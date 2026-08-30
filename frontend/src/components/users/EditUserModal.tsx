import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  updateUser,
  type User,
} from "../../api/user";

import {
  getDepartments,
  getDesignations,
  type Department,
  type Designation,
} from "../../api/company";

import {
  getDepartmentManagers,
  type DepartmentManager,
} from "../../api/user";

interface Props {
  user: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

type Role = "admin" | "manager" | "employee";

export default function EditUserModal({
  user,
  onClose,
  onUpdated,
}: Props) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [departmentId, setDepartmentId] = useState(user.department_id);
  const [designationId, setDesignationId] = useState(user.designation_id);
  const [managerId, setManagerId] = useState(
  user.manager_id || ""
);
  const [isActive, setIsActive] = useState(user.is_active);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<DepartmentManager[]>([]);
const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => toast.error("Failed to load departments."))
      .finally(() => setLoadingDepartments(false));
  }, []);

  useEffect(() => {
    if (!departmentId) {
      setDesignations([]);
      return;
    }

    setLoadingDesignations(true);

    getDesignations(departmentId)
      .then(setDesignations)
      .catch(() => {
        setDesignations([]);
        toast.error("Failed to load designations.");
      })
      .finally(() => setLoadingDesignations(false));
  }, [departmentId]);
  useEffect(() => {
  if (!departmentId) {
    setManagers([]);
    setManagerId("");
    return;
  }

  setLoadingManagers(true);

  getDepartmentManagers(departmentId)
    .then(setManagers)
    .catch(() => {
      setManagers([]);
      toast.error("Failed to load managers.");
    })
    .finally(() => setLoadingManagers(false));
}, [departmentId]);

  const handleSave = async () => {
    if (
  !name.trim() ||
  !departmentId ||
  !designationId ||
  (role === "employee" && !managerId)
) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);

      const updated = await updateUser(user.id, {
  name: name.trim(),
  role,
  department_id: departmentId,
  designation_id: designationId,
  manager_id: role === "employee" ? managerId : null,
  is_active: isActive,
});

      onUpdated(updated);
      toast.success("User updated successfully.");
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Edit User
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update this user's account details.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Full Name"
            value={name}
            onChange={setName}
          />

          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </Select>

          <Select
  label="Department"
  value={departmentId}
  disabled={loadingDepartments}
  onChange={(e) => {
    setDepartmentId(e.target.value);
    setDesignationId("");
    setManagerId("");
  }}
>
  <option value="">
    {loadingDepartments
      ? "Loading..."
      : "Select Department"}
  </option>

  {departments.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ))}
</Select>

<Select
  label="Manager"
  value={managerId}
  disabled={
    !departmentId ||
    loadingManagers ||
    role !== "employee"
  }
  onChange={(e) => setManagerId(e.target.value)}
>
  <option value="">
    {loadingManagers
      ? "Loading..."
      : role !== "employee"
      ? "Not applicable"
      : "Select Manager"}
  </option>

  {managers.map((manager) => (
    <option
      key={manager.id}
      value={manager.id}
    >
      {manager.name}
    </option>
  ))}
</Select>

<Select
  label="Designation"
  value={designationId}
  disabled={!departmentId || loadingDesignations}
  onChange={(e) => setDesignationId(e.target.value)}
>
  <option value="">
    {loadingDesignations
      ? "Loading..."
      : "Select Designation"}
  </option>

  {designations.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ))}
</Select>




        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Account Status
            </p>
            <p className="text-xs text-slate-500">
              {isActive ? "User can access the system." : "User is deactivated."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative h-6 w-11 rounded-full transition ${
              isActive ? "bg-teal-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                isActive ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60"
          >
            {saving && (
              <Loader2 size={17} className="animate-spin" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}