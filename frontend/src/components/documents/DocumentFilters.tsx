import { Filter, RotateCcw } from "lucide-react";

interface Props {
  documentType: string;
  sort: string;
  onDocumentTypeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onReset: () => void;
}

function DocumentFilters({
  documentType,
  sort,
  onDocumentTypeChange,
  onSortChange,
  onReset,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Filter size={19} />
        </div>

        <div>
          <h2 className="text-base font-black text-slate-900 sm:text-lg">
            Filter documents
          </h2>

          <p className="text-sm font-medium text-slate-500">
            Narrow down your document list.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div>
          <label
            htmlFor="document-type"
            className="mb-1.5 block text-sm font-bold text-slate-700"
          >
            Document type
          </label>

          <select
            id="document-type"
            value={documentType}
            onChange={(e) =>
              onDocumentTypeChange(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 sm:text-base"
          >
            <option value="">All document types</option>
            <option value="sales_report">
              Sales Report
            </option>
            <option value="invoice">
              Invoice
            </option>
            <option value="inventory">
              Inventory
            </option>
            <option value="financial_statement">
              Financial Statement
            </option>
            <option value="purchase_order">
              Purchase Order
            </option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="document-sort"
            className="mb-1.5 block text-sm font-bold text-slate-700"
          >
            Sort by
          </label>

          <select
            id="document-sort"
            value={sort}
            onChange={(e) =>
              onSortChange(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 sm:text-base"
          >
            <option value="newest">
              Newest first
            </option>
            <option value="oldest">
              Oldest first
            </option>
            <option value="name">
              Name A–Z
            </option>
            <option value="size">
              File size
            </option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 sm:text-base lg:w-auto"
          >
            <RotateCcw size={17} />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}

export default DocumentFilters;