import {
  FileText,
  Loader2,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import type { DocumentItem } from "../../api/document";

interface Props {
  documents: DocumentItem[];
}

function DocumentStats({ documents }: Props) {
  const total = documents.length;

  const processing = documents.filter(
    (document) =>
      document.status === "processing" ||
      document.status === "uploaded"
  ).length;

  const completed = documents.filter(
    (document) =>
      document.status === "completed"
  ).length;

  const totalSize = documents.reduce(
    (sum, document) =>
      sum + document.file_size,
    0
  );

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

  const cards = [
    {
      title: "Total Documents",
      value: total,
      icon: FileText,
      iconStyle:
        "bg-cyan-100 text-cyan-700",
    },
    {
      title: "Processing",
      value: processing,
      icon: Loader2,
      iconStyle:
        "bg-amber-100 text-amber-700",
    },
    {
      title: "Ready",
      value: completed,
      icon: CheckCircle2,
      iconStyle:
        "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Storage Used",
      value: formatSize(totalSize),
      icon: HardDrive,
      iconStyle:
        "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-600 sm:text-base">
                  {card.title}
                </p>

                <p className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                  {card.value}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${card.iconStyle}`}
              >
                <Icon
                  size={21}
                  className={
                    card.title ===
                    "Processing"
                      ? "animate-spin"
                      : ""
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default DocumentStats;