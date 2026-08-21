export function formatViews(value: number) {
  const integerValue = Math.round(value);
  if (integerValue >= 1000000) return `${(integerValue / 1000000).toFixed(integerValue >= 10000000 ? 0 : 1)}M`;
  if (integerValue >= 1000) return `${(integerValue / 1000).toFixed(integerValue >= 100000 ? 0 : 1)}K`;
  return String(integerValue);
}

export function formatDuration(value: string) {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatAge(value: string, language: UILanguage = "vi") {
  const hours = Math.max(1, (Date.now() - new Date(value).getTime()) / 3_600_000);
  if (hours < 48) return translate(language, "research.time.hoursAgo", { count: Math.round(hours) });
  const days = hours / 24;
  if (days < 60) return translate(language, "research.time.daysAgo", { count: Math.round(days) });
  const months = days / 30;
  if (months < 24) return translate(language, "research.time.monthsAgo", { count: Math.round(months) });
  return translate(language, "research.time.yearsAgo", { count: Math.round(months / 12) });
}
import { translate } from "@/shared/i18n";
import type { UILanguage } from "@/shared/stores/ui-preferences-store";
