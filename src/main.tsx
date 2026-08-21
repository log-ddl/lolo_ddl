import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge (only available in Electron)
if (window.ipcRenderer) {
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
}

// Register the renderer-side AutoPilot HTTP handler as soon as the renderer boots
// so the local server never answers 503 after startup.
import('./features/video-studio/autopilot/autopilot-http-handler').then(({ registerAutopilotHttpHandler }) => {
  registerAutopilotHttpHandler()
}).catch((error) => {
  console.error('[autopilot] failed to register HTTP handler:', error)
})
