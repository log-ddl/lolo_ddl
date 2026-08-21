const fs = require('node:fs')
const path = require('node:path')
const { rcedit } = require('rcedit')

module.exports = async function setWinIcon(context) {
  if (context.electronPlatformName !== 'win32') return

  const iconPath = path.join(context.packager.projectDir, 'build', 'icon.ico')
  const executableName = `${context.packager.platformSpecificBuildOptions.executableName || context.packager.appInfo.productFilename}.exe`
  const executablePath = path.join(context.appOutDir, executableName)

  if (!fs.existsSync(iconPath) || !fs.existsSync(executablePath)) return

  await rcedit(executablePath, { icon: iconPath })
}
