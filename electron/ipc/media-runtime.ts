import { ipcMain, shell } from 'electron'
import {
  cancelCliTextTask, getCliCommands, getCliModels, getCliStatus, installCli, runCliTextTask,
  type RunCliTextPayload,
} from '../features/video-studio/cli-runtime'
import { runFFmpeg, cancelFFmpeg, probeAudioDuration, probeMediaDimensions, type FFmpegRunOptions } from '../ffmpeg-runtime'
import { transcribeAudio, cancelTranscribe, type TranscribeRequest } from '../features/video-studio/whisper-runtime'
import { renderVideo, cancelRender, pickOutputVideoPath, type RenderJobRequest } from '../features/video-studio/render-pipeline'
import { renderEditor, cancelEditorRender, pickEditorOutput } from '../features/video-studio/editor-render-pipeline'
import {
  cancelTtsJob, exportTtsAudio, generateTts, getTtsModelStatuses,
  installTtsModel, pickReferenceAudio, removeTtsModel, revealTtsAudio,
  type TtsGeneratePayload, type TtsModelDescriptor,
} from '../features/tts-voice/omnivoice-runtime'
import { getGeminiApiKeys, setGeminiApiKeys } from '../features/tts-voice/gemini-runtime'
import { getVbeeCredentials, getVbeeVoices, setVbeeCredentials } from '../features/tts-voice/vbee-runtime'
import { listVieneuVoices } from '../features/tts-voice/vieneu-runtime'
import { getMediaRoot } from '../storage-paths'

export function registerCliRuntimeIpc() {
  ipcMain.handle('cli-runtime-status', async () => {
    return getCliStatus()
  })

  ipcMain.handle('cli-runtime-install', async (_event, adapter: 'claude' | 'opencode' | 'codex') => {
    return installCli(adapter)
  })

  ipcMain.handle('cli-runtime-models', async (_event, adapter: 'claude' | 'opencode' | 'codex') => {
    return getCliModels(adapter)
  })

  ipcMain.handle('cli-runtime-commands', async (_event, adapter: 'claude' | 'opencode' | 'codex', workingDirectory?: string) => {
    return getCliCommands(adapter, workingDirectory)
  })

  ipcMain.handle('cli-runtime-run-text', async (_event, payload: RunCliTextPayload) => {
    return runCliTextTask({
      ...payload,
      onChunk: payload.requestId
        ? (chunk) => {
          _event.sender.send('cli-runtime-event', {
            requestId: payload.requestId,
            type: 'chunk',
            chunk,
          })
        }
        : undefined,
      onSessionId: payload.requestId
        ? (sessionId) => {
          _event.sender.send('cli-runtime-event', {
            requestId: payload.requestId,
            type: 'session',
            sessionId,
          })
        }
        : undefined,
      onCommands: payload.requestId
        ? (commands) => {
          _event.sender.send('cli-runtime-event', {
            requestId: payload.requestId,
            type: 'commands',
            commands,
          })
        }
        : undefined,
    } as RunCliTextPayload & { onChunk?: (chunk: string) => void; onSessionId?: (sessionId: string) => void })
  })

  ipcMain.handle('cli-runtime-cancel-text', async (_event, requestId: string) => {
    return cancelCliTextTask(requestId)
  })
}

export function registerFFmpegIpc() {
  ipcMain.handle('ffmpeg-run', async (_event, payload: Omit<FFmpegRunOptions, 'onProgress' | 'onLog'>) => {
    return runFFmpeg({
      ...payload,
      onProgress: (progress) => {
        _event.sender.send('ffmpeg-event', {
          jobId: payload.jobId,
          type: 'progress',
          progress,
        })
      },
      onLog: (line) => {
        _event.sender.send('ffmpeg-event', {
          jobId: payload.jobId,
          type: 'log',
          line,
        })
      },
    })
  })

  ipcMain.handle('ffmpeg-cancel', async (_event, jobId: string) => {
    return { canceled: cancelFFmpeg(jobId) }
  })

  ipcMain.handle('ffmpeg-probe-duration', async (_event, audioPath: string) => {
    return { durationSec: await probeAudioDuration(audioPath) }
  })

  ipcMain.handle('ffmpeg-probe-dimensions', async (_event, mediaPath: string) => {
    return { dimensions: await probeMediaDimensions(mediaPath) }
  })
}

export function registerWhisperIpc() {
  ipcMain.handle('whisper-transcribe', async (_event, payload: TranscribeRequest) => {
    return transcribeAudio(payload, (progress) => {
      _event.sender.send('whisper-event', progress)
    })
  })

  ipcMain.handle('whisper-cancel', async (_event, jobId: string) => {
    return { canceled: cancelTranscribe(jobId) }
  })
}

export function registerTtsIpc() {
  ipcMain.handle('tts-model-statuses', async (_event, models: TtsModelDescriptor[]) => getTtsModelStatuses(models))
  ipcMain.handle('tts-gemini-keys-get', async () => getGeminiApiKeys())
  ipcMain.handle('tts-gemini-keys-set', async (_event, keys: string[]) => setGeminiApiKeys(keys))
  ipcMain.handle('tts-vbee-credentials-get', async () => getVbeeCredentials())
  ipcMain.handle('tts-vbee-credentials-set', async (_event, input: { appId?: string; token?: string }) => setVbeeCredentials(input))
  ipcMain.handle('tts-vbee-voices-get', async (_event, force?: boolean) => getVbeeVoices(Boolean(force)))
  ipcMain.handle('tts-vieneu-voices-get', async () => ({ success: true, voices: await listVieneuVoices() }))
  ipcMain.handle('tts-model-install', async (event, payload: { jobId: string; model: TtsModelDescriptor }) => (
    installTtsModel(payload.jobId, payload.model, (progress) => {
      if (!event.sender.isDestroyed()) event.sender.send('tts-runtime-event', progress)
    })
  ))
  ipcMain.handle('tts-model-remove', async (_event, modelId: string) => removeTtsModel(modelId))
  ipcMain.handle('tts-generate', async (event, payload: TtsGeneratePayload) => (
    generateTts(payload, (progress) => {
      if (!event.sender.isDestroyed()) event.sender.send('tts-runtime-event', progress)
    })
  ))
  ipcMain.handle('tts-cancel', async (_event, jobId: string) => cancelTtsJob(jobId))
  ipcMain.handle('tts-pick-reference-audio', async (_event, title?: string) => pickReferenceAudio(title))
  ipcMain.handle('tts-export-audio', async (_event, sourcePath: string, title?: string) => exportTtsAudio(sourcePath, title))
  ipcMain.handle('tts-reveal-audio', async (_event, filePath: string) => revealTtsAudio(filePath))
}

export function registerRenderIpc() {
  // ==================== Auto Video Render ====================
  ipcMain.handle('auto-video-render', async (_event, payload: Omit<RenderJobRequest, 'mediaRoot'>) => {
    return renderVideo({ ...payload, mediaRoot: getMediaRoot() }, (progress) => {
      _event.sender.send('auto-video-render-event', progress)
    })
  })

  ipcMain.handle('auto-video-cancel', async (_event, jobId: string) => {
    return { canceled: cancelRender(jobId) }
  })

  ipcMain.handle('auto-video-pick-output', async (_event, defaultName: string) => {
    return { path: await pickOutputVideoPath(defaultName) }
  })

  ipcMain.handle('auto-video-show-in-folder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
    return { ok: true }
  })

  ipcMain.handle('auto-video-open-file', async (_event, filePath: string) => {
    const err = await shell.openPath(filePath)
    return { ok: !err, error: err || undefined }
  })

  // ==================== Auto Edit Render ====================
  ipcMain.handle('editor-render', async (_event, payload: { jobId: string; plan: import('../../src/features/auto-edit/render/types').RenderPlan; outputPath: string; options?: import('../../src/features/auto-edit/render/types').ExportOptions }) => {
    return renderEditor(payload.plan, payload.jobId, payload.outputPath, (progress) => {
      if (!_event.sender.isDestroyed()) _event.sender.send('editor-render-event', progress)
    }, payload.options)
  })

  ipcMain.handle('editor-render-cancel', async (_event, jobId: string) => {
    return { canceled: cancelEditorRender(jobId) }
  })

  ipcMain.handle('editor-render-pick-output', async (_event, defaultName: string) => {
    return { path: await pickEditorOutput(defaultName) }
  })

  ipcMain.handle('editor-render-show-in-folder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
    return { ok: true }
  })
}
