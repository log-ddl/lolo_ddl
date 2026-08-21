import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { RUNTIME_VERSION } from './constants'

/**
 * Where the managed Python runtime, models, outputs and voice prompts live, and
 * how we decide whether the installed runtime is still current.
 */

export function runtimeRoot() {
  return path.join(app.getPath('userData'), 'runtimes', 'omnivoice')
}

export function modelRoot() {
  return path.join(app.getPath('userData'), 'models', 'omnivoice')
}

export function outputRoot() {
  return path.join(app.getPath('userData'), 'tts', 'outputs')
}

export function voicePromptRoot() {
  return path.join(app.getPath('userData'), 'tts', 'voices', 'omnivoice')
}

export function sourceRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'omnivoice-package')
    : path.join(process.env.APP_ROOT || process.cwd(), 'electron', 'features', 'tts-voice', 'vendor', 'omnivoice')
}

export function workerPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'tts-worker', 'omnivoice_worker.py')
    : path.join(process.env.APP_ROOT || process.cwd(), 'electron', 'features', 'tts-voice', 'python', 'omnivoice_worker.py')
}

export function venvPython() {
  return process.platform === 'win32'
    ? path.join(runtimeRoot(), '.venv', 'Scripts', 'python.exe')
    : path.join(runtimeRoot(), '.venv', 'bin', 'python')
}

export function bundledPython() {
  return process.platform === 'win32' ? path.join(runtimeRoot(), 'python', 'python.exe') : ''
}

export function legacyQwenPython() {
  return process.platform === 'win32'
    ? path.join(app.getPath('userData'), 'runtimes', 'qwen-tts', 'python', 'python.exe')
    : ''
}

export function runtimeMarker() {
  return path.join(runtimeRoot(), '.runtime-ready')
}

export function modelPath(modelId: string) {
  return path.join(modelRoot(), modelId)
}

export function readRuntimeMarker() {
  try {
    return JSON.parse(fs.readFileSync(runtimeMarker(), 'utf8')) as { version?: number; sourceVersion?: string }
  } catch {
    return {}
  }
}

export function sourceVersion() {
  try {
    const pyproject = fs.readFileSync(path.join(sourceRoot(), 'pyproject.toml'), 'utf8')
    return pyproject.match(/^version\s*=\s*["']([^"']+)["']/m)?.[1] || 'unknown'
  } catch {
    return 'unknown'
  }
}

export function isRuntimeCurrent() {
  const marker = readRuntimeMarker()
  if ((marker.version || 0) < RUNTIME_VERSION) return false
  const currentSourceVersion = sourceVersion()
  if (!marker.sourceVersion && fs.existsSync(runtimeMarker())) {
    fs.writeFileSync(runtimeMarker(), JSON.stringify({ ...marker, sourceVersion: currentSourceVersion }, null, 2), 'utf8')
    return true
  }
  return marker.sourceVersion === currentSourceVersion
}

export function isInstalled(modelId: string) {
  return fs.existsSync(path.join(modelPath(modelId), '.model-ready'))
}

