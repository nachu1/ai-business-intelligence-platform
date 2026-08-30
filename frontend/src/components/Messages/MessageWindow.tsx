import {
  ArrowLeft,
  ChevronDown,
  Send,
  Loader2,
  Trash2,
  Eraser,
  ClipboardList,
  X,
  MoreVertical,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  clearChat,
  createTask,
  deleteMessage,
  getMessages,
  markMessagesRead,
  sendMessage,
  type Conversation,
  type Message,
} from "../../api/messages";

interface Props {
  conversation: Conversation;
  currentUserId: string;
  currentUserRole: string;
  onBack?: () => void;
  onMessageSent: () => void;
  onMessageDeleted?: (messageId: string) => void;
}

export default function MessageWindow({
  conversation,
  currentUserId,
  currentUserRole,
  onBack,
  onMessageSent,
  onMessageDeleted,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setMenuId(null);

    Promise.all([
      getMessages(conversation.id),
      markMessagesRead(conversation.id),
    ])
      .then(([data]) => setMessages(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const initials = conversation.name
    .trim()
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    conversation.role === "admin"
      ? "Administrator"
      : conversation.role === "manager"
        ? "Manager"
        : "Employee";

  const formatMessageTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const formatLastSeen = () => {
    if (conversation.is_online) return "Online";
    if (!conversation.last_seen) return "Offline";

    const value = new Date(conversation.last_seen);
    const now = new Date();
    const diff = now.getTime() - value.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Last seen just now";

    if (minutes < 60) {
      return `Last seen ${minutes} min ago`;
    }

    if (value.toDateString() === now.toDateString()) {
      return `Last seen today at ${value.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    return `Last seen ${value.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    })} at ${value.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  };

  const handleSend = async () => {
    const text = content.trim();

    if (!text || sending) return;

    try {
      setSending(true);

      const message = await sendMessage(
        conversation.user_id,
        text
      );

      setMessages((current) => [...current, message]);
      setContent("");
      onMessageSent();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);

      setMessages((current) =>
        current.filter((message) => message.id !== messageId)
      );

      setMenuId(null);
      onMessageDeleted?.(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChat(conversation.id);

      setMessages([]);
      setMenuId(null);
      setShowClearConfirm(false);
      onMessageDeleted?.(conversation.id);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const canCreateTask =
    currentUserRole === "manager" &&
    conversation.role === "employee";

  const handleCreateTask = async () => {
    if (
      !taskTitle.trim() ||
      !taskDescription.trim() ||
      creatingTask
    ) {
      return;
    }

    try {
      setCreatingTask(true);

      await createTask(
        conversation.user_id,
        taskTitle.trim(),
        taskDescription.trim(),
        taskDueDate
          ? new Date(taskDueDate).toISOString()
          : null
      );

      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setShowTaskForm(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#e1edf2]">
      {/* HEADER */}

      <header className="flex h-[72px] min-h-[72px] shrink-0 items-center gap-3 border-b border-slate-200 bg-[#f8fbfc] px-3 sm:h-[76px] sm:min-h-[76px] sm:px-5 md:px-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
        )}

        <div className="relative shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-base font-black text-white sm:h-12 sm:w-12">
            {initials}
          </div>

          {conversation.is_online && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#f8fbfc] bg-emerald-500" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-black text-slate-900 sm:text-lg">
            {conversation.name}
          </p>

          <p
            className={`truncate text-xs font-semibold sm:text-sm ${
              conversation.is_online
                ? "text-emerald-600"
                : "text-slate-500"
            }`}
          >
            {roleLabel} • {formatLastSeen()}
          </p>
        </div>
       <div className="relative ml-auto shrink-0">
  <button
    type="button"
    onClick={() => setShowChatMenu((value) => !value)}
    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
    aria-label="Chat options"
    title="Chat options"
  >
    <MoreVertical size={21} />
  </button>

  {showChatMenu && (
    <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      <button
        type="button"
        onClick={() => {
          setShowChatMenu(false);
          setShowClearConfirm(true);
        }}
        disabled={!messages.length}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Eraser size={16} />
        Clear chat
      </button>
    </div>
  )}
</div>
      </header>

      {/* MESSAGE AREA */}

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#e1edf2] px-3 py-5 sm:px-5 sm:py-6 md:px-8">
        <div className="flex min-h-full w-full flex-col justify-end gap-4">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2
                size={26}
                className="animate-spin text-slate-500"
              />
            </div>
          ) : messages.length ? (
            messages.map((message) => {
              const mine =
                message.sender_id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex w-full ${
                    mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative flex max-w-[88%] flex-col ${
                      mine ? "items-end" : "items-start"
                    } sm:max-w-[70%] md:max-w-[60%] lg:max-w-[55%]`}
                  >
                    <div
                      className={`relative rounded-2xl px-4 py-3.5 text-[15px] leading-6 shadow-sm sm:px-5 sm:py-3.5 sm:text-base sm:leading-7 ${
                        mine
                          ? "rounded-br-md bg-[#17232a] pr-11 text-white"
                          : "rounded-bl-md border border-[#9aafb8] bg-[#b3c9d1] text-[#1d3038]"
                      }`}
                    >
                      {message.content}

                      {mine && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuId(
                              menuId === message.id
                                ? null
                                : message.id
                            );
                          }}
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                          aria-label="Message options"
                        >
                          <ChevronDown size={17} />
                        </button>
                      )}
                    </div>

                    <span className="mt-1 px-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                      {formatMessageTime(message.created_at)}
                    </span>

                    {menuId === message.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                        onMouseDown={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(message.id)
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Delete message
                        </button>

                        
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#cfdee4]">
                <Send size={25} className="text-slate-500" />
              </div>

              <h3 className="mt-5 text-base font-black text-slate-700 sm:text-lg">
                Start the conversation
              </h3>

              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                Send a message to {conversation.name}.
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT / TASK AREA */}

      <div className="shrink-0 border-t border-slate-200 bg-[#f8fbfc] p-3 sm:p-4 md:p-5">
        {canCreateTask && (
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTaskForm(false)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                !showTaskForm
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Message
            </button>

            <button
              type="button"
              onClick={() => setShowTaskForm(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                showTaskForm
                  ? "bg-teal-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ClipboardList size={15} />
              Create Task
            </button>
          </div>
        )}

        {showTaskForm ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Create Task
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Assign a task to {conversation.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close task form"
              >
                <X size={17} />
              </button>
            </div>

            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5"
            />

            <textarea
              value={taskDescription}
              onChange={(e) =>
                setTaskDescription(e.target.value)
              }
              rows={3}
              placeholder="Describe what the employee needs to do..."
              className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
  <label className="mb-1.5 block text-xs font-bold text-slate-600">
    Deadline
  </label>

  <input
    type="datetime-local"
    value={taskDueDate}
    onChange={(e) => setTaskDueDate(e.target.value)}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5"
  />

  <p className="mt-1 text-[11px] text-slate-400">
    Complete this task by the selected date and time.
  </p>
</div>

              <button
                type="button"
                onClick={handleCreateTask}
                disabled={
                  creatingTask ||
                  !taskTitle.trim() ||
                  !taskDescription.trim()
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creatingTask ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <ClipboardList size={17} />
                )}

                {creatingTask
                  ? "Creating..."
                  : "Create Task"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-end gap-2 sm:gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder={`Message ${conversation.name}...`}
              className="max-h-36 min-h-12 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5 sm:min-h-13 sm:px-5 sm:py-3.5 sm:text-base"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#17232a] text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 sm:h-13 sm:w-13"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <Send size={19} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* CLEAR CHAT CONFIRMATION */}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <Eraser
                size={21}
                className="text-red-600"
              />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              Clear this chat?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will permanently remove all messages
              from this conversation. This action cannot
              be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowClearConfirm(false)
                }
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Clear chat
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}