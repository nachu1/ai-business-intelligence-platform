import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

import {
  createChat,
  deleteChat,
  getChatMessages,
  getChats,
  streamMessage,
  type Chat,
  type ChatMessage,
  type ChatSource,
} from "../../api/chat";

import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import ChatInput from "../../components/chat/ChatInput";

function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipNextLoadRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        setLoadingChats(true);
        const data = await getChats();
        setChats(data);

        if (data.length) {
          setSelectedChatId(data[0].chat_id);
        }
      } catch {
        setError("Failed to load your conversations.");
      } finally {
        setLoadingChats(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
  if (!selectedChatId) {
    setMessages([]);
    setSources([]);
    return;
  }

  if (skipNextLoadRef.current) {
    skipNextLoadRef.current = false;
    return;
  }

  const chatId = selectedChatId;

  async function loadMessages() {
    try {
      setLoadingMessages(true);
      setError(null);

      const data = await getChatMessages(chatId);

      setMessages(data.messages);
      setSources([]);
    } catch {
      setError("Failed to load this conversation.");
      setMessages([]);
      setSources([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  loadMessages();
}, [selectedChatId]);

  const handleNewChat = () => {
    setSelectedChatId(null);
    setMessages([]);
    setSources([]);
    setError(null);
    setMobileSidebar(false);
  };

  const handleClearChat = async () => {
    if (!selectedChatId || streaming) return;

    try {
      setError(null);
      await deleteChat(selectedChatId);

      setChats((current) =>
        current.filter((chat) => chat.chat_id !== selectedChatId)
      );

      setSelectedChatId(null);
      setMessages([]);
      setSources([]);
    } catch {
      setError("Failed to clear the conversation.");
    }
  };

  const handleSend = async (content: string) => {
  if (streaming) return;

  let assistantMessageAdded = false;

  try {
    setError(null);

    let chatId = selectedChatId;

    if (!chatId) {
  const data = await createChat();
  chatId = data.chat_id;

  skipNextLoadRef.current = true;
  setSelectedChatId(chatId);
}

    if (!chatId) return;

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      },
    ]);

    assistantMessageAdded = true;
    setSources([]);
    setStreaming(true);

    await streamMessage(chatId, content, (chunk) => {
      setMessages((current) => {
        const updated = [...current];
        const last = updated[updated.length - 1];

        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
        }

        return updated;
      });
    });

    setChats(await getChats());

  } catch {
    setMessages((current) => {
      const updated = [...current];
      const last = updated[updated.length - 1];

      if (
        assistantMessageAdded &&
        last?.role === "assistant" &&
        !last.content
      ) {
        updated.pop();
      }

      return updated;
    });

    setError(
      "The AI service is temporarily unavailable. Please try again later."
    );

  } finally {
    setStreaming(false);
  }
};
   

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#171717]">
      <ChatSidebar
        chats={chats}
        selectedChatId={selectedChatId}
        loading={loadingChats}
        mobileOpen={mobileSidebar}
        sidebarOpen={chatSidebarOpen}
        onSelect={setSelectedChatId}
        onNewChat={handleNewChat}
        onCloseMobile={() => setMobileSidebar(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {error && (
          <div className="absolute left-1/2 top-3 z-40 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-red-500/20 bg-[#252525] px-3 py-2 text-xs font-medium text-red-400 shadow-xl">
            <AlertCircle size={15} />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-1 rounded-md p-1 hover:bg-red-500/10"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loadingMessages ? (
          <div className="flex flex-1 items-center justify-center bg-[#171717]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />

              <p className="text-sm text-slate-500">
                Loading conversation...
              </p>
            </div>
          </div>
        ) : (
          <>
            <ChatWindow
              messages={messages}
              sources={sources}
              loading={false}
              streaming={streaming}
              sidebarOpen={chatSidebarOpen}
              onToggleSidebar={() => setChatSidebarOpen(false)}
              onOpenSidebar={() => {
                setChatSidebarOpen(true);
                setMobileSidebar(true);
              }}
              onClearChat={handleClearChat}
            />

            <ChatInput
              onSend={handleSend}
              disabled={streaming}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ChatPage;