import api from "./api";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export type DocumentType =
  | "sales_report"
  | "invoice"
  | "inventory"
  | "financial_statement"
  | "purchase_order"
  | "other";

export interface DocumentItem {
  id: string;
  company_id: string;
  uploaded_by: string;
  uploader_name: string;
  department_id: string | null;
  original_filename: string;
  stored_filename: string;
  storage_path: string;
  document_type: DocumentType;
  mime_type: string;
  file_size: number;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export interface UploadDocumentResponse {
  message: string;
  document_id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}

export interface DocumentFilters {
  search?: string;
  document_type?: DocumentType;
  sort?:
    | "newest"
    | "oldest"
    | "name_asc"
    | "name_desc"
    | "updated";
}


// =========================================================
// GET DOCUMENTS
// =========================================================

export const getDocuments = async (
  filters: DocumentFilters = {}
): Promise<DocumentItem[]> => {
  const response = await api.get("/documents/", {
    params: {
      search: filters.search || undefined,
      document_type:
        filters.document_type || undefined,
      sort: filters.sort || "newest",
    },
  });

  return response.data;
};


// =========================================================
// UPLOAD
// =========================================================

export const uploadDocument = async (
  file: File,
  documentType: DocumentType
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("document_type", documentType);

  const response = await api.post(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


// =========================================================
// DELETE
// =========================================================

export const deleteDocument = async (
  documentId: string
) => {
  const response = await api.delete(
    `/documents/${documentId}`
  );

  return response.data;
};


// =========================================================
// DOWNLOAD
// =========================================================

export const downloadDocument = async (
  documentId: string,
  filename: string
) => {
  const response = await api.get(
    `/documents/${documentId}/download`,
    {
      responseType: "blob",
    }
  );

  const contentType =
    typeof response.headers["content-type"] === "string"
      ? response.headers["content-type"]
      : "application/pdf";

  const blob = new Blob(
    [response.data],
    {
      type: contentType,
    }
  );

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};


// =========================================================
// RAG SEARCH
// =========================================================

export interface DocumentSearchSource {
  document: string;
  document_type: string;
  chunk: number;
}

export interface DocumentSearchResponse {
  question: string;
  answer: string;
  sources: DocumentSearchSource[];
}

export const searchDocuments = async (
  question: string
): Promise<DocumentSearchResponse> => {
  const response = await api.post(
    "/documents/search",
    {
      question,
    }
  );

  return response.data;
};

