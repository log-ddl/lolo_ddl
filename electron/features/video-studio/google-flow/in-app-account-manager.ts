import type { InAppBrowserSessionManager } from '../browser-session/session-manager'
import type { GoogleFlowRuntime } from './runtime'
import { GoogleFlowInAppBridge } from './in-app-bridge'
import { InAppAccountManager } from '../browser-session/in-app-account-manager'

const LOGIN_URL = 'https://labs.google/fx/tools/flow'

export class GoogleFlowInAppAccountManager extends InAppAccountManager<GoogleFlowInAppBridge> {
  constructor(sessionManager: InAppBrowserSessionManager, runtime: GoogleFlowRuntime) {
    super('google-flow', LOGIN_URL, 'Google Flow', sessionManager, runtime, (handle, onFirstReady) => {
      return new GoogleFlowInAppBridge(handle, runtime, onFirstReady)
    })
  }
}
