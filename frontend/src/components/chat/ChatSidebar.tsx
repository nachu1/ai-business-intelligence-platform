import {
  Bot,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

import type { Chat } from "../../api/chat";

interface Props {
  chats: Chat[];
  selectedChatId: string | null;
  loading: boolean;
  mobileOpen: boolean;
  sidebarOpen: boolean;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  onCloseMobile: () => void;
}

function ChatSidebar({
  chats,
  selectedChatId,
  loading,
  mobileOpen,
  sidebarOpen,
  onSelect,
  onNewChat,
  onCloseMobile,
}: Props) {
  const handleSelect = (chatId: string) => {
    onSelect(chatId);
    onCloseMobile();
  };

  const content = (
    <div className="flex h-full flex-col bg-[#0f172a] text-white">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-cyan-500/10">
            <Bot className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-sm font-bold">
                BizInsight
              </h2>
              
            </div>

            
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close conversations"
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90 active:scale-[0.98]"
        >
          <Plus size={18} />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Recent conversations
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          </div>
        ) : chats.length === 0 ? (
          <div className="mx-1 mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-7 text-center">
            <MessageSquare className="mx-auto mb-3 h-6 w-6 text-slate-500" />

            <p className="text-sm font-semibold text-slate-300">
              No conversations yet
            </p>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Start a new chat to ask about your business.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => {
              const selected = selectedChatId === chat.chat_id;

              return (
                <button
                  key={chat.chat_id}
                  type="button"
                  onClick={() => handleSelect(chat.chat_id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selected
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  <MessageSquare
                    size={16}
                    className={
                      selected
                        ? "shrink-0 text-cyan-400"
                        : "shrink-0 text-slate-500"
                    }
                  />

                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {chat.title || "New chat"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-xs font-medium text-slate-400">
            AI services ready
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden h-full shrink-0 overflow-hidden border-r border-white/10 transition-[width] duration-200 lg:block ${
          sidebarOpen ? "w-72 xl:w-80" : "w-0 border-r-0"
        }`}
      >
        <div className="h-full w-72 xl:w-80">
          {content}
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close conversations"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <aside className="relative h-full w-[85%] max-w-80 overflow-hidden border-r border-white/10 shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

export default ChatSidebar;