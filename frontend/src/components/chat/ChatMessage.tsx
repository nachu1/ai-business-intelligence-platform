import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[95%] gap-3 sm:max-w-[85%] lg:max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isUser
              ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
              : "bg-slate-800 text-cyan-400"
          }`}
        >
          {isUser ? <User size={17} /> : <Bot size={18} />}
        </div>

        <div
          className={`min-w-0 rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm ${
            isUser
              ? "rounded-tr-md bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
              : "rounded-tl-md border border-white/10 bg-[#242424] text-slate-200"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {content}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none break-words prose-headings:mb-3 prose-headings:mt-5 prose-headings:font-bold prose-headings:text-white prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-white prose-code:rounded prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:text-cyan-300 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-slate-950 prose-table:block prose-table:overflow-x-auto prose-th:bg-slate-800 prose-th:px-3 prose-th:py-2 prose-td:border-t prose-td:border-white/10 prose-td:px-3 prose-td:py-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;