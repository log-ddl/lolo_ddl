import { useEffect, useState } from "react";
import { Cpu, HardDrive, Activity, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { toast } from "sonner";

interface ProcessInfo {
  id: string;
  name: string;
  pid: number;
  runtimeMs: number;
}

interface ResourceMetrics {
  cpuUsagePercent: number;
  totalMemMb: number;
  usedMemMb: number;
  freeMemMb: number;
  memUsagePercent: number;
  activeProcesses: ProcessInfo[];
}

export function ResourceStatusBar() {
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const sys = (window as any).systemResources;
    if (!sys) return;
    setIsElectron(true);

    // Initial fetch
    sys.getMetrics().then((data: ResourceMetrics) => {
      if (data) setMetrics(data);
    }).catch(() => {});

    // Live subscription
    const unsubscribe = sys.onMetricsUpdate((data: ResourceMetrics) => {
      if (data) setMetrics(data);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  if (!isElectron || !metrics) return null;

  const getUsageColor = (pct: number) => {
    if (pct >= 85) return "text-destructive font-semibold";
    if (pct >= 65) return "text-amber-500 font-medium";
    return "text-emerald-500";
  };

  const formatRuntime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  };

  const handleCancelProcess = async (procId: string, name: string) => {
    const sys = (window as any).systemResources;
    if (!sys) return;
    try {
      await sys.cancelProcess(procId);
      toast.success(`Đã dừng tiến trình "${name}"`);
    } catch {
      toast.error(`Không thể dừng tiến trình "${name}"`);
    }
  };

  return (
    <div className="fixed bottom-2 right-4 z-40 flex items-center gap-2 pointer-events-auto">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-3 px-2.5 py-1 rounded-full bg-card/85 backdrop-blur-md border border-border/70 shadow-xs hover:border-primary/40 transition-all text-2xs font-mono text-muted-foreground select-none"
            title="Nhấn để xem chi tiết tài nguyên và tiến trình đang chạy"
          >
            {/* CPU */}
            <div className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span>CPU</span>
              <span className={getUsageColor(metrics.cpuUsagePercent)}>
                {metrics.cpuUsagePercent}%
              </span>
            </div>

            <span className="text-border">•</span>

            {/* RAM */}
            <div className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span>RAM</span>
              <span className={getUsageColor(metrics.memUsagePercent)}>
                {metrics.memUsagePercent}%
              </span>
            </div>

            {/* Active processes badge */}
            {metrics.activeProcesses && metrics.activeProcesses.length > 0 && (
              <>
                <span className="text-border">•</span>
                <div className="flex items-center gap-1 text-primary font-medium animate-pulse">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span>{metrics.activeProcesses.length} tác vụ</span>
                </div>
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent side="top" align="end" className="w-72 p-3 bg-card/95 backdrop-blur-xl border-border shadow-xl rounded-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-semibold text-foreground">Giám sát tài nguyên hệ thống</span>
              <Activity className="w-4 h-4 text-primary" />
            </div>

            {/* RAM detail */}
            <div className="space-y-1 text-2xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Bộ nhớ RAM:</span>
                <span className="font-mono text-foreground font-medium">
                  {metrics.usedMemMb} MB / {metrics.totalMemMb} MB ({metrics.memUsagePercent}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    metrics.memUsagePercent >= 85 ? "bg-destructive" : metrics.memUsagePercent >= 65 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${metrics.memUsagePercent}%` }}
                />
              </div>
            </div>

            {/* Active Processes list */}
            <div className="pt-2 border-t border-border/40">
              <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Tiến trình đang chạy ({metrics.activeProcesses?.length || 0})
              </span>

              {!metrics.activeProcesses || metrics.activeProcesses.length === 0 ? (
                <div className="py-3 text-center text-2xs text-muted-foreground italic">
                  Không có tác vụ nền nào đang chạy.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {metrics.activeProcesses.map((proc) => (
                    <div
                      key={proc.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50 border border-border/50 text-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-foreground truncate">{proc.name}</p>
                        <p className="font-mono text-muted-foreground text-[10px]">
                          PID: {proc.pid} • Thời gian: {formatRuntime(proc.runtimeMs)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelProcess(proc.id, proc.name)}
                        className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        title="Dừng tiến trình"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
