import {
  CheckCircle2,
  Clock3,
  FileText,
  MoreVertical,
  Trash2,
  UserRound,
  AlertCircle,
} from "lucide-react";
import type { DocumentItem } from "../../api/document";

interface Props {
  document: DocumentItem;
  currentUserId?: string;
  onDelete?: (document: DocumentItem) => void;
}

function DocumentCard({
  document,
  currentUserId,
  onDelete,
}: Props) {
  const isOwner =
    document.uploaded_by === currentUserId;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      [],
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const documentType = document.document_type
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

  const status = {
    uploaded: {
      label: "Uploaded",
      icon: Clock3,
      style:
        "bg-slate-100 text-slate-700 ring-slate-200",
    },
    processing: {
      label: "Processing",
      icon: Clock3,
      style:
        "bg-amber-50 text-amber-700 ring-amber-200",
    },
    completed: {
      label: "Ready",
      icon: CheckCircle2,
      style:
        "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    failed: {
      label: "Failed",
      icon: AlertCircle,
      style:
        "bg-red-50 text-red-700 ring-red-200",
    },
  }[document.status];

  const StatusIcon = status.icon;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:rounded-3xl sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* FILE ICON */}

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-600 sm:h-14 sm:w-14 sm:rounded-2xl">
          <FileText
            size={23}
            className="sm:h-7 sm:w-7"
          />
        </div>

        {/* DOCUMENT INFO */}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="truncate text-base font-black text-slate-900 sm:text-lg"
                title={
                  document.original_filename
                }
              >
                {document.original_filename}
              </h3>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {documentType} ·{" "}
                {formatSize(document.file_size)}
              </p>
            </div>

            {/* MENU */}

            {isOwner && onDelete && (
              <button
                type="button"
                onClick={() =>
                  onDelete(document)
                }
                title="Delete document"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <MoreVertical size={19} />
              </button>
            )}
          </div>

          {/* META */}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
            <div className="flex min-w-0 items-center gap-2">
              <UserRound
                size={15}
                className="shrink-0 text-slate-400"
              />

              <span className="truncate text-sm font-semibold text-slate-600">
                {isOwner
                  ? "Uploaded by You"
                  : `Uploaded by ${document.uploader_name}`}
              </span>
            </div>

            <span className="hidden text-slate-300 sm:inline">
              •
            </span>

            <span className="text-sm font-medium text-slate-500">
              {formatDate(document.created_at)}
            </span>
          </div>

          {/* STATUS */}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset sm:text-sm ${status.style}`}
            >
              <StatusIcon size={14} />
              {status.label}
            </span>

            {!isOwner && (
              <span className="text-xs font-semibold text-slate-400 sm:text-sm">
                View only
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default DocumentCard;