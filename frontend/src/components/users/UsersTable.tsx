import {
  Pencil,
  MessageCircle,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { User } from "../../api/user";

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onMessage: (user: User) => void;
  currentUserId?: string;
}

function UsersTable({
  users,
  onEdit,
  onDelete,
  onMessage,
  currentUserId,
}: Props) {
  const initials = (name: string) =>
    name
      ?.trim()
      .split(/\s+/)
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const roleStyle = (role: string) =>
    ({
      admin:
        "bg-violet-50 text-violet-700 ring-violet-200",
      manager:
        "bg-blue-50 text-blue-700 ring-blue-200",
      employee:
        "bg-slate-100 text-slate-700 ring-slate-200",
    }[role?.toLowerCase()] ||
      "bg-slate-100 text-slate-700 ring-slate-200");

  const roleLabel = (role: string) =>
    role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "User";

  if (!users.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <UsersRound className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 p-4 text-slate-400" />

        <h3 className="mt-5 text-xl font-bold text-slate-900">
          No users found
        </h3>

        <p className="mx-auto mt-2 max-w-md text-base text-slate-500">
          There are no users matching your current search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
        <div>
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            All Users
          </h2>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm sm:flex">
          <UsersRound
            size={18}
            className="text-teal-600"
          />
          Team members
        </div>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-[950px] w-full">
          <thead className="border-b border-slate-200 bg-slate-100/80">
            <tr>
              {[
                "User",
                "Role",
                "Department",
                "Status",
                "Actions",
              ].map((title) => (
                <th
                  key={title}
                  className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-slate-600 last:text-right sm:text-[15px]"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isCurrentUser =
                user.id === currentUserId;

              return (
                <tr
                  key={user.id}
                  className={`border-b border-slate-100 transition last:border-0 ${
                    isCurrentUser
                      ? "bg-teal-50/50 hover:bg-teal-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* USER */}
                  <td className="px-6 py-6 sm:px-7">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-base font-black text-white shadow-sm">
                        {initials(user.name)}

                        {isCurrentUser && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-teal-600 px-1 text-[9px] font-black text-white">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-bold text-slate-950 sm:text-lg">
                            {isCurrentUser
                              ? "You"
                              : user.name}
                          </p>

                          {isCurrentUser && (
                            <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-black text-teal-700">
                              You
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm font-medium text-slate-500 sm:text-base">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-6 py-6">
                    <span
                      className={`inline-flex rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 ring-inset ${roleStyle(
                        user.role
                      )}`}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </td>

                  {/* DEPARTMENT */}
                  <td className="px-6 py-6 text-base font-semibold text-slate-700">
                    {user.department || "—"}
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          user.is_active
                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                            : "bg-red-500 shadow-sm shadow-red-500/30"
                        }`}
                      />

                      <span
                        className={`text-sm font-bold sm:text-base ${
                          user.is_active
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {user.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-6 sm:px-7">
                    <div className="flex justify-end gap-2">
                      {/* EDIT */}
                      <button
                        onClick={() => onEdit(user)}
                        title={
                          isCurrentUser
                            ? "Edit your profile"
                            : "Edit user"
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* MESSAGE */}
                      <button
                        onClick={() => onMessage(user)}
                        disabled={
                          isCurrentUser ||
                          !user.is_active
                        }
                        title={
                          isCurrentUser
                            ? "You cannot message yourself"
                            : !user.is_active
                            ? "Inactive user"
                            : `Message ${user.name}`
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-100 hover:text-teal-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-teal-50 disabled:hover:text-teal-600"
                      >
                        <MessageCircle size={19} />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => onDelete(user)}
                        title="Delete user"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 shadow-sm transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 hover:shadow"
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersTable;