import { dialog, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { outputRoot } from './omnivoice/paths'

/**
 * Đọc hàng loạt theo thư mục: quét đệ quy mọi file .txt trong thư mục người dùng
 * chọn, bỏ qua file đã có audio trùng tên, và ghi audio kết quả ngay cạnh file
 * .txt nguồn thay vì để lại trong thư mục outputs của app.
 */

const AUDIO_EXTENSIONS = ['.wav', '.mp3']
const MAX_FILES = 2000
const MAX_TEXT_BYTES = 5 * 1024 * 1024

export interface TtsBatchScanFile {
  path: string
  name: string
  chars: number
  existingAudioPath?: string
}

function siblingAudioPath(textFilePath: string, extension: string) {
  const base = path.basename(textFilePath, path.extname(textFilePath))
  return path.join(path.dirname(textFilePath), `${base}${extension}`)
}

function collectTextFiles(directory: string, found: string[]) {
  if (found.length >= MAX_FILES) return
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (found.length >= MAX_FILES) return
    if (entry.name.startsWith('.')) continue
    const full = path.join(directory, entry.name)
    // Symlink không được coi là thư mục nên vòng lặp không thể tự lặp vô hạn.
    if (entry.isDirectory()) collectTextFiles(full, found)
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.txt') found.push(full)
  }
}

function countCharacters(filePath: string) {
  try {
    if (fs.statSync(filePath).size > MAX_TEXT_BYTES) return -1
    return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim().length
  } catch {
    return -1
  }
}

export async function pickTtsBatchFolder(title?: string) {
  const result = await dialog.showOpenDialog({ title, properties: ['openDirectory'] })
  return { path: result.canceled ? null : result.filePaths[0] || null }
}

export function scanTtsBatchFolder(folderPath: string) {
  const files: TtsBatchScanFile[] = []
  if (!folderPath || !fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return { success: false, error: 'Không tìm thấy thư mục', files, truncated: false }
  }
  const found: string[] = []
  collectTextFiles(folderPath, found)
  for (const filePath of found) {
    files.push({
      path: filePath,
      name: path.relative(folderPath, filePath) || path.basename(filePath),
      chars: countCharacters(filePath),
      existingAudioPath: AUDIO_EXTENSIONS
        .map((extension) => siblingAudioPath(filePath, extension))
        .find((candidate) => fs.existsSync(candidate)),
    })
  }
  return { success: true, files, truncated: found.length >= MAX_FILES }
}

export function readTtsBatchText(filePath: string) {
  if (path.extname(filePath).toLowerCase() !== '.txt') return { success: false, error: 'Chỉ đọc được file .txt' }
  if (!fs.existsSync(filePath)) return { success: false, error: 'Không tìm thấy file văn bản' }
  if (fs.statSync(filePath).size > MAX_TEXT_BYTES) return { success: false, error: 'File văn bản lớn hơn 5 MB' }
  try {
    return { success: true, text: fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '') }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function saveTtsBatchOutput(sourcePath: string, textFilePath: string) {
  if (!fs.existsSync(sourcePath)) return { success: false, error: 'Không tìm thấy audio vừa tạo' }
  if (path.extname(textFilePath).toLowerCase() !== '.txt') return { success: false, error: 'Đích lưu phải đi kèm file .txt' }
  const extension = path.extname(sourcePath).toLowerCase() || '.wav'
  const outputPath = siblingAudioPath(textFilePath, extension)
  try {
    fs.copyFileSync(sourcePath, outputPath)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
  const root = path.resolve(outputRoot())
  if (path.resolve(sourcePath).startsWith(`${root}${path.sep}`)) {
    try { fs.rmSync(sourcePath, { force: true }) } catch { /* dọn file tạm không bắt buộc */ }
  }
  return { success: true, outputPath }
}

export async function openTtsBatchFolder(folderPath: string) {
  if (!folderPath || !fs.existsSync(folderPath)) return { success: false, error: 'Không tìm thấy thư mục' }
  const error = await shell.openPath(folderPath)
  return error ? { success: false, error } : { success: true }
}
