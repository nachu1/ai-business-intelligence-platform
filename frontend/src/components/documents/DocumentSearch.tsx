import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

function DocumentSearch({
  value,
  onChange,
  onSearch,
  onClear,
}: Props) {
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      onSearch();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6">
      <div className="mb-4">
        <h2 className="text-base font-black text-slate-900 sm:text-lg">
          Search documents
        </h2>

        <p className="mt-1 text-sm font-medium leading-5 text-slate-500 sm:text-base">
          Find a document by its file name.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Search by document name..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-11 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 sm:text-base"
          />

          {value && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 text-sm font-bold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 active:scale-[0.98] sm:text-base"
        >
          <Search size={18} />
          Search
        </button>
      </div>
    </section>
  );
}

export default DocumentSearch;