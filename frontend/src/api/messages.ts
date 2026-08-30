import api from "./api";

export interface Conversation {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_online: boolean;
  last_seen: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_online: boolean;
  last_seen: string | null;
}

export const getConversations = async (): Promise<Conversation[]> =>
  (await api.get("/messages/conversations")).data;

export const searchMessageUsers = async (
  search: string
): Promise<MessageUser[]> =>
  (await api.get("/messages/users", { params: { search } })).data;

export const createConversation = async (
  receiverId: string
): Promise<Conversation> =>
  (
    await api.post(
      `/messages/conversations/${receiverId}`
    )
  ).data;

export const getMessages = async (
  conversationId: string
): Promise<Message[]> =>
  (await api.get(`/messages/${conversationId}`)).data;

export const sendMessage = async (
  receiverId: string,
  content: string
): Promise<Message> =>
  (
    await api.post("/messages/send", {
      receiver_id: receiverId,
      content,
    })
  ).data;

export const markMessagesRead = async (
  conversationId: string
) => api.patch(`/messages/${conversationId}/read`);

export const deleteMessage = async (
  messageId: string
) =>
  api.delete(`/messages/message/${messageId}`);

export const clearChat = async (
  conversationId: string
) => {
  return (
    await api.delete(
      `/messages/conversation/${conversationId}`
    )
  ).data;
};

export interface Task {
  id: string;
  company_id: string;
  assigned_by: string;
  assigned_to: string;
  title: string;
  description: string;
  due_date: string | null;
  status: "pending" | "submitted" | "approved" | "rejected";
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export const createTask = async (
  receiverId: string,
  title: string,
  description: string,
  dueDate: string | null
): Promise<Task> =>
  (
    await api.post("/tasks", {
      receiver_id: receiverId,
      title,
      description,
      due_date: dueDate,
    })
  ).data;

export const getMyTasks = async (): Promise<Task[]> =>
  (await api.get("/tasks/mine")).data;

export const submitTask = async (
  taskId: string,
  documentId: string
): Promise<Task> =>
  (
    await api.patch(
      `/tasks/${taskId}/submit`,
      null,
      {
        params: {
          document_id: documentId,
        },
      }
    )
  ).data;

export const reviewTask = async (
  taskId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<Task> =>
  (
    await api.patch(
      `/tasks/${taskId}/review`,
      null,
      {
        params: {
          status,
          rejection_reason:
            rejectionReason || undefined,
        },
      }
    )
  ).data;