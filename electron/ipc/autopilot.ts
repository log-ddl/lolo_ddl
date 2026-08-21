import { ipcMain } from 'electron'
import { autopilotHttpServer } from '../features/video-studio/autopilot-http-server'
import { findAppWebContents } from '../app-window'

export function registerAutopilotIpc() {
  ipcMain.handle('autopilot-server-status', () => {
    return {
      port: autopilotHttpServer.getPort(),
      running: autopilotHttpServer.isRunning(),
    }
  })

  ipcMain.on('autopilot:http-response', (_event, requestId: string, status: number, body: unknown) => {
    autopilotHttpServer.handleResponse(requestId, status, body)
  })

  ipcMain.on('autopilot:sse-event', (_event, requestId: string, event: unknown) => {
    autopilotHttpServer.handleSseEvent(requestId, event)
  })
}

export function startAutopilotServer(): void {
  autopilotHttpServer.start(() => findAppWebContents())
}
