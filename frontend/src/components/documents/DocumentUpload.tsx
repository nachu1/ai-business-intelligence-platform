import {
  FileUp,
  FileText,
  X,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  uploadDocument,
  type UploadDocumentResponse,
  type DocumentType,
} from "../../api/document";

interface Props {
  onUploaded?: (document: UploadDocumentResponse) => void;
}

const documentTypes: {
  value: DocumentType;
  label: string;
}[] = [
  { value: "sales_report", label: "Sales Report" },
  { value: "invoice", label: "Invoice" },
  { value: "inventory", label: "Inventory" },
  { value: "financial_statement", label: "Financial Statement" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "other", label: "Other" },
];

function DocumentUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<DocumentType>("sales_report");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const selectFile = (selected?: File) => {
    setError("");
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setError("Only PDF documents are supported.");
      return;
    }

    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    try {
      setError("");
      setUploading(true);

      const response = await uploadDocument(
        file,
        documentType
      );

      clearFile();
      onUploaded?.(response);
    } catch (error: any) {
      console.error("Failed to upload document:", error);
      setError(
        error?.response?.data?.detail ||
          "Failed to upload document. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 sm:h-12 sm:w-12 sm:rounded-2xl">
          <FileUp size={22} />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-900 sm:text-xl">
            Upload document
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-500 sm:text-base">
            Add a PDF to your organization's document library.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          selectFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() =>
          !uploading && inputRef.current?.click()
        }
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
          file
            ? "border-teal-300 bg-teal-50/50"
            : "border-slate-300 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) =>
            selectFile(e.target.files?.[0])
          }
          className="hidden"
        />

        {file ? (
          <div className="mx-auto flex max-w-xl items-center gap-3 text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
              <FileText size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900 sm:text-base">
                {file.name}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                PDF · {formatSize(file.size)}
              </p>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
              title="Remove file"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
              <UploadCloud size={27} />
            </div>

            <p className="mt-4 text-base font-black text-slate-800 sm:text-lg">
              Choose a PDF file
            </p>

            <p className="mt-1 text-sm font-medium text-slate-500">
              or drag and drop it here
            </p>

            <p className="mt-3 text-xs font-medium text-slate-400 sm:text-sm">
              PDF documents only
            </p>
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label
            htmlFor="upload-document-type"
            className="mb-1.5 block text-sm font-bold text-slate-700"
          >
            Document type
          </label>

          <select
            id="upload-document-type"
            value={documentType}
            onChange={(e) =>
              setDocumentType(
                e.target.value as DocumentType
              )
            }
            disabled={uploading}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 sm:text-base"
          >
            {documentTypes.map((type) => (
              <option
                key={type.value}
                value={type.value}
              >
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 text-sm font-bold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:text-base"
        >
          {uploading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              Upload Document
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}

export default DocumentUpload;