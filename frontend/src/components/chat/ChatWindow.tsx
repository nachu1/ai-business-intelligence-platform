import {
  Bot,
  Menu,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef } from "react";

import type {
  ChatMessage as ChatMessageType,
  ChatSource,
} from "../../api/chat";
import ChatMessage from "./ChatMessage";
import ChatSources from "./ChatSources";

interface Props {
  messages: ChatMessageType[];
  sources: ChatSource[];
  loading: boolean;
  streaming: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSidebar: () => void;
  onClearChat: () => void;
}

function ChatWindow({
  messages,
  sources,
  loading,
  streaming,
  sidebarOpen,
  onToggleSidebar,
  onOpenSidebar,
  onClearChat,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const toggleSidebar = () => {
    if (sidebarOpen) {
      onToggleSidebar();
    } else {
      onOpenSidebar();
    }
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#171717]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#171717] px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={
              sidebarOpen
                ? "Close conversations"
                : "Open conversations"
            }
            title={
              sidebarOpen
                ? "Close conversations"
                : "Open conversations"
            }
          >
            <Menu size={20} />
          </button>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500">
            <Bot className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-white sm:text-base">
              AI Assistant
            </h1>

            
          </div>
        </div>

        <button
          type="button"
          onClick={onClearChat}
          disabled={!messages.length || streaming}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 size={15} />
          <span className="hidden sm:inline">Clear chat</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-3 py-6 sm:px-5 sm:py-8">
          {!messages.length && !loading ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-cyan-500/10">
                <Bot className="h-8 w-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white">
                How can I help you?
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Ask questions about your business documents,
                reports, performance, or company information.
              </p>
            </div>
          ) : (
            <div className="space-y-7">
              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;

                const thinking =
                  streaming &&
                  isLast &&
                  message.role === "assistant" &&
                  !message.content;

                return (
                  <div key={`${message.created_at}-${index}`}>
                    {thinking ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                          <Bot size={18} />
                        </div>

                        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/10 bg-[#242424] px-4 py-3">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                        </div>
                      </div>
                    ) : (
                      <ChatMessage
                        role={message.role}
                        content={message.content}
                      />
                    )}

                    {isLast &&
                      message.role === "assistant" &&
                      message.content &&
                      !streaming && (
                        <div className="ml-12 mt-2 max-w-[95%] sm:max-w-[85%] lg:max-w-[80%]">
                          <ChatSources sources={sources} />
                        </div>
                      )}
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ChatWindow;