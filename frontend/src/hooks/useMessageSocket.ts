import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const WS_URL = "ws://localhost:8000/messages/ws";

export interface SocketEvent {
  type?: "message" | "presence" | "message_deleted" | "inviation_accepted";
  id?: string;
  conversation_id?: string;
  sender_id?: string;
  receiver_id?: string;
  content?: string;
  is_read?: boolean;
  created_at?: string;
  user_id?: string;
  is_online?: boolean;
  last_seen?: string | null;
}

export function useMessageSocket(
  onEvent: (event: SocketEvent) => void
) {
  const { token } = useAuth();
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(WS_URL);
    socket.current = ws;

    ws.onopen = () => {
      ws.send(token);
    };

    ws.onmessage = (event) => {
      try {
        onEvent(JSON.parse(event.data));
      } catch {
        console.error("Invalid WebSocket message.");
      }
    };

    ws.onclose = () => {
      socket.current = null;
    };

    return () => {
      ws.close();
      socket.current = null;
    };
  }, [token, onEvent]);

  return socket;
}