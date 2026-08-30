import {
  ArrowUp,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

function ChatInput({
  onSend,
  disabled = false,
}: Props) {
  const [value, setValue] = useState("");

  const send = () => {
    const content = value.trim();

    if (!content || disabled) return;

    onSend(content);
    setValue("");
  };

  return (
    <div className="shrink-0 border-t border-white/10 bg-[#171717] px-3 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#222] p-2 shadow-xl shadow-black/20 transition focus-within:border-cyan-500/50 focus-within:ring-4 focus-within:ring-cyan-500/5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={disabled}
            rows={1}
            placeholder="Message your AI assistant..."
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
          />

          <button
            type="button"
            onClick={send}
            disabled={disabled || !value.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Send message"
          >
            {disabled ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate-600 sm:text-[11px]">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}

export default ChatInput;