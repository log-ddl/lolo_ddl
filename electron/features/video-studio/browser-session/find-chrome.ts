import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Google's OAuth consent screen actively blocks Electron's own embedded
// Chromium ("This browser or app may not be secure") no matter how the
// User-Agent is spoofed — it's a deliberate anti-embedded-browser policy,
// not a bug we can code around from inside Electron. The only reliable way
// past it is to drive the user's real, separately-installed Chrome (or
// Edge, also Chromium but a distinct trusted binary) as an external
// process and control it over the DevTools protocol.
export function findChromeExecutable(): string | null {
  if (process.platform === 'win32') return findWindows()
  if (process.platform === 'darwin') return findMacos()
  return findLinux()
}

function findWindows(): string | null {
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local')
  const candidates = [
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate
  return readWindowsAppPathsRegistry('chrome.exe') || readWindowsAppPathsRegistry('msedge.exe')
}

function readWindowsAppPathsRegistry(exeName: string): string | null {
  try {
    const output = execFileSync('reg', [
      'query',
      `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exeName}`,
      '/ve',
    ], { encoding: 'utf8', windowsHide: true })
    const match = /REG_SZ\s+(.+)$/m.exec(output)
    const registryPath = match?.[1]?.trim()
    if (registryPath && fs.existsSync(registryPath)) return registryPath
  } catch {
    // Registry key not present — no Chrome/Edge installed via the usual path.
  }
  return null
}

function findMacos(): string | null {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    path.join(process.env.HOME || '', 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ]
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate
  return null
}

function findLinux(): string | null {
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium', 'microsoft-edge']) {
    try {
      const resolved = execFileSync('which', [name], { encoding: 'utf8' }).trim()
      if (resolved) return resolved
    } catch { /* try the next candidate */ }
  }
  return null
}
