import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Entirely generated PCM; no captured or third-party media.
const rate = 48000
const long = process.argv.includes('--long')
const pulses = process.argv.includes('--bass-pulses')
const seconds = pulses ? 8 : long ? 45 : 7
const count = rate * seconds
const wav = Buffer.alloc(44 + count * 2)
wav.write('RIFF', 0)
wav.writeUInt32LE(wav.length - 8, 4)
wav.write('WAVEfmt ', 8)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(rate, 24)
wav.writeUInt32LE(rate * 2, 28)
wav.writeUInt16LE(2, 32)
wav.writeUInt16LE(16, 34)
wav.write('data', 36)
wav.writeUInt32LE(count * 2, 40)
for (let i = 0; i < count; i++) {
  const time = i / rate
  const phase = long ? time % 7 : time
  const frequency = phase < 2 ? 100 : phase < 4 ? 1000 : phase < 6 ? 8000 : 0
  let sample = 0.1 * Math.sin(2 * Math.PI * frequency * time)
  if (pulses) {
    const position = time % 0.5
    const amplitude = Math.floor(time / 0.5) % 8 < 4 ? 0.008 : 0.12
    const envelope = position < 0.005 ? position / 0.005 : position < 0.1
      ? 0.001 ** ((position - 0.005) / 0.095) : position < 0.12 ? 0.001 * (0.12 - position) / 0.02 : 0
    sample = amplitude * envelope * Math.sin(2 * Math.PI * 60 * time)
  }
  wav.writeInt16LE(Math.round(32767 * sample), 44 + i * 2)
}
const output = join(tmpdir(), pulses ? 'echo-permitted-bass-pulses.wav' : long ? 'echo-permitted-tones-long.wav' : 'echo-permitted-tones.wav')
writeFileSync(output, wav)
console.log(`Generated ${output} (${seconds} seconds): ${pulses ? '60 Hz pulses, four quiet then four loud' : '100 Hz, 1000 Hz, 8000 Hz (2 seconds each), then 1 second silence'}.`)
