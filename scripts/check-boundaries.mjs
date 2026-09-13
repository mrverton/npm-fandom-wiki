import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const filename = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(filename) : [filename]
  }))
  return nested.flat()
}

const failures = []
for (const filename of await walk('src')) {
  if (!/\.(?:js|jsx)$/.test(filename)) continue
  const name = filename.replaceAll('\\', '/')
  const text = await readFile(filename, 'utf8')
  if (name !== 'src/api/client.js' && /\b(?:fetch|XMLHttpRequest)\s*\(/.test(text)) {
    failures.push(`${name}: HTTP transport belongs in src/api/client.js`)
  }
  if (/^src\/(pages|components)\//.test(name) && /(?:['"`]\/api\/|API_BASE_URL|import\.meta\.env)/.test(text)) {
    failures.push(`${name}: UI must not know endpoint paths or environment configuration`)
  }
  if (/X-Telegram-User-Id|ADMIN_ID\s*=/.test(text)) {
    failures.push(`${name}: do not restore client-side identity authorization`)
  }
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log('Layer boundaries: PASS')
