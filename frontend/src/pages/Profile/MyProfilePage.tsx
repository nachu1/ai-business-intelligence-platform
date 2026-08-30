import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Card from "../../components/ui/Card";
import {
  getCurrentUser,
  type User as UserData,
} from "../../api/user";

function MyProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setUser(await getCurrentUser());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—";

  const roleLabel = (value?: string) =>
    value
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : "—";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-4">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-400">
            Unable to load your profile.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-x-hidden bg-slate-950 px-3 py-2 sm:px-5 sm:py-3 lg:px-6">
      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative z-10 w-full">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* CENTERED PROFILE CONTENT */}
        <div className="mx-auto w-full max-w-4xl">
          {/* Profile Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-teal-400/30 blur-2xl" />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-800 bg-gradient-to-br from-teal-400 to-cyan-500 text-3xl font-black text-white shadow-2xl sm:h-24 sm:w-24 sm:text-4xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {user.name}
            </h1>

            <p className="mt-1 text-sm font-semibold text-teal-300">
              {roleLabel(user.role)}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail size={15} />
                {user.email}
              </span>

              {user.company?.name && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={15} />
                  {user.company.name}
                </span>
              )}
            </div>
          </div>

          {/* Information */}
          <div className="mt-5 space-y-4">
            {/* Personal Information */}
            <Card>
              <SectionTitle
                icon={<User size={17} />}
                title="Personal Information"
              />

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <InfoItem
                  icon={<User size={17} />}
                  label="Full Name"
                  value={user.name}
                />

                <InfoItem
                  icon={<Mail size={17} />}
                  label="Email Address"
                  value={user.email}
                />
              </div>
            </Card>

            {/* Work Information */}
            <Card>
              <SectionTitle
                icon={<BriefcaseBusiness size={17} />}
                title="Work Information"
              />

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem
                  icon={<Building2 size={17} />}
                  label="Company"
                  value={user.company?.name || "—"}
                />

                <InfoItem
                  icon={<BriefcaseBusiness size={17} />}
                  label="Department"
                  value={user.department || "—"}
                />

                <InfoItem
                  icon={<ShieldCheck size={17} />}
                  label="Role"
                  value={roleLabel(user.role)}
                />

                <InfoItem
                  icon={<User size={17} />}
                  label="Designation"
                  value={user.designation || "—"}
                />

                <InfoItem
                  icon={<CalendarDays size={17} />}
                  label="Joined"
                  value={formatDate(user.created_at)}
                />

                <InfoItem
                  icon={<CheckCircle2 size={17} />}
                  label="Account Status"
                  value={user.is_active ? "Active" : "Inactive"}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
        {icon}
      </div>

      <h2 className="text-base font-black text-slate-800 sm:text-lg">
        {title}
      </h2>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-teal-200 hover:bg-teal-50/30">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <p className="text-[11px] font-bold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-bold text-slate-800 sm:text-[15px]">
        {value}
      </p>
    </div>
  );
}

export default MyProfilePage;