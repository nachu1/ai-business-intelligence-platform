import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RotateCcw,
  ShieldCheck,
  BriefcaseBusiness,
  UserRound,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getUsers,
  getUserStats,
  deleteUser,
  type User,
} from "../../api/user";

import {
  getDepartments,
  type Department,
} from "../../api/company";

import { useAuth } from "../../context/AuthContext";

import UsersTable from "../../components/users/UsersTable";
import EditUserModal from "../../components/users/EditUserModal";
import DeleteUserModal from "../../components/users/DeleteUserModal";

function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] =
    useState<User | null>(null);
  const [deletingUser, setDeletingUser] =
    useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    managers: 0,
    employees: 0,
  });

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [departmentsLoading, setDepartmentsLoading] =
    useState(true);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] =
    useState("");

  const loadUsers = async (
    filters = {
      search: search || undefined,
      role: role || undefined,
      department: department || undefined,
    }
  ) => {
    try {
      setLoading(true);

      const data = await getUsers({
        ...filters,
        page: 1,
        limit: 10,
      });

      setUsers(data);
    } catch (error) {
      console.error(
        "Failed to load users:",
        error
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);

      const data = await getUserStats();

      setStats({
        total: data.total_users,
        admins: data.administrators,
        managers: data.managers,
        employees: data.employees,
      });
    } catch (error) {
      console.error(
        "Failed to load user statistics:",
        error
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      setDepartments(await getDepartments());
    } catch (error) {
      console.error(
        "Failed to load departments:",
        error
      );
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
    loadDepartments();
  }, []);

  /* =====================================================
     PUT CURRENT USER FIRST
  ===================================================== */

  const orderedUsers = currentUser
    ? [
        ...users.filter(
          (item) => item.id === currentUser.id
        ),
        ...users.filter(
          (item) => item.id !== currentUser.id
        ),
      ]
    : users;

  /* =====================================================
     OPEN CHAT WITH USER
  ===================================================== */

  const handleMessage = (selectedUser: User) => {
    if (!currentUser) return;

    if (selectedUser.id === currentUser.id) {
      return;
    }

    navigate("/messages", {
      state: {
        userId: selectedUser.id,
      },
    });
  };

  /* =====================================================
     RESET FILTERS
  ===================================================== */

  const handleReset = () => {
    setSearch("");
    setRole("");
    setDepartment("");

    loadUsers({
      search: undefined,
      role: undefined,
      department: undefined,
    });
  };

  /* =====================================================
     DELETE USER
  ===================================================== */

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      setDeleting(true);

      await deleteUser(deletingUser.id);

      setUsers((current) =>
        current.filter(
          (user) =>
            user.id !== deletingUser.id
        )
      );

      setStats((current) => ({
        ...current,

        total: Math.max(
          0,
          current.total - 1
        ),

        admins:
          deletingUser.role === "admin"
            ? Math.max(
                0,
                current.admins - 1
              )
            : current.admins,

        managers:
          deletingUser.role === "manager"
            ? Math.max(
                0,
                current.managers - 1
              )
            : current.managers,

        employees:
          deletingUser.role === "employee"
            ? Math.max(
                0,
                current.employees - 1
              )
            : current.employees,
      }));

      setDeletingUser(null);

      toast.success(
        "User deleted successfully."
      );
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to delete user."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =====================================================
     STATISTICS
  ===================================================== */

  const statCards = [
    [
      "Total Users",
      stats.total,
      UserRound,
      "bg-cyan-100 text-cyan-700",
    ],
    [
      "Administrators",
      stats.admins,
      ShieldCheck,
      "bg-violet-100 text-violet-700",
    ],
    [
      "Managers",
      stats.managers,
      BriefcaseBusiness,
      "bg-blue-100 text-blue-700",
    ],
    [
      "Employees",
      stats.employees,
      UserCheck,
      "bg-emerald-100 text-emerald-700",
    ],
  ] as const;

  return (
    <div className="min-h-full w-full space-y-6 pb-8 sm:space-y-8 sm:pb-10">

      {/* HEADER */}

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl sm:h-72 sm:w-72" />

        <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-teal-200/40 blur-3xl sm:h-72 sm:w-72" />

        <div className="relative px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 items-center gap-3 sm:gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl">
                <Users className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                  Users
                </h1>

                <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  Manage and organize everyone in your workspace.
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                navigate("/invite-user")
              }
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:from-teal-700 hover:to-cyan-700 sm:w-auto sm:text-base"
            >
              + Invite User
            </button>

          </div>
        </div>
      </section>

      {/* STATISTICS */}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">

        {statCards.map(
          ([
            label,
            value,
            Icon,
            iconStyle,
          ]) => (
            <div
              key={label}
              className="rounded-2xl border border-cyan-100 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">

                <div>
                  <p className="text-sm font-bold text-slate-600 sm:text-base">
                    {label}
                  </p>

                  {statsLoading ? (
                    <div className="mt-2 h-8 w-12 animate-pulse rounded-lg bg-slate-200" />
                  ) : (
                    <p className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                      {value}
                    </p>
                  )}
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconStyle}`}
                >
                  <Icon size={20} />
                </div>

              </div>
            </div>
          )
        )}

      </section>

      {/* FILTERS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">

        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-900 sm:text-xl">
            Find users
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
            Search and filter members of your organization.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_200px_auto_auto]">

          <div className="relative md:col-span-2 xl:col-span-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                loadUsers()
              }
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 sm:text-base"
            />

          </div>

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 sm:text-base"
          >
            <option value="">
              All Roles
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="manager">
              Manager
            </option>

            <option value="employee">
              Employee
            </option>
          </select>

          <select
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
            disabled={departmentsLoading}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60 sm:text-base"
          >
            <option value="">
              {departmentsLoading
                ? "Loading Departments..."
                : "All Departments"}
            </option>

            {departments.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>

          <button
            onClick={() => loadUsers()}
            className="rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:text-base"
          >
            Search
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:text-base"
          >
            <RotateCcw size={17} />
            Reset
          </button>

        </div>
      </section>

      {/* USERS */}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:rounded-3xl">

          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

          <p className="mt-4 text-base font-bold text-slate-600 sm:text-lg">
            Loading users...
          </p>

        </div>
      ) : (
        <div className="min-w-0 overflow-hidden">

          <UsersTable
            users={orderedUsers}
            onEdit={setEditingUser}
            onDelete={setDeletingUser}
            onMessage={handleMessage}
            currentUserId={
              currentUser?.id
            }
          />

        </div>
      )}

      {/* EDIT USER */}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() =>
            setEditingUser(null)
          }
          onUpdated={(updated: User) => {
            setUsers((current) =>
              current.map((user) =>
                user.id === updated.id
                  ? updated
                  : user
              )
            );

            setEditingUser(null);
          }}
        />
      )}

      {/* DELETE USER */}

      {deletingUser && (
        <DeleteUserModal
          userName={
            deletingUser.name
          }
          loading={deleting}
          onClose={() =>
            !deleting &&
            setDeletingUser(null)
          }
          onConfirm={handleDelete}
        />
      )}

    </div>
  );
}

export default UsersPage;