# logdd Media MCP

The desktop app exposes its existing image, video and speech engines through MCP. Grok and Qwen Image remain available. The tool host is mounted in AppShell, so switching away from Content Chat does not disconnect it. Open the app and sign in before connecting an AI client.

## Connect an external AI client

Requires Node.js 20 or later. Add this MCP server to your client's MCP configuration (adapt paths to your checkout):

```json
{
  "mcpServers": {
    "logdd": {
      "command": "node",
      "args": ["D:/bk/scripts/media-mcp-stdio.mjs"]
    }
  }
}
```

The packaged app also ships the bridge at `resources/mcp/media-mcp-stdio.mjs`. It reads the app's rotating connection file at `%APPDATA%/logdd/mcp-connection.json` on Windows, `~/Library/Application Support/logdd/mcp-connection.json` on macOS, or `$XDG_CONFIG_HOME/logdd/mcp-connection.json` (default `~/.config`) on Linux. For another user-data directory, pass the full connection-file path as the second argument or set `LOGDD_MCP_CONNECTION_FILE`.

The connection file contains a local bearer token: do not share or commit it. The bridge rereads it on every call, so app restarts require no configuration edits. Provider credentials remain in the app. Internal Content Chat continues using the same gateway.

HTTP listens only on `127.0.0.1`, checks bearer authentication and validates browser origins. See the [MCP transport specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports).

## Tools

| Tool | Purpose |
| --- | --- |
| `list_media_capabilities` | Media models, supported modes and TTS installation status |
| `generate_image` | Prompt plus up to 10 reference images |
| `generate_video` | Text-to-video, image-to-video or reference-to-video |
| `list_voice_profiles` | Saved clone profiles and preset voice IDs for a selected model |
| `create_voice_profile` | Save a clone profile from an existing audio path and transcript |
| `create_tts_audio` | Speech with a clone, preset, voice design or auto voice |
| `get_media_task` / `list_media_tasks` | Progress, errors and completed outputs |
| `cancel_media_task` | Request cancellation through the existing runtime |
| `get_media_asset` | Output metadata and optional image content for visual inspection |

Existing YouTube tools remain available.

Generation and profile creation return a `taskId` immediately. Poll `get_media_task` every few seconds until it reaches a terminal state. Successful generation returns `result.assetId`, `source` and, for local files, `outputPath`. Pass an image's `assetId` into later `references` or `startImage` arguments. Flow reference metadata is preserved. Absolute image paths and existing image URLs also work. `get_media_asset` with `includePreview: true` returns MCP image content for vision clients (maximum 9 MB).

Every creation call requires `requestKey`. Reuse the same key and arguments after a timeout to retrieve the same task; use a new key only for intentionally new work. Up to 1000 records are retained locally, with at most 8 active MCP tasks. After reload/restart, unfinished jobs become `interrupted` and are never automatically resubmitted. Check provider history before retrying interrupted jobs. Completed asset IDs survive reloads. Persistence is best effort if local storage is full; clearing app data removes task history.

Cancellation can take time. If a provider finishes first, the task keeps the completed output. The app must remain open. Progress includes preparation/submission stages; speech also reports runtime progress. Generation may consume provider credits.

## Example workflow

1. Call `list_media_capabilities` and choose a model.
2. Call `generate_image` with `{"requestKey":"character-001","prompt":"A clay fox","model":"GEM_PIX_2"}`.
3. Poll the task; take `result.assetId` from the completed result.
4. Call `generate_video` with `{"requestKey":"shot-001","prompt":"The fox walks slowly","model":"Veo_3.1-Fast","mode":"image-to-video","startImage":"<assetId>","duration":8}`.
5. Call `list_voice_profiles` with `{"modelId":"capcut-online"}`, then `create_tts_audio` with `{"requestKey":"narration-001","text":"Hello world","modelId":"capcut-online","voiceId":"<voiceId>"}`.

For cloning, pass an existing `voiceProfileId` or `referenceAudioPath` plus `referenceText` directly to `create_tts_audio`. OmniVoice requires a transcript; VieNeu may omit it. Clone profiles must match the engine. Saving a profile records its source path; keep that audio file in place. The runtime checks readability when synthesis starts. Local models must already be installed; online providers must be configured.

Grok supports text and start/end-image video; reference video uses Google Flow. Veo reference video uses 8 seconds. Account-tier restrictions remain enforced by the underlying runtimes. MCP follows the interface's Video Studio plan requirement and does not install models or open login dialogs automatically.

## Validation

`npm run test:media-mcp` runs mocked engine integration tests and a real local HTTP/stdio transport test. Coverage includes validation, duplicate requests, cancellation races, reload recovery, image references, three video modes, clone speech and four preset engines. Tests do not consume provider credits or establish live provider availability. Build with `npx electron-vite build`.
