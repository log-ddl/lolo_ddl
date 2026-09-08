"use client";

/**
 * Picks which Google Flow accounts and models media generation may use.
 *
 * Rendered twice with the same shape: in Settings it edits the app-wide defaults,
 * in AutoPilot's advanced section it edits one job. A job copies the defaults when
 * it is created, so what is on screen there is always what that job will run with.
 *
 * The panel is split the way the accounts actually differ:
 *
 * - Images: every Flow account can run every image model, so there is nothing to
 *   configure per account — only the order models are tried in.
 * - Videos: Omni Flash and the low-priority Veo keys exist on some accounts and
 *   not on others, so each account carries its own list of models it owns. A
 *   model no enabled account owns is skipped instead of burning an attempt on a
 *   404 that no retry can fix.
 *
 * Empty still means "no restriction" everywhere: no disabled account = every
 * connected account, no order picked = whatever Settings selected, untouched
 * model ticks = the account owns everything.
 */

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import {
  GOOGLE_FLOW_IMAGE_MODELS,
  GOOGLE_FLOW_VIDEO_MODELS,
  getModelDisplayName,
  modelGroupKey,
} from "@/features/video-studio/lib/api-key-manager";
import { useGoogleFlowRuntimeStore } from "@/features/video-studio/stores/google-flow-runtime-store";
import { buildAccountRouting, type AccountVideoModelMap } from "@/features/video-studio/autopilot/account-routing";
import type { VideoStudioInAppAccount } from "@/shared/types/electron";

export interface MediaRoutingValue {
  /** Head of the image chain. Empty = inherit whatever Settings selected. */
  imageModel?: string;
  videoModel?: string;
  imageModelFallbacks: string[];
  videoModelFallbacks: string[];
  /** Accounts (`ownerScopeId`) the job may use. Empty = every connected account. */
  flowAccounts: string[];
  /** ownerScopeId → video models that account owns. Missing entry = owns everything. */
  accountVideoModels: AccountVideoModelMap;
}

const ACCOUNT_LABELS_KEY = "googleFlowAccountLabels";

function readAccountLabels(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_LABELS_KEY) || "{}"); } catch { return {}; }
}

/** Head + fallbacks as one ordered list, which is how the user reads it. */
function toChain(primary: string | undefined, fallbacks: string[]): string[] {
  return [...new Set([primary || "", ...fallbacks].map((model) => (model || "").trim()).filter(Boolean))];
}

/**
 * Locks as the user reads them: one entry per model name, keeping the earliest
 * reset. One picked video model expands into several runtime keys that all read
 * back as the same name, so without this a single locked model would be listed
 * — and counted — several times.
 */
function lockedModelList(locks: Array<{ modelKey: string; until: number }> | undefined) {
  const byName = new Map<string, number>();
  for (const lock of locks || []) {
    const name = getModelDisplayName(lock.modelKey);
    const current = byName.get(name);
    if (current === undefined || lock.until < current) byName.set(name, lock.until);
  }
  return [...byName].map(([name, until]) => ({ name, until }));
}

/** Quota resets can land tomorrow, so the date only shows when it is not today. */
function formatUnlockAt(until: number): string {
  const at = new Date(until);
  const time = at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return at.toDateString() === new Date().toDateString()
    ? time
    : `${time} ${at.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
}

/**
 * One row of model chips whose click order is the run order.
 *
 * Clicking appends, so the numbers say what the user picked rather than where the
 * model happens to sit in the canonical list; clicking a picked model removes it
 * and the rest renumber.
 */
function ModelOrderPicker({
  label, hint, emptyHint, models, chain, onChange, warning, lockedUntil,
}: {
  label: string;
  hint: string;
  emptyHint: string;
  models: string[];
  chain: string[];
  onChange: (chain: string[]) => void;
  warning?: string;
  /**
   * modelId → when it frees up, for models out of daily quota on *every* enabled
   * account. Dimmed rather than disabled on purpose: this row is the plan a job
   * runs by, and a job started after that time uses the model normally, so
   * blocking the click here would block work that is perfectly valid.
   */
  lockedUntil?: Record<string, number>;
}) {
  const lockedNow = models
    .map((model) => ({ model, until: lockedUntil?.[model] }))
    .filter((item): item is { model: string; until: number } => typeof item.until === "number");
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1">
          {chain.length < models.length && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-2xs"
              onClick={() => onChange([...chain, ...models.filter((model) => !chain.includes(model))])}
            >
              Thêm hết
            </Button>
          )}
          {chain.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-2xs" onClick={() => onChange([])}>
              Xoá thứ tự
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {models.map((model) => {
          const index = chain.indexOf(model);
          const picked = index >= 0;
          const locked = lockedUntil?.[model];
          return (
            <Button
              key={model}
              type="button"
              variant={picked ? "default" : "outline"}
              size="sm"
              className={`h-7 rounded-full px-2.5 text-2xs ${locked ? "opacity-45" : ""}`}
              title={locked ? `Hết hạn mức trên mọi tài khoản đang bật — mở lại ${formatUnlockAt(locked)}` : undefined}
              onClick={() => onChange(picked ? chain.filter((item) => item !== model) : [...chain, model])}
            >
              {picked ? `${index + 1}. ` : ""}{getModelDisplayName(model)}
            </Button>
          );
        })}
      </div>
      <p className="text-2xs leading-4 text-muted-foreground">
        {chain.length > 0 ? `${hint}: ${chain.map(getModelDisplayName).join(" → ")}` : emptyHint}
      </p>
      {lockedNow.length > 0 && (
        <p className="text-2xs leading-4 text-amber-500">
          {`Hết hạn mức trên mọi tài khoản đang bật: ${lockedNow.map((item) => `${getModelDisplayName(item.model)} (mở lại ${formatUnlockAt(item.until)})`).join(" · ")}. Vẫn chọn được — job chạy sau giờ đó dùng lại bình thường.`}
        </p>
      )}
      {warning && <p className="text-2xs leading-4 text-amber-500">{warning}</p>}
    </div>
  );
}

export function MediaRoutingPicker({
  value, onChange,
  imageModels = GOOGLE_FLOW_IMAGE_MODELS,
  videoModels = GOOGLE_FLOW_VIDEO_MODELS,
  videoOnGoogleFlow = true,
}: {
  value: MediaRoutingValue;
  onChange: (next: MediaRoutingValue) => void;
  /** Models of the provider currently selected for each kind. */
  imageModels?: string[];
  videoModels?: string[];
  /**
   * Per-account video models and the quota routing they feed only exist on
   * Google Flow. With another provider selected for video, that whole part of
   * the panel would be describing accounts the request never touches.
   */
  videoOnGoogleFlow?: boolean;
}) {
  const { status, initialize, refresh } = useGoogleFlowRuntimeStore();
  const [accountLabels, setAccountLabels] = useState<Record<string, string>>({});
  const [inAppAccounts, setInAppAccounts] = useState<VideoStudioInAppAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  /** accountSlotId → why its Chrome could not be reconnected on the last refresh. */
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});

  useEffect(() => initialize(), [initialize]);
  useEffect(() => { setAccountLabels(readAccountLabels()); }, [status?.credentials.length]);
  useEffect(() => {
    void window.googleFlowRuntime?.listInAppAccounts().then(setInAppAccounts).catch(() => setInAppAccounts([]));
  }, [status?.credentials.length]);

  // An account can be signed in inside the app long before its extension sends a
  // token, and only the token creates the credential this panel routes on. Give
  // the user the same button Settings has instead of an empty box.
  const reloadAccounts = async () => {
    setRefreshing(true);
    try {
      const result = await window.googleFlowRuntime?.refreshInAppAccounts().catch(() => ({ ok: false, errors: [] }));
      setAccountErrors(Object.fromEntries((result?.errors || []).map((item) => [item.accountSlotId, item.message])));
      await refresh();
      setInAppAccounts(await (window.googleFlowRuntime?.listInAppAccounts().catch(() => []) ?? []));
    } finally {
      setRefreshing(false);
    }
  };

  const accounts = useMemo(() => (status?.credentials || []).map((credential) => ({
    ownerScopeId: credential.ownerScopeId,
    label: accountLabels[credential.extensionInstanceId]?.trim()
      || credential.email
      || `Tài khoản ${credential.extensionInstanceId.slice(0, 8)}`,
    state: credential.state,
    lockedModels: lockedModelList(credential.quotaLocks),
  })), [accountLabels, status?.credentials]);

  const patch = (next: Partial<MediaRoutingValue>) => onChange({ ...value, ...next });

  // A chain saved under a different provider can outlive the switch, so only
  // models the current provider actually offers are shown or handed on.
  const imageChain = toChain(value.imageModel, value.imageModelFallbacks).filter((model) => imageModels.includes(model));
  const videoChain = toChain(value.videoModel, value.videoModelFallbacks).filter((model) => videoModels.includes(model));

  // Mắt số 1 là model chính, phần còn lại là dự phòng — một danh sách, một nghĩa.
  const setChain = (kind: "image" | "video", chain: string[]) => {
    const [head, ...rest] = chain;
    patch(kind === "image"
      ? { imageModel: head || "", imageModelFallbacks: rest }
      : { videoModel: head || "", videoModelFallbacks: rest });
  };

  const accountIds = accounts.map((account) => account.ownerScopeId);
  // Empty list means "all", so the first account switched off has to materialise
  // the rest — otherwise turning one off would read as turning everything off.
  const isUsed = (ownerScopeId: string) => value.flowAccounts.length === 0 || value.flowAccounts.includes(ownerScopeId);
  const usedIds = accountIds.filter(isUsed);

  /**
   * modelId → when it frees up, for models every enabled account is out of daily
   * quota for. Only then does a lock actually stop anything: with one account
   * still free the runtime simply routes there, so marking a model on a single
   * account's lock would be telling the user something untrue. The moment it
   * frees up is the earliest of the accounts' resets, since the first account to
   * come back is enough.
   */
  const lockedEverywhere = useMemo(() => {
    const enabled = accounts.filter((account) => isUsed(account.ownerScopeId));
    if (enabled.length === 0) return {} as Record<string, number>;
    const result: Record<string, number> = {};
    for (const model of [...imageModels, ...videoModels]) {
      const group = modelGroupKey(model);
      const untils = enabled.map((account) => account.lockedModels.find((lock) => lock.name === group)?.until);
      if (untils.some((until) => until === undefined)) continue;
      result[model] = Math.min(...(untils as number[]));
    }
    return result;
  }, [accounts, value.flowAccounts, imageModels, videoModels]);

  const toggleAccount = (ownerScopeId: string) => {
    const current = value.flowAccounts.length ? value.flowAccounts : accountIds;
    const next = current.includes(ownerScopeId)
      ? current.filter((item) => item !== ownerScopeId)
      : [...current, ownerScopeId];
    // An empty list reads as "no restriction", so switching the last account off
    // would silently switch every account back on. Keep the last one enabled.
    if (next.length === 0) return;
    const isEveryone = accountIds.length > 0 && accountIds.every((item) => next.includes(item));
    patch({ flowAccounts: isEveryone ? [] : next });
  };

  // Settings persisted before this field existed come back without the map.
  const capabilities = value.accountVideoModels || {};

  const ownsModel = (ownerScopeId: string, model: string) => {
    const owned = capabilities[ownerScopeId];
    return !owned || owned.includes(model);
  };

  const toggleModel = (ownerScopeId: string, model: string) => {
    const owned = capabilities[ownerScopeId] || videoModels;
    const next = owned.includes(model)
      ? owned.filter((item) => item !== model)
      : videoModels.filter((item) => owned.includes(item) || item === model);
    const map = { ...capabilities };
    // Owning everything is the default, so store nothing rather than a full list
    // that would silently freeze if a new model is added later.
    if (next.length === videoModels.length) delete map[ownerScopeId];
    else map[ownerScopeId] = next;
    patch({ accountVideoModels: map });
  };

  // Same resolver the engine runs, so the warning here cannot drift from what a
  // job will actually do with these settings.
  const routing = useMemo(() => buildAccountRouting({
    connectedOwnerScopeIds: accountIds,
    flowAccounts: value.flowAccounts,
    accountVideoModels: capabilities,
  }), [accountIds.join("|"), value.flowAccounts, capabilities]);

  const droppedVideoModels = videoOnGoogleFlow
    ? videoChain.filter((model) => routing.videoAccountsFor(model)?.length === 0)
    : [];
  const hasAccounts = accounts.length > 0;
  // In-app accounts are keyed by the slot id the extension reports as its
  // instance id, so anything without a matching credential is signed in but not
  // yet usable — and has no ownerScopeId to route on.
  const connectedSlotIds = new Set((status?.credentials || []).map((credential) => credential.extensionInstanceId));
  const pendingAccounts = inAppAccounts.filter((account) => !connectedSlotIds.has(account.accountSlotId));

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-3">
      <div className="grid gap-4 md:grid-cols-2">
        <ModelOrderPicker
          label="Model ảnh — bấm theo thứ tự chạy"
          hint="Thứ tự"
          emptyHint="Chưa chọn model nào — sẽ dùng model mặc định và không đổi model khi hết hạn mức."
          models={imageModels}
          chain={imageChain}
          onChange={(chain) => setChain("image", chain)}
          lockedUntil={lockedEverywhere}
        />
        <ModelOrderPicker
          label="Model video — bấm theo thứ tự chạy"
          hint="Thứ tự"
          emptyHint="Chưa chọn model nào — sẽ dùng model mặc định và không đổi model khi hết hạn mức."
          models={videoModels}
          chain={videoChain}
          onChange={(chain) => setChain("video", chain)}
          lockedUntil={lockedEverywhere}
          warning={droppedVideoModels.length > 0
            ? `Bỏ qua ${droppedVideoModels.map(getModelDisplayName).join(", ")}: không tài khoản nào đang bật có model này.`
            : undefined}
        />
      </div>
      <p className="text-2xs leading-4 text-muted-foreground">
        Hết hạn mức model đầu trên mọi tài khoản thì tự chạy tiếp model kế — xếp đủ model để vét hết hạn mức.
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Tài khoản Google Flow</Label>
          <div className="flex items-center gap-1">
            {value.flowAccounts.length > 0 && (
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-2xs" onClick={() => patch({ flowAccounts: [] })}>
                Bật lại tất cả
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-2xs"
              disabled={refreshing}
              onClick={() => void reloadAccounts()}
            >
              {refreshing ? "Đang tải…" : "Làm mới"}
            </Button>
          </div>
        </div>
        {!hasAccounts && pendingAccounts.length === 0 ? (
          <p className="text-2xs text-muted-foreground">Chưa có tài khoản Google Flow nào kết nối.</p>
        ) : (
          <div className="space-y-1.5">
            {accounts.map((account) => {
              const used = isUsed(account.ownerScopeId);
              return (
                <div
                  key={account.ownerScopeId}
                  className={`rounded-lg border border-border/60 p-2 ${used ? "" : "opacity-50"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant={used ? "default" : "outline"}
                      size="sm"
                      className="h-7 rounded-full px-2.5 text-2xs"
                      onClick={() => toggleAccount(account.ownerScopeId)}
                    >
                      {used ? "✓ " : ""}{account.label}
                    </Button>
                    <span className="text-2xs text-muted-foreground">
                      {account.state !== "ready" && "chưa sẵn sàng"}
                      {account.state !== "ready" && account.lockedModels.length > 0 && " · "}
                      {account.lockedModels.length > 0 && `hết hạn mức: ${account.lockedModels
                        .map((lock) => `${lock.name} (mở lại ${formatUnlockAt(lock.until)})`)
                        .join(" · ")}`}
                    </span>
                  </div>
                  {used && videoOnGoogleFlow && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-2xs text-muted-foreground">Có model video:</span>
                      {videoModels.map((model) => {
                        const owns = ownsModel(account.ownerScopeId, model);
                        return (
                          <Button
                            key={model}
                            type="button"
                            variant={owns ? "secondary" : "outline"}
                            size="sm"
                            className={`h-6 rounded-full px-2 text-2xs ${owns ? "" : "text-muted-foreground line-through"}`}
                            onClick={() => toggleModel(account.ownerScopeId, model)}
                          >
                            {getModelDisplayName(model)}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {pendingAccounts.map((account) => (
              <div
                key={account.accountSlotId}
                className="rounded-lg border border-dashed border-border/60 p-2 text-2xs text-muted-foreground"
              >
                {accountLabels[account.accountSlotId]?.trim() || `Tài khoản ${account.accountSlotId.slice(0, 8)}`}
                {accountErrors[account.accountSlotId]
                  ? ` · ${accountErrors[account.accountSlotId]}`
                  : " · chưa lấy được token — bấm “Làm mới”"}
              </div>
            ))}
          </div>
        )}
        <p className="text-2xs leading-4 text-muted-foreground">
          {value.flowAccounts.length === 0
            ? "Đang dùng mọi tài khoản đang kết nối."
            : `Chỉ chạy trên ${usedIds.length} tài khoản đang bật — không tài khoản nào trong số đó kết nối thì job dừng.`}
          {videoOnGoogleFlow
            ? " Bỏ tick model video mà tài khoản đó không có."
            : " Video đang chạy bằng nhà cung cấp khác nên không dùng tài khoản Google Flow."}
        </p>
      </div>
    </div>
  );
}
