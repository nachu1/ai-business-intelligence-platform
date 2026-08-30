import { useCallback,useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Check,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { useMessageSocket } from "../../hooks/useMessageSocket";

import {
  inviteUser,
  getInvitations,
  resendInvitation,
  cancelInvitation,
  type Invitation,
} from "../../api/user";

import {
  getDepartments,
  getDesignations,
  type Department,
  type Designation,
} from "../../api/company";

type Role = "admin" | "manager" | "employee";

function InviteUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [search, setSearch] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
  try {
    setLoadingInvitations(true);

    const data = await getInvitations();

    setInvitations(
      Array.isArray(data) ? data : []
    );
  } catch (error) {
    console.error(error);
    setInvitations([]);
    toast.error(
      "Failed to load invitations."
    );
  } finally {
    setLoadingInvitations(false);
  }
}, []);

const handleSocketEvent = useCallback(
  (event: any) => {
    if (
      event.type ===
      "invitation_accepted"
    ) {
      loadInvitations();
    }
  },
  [loadInvitations]
);

useMessageSocket(handleSocketEvent);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);

        if (user?.role === "manager" && user.department_id) {
          setDepartmentId(user.department_id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load departments.");
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
    loadInvitations();
  }, [user,loadInvitations]);

  useEffect(() => {
    if (!departmentId) {
      setDesignations([]);
      setDesignationId("");
      return;
    }

    const loadDesignations = async () => {
      try {
        setLoadingDesignations(true);
        setDesignationId("");
        setDesignations(await getDesignations(departmentId));
      } catch (error) {
        console.error(error);
        setDesignations([]);
        toast.error("Failed to load designations.");
      } finally {
        setLoadingDesignations(false);
      }
    };

    loadDesignations();
  }, [departmentId]);

  const handleInvite = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !departmentId ||
      !designationId ||
      !role
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await inviteUser({
        name: name.trim(),
        email: email.trim(),
        department_id: departmentId,
        designation_id: designationId,
        role,
      });

      if (response.success === false) {
        toast.error(response.message || "Failed to send invitation.");
        return;
      }

      toast.success("Invitation sent successfully.");

      setName("");
      setEmail("");
      setDepartmentId("");
      setDesignationId("");
      setDesignations([]);
      setRole("");

      await loadInvitations();
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to send invitation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      setResendingId(id);

      const response = await resendInvitation(id);

      if (response.success === false) {
        toast.error(response.message || "Failed to resend invitation.");
        return;
      }

      toast.success("Invitation resent.");
      await loadInvitations();
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to resend invitation."
      );
    } finally {
      setResendingId(null);
    }
  };

  const handleCancel = async (invitation: Invitation) => {
    if (!window.confirm(`Cancel the invitation sent to ${invitation.email}?`))
      return;

    try {
      setCancellingId(invitation.id);

      const response = await cancelInvitation(invitation.id);

      if (response.success === false) {
        toast.error(response.message || "Failed to cancel invitation.");
        return;
      }

      toast.success("Invitation cancelled.");
      await loadInvitations();
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to cancel invitation."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const filteredInvitations = useMemo(() => {
    const value = search.trim().toLowerCase();

    return value
      ? invitations.filter(
          (item) =>
            item.name.toLowerCase().includes(value) ||
            item.email.toLowerCase().includes(value)
        )
      : invitations;
  }, [invitations, search]);

  const getStatus = (value: Invitation["status"]) => {
    if (value === "accepted")
      return {
        text: "Accepted",
        Icon: Check,
        style:
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-600",
      };

    if (value === "cancelled")
      return {
        text: "Cancelled",
        Icon: XCircle,
        style: "border-slate-300 bg-slate-100 text-slate-500",
      };

    return {
      text: "Pending",
      Icon: Clock3,
      style: "border-amber-400/20 bg-amber-500/10 text-amber-600",
    };
  };

  const roleLabel = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-5">

        <Card>
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-200"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-cyan-500/20">
              <UserPlus className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Invite User
              </h1>
              <p className="mt-0.5 text-sm font-medium text-slate-500 sm:text-[15px]">
                Add a new member to your organization.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Business Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role | "")}
            >
              <option value="">Select role</option>

              {!isManager && (
                <>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </>
              )}

              <option value="employee">Employee</option>
            </Select>

            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={
                isManager ||
                loadingDepartments ||
                !departments.length
              }
            >
              <option value="">
                {loadingDepartments
                  ? "Loading..."
                  : departments.length
                  ? "Select department"
                  : "No departments"}
              </option>

              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Select
              label="Designation"
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              disabled={
                !departmentId ||
                loadingDesignations ||
                !designations.length
              }
            >
              <option value="">
                {loadingDesignations
                  ? "Loading..."
                  : !departmentId
                  ? "Select department first"
                  : designations.length
                  ? "Select designation"
                  : "No designations"}
              </option>

              {designations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>

            <div className="flex items-end">
              <Button
                onClick={handleInvite}
                disabled={
                  loading ||
                  loadingDepartments ||
                  !departments.length
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send size={17} />
                    Send Invitation
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Sent Invitations
              </h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                Manage invitations sent to your organization members.
              </p>
            </div>

            <button
              type="button"
              onClick={loadInvitations}
              disabled={loadingInvitations}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={loadingInvitations ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="relative mt-5">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
            />
          </div>

          <div className="mt-5">
            {loadingInvitations ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2
                  size={26}
                  className="animate-spin text-teal-600"
                />
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
                <Mail className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {search ? "No matching invitations" : "No invitations yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
                  <table className="w-full min-w-[720px]">
                    <thead className="bg-slate-100">
                      <tr className="border-b border-slate-200 text-left">
                        {["User", "Role", "Status", "Sent", ""].map(
                          (title) => (
                            <th
                              key={title}
                              className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500"
                            >
                              {title}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredInvitations.map((item) => {
                        const s = getStatus(item.status);
                        const active = item.status === "pending";

                        return (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-black text-white">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-[15px] font-bold text-slate-800">
                                    {item.name}
                                  </p>
                                  <p className="truncate text-sm font-medium text-slate-500">
                                    {item.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                              {roleLabel(item.role)}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${s.style}`}
                              >
                                <s.Icon size={13} />
                                {s.text}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm font-medium text-slate-500">
                              {formatDate(item.created_at)}
                            </td>

                            <td className="px-4 py-4">
                              {active && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleResend(item.id)}
                                    disabled={
                                      !!resendingId || !!cancellingId
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                                  >
                                    {resendingId === item.id ? (
                                      <Loader2
                                        size={15}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <span className="flex items-center gap-1.5">
                                        <RefreshCw size={13} />
                                        Resend
                                      </span>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCancel(item)}
                                    disabled={
                                      !!resendingId || !!cancellingId
                                    }
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {cancellingId === item.id ? (
                                      <Loader2
                                        size={15}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <span className="flex items-center gap-1.5">
                                        <X size={14} />
                                        Cancel
                                      </span>
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {filteredInvitations.map((item) => {
                    const s = getStatus(item.status);
                    const active = item.status === "pending";

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 font-black text-white">
                            {item.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[15px] font-bold text-slate-800">
                                  {item.name}
                                </p>
                                <p className="break-all text-sm font-medium text-slate-500">
                                  {item.email}
                                </p>
                              </div>

                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${s.style}`}
                              >
                                <s.Icon size={11} />
                                {s.text}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-sm font-medium text-slate-500">
                              <span>{roleLabel(item.role)}</span>
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {active && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleResend(item.id)}
                              disabled={!!resendingId || !!cancellingId}
                              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                              {resendingId === item.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                              Resend
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancel(item)}
                              disabled={!!resendingId || !!cancellingId}
                              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {cancellingId === item.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <X size={14} />
                              )}
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default InviteUserPage;