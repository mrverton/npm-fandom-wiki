import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) await inspect(filename)
    else if (/\.(?:js|html|css)$/.test(filename)) {
      const text = await readFile(filename, 'utf8')
      // React Router uses two synthetic URL parsing bases (never network targets).
      // Match their full surrounding expressions, not an allowlist of localhost URLs.
      const networkText = text
        .replace(/let (\w+)="http:\/\/localhost";(\w+)&&\(\1=\2\.location\.origin!=="null"\?\2\.location\.origin:\2\.location\.href\)/g, '')
        .replace(/var (\w+)=new URL\("http:\/\/localhost"\);function (\w+)\((\w+)\)\{if\(\3\.createURL\)return \3\.createURL\("\/"\);try\{return new URL\(\3\.createHref\("\/"\),\1\)\}catch\{return \1\}\}/g, '')
      if (/(?:https?:\/\/)(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?=[:/"'`]|$)/i.test(networkText)) {
        throw new Error(`Loopback URL leaked into production asset: ${filename}`)
      }
      if (/\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/.test(text)) {
        throw new Error(`Possible Telegram bot token leaked into production asset: ${filename}`)
      }
    }
  }
}
await inspect('dist')
console.log('Production bundle loopback/token scan: PASS')
