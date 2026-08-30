import { Users, TrendingUp } from "lucide-react";

import type { EmployeePerformance as EmployeePerformanceData } from "../../api/reports";

interface EmployeePerformanceProps {
  employees: EmployeePerformanceData[];
}

export default function EmployeePerformance({
  employees,
}: EmployeePerformanceProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Users className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-950">
            Employee performance
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Task assignment and submission activity for the selected
            period.
          </p>
        </div>
      </div>

      {employees.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Employee
                </th>

                <th className="px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Assigned
                </th>

                <th className="px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Submitted
                </th>

                <th className="px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Completion
                </th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee.employee_id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                        {employee.employee_name
                          .trim()
                          .split(/\s+/)
                          .map((name) => name[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <span className="text-sm font-bold text-slate-800">
                        {employee.employee_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-4 text-sm font-bold text-slate-700">
                    {employee.assigned}
                  </td>

                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700">
                      {employee.submitted}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex min-w-[150px] items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all"
                          style={{
                            width: `${Math.min(
                              employee.completion_rate,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="w-12 text-right text-xs font-black text-slate-700">
                        {employee.completion_rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 flex min-h-[150px] flex-col items-center justify-center rounded-xl bg-slate-50 text-center">
          <TrendingUp className="h-7 w-7 text-slate-300" />

          <p className="mt-3 text-sm font-extrabold text-slate-700">
            No employee activity
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            No task activity was recorded during this period.
          </p>
        </div>
      )}
    </section>
  );
}