import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const faviconSvg = readFileSync(join(root, 'public/favicon.svg'))

const outputs = [
  { path: 'public/favicon-16x16.png', size: 16 },
  { path: 'public/favicon-32x32.png', size: 32 },
  { path: 'public/apple-touch-icon.png', size: 180 },
  { path: 'public/icons/icon-180.png', size: 180 },
  { path: 'public/icons/icon-192.png', size: 192 },
  { path: 'public/icons/icon-512.png', size: 512 }
]

for (const { path, size } of outputs) {
  const buffer = await sharp(faviconSvg).resize(size, size).png().toBuffer()
  writeFileSync(join(root, path), buffer)
  console.log(`wrote ${path} (${size}x${size})`)
}

const ico32 = await sharp(faviconSvg).resize(32, 32).png().toBuffer()
writeFileSync(join(root, 'public/favicon.ico'), ico32)
console.log('wrote public/favicon.ico')
