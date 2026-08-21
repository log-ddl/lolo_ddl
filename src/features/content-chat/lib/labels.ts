import type { ContentCliAdapter, ContentMessage } from "../store";

export function createMessage(role: ContentMessage["role"], content: string): ContentMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now() };
}

export function cliLabel(adapter: ContentCliAdapter, includeCli = false) {
  const label = adapter === "claude" ? "Claude" : adapter === "opencode" ? "OpenCode" : "Codex";
  return includeCli ? `${label} CLI` : label;
}

export function effortLabel(effort: string, locale: string) {
  const labels: Record<string, { en: string; vi: string }> = {
    none: { en: "None", vi: "Không suy luận" },
    minimal: { en: "Minimal", vi: "Tối thiểu" },
    low: { en: "Low", vi: "Thấp" },
    medium: { en: "Medium", vi: "Trung bình" },
    high: { en: "High", vi: "Cao" },
    xhigh: { en: "Extra high", vi: "Rất cao" },
    max: { en: "Maximum", vi: "Tối đa" },
    ultra: { en: "Ultra", vi: "Siêu cao" },
  };
  const language = locale.toLocaleLowerCase().startsWith("vi") ? "vi" : "en";
  const value = labels[effort]?.[language] ?? effort;
  return language === "vi" ? `Suy luận: ${value}` : `Reasoning: ${value}`;
}

/** Last path segment, used as the short workspace name in the UI. */
export function workspaceLabel(workspacePath: string) {
  return workspacePath.split(/[\\/]/).filter(Boolean).pop() || workspacePath;
}
