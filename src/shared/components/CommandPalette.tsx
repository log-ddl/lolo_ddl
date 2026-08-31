import { useEffect, useState, useMemo, useRef } from "react";
import {
  Search,
  Video,
  Mic,
  MessageSquare,
  SearchCode,
  Scissors,
  Moon,
  Sun,
  Settings,
  Home,
  Command,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useAppShellStore } from "@/shared/stores/app-shell-store";
import { useThemeStore } from "@/shared/stores/theme-store";

interface CommandItem {
  id: string;
  title: string;
  category: "features" | "appearance" | "settings";
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { openFeature, goHome, openSettings } = useAppShellStore();
  const { setTheme } = useThemeStore();

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-scroll selected item into view on keyboard navigation
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  const items: CommandItem[] = useMemo(() => [
    {
      id: "feature-home",
      title: "Trang chủ (Home)",
      category: "features",
      description: "Xem danh sách tổng quan các công cụ AI",
      icon: Home,
      action: () => {
        goHome();
        setOpen(false);
      },
      keywords: ["home", "trang chu", "dashboard", "overview"]
    },
    {
      id: "feature-video-studio",
      title: "Video AI Studio",
      category: "features",
      description: "Soạn kịch bản, đạo diễn, vẽ ảnh và render video AI",
      icon: Video,
      badge: "Studio",
      action: () => {
        openFeature("video-studio");
        setOpen(false);
      },
      keywords: ["video", "studio", "render", "timeline", "kich ban"]
    },
    {
      id: "feature-tts-voice",
      title: "TTS – Tạo giọng nói (OmniVoice)",
      category: "features",
      description: "Voice Clone, tạo giọng đọc thuyết minh đa ngôn ngữ",
      icon: Mic,
      badge: "Local AI",
      action: () => {
        openFeature("tts-voice");
        setOpen(false);
      },
      keywords: ["tts", "voice", "giong doc", "omnivoice", "clone"]
    },
    {
      id: "feature-content-chat",
      title: "Content Chat (AI MCP Agent)",
      category: "features",
      description: "Trò chuyện & điều khiển công cụ tự động qua MCP",
      icon: MessageSquare,
      badge: "MCP",
      action: () => {
        openFeature("content-chat");
        setOpen(false);
      },
      keywords: ["chat", "content", "mcp", "agent", "tro ly"]
    },
    {
      id: "feature-research-monitor",
      title: "Nghiên cứu & Theo dõi (Research Monitor)",
      category: "features",
      description: "Theo dõi kênh YouTube, trích xuất phụ đề và bình luận",
      icon: SearchCode,
      action: () => {
        openFeature("research-monitor");
        setOpen(false);
      },
      keywords: ["research", "monitor", "youtube", "comments", "theo doi"]
    },
    {
      id: "feature-auto-edit",
      title: "Auto Edit (Tự động cắt ghép)",
      category: "features",
      description: "Tự động biên tập video theo kịch bản",
      icon: Scissors,
      action: () => {
        openFeature("auto-edit");
        setOpen(false);
      },
      keywords: ["auto edit", "cat video", "bien tap"]
    },
    {
      id: "theme-dark",
      title: "Chuyển sang Giao diện Tối (Dark Mode)",
      category: "appearance",
      description: "Tối ưu làm việc ban đêm, giảm mỏi mắt",
      icon: Moon,
      action: () => {
        setTheme("dark");
        setOpen(false);
      },
      keywords: ["dark", "toi", "theme", "night"]
    },
    {
      id: "theme-light",
      title: "Chuyển sang Giao diện Sáng (Light Mode)",
      category: "appearance",
      description: "Giao diện sáng rõ ràng, tươi sáng",
      icon: Sun,
      action: () => {
        setTheme("light");
        setOpen(false);
      },
      keywords: ["light", "sang", "theme", "day"]
    },
    {
      id: "settings-global",
      title: "Cài đặt ứng dụng (Settings)",
      category: "settings",
      description: "Quản lý API Keys, tài khoản, ngôn ngữ và bộ nhớ cache",
      icon: Settings,
      action: () => {
        openSettings();
        setOpen(false);
      },
      keywords: ["settings", "cai dat", "api", "key", "license", "storage"]
    }
  ], [goHome, openFeature, openSettings, setTheme]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchKeywords;
    });
  }, [items, query]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) current.action();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-xl bg-card/95 backdrop-blur-xl border-border shadow-2xl rounded-2xl [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>

        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 bg-background/60">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Tìm tính năng, công cụ, chuyển giao diện, cài đặt..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          <div className="flex items-center px-2 py-0.5 rounded-md bg-muted/80 text-[11px] font-mono text-muted-foreground border border-border/60 select-none shadow-2xs">
            <span>ESC</span>
          </div>
        </div>

        {/* Results list */}
        <div className="max-h-[360px] overflow-y-auto p-2 divide-y divide-border/20">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Không tìm thấy lệnh hoặc tính năng phù hợp.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium leading-none">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`text-2xs px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                                isSelected
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-primary/10 text-primary border border-primary/20"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p
                            className={`text-xs truncate mt-1 ${
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            }`}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 shrink-0 text-primary-foreground/80" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-t border-border/50 text-2xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ để di chuyển</span>
            <span>•</span>
            <span>Enter để chọn</span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K để mở/đóng</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
