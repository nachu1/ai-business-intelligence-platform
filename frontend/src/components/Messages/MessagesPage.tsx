import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MessageCircle,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  createConversation,
  getConversations,
  type Conversation,
  type MessageUser,
} from "../../api/messages";

import { useAuth } from "../../context/AuthContext";

import {
  useMessageSocket,
  type SocketEvent,
} from "../../hooks/useMessageSocket";

import ConversationList from "./ConversationList";
import MessageWindow from "./MessageWindow";

export default function MessagesPage() {
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [selected, setSelected] =
    useState<Conversation | null>(null);

  const [loading, setLoading] = useState(true);

  const openingUserRef = useRef<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();

      setConversations(data);

      setSelected((current) => {
        if (!current) return null;

        return (
          data.find(
            (chat) => chat.id === current.id
          ) ?? current
        );
      });
    } catch (error) {
      console.error(
        "Failed to load conversations:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /* =====================================================
     OPEN CHAT FROM USERS PAGE
  ===================================================== */

  useEffect(() => {
    const userId = location.state?.userId;

    if (!userId || loading) return;

    if (openingUserRef.current === userId) {
      return;
    }

    openingUserRef.current = userId;

    const openChat = async () => {
      try {
        /*
         * This endpoint already does both:
         *
         * 1. Finds an existing conversation
         * 2. Creates one if it doesn't exist
         */
        const conversation =
          await createConversation(userId);

        setConversations((current) => {
          const exists = current.some(
            (chat) =>
              chat.id === conversation.id
          );

          if (exists) {
            return current.map((chat) =>
              chat.id === conversation.id
                ? conversation
                : chat
            );
          }

          return [
            conversation,
            ...current,
          ];
        });

        setSelected({
          ...conversation,
          unread_count: 0,
        });

        /*
         * Remove userId from navigation state
         * so refreshing / revisiting / navigating
         * doesn't automatically open the same chat.
         */
        navigate("/messages", {
          replace: true,
          state: null,
        });
      } catch (error) {
        console.error(
          "Failed to open conversation:",
          error
        );

        openingUserRef.current = null;
      }
    };

    openChat();
  }, [
    location.state,
    loading,
    navigate,
  ]);

  /* =====================================================
     SOCKET EVENTS
  ===================================================== */

  const handleSocketEvent = useCallback(
    (event: SocketEvent) => {
      /* MESSAGE */

      if (
        event.type === "message" &&
        event.conversation_id
      ) {
        setConversations((current) => {
          const index = current.findIndex(
            (chat) =>
              chat.id ===
              event.conversation_id
          );

          if (index === -1) {
            loadConversations();
            return current;
          }

          const chat = current[index];

          const isOwnMessage =
            event.sender_id === user?.id;

          const updated: Conversation = {
            ...chat,
            last_message:
              event.content ??
              chat.last_message,
            last_message_at:
              event.created_at ??
              chat.last_message_at,
            unread_count: isOwnMessage
              ? chat.unread_count
              : chat.unread_count + 1,
          };

          return [
            updated,
            ...current.filter(
              (_, i) => i !== index
            ),
          ];
        });

        setSelected((current) => {
          if (
            !current ||
            current.id !==
              event.conversation_id
          ) {
            return current;
          }

          return {
            ...current,
            last_message:
              event.content ??
              current.last_message,
            last_message_at:
              event.created_at ??
              current.last_message_at,
            unread_count: 0,
          };
        });

        return;
      }

      /* MESSAGE DELETED */

      if (
        event.type === "message_deleted"
      ) {
        loadConversations();
        return;
      }

      /* PRESENCE */

      if (
        event.type === "presence" &&
        event.user_id
      ) {
        setConversations((current) =>
          current.map((chat) =>
            chat.user_id ===
            event.user_id
              ? {
                  ...chat,
                  is_online:
                    event.is_online ??
                    false,
                  last_seen:
                    event.last_seen ??
                    null,
                }
              : chat
          )
        );

        setSelected((current) => {
          if (
            !current ||
            current.user_id !==
              event.user_id
          ) {
            return current;
          }

          return {
            ...current,
            is_online:
              event.is_online ??
              false,
            last_seen:
              event.last_seen ??
              null,
          };
        });
      }
    },
    [
      loadConversations,
      user?.id,
    ]
  );

  useMessageSocket(handleSocketEvent);

  /* =====================================================
     SELECT EXISTING CONVERSATION
  ===================================================== */

  const handleSelect = (
    conversation: Conversation
  ) => {
    setSelected({
      ...conversation,
      unread_count: 0,
    });

    setConversations((current) =>
      current.map((chat) =>
        chat.id === conversation.id
          ? {
              ...chat,
              unread_count: 0,
            }
          : chat
      )
    );
  };

  /* =====================================================
     START NEW CONVERSATION FROM SEARCH
  ===================================================== */

  const handleStartConversation = async (
    messageUser: MessageUser
  ) => {
    try {
      const conversation =
        await createConversation(
          messageUser.id
        );

      setConversations((current) => {
        const exists = current.some(
          (chat) =>
            chat.id === conversation.id
        );

        if (exists) {
          return current.map((chat) =>
            chat.id === conversation.id
              ? conversation
              : chat
          );
        }

        return [
          conversation,
          ...current,
        ];
      });

      setSelected({
        ...conversation,
        unread_count: 0,
      });
    } catch (error) {
      console.error(
        "Failed to start conversation:",
        error
      );
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="h-[calc(100vh-120px)] min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#edf3f5] shadow-sm sm:rounded-3xl">
      <div className="flex h-full min-h-0">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center bg-[#edf3f5]">
            <div className="px-6 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 sm:h-10 sm:w-10" />

              <p className="mt-4 text-base font-bold text-slate-600 sm:text-lg">
                Loading messages...
              </p>
            </div>
          </div>
        ) : selected ? (
          <MessageWindow
  conversation={selected}
  currentUserId={user?.id ?? ""}
  currentUserRole={user?.role ?? ""}
            onBack={() =>
              setSelected(null)
            }
            onMessageSent={
              loadConversations
            }
            onMessageDeleted={
              loadConversations
            }
          />
        ) : (
          <div className="flex h-full min-h-0 w-full">
            <ConversationList
              conversations={
                conversations
              }
              selectedId={null}
              onSelect={handleSelect}
              onStartConversation={
                handleStartConversation
              }
            />

            <div className="hidden min-h-0 flex-1 items-center justify-center bg-[#edf3f5] px-6 lg:flex">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#d9e6eb] shadow-sm">
                  <MessageCircle
                    size={34}
                    className="text-slate-500"
                  />
                </div>

                <h2 className="mt-6 text-xl font-black text-slate-800 xl:text-2xl">
                  Your Messages
                </h2>

                <p className="mt-2 text-base font-medium leading-7 text-slate-500 xl:text-lg">
                  Search for someone or
                  select a conversation
                  to start chatting.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}