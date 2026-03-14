import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { cn } from "@/lib/utils";

// Strip internal markers like [END] from display content
const sanitizeContent = (content: string): string => {
  return content.replace(/\[END\]/g, "").trim();
};

export const Markdown = ({ id, content }: { id: string; content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[rehypeKatex, rehypeRaw]}
    components={{
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const code = String(children).replace(/\n$/, "");

        if (match) {
          // Multi-line code block - use CodeEditor in read-only mode
          const lines = code.split('\n');
          const isMultiline = lines.length > 1 || code.length > 80;

          if (isMultiline) {
            return (
              <div className="my-3">
                <CodeEditor
                  value={code}
                  language={match[1]}
                  editable={false}
                  dark={true}
                  minHeight="auto"
                  className="border-neutral-800"
                />
              </div>
            );
          }
        }

        // Inline code or short code
        return (
          <code
            className={cn(
              "px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono text-sm border border-neutral-200",
              className
            )}
            {...props}
          >
            {children}
          </code>
        );
      },
      h1: ({ children }) => (
        <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>
      ),
      h4: ({ children }) => (
        <h4 className="text-base font-semibold mb-2 mt-3">{children}</h4>
      ),
      h5: ({ children }) => (
        <h5 className="text-sm font-semibold mb-1 mt-2">{children}</h5>
      ),
      h6: ({ children }) => (
        <h6 className="text-xs font-semibold mb-1 mt-2">{children}</h6>
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-neutral-200 rounded-lg">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-neutral-50 border-b border-neutral-200">
          {children}
        </thead>
      ),
      tbody: ({ children }) => (
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      ),
      tr: ({ children }) => (
        <tr className="hover:bg-neutral-50/50">{children}</tr>
      ),
      th: ({ children }) => (
        <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-4 py-2 text-sm text-neutral-600">{children}</td>
      ),
      ul: ({ children }) => (
        <ul className="list-disc list-inside space-y-1 my-3 ml-4">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside space-y-1 my-3 ml-4 [&_p]:inline">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="text-sm text-neutral-700 [&_p]:inline">{children}</li>
      ),
      hr: () => <hr className="my-4 border-neutral-200" />,
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-neutral-300 pl-4 py-2 my-3 text-neutral-600 italic bg-neutral-50/50">
          {children}
        </blockquote>
      ),
      a: ({ href, children, ...props }) => {
        if ((props as any)["data-footnote-ref"] !== undefined) {
          return (
            <span
              id={id + "-" + (props as any).id}
              onClick={() => {
                const footnote = document.getElementById(
                  id + "-footnote-" + (props as any).id
                );
                footnote?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              [{children}]
            </span>
          );
        }
        if ((props as any)["data-footnote-backref"] !== undefined) {
          return (
            <span
              id={id + "-footnote-" + href?.slice(1)}
              onClick={() => {
                const ref = document.getElementById(id + "-" + href?.slice(1));
                ref?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              {children}
            </span>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {children}
          </a>
        );
      },
      section: ({ children, ...props }) => {
        const dataFootnotes = (props as any)["data-footnotes"];
        if (dataFootnotes !== undefined) {
          return (
            <section
              data-footnotes
              className="mt-8 pt-4 border-t border-neutral-200 text-sm text-neutral-600 [&_p]:inline [&_li]:mb-2"
              {...props}
            >
              {children}
            </section>
          );
        }
        return <section {...props}>{children}</section>;
      },
    }}
  >
    {sanitizeContent(content)}
  </ReactMarkdown>
);
