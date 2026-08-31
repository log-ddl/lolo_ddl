import { app, dialog, ipcMain, shell } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const MEMORY_FILE_NAME = 'memory.md'
const MAX_MEMORY_BYTES = 1024 * 1024
const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024
const MAX_IMAGE_PREVIEW_BYTES = 12 * 1024 * 1024
const MAX_MEDIA_PREVIEW_BYTES = 32 * 1024 * 1024
const MAX_BUZZ_INPUT_FILES = 2000
const MAX_BUZZ_INPUT_BYTES = 512 * 1024 * 1024
const BUZZ_IGNORED_NAMES = new Set(['.buzz', '.git', '.svn', '.hg', 'node_modules', '.DS_Store', 'Thumbs.db'])
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.json', '.jsonc', '.csv', '.tsv', '.srt', '.vtt',
  '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.xml', '.yaml', '.yml',
  '.py', '.sh', '.ps1', '.bat', '.c', '.cpp', '.h', '.hpp', '.java', '.go', '.rs',
  '.sql', '.toml', '.ini', '.env', '.log', '.svg', '.vue', '.svelte', '.astro',
  '.php', '.rb', '.swift', '.kt', '.kts', '.dart', '.lua', '.r', '.m', '.mm',
  '.cs', '.fs', '.fsx', '.vb', '.gradle', '.properties', '.conf', '.config',
  '.lock', '.gitignore', '.gitattributes', '.editorconfig', '.dockerfile',
])
const IMAGE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
}
const AUDIO_MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
  '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/ogg',
}
const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.m4v': 'video/mp4', '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska',
}

function getDefaultWorkspacePath(): string {
  return path.join(app.getPath('userData'), 'content-chat', 'workspace')
}

function resolveWorkspacePath(candidate?: string | null): string {
  return path.resolve(candidate?.trim() || getDefaultWorkspacePath())
}

function ensureWorkspace(candidate?: string | null): { path: string; memory: string } {
  const workspacePath = resolveWorkspacePath(candidate)
  fs.mkdirSync(workspacePath, { recursive: true })
  const stats = fs.statSync(workspacePath)
  if (!stats.isDirectory()) throw new Error('Workspace path is not a directory')

  const memoryPath = path.join(workspacePath, MEMORY_FILE_NAME)
  if (!fs.existsSync(memoryPath)) fs.writeFileSync(memoryPath, '', 'utf8')
  const memoryStats = fs.statSync(memoryPath)
  if (!memoryStats.isFile()) throw new Error('memory.md is not a file')
  if (memoryStats.size > MAX_MEMORY_BYTES) throw new Error('memory.md exceeds the 1 MB limit')

  return { path: workspacePath, memory: fs.readFileSync(memoryPath, 'utf8') }
}

/**
 * Phần resolve một file, đã tách khỏi `ensureWorkspace`.
 *
 * Tách ra để chỗ resolve hàng loạt chỉ phải dựng workspace ĐÚNG MỘT LẦN. Trước đây
 * mỗi ứng viên file kéo theo một lượt mkdir + 2 statSync + đọc nguyên memory.md,
 * nên một tin nhắn có 100 ứng viên là 100 lượt như vậy, đồng bộ, trên main process.
 */
function resolveFileInWorkspace(workspaceRealPath: string, fileCandidate: string) {
  const cleaned = String(fileCandidate ?? '').trim().replace(/^[`'\"]+|[`'\"]+$/g, '')
  if (!cleaned) throw new Error('File path is required')
  const requestedPath = path.isAbsolute(cleaned)
    ? path.resolve(cleaned)
    : path.resolve(workspaceRealPath, cleaned.replace(/^\.([\\/])/, ''))
  if (!fs.existsSync(requestedPath)) throw new Error('File not found in this workspace')
  const fileRealPath = fs.realpathSync(requestedPath)
  const relative = path.relative(workspaceRealPath, fileRealPath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('File is outside the active workspace')
  }
  const stats = fs.statSync(fileRealPath)
  if (!stats.isFile()) throw new Error('The selected path is not a file')
  return { filePath: fileRealPath, stats }
}

function resolveWorkspaceFile(workspaceCandidate: string | null | undefined, fileCandidate: string) {
  const workspace = ensureWorkspace(workspaceCandidate)
  const workspaceRealPath = fs.realpathSync(workspace.path)
  return { workspace, ...resolveFileInWorkspace(workspaceRealPath, fileCandidate) }
}

function looksLikeTextFile(filePath: string, size: number): boolean {
  const descriptor = fs.openSync(filePath, 'r')
  try {
    const sampleSize = Math.min(size, 8192)
    const sample = Buffer.alloc(sampleSize)
    fs.readSync(descriptor, sample, 0, sampleSize, 0)
    if (sample.includes(0)) return false
    let controlBytes = 0
    for (const byte of sample) {
      if (byte < 9 || (byte > 13 && byte < 32)) controlBytes += 1
    }
    return sampleSize === 0 || controlBytes / sampleSize < 0.05
  } finally {
    fs.closeSync(descriptor)
  }
}

type BuzzInputRequest = { id: string; name: string; kind: 'file' | 'folder'; path: string }

type ScannedInputFile = { relativePath: string; size: number; modifiedAt: number; sourcePath: string }

function scanBuzzInput(sourcePath: string, kind: 'file' | 'folder'): ScannedInputFile[] {
  const resolved = path.resolve(sourcePath)
  if (!fs.existsSync(resolved)) throw new Error('Đường dẫn không còn tồn tại')
  const rootStats = fs.statSync(resolved)
  if (kind === 'file' && !rootStats.isFile()) throw new Error('Đầu vào phải là một file')
  if (kind === 'folder' && !rootStats.isDirectory()) throw new Error('Đầu vào phải là một folder')
  if (rootStats.isFile()) return [{ relativePath: path.basename(resolved), size: rootStats.size, modifiedAt: rootStats.mtimeMs, sourcePath: resolved }]

  const files: ScannedInputFile[] = []
  let totalBytes = 0
  const visit = (directory: string) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (BUZZ_IGNORED_NAMES.has(entry.name) || entry.isSymbolicLink()) continue
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        visit(entryPath)
        continue
      }
      if (!entry.isFile()) continue
      const stats = fs.statSync(entryPath)
      totalBytes += stats.size
      if (files.length >= MAX_BUZZ_INPUT_FILES) throw new Error(`Folder vượt quá ${MAX_BUZZ_INPUT_FILES} file`)
      if (totalBytes > MAX_BUZZ_INPUT_BYTES) throw new Error('Folder vượt quá giới hạn 512 MB')
      files.push({
        relativePath: path.relative(resolved, entryPath),
        size: stats.size,
        modifiedAt: stats.mtimeMs,
        sourcePath: entryPath,
      })
    }
  }
  visit(resolved)
  return files
}

function fingerprintScannedFiles(kind: 'file' | 'folder', files: ScannedInputFile[]): string {
  const hash = crypto.createHash('sha256')
  hash.update(kind)
  for (const file of files) hash.update(`\n${file.relativePath}\0${file.size}\0${Math.floor(file.modifiedAt)}`)
  return hash.digest('hex')
}

function isInsideDirectory(parentPath: string, candidatePath: string): boolean {
  const relative = path.relative(parentPath, candidatePath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function prepareBuzzInput(workspaceCandidate: string | null | undefined, input: BuzzInputRequest) {
  const workspace = ensureWorkspace(workspaceCandidate)
  const workspaceRoot = fs.realpathSync(workspace.path)
  const sourcePath = path.resolve(input.path)
  const files = scanBuzzInput(sourcePath, input.kind)
  const fingerprint = fingerprintScannedFiles(input.kind, files)
  const sourceRealPath = fs.realpathSync(sourcePath)
  const staged = !isInsideDirectory(workspaceRoot, sourceRealPath)
  let resolvedPath = sourceRealPath

  if (staged) {
    const safeId = input.id.replace(/[^a-zA-Z0-9_-]/g, '_')
    const cacheRoot = path.join(workspaceRoot, '.buzz', 'input-cache', safeId, fingerprint.slice(0, 16))
    resolvedPath = path.join(cacheRoot, path.basename(sourceRealPath))
    if (!fs.existsSync(resolvedPath)) {
      if (input.kind === 'file') {
        fs.mkdirSync(cacheRoot, { recursive: true })
        fs.copyFileSync(sourceRealPath, resolvedPath)
      } else {
        fs.mkdirSync(resolvedPath, { recursive: true })
        for (const file of files) {
          const destination = path.join(resolvedPath, file.relativePath)
          fs.mkdirSync(path.dirname(destination), { recursive: true })
          fs.copyFileSync(file.sourcePath, destination)
        }
      }
    }
  }

  return {
    nodeId: input.id,
    name: input.name,
    kind: input.kind,
    sourcePath: sourceRealPath,
    resolvedPath,
    staged,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    fingerprint,
    files: files.slice(0, 250).map((file) => file.relativePath),
    filesTruncated: files.length > 250,
  }
}

function verifyBuzzOutput(workspaceCandidate: string | null | undefined, kind: 'text' | 'file' | 'folder', outputPath?: string, text?: string) {
  if (kind === 'text') {
    const value = String(text ?? '').trim()
    if (!value) return { valid: false as const, error: 'Agent không trả về nội dung' }
    return {
      valid: true as const,
      kind,
      fileCount: 0,
      totalBytes: Buffer.byteLength(value, 'utf8'),
      fingerprint: crypto.createHash('sha256').update(value).digest('hex'),
    }
  }

  try {
    const workspace = ensureWorkspace(workspaceCandidate)
    const workspaceRoot = fs.realpathSync(workspace.path)
    const cleaned = String(outputPath ?? '').trim().replace(/^[`'"]+|[`'"]+$/g, '')
    if (!cleaned) throw new Error('Chưa đặt đường dẫn đầu ra')
    const candidate = path.isAbsolute(cleaned) ? path.resolve(cleaned) : path.resolve(workspaceRoot, cleaned)
    if (!isInsideDirectory(workspaceRoot, candidate)) throw new Error('Đầu ra phải nằm trong workspace')
    if (!fs.existsSync(candidate)) throw new Error(`${kind === 'file' ? 'File' : 'Folder'} đầu ra chưa được tạo`)
    const stats = fs.statSync(candidate)
    if (kind === 'file' && !stats.isFile()) throw new Error('Đường dẫn đầu ra không phải file')
    if (kind === 'folder' && !stats.isDirectory()) throw new Error('Đường dẫn đầu ra không phải folder')
    const files = scanBuzzInput(candidate, kind)
    if (kind === 'folder' && files.length === 0) throw new Error('Folder đầu ra đang rỗng')
    return {
      valid: true as const,
      kind,
      path: candidate,
      fileCount: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
      fingerprint: fingerprintScannedFiles(kind, files),
    }
  } catch (error) {
    return { valid: false as const, error: error instanceof Error ? error.message : String(error) }
  }
}

export interface WorkspaceTreeNode {
  name: string
  path: string
  relativePath: string
  isDirectory: boolean
  size?: number
  extension?: string
  children?: WorkspaceTreeNode[]
}

function scanWorkspaceDirectory(dirPath: string, rootPath: string, maxDepth = 4, currentDepth = 0): WorkspaceTreeNode[] {
  if (currentDepth > maxDepth || !fs.existsSync(dirPath)) return []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const nodes: WorkspaceTreeNode[] = []

    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() === b.isDirectory()) return a.name.localeCompare(b.name)
      return a.isDirectory() ? -1 : 1
    })

    for (const entry of sorted) {
      if (entry.name.startsWith('.') && entry.name !== '.env') continue
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'out' || entry.name === '.git') continue

      const fullPath = path.join(dirPath, entry.name)
      const relPath = path.relative(rootPath, fullPath)
      const isDir = entry.isDirectory()

      if (isDir) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          isDirectory: true,
          children: scanWorkspaceDirectory(fullPath, rootPath, maxDepth, currentDepth + 1),
        })
      } else {
        let size = 0
        try {
          size = fs.statSync(fullPath).size
        } catch {}
        nodes.push({
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          isDirectory: false,
          size,
          extension: path.extname(entry.name).toLowerCase(),
        })
      }
    }
    return nodes
  } catch {
    return []
  }
}

export function registerContentWorkspaceIpc(): void {
  ipcMain.handle('content-workspace-get-default', () => ensureWorkspace())

  ipcMain.handle('content-workspace-list-tree', (_event, candidate?: string | null) => {
    const workspace = ensureWorkspace(candidate)
    return {
      workspacePath: workspace.path,
      tree: scanWorkspaceDirectory(workspace.path, workspace.path),
    }
  })

  ipcMain.handle('content-workspace-ensure', (_event, candidate?: string | null) => {
    return ensureWorkspace(candidate)
  })

  ipcMain.handle('content-workspace-choose', async (_event, currentPath?: string | null) => {
    const result = await dialog.showOpenDialog({
      title: 'Choose Content workspace',
      defaultPath: currentPath?.trim() || getDefaultWorkspacePath(),
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return { canceled: true as const }
    return { canceled: false as const, ...ensureWorkspace(result.filePaths[0]) }
  })

  ipcMain.handle('content-workspace-pick-input', async (_event, payload?: {
    kind?: 'file' | 'folder'
    workspacePath?: string | null
    currentPath?: string | null
  }) => {
    const kind = payload?.kind === 'folder' ? 'folder' : 'file'
    const workspace = ensureWorkspace(payload?.workspacePath)
    const currentPath = payload?.currentPath?.trim()
    const result = await dialog.showOpenDialog({
      title: kind === 'file' ? 'Chọn file đầu vào' : 'Chọn folder đầu vào',
      defaultPath: currentPath && fs.existsSync(currentPath) ? currentPath : workspace.path,
      properties: kind === 'file' ? ['openFile'] : ['openDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return { canceled: true as const }
    const selectedPath = path.resolve(result.filePaths[0])
    return {
      canceled: false as const,
      path: selectedPath,
      name: path.basename(selectedPath),
    }
  })

  ipcMain.handle('content-workspace-prepare-buzz-inputs', (_event, payload?: {
    workspacePath?: string | null
    inputs?: BuzzInputRequest[]
  }) => {
    const inputs = Array.isArray(payload?.inputs) ? payload.inputs : []
    return inputs.map((input) => prepareBuzzInput(payload?.workspacePath, input))
  })

  ipcMain.handle('content-workspace-verify-buzz-output', (_event, payload?: {
    workspacePath?: string | null
    kind?: 'text' | 'file' | 'folder'
    outputPath?: string
    text?: string
  }) => verifyBuzzOutput(payload?.workspacePath, payload?.kind ?? 'text', payload?.outputPath, payload?.text))

  ipcMain.handle('content-workspace-read-memory', (_event, candidate?: string | null) => {
    return ensureWorkspace(candidate)
  })

  ipcMain.handle('content-workspace-open', async (_event, candidate?: string | null) => {
    const workspace = ensureWorkspace(candidate)
    const error = await shell.openPath(workspace.path)
    return { success: !error, error: error || undefined }
  })

  ipcMain.handle('content-workspace-preview-file', (_event, payload: { workspacePath?: string | null; filePath: string }) => {
    const resolved = resolveWorkspaceFile(payload?.workspacePath, payload?.filePath)
    const extension = path.extname(resolved.filePath).toLowerCase()
    const common = {
      success: true as const,
      path: resolved.filePath,
      name: path.basename(resolved.filePath),
      extension,
      size: resolved.stats.size,
    }
    if (TEXT_EXTENSIONS.has(extension)) {
      const readBytes = Math.min(resolved.stats.size, MAX_TEXT_PREVIEW_BYTES)
      const descriptor = fs.openSync(resolved.filePath, 'r')
      try {
        const buffer = Buffer.alloc(readBytes)
        fs.readSync(descriptor, buffer, 0, readBytes, 0)
        let content = buffer.toString('utf8')
        if (extension === '.json' && resolved.stats.size <= MAX_TEXT_PREVIEW_BYTES) {
          try { content = JSON.stringify(JSON.parse(content), null, 2) } catch {}
        }
        return { ...common, kind: 'text' as const, content, truncated: resolved.stats.size > readBytes }
      } finally {
        fs.closeSync(descriptor)
      }
    }
    const imageMimeType = IMAGE_MIME_TYPES[extension]
    if (imageMimeType) {
      if (resolved.stats.size > MAX_IMAGE_PREVIEW_BYTES) {
        return { ...common, kind: 'unsupported' as const, error: 'Image exceeds the 12 MB preview limit' }
      }
      const data = fs.readFileSync(resolved.filePath).toString('base64')
      return { ...common, kind: 'image' as const, dataUrl: `data:${imageMimeType};base64,${data}`, truncated: false }
    }
    const mediaMimeType = AUDIO_MIME_TYPES[extension] || VIDEO_MIME_TYPES[extension] || (extension === '.pdf' ? 'application/pdf' : '')
    if (mediaMimeType) {
      if (resolved.stats.size > MAX_MEDIA_PREVIEW_BYTES) {
        return { ...common, kind: 'unsupported' as const, error: 'File exceeds the 32 MB in-app preview limit' }
      }
      const data = fs.readFileSync(resolved.filePath).toString('base64')
      const kind = extension === '.pdf' ? 'pdf' : AUDIO_MIME_TYPES[extension] ? 'audio' : 'video'
      return { ...common, kind, mimeType: mediaMimeType, dataUrl: `data:${mediaMimeType};base64,${data}`, truncated: false }
    }
    if (looksLikeTextFile(resolved.filePath, resolved.stats.size)) {
      const readBytes = Math.min(resolved.stats.size, MAX_TEXT_PREVIEW_BYTES)
      const descriptor = fs.openSync(resolved.filePath, 'r')
      try {
        const buffer = Buffer.alloc(readBytes)
        fs.readSync(descriptor, buffer, 0, readBytes, 0)
        return { ...common, kind: 'text' as const, content: buffer.toString('utf8'), truncated: resolved.stats.size > readBytes }
      } finally {
        fs.closeSync(descriptor)
      }
    }
    return { ...common, kind: 'unsupported' as const, error: 'Preview is not available for this file type' }
  })

  ipcMain.handle('content-workspace-resolve-files', (_event, payload: { workspacePath?: string | null; filePaths?: string[] }) => {
    const filePaths = Array.isArray(payload?.filePaths) ? payload.filePaths.slice(0, 100) : []
    if (filePaths.length === 0) return []
    // Dựng workspace một lần cho cả lô, rồi mới soi từng file.
    let workspaceRealPath: string
    try {
      workspaceRealPath = fs.realpathSync(ensureWorkspace(payload?.workspacePath).path)
    } catch {
      return []
    }
    // Ứng viên trùng nhau chỉ tốn I/O thêm mà không đổi kết quả.
    const seen = new Set<string>()
    return filePaths.flatMap((requestedPath) => {
      const key = String(requestedPath ?? '').trim().toLowerCase()
      if (!key || seen.has(key)) return []
      seen.add(key)
      try {
        const resolved = resolveFileInWorkspace(workspaceRealPath, requestedPath)
        return [{
          requestedPath,
          path: resolved.filePath,
          name: path.basename(resolved.filePath),
          extension: path.extname(resolved.filePath).toLowerCase(),
          size: resolved.stats.size,
        }]
      } catch {
        return []
      }
    })
  })

  ipcMain.handle('content-workspace-open-file', async (_event, payload: { workspacePath?: string | null; filePath: string }) => {
    const resolved = resolveWorkspaceFile(payload?.workspacePath, payload?.filePath)
    const error = await shell.openPath(resolved.filePath)
    return { success: !error, error: error || undefined }
  })

  ipcMain.handle('content-workspace-reveal-file', (_event, payload: { workspacePath?: string | null; filePath: string }) => {
    const resolved = resolveWorkspaceFile(payload?.workspacePath, payload?.filePath)
    shell.showItemInFolder(resolved.filePath)
    return { success: true }
  })

  ipcMain.handle('content-workspace-create-file', (_event, payload: { workspacePath?: string | null; relativePath: string; initialContent?: string }) => {
    const workspace = ensureWorkspace(payload?.workspacePath)
    const targetPath = path.resolve(workspace.path, payload.relativePath)
    if (!targetPath.startsWith(workspace.path)) throw new Error('Invalid file path outside workspace')
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, payload.initialContent ?? '', 'utf8')
    }
    return { success: true, path: targetPath }
  })

  ipcMain.handle('content-workspace-create-folder', (_event, payload: { workspacePath?: string | null; relativePath: string }) => {
    const workspace = ensureWorkspace(payload?.workspacePath)
    const targetPath = path.resolve(workspace.path, payload.relativePath)
    if (!targetPath.startsWith(workspace.path)) throw new Error('Invalid directory path outside workspace')
    fs.mkdirSync(targetPath, { recursive: true })
    return { success: true, path: targetPath }
  })

  ipcMain.handle('content-workspace-delete-entry', (_event, payload: { workspacePath?: string | null; relativePath: string }) => {
    const workspace = ensureWorkspace(payload?.workspacePath)
    const targetPath = path.resolve(workspace.path, payload.relativePath)
    if (!targetPath.startsWith(workspace.path)) throw new Error('Invalid path outside workspace')
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true })
    }
    return { success: true }
  })

  ipcMain.handle('content-workspace-write-memory', (_event, payload: { workspacePath?: string | null; content: string }) => {
    const content = String(payload?.content ?? '')
    if (Buffer.byteLength(content, 'utf8') > MAX_MEMORY_BYTES) {
      throw new Error('memory.md exceeds the 1 MB limit')
    }
    const workspace = ensureWorkspace(payload?.workspacePath)
    fs.writeFileSync(path.join(workspace.path, MEMORY_FILE_NAME), content, 'utf8')
    return { path: workspace.path, memory: content }
  })
}
