import { useEffect, useState } from "react";
import { Activity, AlertCircle, Loader2 } from "lucide-react";

import {
  getDashboard,
  type DashboardData,
} from "../../api/dashboard";

import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const result = await getDashboard();

        setData(result);
      } catch {
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f5f8fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-cyan-400/20" />
            <Loader2 className="relative h-6 w-6 animate-spin text-cyan-500" />
          </div>

          <p className="text-sm font-medium text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f5f8fc] p-6">
        <div className="flex max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />

          <p className="text-sm font-medium text-slate-600">
            {error || "Unable to load dashboard."}
          </p>
        </div>
      </div>
    );
  }

  if (data.role === "admin") {
    return <AdminDashboard data={data} />;
  }

  if (data.role === "manager") {
    return <ManagerDashboard data={data} />;
  }

  if (data.role === "employee") {
    return <EmployeeDashboard data={data} />;
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[#f5f8fc]">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Activity className="h-5 w-5 text-cyan-500" />
        Unsupported user role.
      </div>
    </div>
  );
}

export default DashboardPage;