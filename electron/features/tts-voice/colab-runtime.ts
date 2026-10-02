import { app, dialog, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { buildManifest, encodeTasks, hash, MAX_ZIP_BYTES, parseJson, readPackage, safeId, validateResults } from './colab-package'
import { createColabNotebook } from './colab-notebook'
import { outputRoot, workerPath } from './omnivoice/paths'
import type { TtsHistoryItem } from '../../../src/features/tts-voice/types'
import type { TtsGeneratePayload } from './omnivoice-runtime'

export interface ColabExportInput { request: TtsGeneratePayload; voiceLabel: string; source: 'editor' | 'files' }
const ledgerRoot = () => path.join(app.getPath('userData'), 'tts', 'colab')
const errorResult = (error: unknown) => ({ success: false as const, error: error instanceof Error ? error.message : String(error) })
async function readBounded(filename: string, limit: number) {
  if ((await fs.stat(filename)).size > limit) throw new Error('File quá lớn.')
  const bytes = await fs.readFile(filename)
  if (bytes.length > limit) throw new Error('File quá lớn.')
  return bytes
}
export async function exportColab(input: ColabExportInput) {
  try {
    let inputs = [{ name: 'TTS', text: input.request.text }]
    if (input.source === 'files') {
      const selected = await dialog.showOpenDialog({ title: 'Chọn các file TXT', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Text', extensions: ['txt'] }] })
      if (selected.canceled) return { success: false as const, canceled: true }
      if (selected.filePaths.length > 100) throw new Error('Tối đa 100 file mỗi gói.')
      inputs = []
      for (const filename of selected.filePaths) {
        if (path.extname(filename).toLowerCase() !== '.txt') throw new Error('Chỉ hỗ trợ TXT.')
        inputs.push({ name: path.basename(filename, path.extname(filename)), text: (await readBounded(filename, 1024 * 1024)).toString('utf8') })
      }
    }
    const manifest = buildManifest(input.request, inputs, input.voiceLabel)
    const files: Record<string, Uint8Array> = {}
    if (input.request.mode === 'clone') {
      const extension = path.extname(input.request.referenceAudioPath!).toLowerCase()
      if (!['.wav', '.mp3', '.flac', '.m4a', '.ogg'].includes(extension)) throw new Error('Định dạng audio mẫu không được hỗ trợ.')
      const reference = `references/reference${extension}`
      files[reference] = await readBounded(input.request.referenceAudioPath!, 50 * 1024 * 1024)
      manifest.jobs.forEach(job => { job.referenceAudioPath = reference })
    }
    const encoded = encodeTasks(manifest, files)
    if (encoded.zip.length > MAX_ZIP_BYTES) throw new Error('Gói vượt giới hạn 256 MB.')
    const notebook = createColabNotebook(path.dirname(workerPath()))
    const chosen = await dialog.showOpenDialog({ title: 'Chọn thư mục lưu gói Colab', properties: ['openDirectory', 'createDirectory'] })
    if (chosen.canceled || !chosen.filePaths[0]) return { success: false as const, canceled: true }
    const folder = path.join(chosen.filePaths[0], `logdd-colab-${manifest.packId}`)
    await fs.mkdir(folder)
    await fs.mkdir(ledgerRoot(), { recursive: true })
    await fs.writeFile(path.join(ledgerRoot(), `${manifest.packId}.json`), JSON.stringify({ manifest, requestHash: encoded.requestHash }), { flag: 'wx' })
    const zipPath = path.join(folder, 'tts-tasks.zip')
    await fs.writeFile(zipPath, encoded.zip)
    await fs.writeFile(path.join(folder, 'logdd-tts.ipynb'), notebook)
    shell.showItemInFolder(zipPath)
    return { success: true as const, folder, count: manifest.jobs.length }
  } catch (error) { return errorResult(error) }
}
export async function importColab() {
  try {
    const chosen = await dialog.showOpenDialog({ title: 'Nhập ZIP kết quả Colab', properties: ['openFile'], filters: [{ name: 'ZIP', extensions: ['zip'] }] })
    if (chosen.canceled || !chosen.filePaths[0]) return { success: false as const, canceled: true }
    const files = readPackage(await readBounded(chosen.filePaths[0], MAX_ZIP_BYTES))
    const report = parseJson(files, 'results.json')
    if (!safeId(report.packId)) throw new Error('Mã gói không hợp lệ.')
    const ledger = await fs.readFile(path.join(ledgerRoot(), `${report.packId}.json`), 'utf8').catch(() => { throw new Error('Không tìm thấy gói đã xuất trên máy này.') })
    const { manifest, requestHash } = JSON.parse(ledger)
    const checked = validateResults(files, manifest, requestHash)
    await fs.mkdir(outputRoot(), { recursive: true })
    // Check conflicts before writing any audio from the package.
    for (const { task, bytes } of checked.audio) {
      const existing = await fs.readFile(path.join(outputRoot(), `colab-${task.id}.wav`)).catch(error => {
        if (error.code === 'ENOENT') return undefined
        throw error
      })
      if (existing && hash(existing) !== hash(bytes)) throw new Error('Tác vụ này đã có audio khác. Xuất gói mới để tạo phiên bản khác.')
    }
    const items: TtsHistoryItem[] = []
    for (const { task, bytes } of checked.audio) {
      const outputPath = path.join(outputRoot(), `colab-${task.id}.wav`)
      try { await fs.writeFile(outputPath, bytes, { flag: 'wx' }) }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
        if (hash(await fs.readFile(outputPath)) !== hash(bytes)) throw new Error('Tác vụ này đã có audio khác. Xuất gói mới để tạo phiên bản khác.')
      }
      items.push({ id: `colab-${task.id}`, name: task.name, text: task.text, modelId: manifest.modelId, mode: task.mode, voiceLabel: task.voiceLabel, outputPath, createdAt: manifest.createdAt })
    }
    return { success: true as const, items, failed: checked.failed, missing: checked.missing }
  } catch (error) { return errorResult(error) }
}
