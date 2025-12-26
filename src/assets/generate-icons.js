// generate-icons.js
import sharp from 'sharp'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, 'icons.svg')
const outputDir = join(__dirname, '../../public/icons')

;[128, 48, 32, 16].forEach(size => {
  sharp(inputPath)
    .resize(size, size)
    .png()
    .toFile(join(outputDir, `icon-${size}.png`))
})
