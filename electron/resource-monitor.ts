import os from 'node:os'
import { ipcMain } from 'electron'
import { broadcastToWindows } from './app-window'
import { getActiveProcessList, terminateManagedProcess } from './process-supervisor'

export interface SystemResourceMetrics {
  cpuUsagePercent: number
  totalMemMb: number
  usedMemMb: number
  freeMemMb: number
  memUsagePercent: number
  activeProcesses: Array<{
    id: string
    name: string
    pid: number
    runtimeMs: number
  }>
}

let previousCpus = os.cpus()
let monitorTimer: NodeJS.Timeout | null = null

function calculateCpuUsage(): number {
  const currentCpus = os.cpus()
  let idleDelta = 0
  let totalDelta = 0

  for (let i = 0; i < currentCpus.length; i++) {
    const prev = previousCpus[i]?.times
    const curr = currentCpus[i]?.times
    if (!prev || !curr) continue

    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq
    const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq

    totalDelta += currTotal - prevTotal
    idleDelta += curr.idle - prev.idle
  }

  previousCpus = currentCpus
  if (totalDelta === 0) return 0
  const usage = Math.round((1 - idleDelta / totalDelta) * 100)
  return Math.max(0, Math.min(100, usage))
}

export function getSystemResourceMetrics(): SystemResourceMetrics {
  const totalBytes = os.totalmem()
  const freeBytes = os.freemem()
  const usedBytes = totalBytes - freeBytes

  const totalMemMb = Math.round(totalBytes / (1024 * 1024))
  const freeMemMb = Math.round(freeBytes / (1024 * 1024))
  const usedMemMb = Math.round(usedBytes / (1024 * 1024))
  const memUsagePercent = Math.round((usedBytes / totalBytes) * 100)

  return {
    cpuUsagePercent: calculateCpuUsage(),
    totalMemMb,
    usedMemMb,
    freeMemMb,
    memUsagePercent,
    activeProcesses: getActiveProcessList(),
  }
}

export function registerResourceMonitorIpc(): void {
  ipcMain.handle('system:get-resource-metrics', () => {
    return getSystemResourceMetrics()
  })

  ipcMain.handle('system:cancel-managed-process', (_event, processId: string) => {
    return terminateManagedProcess(processId, 'SIGKILL')
  })

  // Start periodic broadcast (every 3 seconds)
  if (!monitorTimer) {
    monitorTimer = setInterval(() => {
      try {
        const metrics = getSystemResourceMetrics()
        broadcastToWindows('system:resource-metrics-update', metrics)
      } catch {}
    }, 3000)
  }
}

export function stopResourceMonitor(): void {
  if (monitorTimer) {
    clearInterval(monitorTimer)
    monitorTimer = null
  }
}
