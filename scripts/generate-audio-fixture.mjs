import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Entirely generated PCM; no captured or third-party media.
const rate = 48000
const seconds = 7
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
  const frequency = time < 2 ? 100 : time < 4 ? 1000 : time < 6 ? 8000 : 0
  wav.writeInt16LE(Math.round(32767 * 0.1 * Math.sin(2 * Math.PI * frequency * time)), 44 + i * 2)
}
const output = join(tmpdir(), 'echo-permitted-tones.wav')
writeFileSync(output, wav)
console.log(`Generated ${output}: 100 Hz, 1000 Hz, 8000 Hz (2 seconds each), then 1 second silence.`)
