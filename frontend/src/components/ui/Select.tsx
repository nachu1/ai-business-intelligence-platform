import type { SelectHTMLAttributes } from "react";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

function Select({
  label,
  error,
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}

      <select
        className={`
          w-full
          rounded-2xl
          border
          ${
            error
              ? "border-red-500"
              : "border-slate-200"
          }
          bg-slate-50
          px-4
          py-3.5
          text-slate-900
          transition-all
          duration-300
          outline-none

          hover:border-slate-300

          focus:border-teal-500
          focus:bg-white
          focus:ring-4
          focus:ring-teal-500/15

          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-400

          ${className}
        `}
        {...props}
      >
        {children}
      </select>

      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;