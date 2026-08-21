import { app, ipcMain } from 'electron'
import Database from 'better-sqlite3'
import path from 'node:path'

type SnapshotVideo = {
  id: string
  channelId: string
  title: string
  thumbnailUrl: string
  viewCount: number
  capturedAt?: number
}

type SnapshotChannel = {
  id: string
  viewCount: number
  capturedAt?: number
}

type RecordScanPayload = {
  startedAt: number
  finishedAt: number
  scope: 'channels' | 'videos' | 'all'
  videos: SnapshotVideo[]
  channels: SnapshotChannel[]
}

type LegacyPoint = {
  scannedAt: number
  viewCount: number
  deltaViews: number
  elapsedHours: number
}

type LegacyPayload = {
  snapshots: Record<string, { videoId: string; channelId: string; title: string; thumbnailUrl: string; viewCount: number; scannedAt: number }>
  vphHistory: Record<string, LegacyPoint[]>
  channelSnapshots: Record<string, { channelId: string; viewCount: number; scannedAt: number }>
  channelViewHistory: Record<string, LegacyPoint[]>
}

let database: Database.Database | null = null

function getDatabase() {
  if (database) return database
  const filePath = path.join(app.getPath('userData'), 'research-monitor.sqlite3')
  database = new Database(filePath)
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')
  database.pragma('synchronous = FULL')
  database.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at INTEGER NOT NULL,
      finished_at INTEGER NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('channels', 'videos', 'all')),
      status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
      channel_count INTEGER NOT NULL DEFAULT 0,
      video_count INTEGER NOT NULL DEFAULT 0,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS video_snapshots (
      video_id TEXT NOT NULL,
      captured_at INTEGER NOT NULL,
      scan_id INTEGER,
      channel_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      view_count INTEGER NOT NULL,
      PRIMARY KEY (video_id, captured_at),
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS channel_snapshots (
      channel_id TEXT NOT NULL,
      captured_at INTEGER NOT NULL,
      scan_id INTEGER,
      view_count INTEGER NOT NULL,
      PRIMARY KEY (channel_id, captured_at),
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_video_snapshots_time
      ON video_snapshots(video_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_channel_snapshots_time
      ON channel_snapshots(channel_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(finished_at DESC);
  `)
  return database
}

function recordScan(payload: RecordScanPayload) {
  const db = getDatabase()
  return db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO scans(started_at, finished_at, scope, status, channel_count, video_count)
      VALUES (?, ?, ?, 'success', ?, ?)
    `).run(payload.startedAt, payload.finishedAt, payload.scope, payload.channels.length, payload.videos.length)
    const scanId = Number(result.lastInsertRowid)
    const insertVideo = db.prepare(`
      INSERT OR IGNORE INTO video_snapshots
        (video_id, captured_at, scan_id, channel_id, title, thumbnail_url, view_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertChannel = db.prepare(`
      INSERT OR IGNORE INTO channel_snapshots(channel_id, captured_at, scan_id, view_count)
      VALUES (?, ?, ?, ?)
    `)
    for (const video of payload.videos) {
      insertVideo.run(video.id, video.capturedAt || payload.finishedAt, scanId, video.channelId, video.title, video.thumbnailUrl, video.viewCount)
    }
    for (const channel of payload.channels) {
      insertChannel.run(channel.id, channel.capturedAt || payload.finishedAt, scanId, channel.viewCount)
    }
    return { scanId }
  })()
}

function recordFailure(payload: { startedAt: number; finishedAt: number; scope: RecordScanPayload['scope']; error: string }) {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO scans(started_at, finished_at, scope, status, error)
    VALUES (?, ?, ?, 'failed', ?)
  `).run(payload.startedAt, payload.finishedAt, payload.scope, payload.error)
  return { scanId: Number(result.lastInsertRowid) }
}

function loadHistory() {
  const db = getDatabase()
  const videos = db.prepare(`
    SELECT video_id AS videoId, channel_id AS channelId, title, thumbnail_url AS thumbnailUrl,
           view_count AS viewCount, captured_at AS scannedAt
    FROM video_snapshots ORDER BY video_id, captured_at
  `).all()
  const channels = db.prepare(`
    SELECT channel_id AS channelId, view_count AS viewCount, captured_at AS scannedAt
    FROM channel_snapshots ORDER BY channel_id, captured_at
  `).all()
  const scans = db.prepare(`
    SELECT id, started_at AS startedAt, finished_at AS finishedAt, scope, status,
           channel_count AS channelCount, video_count AS videoCount, error
    FROM scans ORDER BY finished_at DESC LIMIT 100
  `).all()
  return { videos, channels, scans }
}

function migrateLegacy(payload: LegacyPayload) {
  const db = getDatabase()
  return db.transaction(() => {
    const insertVideo = db.prepare(`
      INSERT OR IGNORE INTO video_snapshots
        (video_id, captured_at, channel_id, title, thumbnail_url, view_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const insertChannel = db.prepare(`
      INSERT OR IGNORE INTO channel_snapshots(channel_id, captured_at, view_count)
      VALUES (?, ?, ?)
    `)
    for (const [videoId, points] of Object.entries(payload.vphHistory || {})) {
      const metadata = payload.snapshots?.[videoId]
      for (const point of points) {
        const previousAt = Math.round(point.scannedAt - point.elapsedHours * 3_600_000)
        insertVideo.run(videoId, previousAt, metadata?.channelId || '', metadata?.title || '', metadata?.thumbnailUrl || '', point.viewCount - point.deltaViews)
        insertVideo.run(videoId, point.scannedAt, metadata?.channelId || '', metadata?.title || '', metadata?.thumbnailUrl || '', point.viewCount)
      }
    }
    for (const snapshot of Object.values(payload.snapshots || {})) {
      insertVideo.run(snapshot.videoId, snapshot.scannedAt, snapshot.channelId, snapshot.title, snapshot.thumbnailUrl, snapshot.viewCount)
    }
    for (const [channelId, points] of Object.entries(payload.channelViewHistory || {})) {
      for (const point of points) {
        const previousAt = Math.round(point.scannedAt - point.elapsedHours * 3_600_000)
        insertChannel.run(channelId, previousAt, point.viewCount - point.deltaViews)
        insertChannel.run(channelId, point.scannedAt, point.viewCount)
      }
    }
    for (const snapshot of Object.values(payload.channelSnapshots || {})) {
      insertChannel.run(snapshot.channelId, snapshot.scannedAt, snapshot.viewCount)
    }
    return { migrated: true }
  })()
}

export function registerResearchDatabaseIpc() {
  ipcMain.handle('research-db-record-scan', (_event, payload: RecordScanPayload) => recordScan(payload))
  ipcMain.handle('research-db-record-failure', (_event, payload: Parameters<typeof recordFailure>[0]) => recordFailure(payload))
  ipcMain.handle('research-db-load', () => loadHistory())
  ipcMain.handle('research-db-migrate-legacy', (_event, payload: LegacyPayload) => migrateLegacy(payload))
  ipcMain.handle('research-db-clear-history', () => {
    const db = getDatabase()
    db.transaction(() => {
      db.prepare('DELETE FROM video_snapshots').run()
      db.prepare('DELETE FROM channel_snapshots').run()
      db.prepare('DELETE FROM scans').run()
    })()
    return true
  })
}

export function closeResearchDatabase() {
  database?.close()
  database = null
}
