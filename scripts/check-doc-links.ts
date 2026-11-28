// Check repository Markdown links without network access or dependencies.
import { readdir, readFile, access } from 'node:fs/promises'
import { resolve, dirname, relative } from 'node:path'
const root = process.cwd()
async function markdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(entry => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? markdown(path) : entry.name.endsWith('.md') ? [path] : []
  }))
  return files.flat()
}
const files = [resolve(root, 'README.md'), resolve(root, 'AGENTS.md'), ...await markdown(resolve(root, 'docs'))]
let checked = 0
const missing:any[]=[]
for (const file of files) {
  const text = await readFile(file, 'utf8')
  for (const match of text.matchAll(/\]\((<[^>\n]+>|[^)\s]+)(?:\s+"[^"\n]*")?\)/g)) {
    const target = match[1].replace(/^<|>$/g, '')
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('#')) continue
    const path = decodeURIComponent(target.split('#')[0])
    if (!path) continue
    checked++
    try { await access(resolve(dirname(file), path)) }
    catch { missing.push(`${relative(root, file)}: ${target}`) }
  }
}
if (missing.length) {
  console.error(missing.join('\n'))
  process.exitCode = 1
}
console.log(`${checked} local Markdown links checked; ${missing.length} missing targets (fragments and external URLs not checked).`)
