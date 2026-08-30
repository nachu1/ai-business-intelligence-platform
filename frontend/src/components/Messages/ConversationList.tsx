import {
  Search,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  searchMessageUsers,
  type Conversation,
  type MessageUser,
} from "../../api/messages";

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onStartConversation: (user: MessageUser) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onStartConversation,
}: Props) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<MessageUser[]>([]);
  const [searching, setSearching] = useState(false);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return conversations;

    return conversations.filter(
      (chat) =>
        chat.name.toLowerCase().includes(value) ||
        chat.email.toLowerCase().includes(value) ||
        chat.last_message?.toLowerCase().includes(value)
    );
  }, [conversations, search]);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        setUsers(await searchMessageUsers(value));
      } catch (error) {
        console.error(
          "Failed to search users:",
          error
        );
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const initials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const formatTime = (date: string | null) => {
    if (!date) return "";

    const value = new Date(date);
    const now = new Date();

    if (
      value.toDateString() ===
      now.toDateString()
    ) {
      return value.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    return value.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
    });
  };

  const showSearchUsers = search.trim().length > 0;

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-slate-200 bg-slate-50 sm:w-80 lg:w-[350px]">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <MessageCircle size={20} />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950">
              Messages
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Team conversations
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search people or conversations..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showSearchUsers ? (
          <div>
            <p className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              People
            </p>

            {searching ? (
              <p className="px-5 py-8 text-center text-xs text-slate-500">
                Searching...
              </p>
            ) : users.length ? (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() =>
                    onStartConversation(user)
                  }
                  className="flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-white"
                >
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-xs font-black text-white">
                      {initials(user.name)}
                    </div>

                    {user.is_online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-50 bg-emerald-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {user.name}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user.role}
                    </p>
                  </div>

                  <UserPlus
                    size={17}
                    className="shrink-0 text-slate-400"
                  />
                </button>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-xs text-slate-500">
                No users found.
              </p>
            )}
          </div>
        ) : filtered.length ? (
          filtered.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={`flex w-full items-center gap-3 border-b border-slate-200 px-4 py-4 text-left transition ${
                selectedId === chat.id
                  ? "bg-white shadow-sm"
                  : "hover:bg-white/70"
              }`}
            >
              <div className="relative shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-black text-white">
                  {initials(chat.name)}
                </div>

                {chat.is_online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-50 bg-emerald-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
  <div className="flex items-center justify-between gap-2">
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-slate-900">
        {chat.name}
      </p>

      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {chat.role === "admin"
          ? "Administrator"
          : chat.role === "manager"
            ? "Manager"
            : "Employee"}
      </p>
    </div>

    <span className="shrink-0 text-[10px] font-medium text-slate-400">
      {formatTime(chat.last_message_at)}
    </span>
  </div>

  <div className="mt-1 flex items-center justify-between gap-2">
    <p className="truncate text-xs font-medium text-slate-500">
      {chat.last_message || "Start a conversation"}
    </p>

    {chat.unread_count > 0 && (
      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-black text-white">
        {chat.unread_count > 99
          ? "99+"
          : chat.unread_count}
      </span>
    )}
  </div>
</div>
            </button>
          ))
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <MessageCircle size={20} />
            </div>

            <p className="mt-4 text-sm font-bold text-slate-700">
              No conversations yet
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Search for someone above to start chatting.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}