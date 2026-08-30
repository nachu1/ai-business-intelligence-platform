import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FileText,
  Search,
  RefreshCw,
  FolderOpen,
  Clock3,
  CheckCircle2,
  Loader2,
  Download,
  Trash2,
  UploadCloud,
  ShieldCheck,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getDocuments,
  deleteDocument,
  downloadDocument,
  type DocumentItem,
} from "../../api/document";

import DocumentUpload from "../../components/documents/DocumentUpload";
import { useAuth } from "../../context/AuthContext";

function DocumentsPage() {
  const { user } = useAuth();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);

  const loadDocuments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setDocuments(await getDocuments());
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Unable to load your documents.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Automatically update Processing → Ready
  useEffect(() => {
    const processing = documents.some(
      (doc) =>
        doc.status === "processing" ||
        doc.status === "uploaded"
    );

    if (!processing) return;

    const interval = window.setInterval(
      () => loadDocuments(false),
      3000
    );

    return () => window.clearInterval(interval);
  }, [documents, loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return documents;

    return documents.filter((doc) =>
      [
        doc.original_filename,
        doc.uploader_name,
        doc.document_type,
      ].some((field) =>
        field?.toLowerCase().includes(value)
      )
    );
  }, [documents, search]);

  const completedCount = documents.filter(
    (doc) => doc.status === "completed"
  ).length;

  const processingCount = documents.filter(
    (doc) =>
      doc.status === "processing" ||
      doc.status === "uploaded"
  ).length;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatType = (type: string) =>
    type
      .split("_")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const canDelete = (document: DocumentItem) => {
    if (!user) return false;

    if (user.role === "admin") return true;

    if (user.role === "manager") {
      return (
        document.department_id ===
        (user as typeof user & {
          department_id?: string;
        }).department_id
      );
    }

    return document.uploaded_by === user.id;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const document = deleteTarget;

    if (!canDelete(document)) {
      setDeleteTarget(null);
      toast.error(
        "You don't have permission to delete this document."
      );
      return;
    }

    try {
      setDeletingId(document.id);

      await deleteDocument(document.id);

      setDocuments((current) =>
        current.filter((item) => item.id !== document.id)
      );

      setDeleteTarget(null);

      toast.success("Document deleted successfully.");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          "Unable to delete the document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (document: DocumentItem) => {
    try {
      setDownloadingId(document.id);

      await downloadDocument(
        document.id,
        document.original_filename
      );

      toast.success("Document downloaded.");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          "Unable to download the document."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUploaded = () => {
    setUploadOpen(false);
    toast.success("Document uploaded successfully.");
    loadDocuments();
  };

  const statusStyle = {
    completed:
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
    failed:
      "bg-red-50 text-red-700 ring-red-200",
    processing:
      "bg-amber-50 text-amber-700 ring-amber-200",
    uploaded:
      "bg-slate-100 text-slate-600 ring-slate-200",
  };

  const statusLabel = {
    completed: "Ready",
    failed: "Failed",
    processing: "Processing",
    uploaded: "Uploaded",
  };

  return (
    <div className="min-h-full w-full space-y-6 pb-10 sm:space-y-8">

      {/* HEADER */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/60 to-teal-50/70 shadow-sm sm:rounded-3xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg sm:h-14 sm:w-14">
              <FileText size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                Documents
              </h1>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                Centralize your business documents and keep your AI knowledge base up to date.
              </p>
            </div>
          </div>

          <button
            onClick={() => setUploadOpen((value) => !value)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-teal-700 hover:to-cyan-700 active:scale-[0.98] sm:w-auto sm:text-base"
          >
            {uploadOpen ? (
              <>
                <X size={18} />
                Close Upload
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                Upload Document
              </>
            )}
          </button>
        </div>
      </section>

     {/* SUMMARY */}
<section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">

  {/* AVAILABLE DOCUMENTS */}
  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-slate-600 sm:text-base">
          Available Documents
        </p>

        <p className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
          {documents.length}
        </p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">
        <FolderOpen size={22} />
      </div>
    </div>
  </div>

  {/* READY */}
  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-slate-600 sm:text-base">
          Completed
        </p>

        <p className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
          {completedCount}
        </p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
        <CheckCircle2 size={22} />
      </div>
    </div>
  </div>

  {/* PROCESSING */}
  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-slate-600 sm:text-base">
          Processing
        </p>

        <p className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
          {processingCount}
        </p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
        <Clock3 size={22} />
      </div>
    </div>
  </div>

</section>
      {/* UPLOAD */}
      {uploadOpen && (
        <DocumentUpload onUploaded={handleUploaded} />
      )}

      {/* LIBRARY */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Document Library
                </h2>
                <ShieldCheck size={19} className="text-teal-600" />
              </div>

              <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                View and manage the documents available to you.
              </p>
            </div>

            <button
              onClick={() => loadDocuments()}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* SEARCH */}
          <div className="relative mt-5">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by document, uploader, or type..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 sm:text-base"
            />
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <Loader2 size={34} className="animate-spin text-teal-600" />
            <p className="mt-4 text-base font-bold text-slate-600">
              Loading documents...
            </p>
          </div>
        ) : !filteredDocuments.length ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderOpen size={28} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-900 sm:text-xl">
              {search ? "No matching documents" : "No documents yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500 sm:text-base">
              {search
                ? "Try a different document name, uploader, or document type."
                : "Upload a document to start building your accessible knowledge library."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="px-5 py-5 transition hover:bg-slate-50/70 sm:px-7 sm:py-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  {/* INFO */}
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 sm:h-14 sm:w-14 sm:rounded-2xl">
                      <FileText size={25} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-all text-base font-black text-slate-900 sm:text-lg">
                        {document.original_filename}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 sm:text-sm">
                        <span>{formatType(document.document_type)}</span>
                        <span className="text-slate-300">•</span>
                        <span>{formatSize(document.file_size)}</span>
                        <span className="text-slate-300">•</span>
                        <span>{formatDate(document.created_at)}</span>
                      </div>

                      <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
                        Uploaded by{" "}
                        <span className="font-bold text-slate-700">
                          {document.uploader_name || "Unknown user"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset sm:text-sm ${
                        statusStyle[document.status]
                      }`}
                    >
                      {document.status === "completed" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}

                      {statusLabel[document.status]}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownload(document)}
                      disabled={
                        downloadingId === document.id ||
                        document.status !== "completed"
                      }
                      title="Download document"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-600 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-100 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {downloadingId === document.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                    </button>

                    {canDelete(document) && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(document)}
                        disabled={deletingId === document.id}
                        title="Delete document"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 shadow-sm transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId === document.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-950 sm:text-xl">
                    Delete document?
                  </h3>

                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    This will permanently remove the document from your document library.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deletingId}
                  className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="break-all text-sm font-bold text-slate-800">
                  {deleteTarget.original_filename}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatType(deleteTarget.document_type)} ·{" "}
                  {formatSize(deleteTarget.file_size)}
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deletingId}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!!deletingId}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;