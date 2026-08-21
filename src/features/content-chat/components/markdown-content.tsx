import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/utils";

/**
 * Dựng một lần ở module. Nếu để inline trong component thì mỗi lần render là một
 * object `components` mới, ReactMarkdown coi đó là cấu hình khác và dựng lại toàn
 * bộ cây — với tin nhắn dài vài trăm KB thì đó là nguyên nhân đơ.
 */
const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-3 whitespace-pre-wrap last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2.5 mt-5 text-lg font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-primary/50 pl-3 text-muted-foreground">{children}</blockquote>,
  a: ({ children, href }) => (
    <a className="text-primary underline underline-offset-2 hover:opacity-80" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    return className
      ? <code className={cn(className, "font-mono text-xs")}>{children}</code>
      : <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
  },
  pre: ({ children }) => <pre className="my-3 max-w-full overflow-x-auto rounded-xl bg-muted p-3 leading-5">{children}</pre>,
  table: ({ children }) => <div className="my-3 max-w-full overflow-x-auto"><table className="w-full border-collapse text-left text-xs">{children}</table></div>,
  th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
  hr: () => <hr className="my-4 border-border" />,
};
const REMARK_PLUGINS = [remarkGfm];
const NO_PLUGINS: typeof REMARK_PLUGINS = [];

/**
 * Ngưỡng độ dài của MỘT đoạn văn mà trên đó remark-gfm bị tắt.
 *
 * Đo trên máy thật: remark-gfm chạy bình phương theo kích thước một đoạn, và chỉ
 * đoạn thôi — chia nhỏ đoạn thì nhanh trở lại, còn xuống dòng suông thì không cứu
 * được. Cùng một nội dung 186 KB:
 *   1 đoạn duy nhất          → 4804 ms
 *   xuống dòng 120 ký tự     → 5404 ms   (vẫn là 1 đoạn)
 *   chia đoạn 400 ký tự      →   86 ms
 * Theo kích thước đoạn: 20 KB → 39 ms, 40 KB → 185 ms, 80 KB → 843 ms.
 * 16 KB giữ chi phí dưới ~30 ms cho trường hợp xấu nhất.
 */
const MAX_GFM_PARAGRAPH = 16 * 1024;
const PARAGRAPH_BREAK = /\r?\n[ \t]*\r?\n/;

/**
 * Chỉ tắt gfm đúng những tin nhắn gây nổ. Văn bản bình thường — kể cả dài — vẫn
 * giữ nguyên bảng, ~gạch ngang~ và autolink.
 */
function gfmIsAffordable(content: string) {
  if (content.length <= MAX_GFM_PARAGRAPH) return true;
  for (const paragraph of content.split(PARAGRAPH_BREAK)) {
    if (paragraph.length > MAX_GFM_PARAGRAPH) return false;
  }
  return true;
}

export const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  const plugins = useMemo(() => (gfmIsAffordable(content) ? REMARK_PLUGINS : NO_PLUGINS), [content]);
  return (
    <div className="min-w-0 break-words">
      <ReactMarkdown remarkPlugins={plugins} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
