import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

/**
 * Bộ render Markdown dùng chung cho nội dung do AI sinh (chat trợ lý, tóm tắt thợ,
 * báo cáo kiểm duyệt). KHÔNG dùng plugin `prose` mặc định vì nền tối — tự map từng
 * phần tử sang class Tailwind hợp tông ink/amber. react-markdown mặc định KHÔNG
 * render HTML thô → an toàn XSS.
 */
const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-base font-bold text-amber-soft first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-3 text-[15px] font-bold text-amber-soft first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-2.5 text-sm font-semibold text-amber-soft first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-2 text-sm font-semibold text-slate-200 first:mt-0">{children}</h4>
  ),
  p: ({ children }) => <p className="my-1.5 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-1.5 ml-1 list-disc space-y-1 pl-4 marker:text-amber-glow/60">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1.5 ml-1 list-decimal space-y-1 pl-4 marker:text-amber-glow/60">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-amber-glow/40 pl-3 text-slate-400">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    // Khối code (có ngôn ngữ) vs inline code.
    const isBlock = /language-/.test(className ?? '')
    if (isBlock) {
      return (
        <code className="block whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 font-mono text-[12px] leading-relaxed text-slate-200">
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px] text-amber-soft">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
  hr: () => <hr className="my-3 border-ink-700" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-white/10 px-2.5 py-1.5 text-left font-semibold text-amber-soft">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-white/10 px-2.5 py-1.5 align-top text-slate-300">{children}</td>
  )
}

/** Render 1 chuỗi Markdown (GFM: bảng, gạch ngang, checkbox) theo tông tối của app. */
export function Markdown({ children }: { children: string }): JSX.Element {
  return (
    <div className="text-sm text-slate-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
