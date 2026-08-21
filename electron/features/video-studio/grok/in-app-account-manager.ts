import type { InAppBrowserSessionManager } from '../browser-session/session-manager'
import type { GrokVideoRuntime } from './runtime'
import { GrokInAppBridge } from './in-app-bridge'
import { InAppAccountManager } from '../browser-session/in-app-account-manager'

const LOGIN_URL = 'https://grok.com/imagine'

export class GrokInAppAccountManager extends InAppAccountManager<GrokInAppBridge> {
  constructor(sessionManager: InAppBrowserSessionManager, runtime: GrokVideoRuntime, extensionPath: string, mediaRoot: string) {
    super('grok', LOGIN_URL, 'Grok', sessionManager, runtime, (handle, onFirstReady) => {
      return new GrokInAppBridge(handle, runtime, extensionPath, mediaRoot, onFirstReady)
    })
  }
}
