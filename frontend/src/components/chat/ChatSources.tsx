import { FileText } from "lucide-react";

import type { ChatSource } from "../../api/chat";

interface Props {
  sources: ChatSource[];
}

function ChatSources({ sources }: Props) {
  const uniqueSources = Array.from(
    new Map(
      sources.map((source) => [
        `${source.document}-${source.document_type}`,
        source,
      ])
    ).values()
  );

  if (!uniqueSources.length) return null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <p className="mb-2 text-xs font-semibold text-slate-500">
        Sources
      </p>

      <div className="flex flex-wrap gap-2">
        {uniqueSources.map((source) => (
          <div
            key={`${source.document}-${source.document_type}`}
            className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
          >
            <FileText className="h-4 w-4 shrink-0 text-cyan-500" />

            <div className="min-w-0">
              <p
                title={source.document}
                className="max-w-[220px] truncate text-xs font-medium text-slate-700"
              >
                {source.document}
              </p>

              <p className="text-[10px] text-slate-400">
                {source.document_type.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSources;