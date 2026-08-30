import api from "./api";
import axios from "axios";

export interface Chat {
  chat_id: string;
  title: string;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface CreateChatResponse {
  message: string;
  chat_id: string;
}

export interface ChatMessagesResponse {
  chat_id: string;
  messages: ChatMessage[];
}

export interface ChatSource {
  document: string;
  document_type: string;
  chunk: number;
}

export interface SendMessageResponse {
  answer: string;
  sources: ChatSource[];
}

export const createChat = async (
  title?: string
): Promise<CreateChatResponse> =>
  (
    await api.post("/chat/create", {
      title: title ?? null,
    })
  ).data;

export const getChats = async (): Promise<Chat[]> =>
  (await api.get("/chat")).data;

export const getChatMessages = async (
  chatId: string
): Promise<ChatMessagesResponse> =>
  (await api.get(`/chat/${chatId}`)).data;

export const sendMessage = async (
  chatId: string,
  content: string
): Promise<SendMessageResponse> =>
  (
    await api.post(`/chat/${chatId}/message`, {
      content,
    })
  ).data;

export const streamMessage = async (
  chatId: string,
  content: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const storedToken =
    localStorage.getItem("access_token");

  if (!storedToken) {
    throw new Error("Access token not found");
  }

  let token: string = storedToken;

  const makeRequest = async (
    accessToken: string
  ) => {
    return fetch(
      `http://127.0.0.1:8000/chat/${chatId}/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content }),
      }
    );
  };

  let response = await makeRequest(token);

  if (response.status === 401) {
    const refreshResponse = await axios.post<{
      access_token: string;
      token_type: string;
    }>(
      "http://172.20.10.4:8000/auth/refresh",
      {},
      {
        withCredentials: true,
      }
    );

    const newToken =
      refreshResponse.data.access_token;

    localStorage.setItem(
      "access_token",
      newToken
    );

    token = newToken;

    response = await makeRequest(token);
  }

  if (!response.ok) {
    throw new Error(
      "Failed to stream AI response"
    );
  }

  if (!response.body) {
    throw new Error(
      "Streaming is not supported"
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  while (true) {
    const { value, done } =
      await reader.read();

    if (done) break;

    onChunk(
      decoder.decode(
        value,
        { stream: true }
      )
    );
  }
};
  


export const deleteChat = async (
  chatId: string
) => {
  return (
    await api.delete(`/chat/${chatId}`)
  ).data;
};