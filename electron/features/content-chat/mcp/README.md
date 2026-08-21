# Content Chat MCP

This folder exposes existing logdd capabilities to the CLI agent without moving or rewriting their feature implementations.

Current tools:

- `search_youtube`
- `get_youtube_comments`
- `get_youtube_transcript`

The MCP endpoint is bound to `127.0.0.1` and protected by a random token generated for each app process. Tool calls are forwarded to the renderer, which invokes the same Research and Media Toolkit functions used by the existing UI.

Future action tools (voice, image, video, render, export) should be added here as adapters over their existing runtimes. Destructive, paid, or long-running actions should require explicit confirmation and return task progress/status.
