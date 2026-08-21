import { EventEmitter } from 'node:events'

// Stand-in for a `ws` WebSocket that GoogleFlowRuntime.attachSocket() (and
// later GrokVideoRuntime.attachSocket()) accept without any changes to
// those methods — they only ever touch `.readyState`, `.send()`,
// `.close()`, and the EventEmitter `'message'`/`'close'` events, so a
// duck-typed object here lets an app-driven Chrome stand in for a real
// extension WebSocket connection.
export const READY_STATE = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 } as const

export class FakeSocket extends EventEmitter {
  readyState: number = READY_STATE.CONNECTING

  constructor(private readonly onSend: (json: string) => void) {
    super()
  }

  open(): void {
    if (this.readyState === READY_STATE.CLOSED) return
    this.readyState = READY_STATE.OPEN
  }

  send(data: string): void {
    if (this.readyState !== READY_STATE.OPEN) return
    this.onSend(data)
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === READY_STATE.CLOSED) return
    this.readyState = READY_STATE.CLOSED
    this.emit('close', code, reason)
  }

  // Feed an inbound message (as if the extension had sent it over the wire)
  // into whatever runtime.attachSocket() wired up via `.on('message', ...)`.
  receive(json: string): void {
    if (this.readyState !== READY_STATE.OPEN) return
    this.emit('message', Buffer.from(json, 'utf8'))
  }
}
