import { Loader2, Trash2, X } from "lucide-react";

interface Props {
  userName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteUserModal({
  userName,
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-red-100 bg-red-50/70 px-6 py-6 sm:px-7">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 size={23} />
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <h2 className="mt-5 text-xl font-black text-slate-900 sm:text-2xl">
            Delete user?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-bold text-slate-900">
              "{userName}"
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 px-6 py-6 sm:flex-row sm:justify-end sm:px-7">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading && (
              <Loader2 size={17} className="animate-spin" />
            )}
            {loading ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>
    </div>
  );
}