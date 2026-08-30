import {
  BarChart3,
  CalendarDays,
  Download,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  onGenerate: () => void;
  onDownload: () => void;
  loading: boolean;
  hasReport: boolean;
}

export default function ReportHeader({
  title,
  subtitle,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onGenerate,
  onDownload,
  loading,
  hasReport,
}: ReportHeaderProps) {
  return (
    <section className="relative mb-5 overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-cyan-50/60 to-indigo-50/80 p-5 shadow-[0_15px_50px_rgba(15,23,42,0.07)] sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {title}
              </h1>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDownload}
            disabled={!hasReport || loading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-700">
            <CalendarDays className="h-4 w-4 text-cyan-600" />
            Report period
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <DateField
              label="Start date"
              value={startDate}
              onChange={setStartDate}
              max={endDate}
            />

            <DateField
              label="End date"
              value={endDate}
              onChange={setEndDate}
              min={startDate}
              max={new Date().toISOString().split("T")[0]}
            />

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading || !startDate || !endDate}
              className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}

              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  );
}