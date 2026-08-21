import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.join(__dirname, '..')
const buildDir = path.join(projectDir, 'build')
const logoPath = path.join(projectDir, 'logo.png')

// Ensure the build directory exists.
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true })
}

async function generateIcons() {
  console.log('🎨 Generating icons from logo.png...')

  if (!fs.existsSync(logoPath)) {
    console.error('❌ logo.png was not found. Place logo.png in the project root.')
    process.exit(1)
  }

  const pngPath = path.join(buildDir, 'icon.png')
  const icoPath = path.join(buildDir, 'icon.ico')
  const icnsPath = path.join(buildDir, 'icon.icns')

  // Generate a 512x512 PNG icon from logo.png.
  await sharp(logoPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath)
  console.log('✅ Generated icon.png (512x512)')

  // Generate multiple PNG sizes for the ICO bundle.
  const sizes = [16, 32, 48, 64, 128, 256]
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(logoPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  )

  // Convert the PNG set to ICO.
  const icoBuffer = await pngToIco(pngBuffers)
  fs.writeFileSync(icoPath, icoBuffer)
  console.log('✅ Generated icon.ico (sizes: ' + sizes.join(', ') + ')')

  if (process.platform === 'darwin') {
    const iconsetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'longdd-iconset-'))
    const iconsetPath = path.join(iconsetDir, 'icon.iconset')
    fs.mkdirSync(iconsetPath, { recursive: true })

    const iconsetSizes = [
      { size: 16, filename: 'icon_16x16.png' },
      { size: 32, filename: 'icon_16x16@2x.png' },
      { size: 32, filename: 'icon_32x32.png' },
      { size: 64, filename: 'icon_32x32@2x.png' },
      { size: 128, filename: 'icon_128x128.png' },
      { size: 256, filename: 'icon_128x128@2x.png' },
      { size: 256, filename: 'icon_256x256.png' },
      { size: 512, filename: 'icon_256x256@2x.png' },
      { size: 512, filename: 'icon_512x512.png' },
      { size: 1024, filename: 'icon_512x512@2x.png' },
    ]

    for (const { size, filename } of iconsetSizes) {
      await sharp(logoPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(iconsetPath, filename))
    }

    const result = spawnSync('iconutil', ['-c', 'icns', iconsetPath, '-o', icnsPath], {
      stdio: 'inherit',
    })

    fs.rmSync(iconsetDir, { recursive: true, force: true })

    if (result.status !== 0) {
      throw new Error('iconutil failed to generate icon.icns')
    }

    console.log('✅ Generated icon.icns (macOS app icon)')
  }

  console.log(`\n📁 Icons saved to: ${buildDir}`)
}

generateIcons().catch(console.error)
