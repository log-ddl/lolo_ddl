import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, by as Info, a3 as Check, a6 as Copy } from "./lucide-react-DHCwBhKI.js";
import { a as useI18n, D as Dialog, a2 as DialogTrigger, B as Button, e as DialogContent, i as DialogHeader, j as DialogTitle } from "./index-DI8hnspe.js";
import { u as useTaskMetadataStore } from "./model-registry-B3C-u_uk.js";
function formatDate(value, locale) {
  return value ? new Date(value).toLocaleString(locale) : "—";
}
function formatDuration(start, end) {
  if (!start || !end || end < start) return "—";
  const seconds = Math.round((end - start) / 100) / 10;
  return `${seconds}s`;
}
function Row({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-1.5 text-xs", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 break-words text-foreground", children: value || "—" })
  ] });
}
function TaskInfoButton({ taskId, outputUrl, prompt, kind, className, title, latest = false }) {
  const { t, locale } = useI18n();
  const buttonTitle = title || t("taskInfo.title");
  const records = useTaskMetadataStore((state) => state.records);
  const order = useTaskMetadataStore((state) => state.order);
  const [copied, setCopied] = reactExports.useState(false);
  const record = reactExports.useMemo(() => {
    if (taskId && records[taskId]) return records[taskId];
    return order.map((id) => records[id]).find((item) => item && (!kind || item.kind === kind) && (latest || outputUrl && item.outputUrl === outputUrl || prompt && item.prompt === prompt));
  }, [kind, latest, order, outputUrl, prompt, records, taskId]);
  const processingStart = record ? record.submittedAt || record.queuedAt : void 0;
  const details = record ? Object.entries(record.details || {}).filter(([, value]) => value !== void 0 && value !== null && value !== "") : [];
  const copyPrompt = async () => {
    const text = record?.prompt || record?.instruction || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: `h-7 w-7 text-muted-foreground hover:text-foreground ${className || ""}`, title: buttonTitle, onClick: (event) => event.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[82vh] max-w-xl overflow-y-auto p-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { className: "border-b px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 text-base", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 text-primary" }),
        t("taskInfo.title")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 px-5 pb-5", children: !record ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mx-auto mb-2 h-5 w-5 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("taskInfo.noData") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("taskInfo.noDataHelp") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border bg-muted/20 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("taskInfo.status"), value: t(`taskInfo.status.${record.status}`) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("taskInfo.kind"), value: record.kind.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Provider", value: record.provider }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Model", value: record.model })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-1 text-xs font-semibold", children: t("taskInfo.time") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("taskInfo.queuedAt"), value: formatDate(record.queuedAt, locale) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("taskInfo.submittedAt"), value: formatDate(record.submittedAt, locale) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("taskInfo.completedAt"), value: formatDate(record.completedAt, locale) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("taskInfo.waitDuration"), value: formatDuration(record.queuedAt, record.submittedAt) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("taskInfo.processingDuration"), value: formatDuration(processingStart, record.completedAt) })
          ] })
        ] }),
        (record.prompt || record.instruction) && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-semibold", children: t("taskInfo.actualPrompt") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 gap-1.5 text-xs", onClick: copyPrompt, children: [
              copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }),
              copied ? t("taskInfo.copied") : t("taskInfo.copy")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-64 whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 font-sans text-xs leading-relaxed", children: record.prompt || record.instruction })
        ] }),
        details.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "rounded-lg border px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-xs font-semibold", children: t("taskInfo.technical") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 border-t pt-1", children: [
            details.map(([label, value]) => /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label, value: String(value) }, label)),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Task ID", value: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-2xs", children: record.id }) })
          ] })
        ] }),
        record.error && /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive", children: record.error })
      ] }) })
    ] })
  ] });
}
export {
  TaskInfoButton as T
};
