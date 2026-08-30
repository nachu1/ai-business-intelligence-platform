import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  BriefcaseBusiness,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  getDesignations,
  createDesignation,
  deleteDesignation,
  type Department,
  type Designation,
} from "../../../api/company";

interface DepartmentWithDesignations extends Department {
  designations: Designation[];
  loadingDesignations: boolean;
}

type DeleteTarget =
  | {
      type: "department";
      department: DepartmentWithDesignations;
    }
  | {
      type: "designation";
      departmentId: string;
      departmentName: string;
      designation: Designation;
    }
  | null;

function OrganizationPage() {
  const [departments, setDepartments] = useState<
    DepartmentWithDesignations[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [departmentModalOpen, setDepartmentModalOpen] =
    useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] =
    useState<string | null>(null);

  const [designationModalOpen, setDesignationModalOpen] =
    useState(false);
  const [designationName, setDesignationName] = useState("");
  const [savingDesignation, setSavingDesignation] = useState(false);
  const [deletingDesignationId, setDeletingDesignationId] =
    useState<string | null>(null);

  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentWithDesignations | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  // =========================================================
  // LOAD DEPARTMENTS
  // =========================================================

  const loadDepartments = async () => {
    try {
      setLoading(true);

      const data = await getDepartments();

      const items = data.map((department) => ({
        ...department,
        designations: [],
        loadingDesignations: true,
      }));

      setDepartments(items);

      await Promise.all(
        items.map(async (department) => {
          try {
            const designations = await getDesignations(
              department.id
            );

            setDepartments((current) =>
              current.map((item) =>
                item.id === department.id
                  ? {
                      ...item,
                      designations,
                      loadingDesignations: false,
                    }
                  : item
              )
            );
          } catch (error) {
            console.error(error);

            setDepartments((current) =>
              current.map((item) =>
                item.id === department.id
                  ? {
                      ...item,
                      loadingDesignations: false,
                    }
                  : item
              )
            );
          }
        })
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // =========================================================
  // CREATE DEPARTMENT
  // =========================================================

  const handleCreateDepartment = async () => {
    const name = departmentName.trim();

    if (!name) {
      toast.error("Please enter a department name.");
      return;
    }

    try {
      setSavingDepartment(true);

      const newDepartment = await createDepartment(name);

      setDepartments((current) => [
        ...current,
        {
          ...newDepartment,
          designations: [],
          loadingDesignations: false,
        },
      ]);

      setDepartmentName("");
      setDepartmentModalOpen(false);

      toast.success("Department created successfully.");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to create department."
      );
    } finally {
      setSavingDepartment(false);
    }
  };

  // =========================================================
  // CREATE DESIGNATION
  // =========================================================

  const openDesignationModal = (
    department: DepartmentWithDesignations
  ) => {
    setSelectedDepartment(department);
    setDesignationName("");
    setDesignationModalOpen(true);
  };

  const handleCreateDesignation = async () => {
    const name = designationName.trim();

    if (!name) {
      toast.error("Please enter a designation name.");
      return;
    }

    if (!selectedDepartment) return;

    try {
      setSavingDesignation(true);

      const newDesignation = await createDesignation(
        selectedDepartment.id,
        name
      );

      setDepartments((current) =>
        current.map((department) =>
          department.id === selectedDepartment.id
            ? {
                ...department,
                designations: [
                  ...department.designations,
                  newDesignation,
                ],
              }
            : department
        )
      );

      setDesignationName("");
      setDesignationModalOpen(false);
      setSelectedDepartment(null);

      toast.success("Designation created successfully.");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to create designation."
      );
    } finally {
      setSavingDesignation(false);
    }
  };

  // =========================================================
  // DELETE REQUESTS
  // =========================================================

  const requestDeleteDepartment = (
    department: DepartmentWithDesignations
  ) => {
    setDeleteError(null);

    setDeleteTarget({
      type: "department",
      department,
    });
  };

  const requestDeleteDesignation = (
    department: DepartmentWithDesignations,
    designation: Designation
  ) => {
    setDeleteError(null);

    setDeleteTarget({
      type: "designation",
      departmentId: department.id,
      departmentName: department.name,
      designation,
    });
  };

  // =========================================================
  // DELETE DEPARTMENT
  // =========================================================

  const handleDeleteDepartment = async (
    department: DepartmentWithDesignations
  ) => {
    try {
      setDeletingDepartmentId(department.id);

      await deleteDepartment(department.id);

      setDepartments((current) =>
        current.filter(
          (item) => item.id !== department.id
        )
      );

      setDeleteTarget(null);

      toast.success("Department deleted successfully.");
    } catch (error: any) {
      console.error(error);

      // Close confirmation modal
      setDeleteTarget(null);

      // Show only error card
      setDeleteError(
        error.response?.data?.detail ||
          "This department cannot be deleted."
      );
    } finally {
      setDeletingDepartmentId(null);
    }
  };

  // =========================================================
  // DELETE DESIGNATION
  // =========================================================

  const handleDeleteDesignation = async (
    departmentId: string,
    designation: Designation
  ) => {
    try {
      setDeletingDesignationId(designation.id);

      await deleteDesignation(designation.id);

      setDepartments((current) =>
        current.map((department) =>
          department.id === departmentId
            ? {
                ...department,
                designations:
                  department.designations.filter(
                    (item) =>
                      item.id !== designation.id
                  ),
              }
            : department
        )
      );

      setDeleteTarget(null);

      toast.success("Designation deleted successfully.");
    } catch (error: any) {
      console.error(error);

      // Close confirmation modal
      setDeleteTarget(null);

      // Show only error card
      setDeleteError(
        error.response?.data?.detail ||
          "This designation cannot be deleted."
      );
    } finally {
      setDeletingDesignationId(null);
    }
  };

  // =========================================================
  // CONFIRM DELETE
  // =========================================================

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "department") {
      await handleDeleteDepartment(
        deleteTarget.department
      );
    } else {
      await handleDeleteDesignation(
        deleteTarget.departmentId,
        deleteTarget.designation
      );
    }
  };

  // =========================================================
  // CLOSE DELETE MODAL
  // =========================================================

  const closeDeleteModal = () => {
    if (
      deletingDepartmentId ||
      deletingDesignationId
    ) {
      return;
    }

    setDeleteTarget(null);
    setDeleteError(null);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full w-full space-y-6 pb-10 sm:space-y-8">

      {/* HEADER */}

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 shadow-sm sm:rounded-3xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-300/30 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-teal-300/30 blur-3xl" />

        <div className="relative px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg sm:h-16 sm:w-16">
                <Building2 size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                  Organization
                </h1>

                <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
                  Manage your company's departments and designations.
                </p>
              </div>
            </div>

            {departments.length > 0 && (
              <button
                onClick={() =>
                  setDepartmentModalOpen(true)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg sm:w-auto"
              >
                <Plus size={19} />
                Add Department
              </button>
            )}
          </div>
        </div>
      </section>

      {/* CONTENT */}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-teal-500"
          />

          <p className="mt-5 font-semibold text-slate-600">
            Loading organization...
          </p>
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-cyan-50/40 px-5 py-16 text-center sm:rounded-3xl sm:px-6 sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
            <Building2 size={30} />
          </div>

          <h2 className="mt-6 text-xl font-black text-slate-900 sm:text-2xl">
            No departments yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Create your first department to start organizing your company.
          </p>

          <button
            onClick={() =>
              setDepartmentModalOpen(true)
            }
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white"
          >
            <Plus size={19} />
            Add Department
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {departments.map((department) => (
            <div
              key={department.id}
              className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl"
            >

              {/* DEPARTMENT HEADER */}

              <div className="bg-gradient-to-r from-slate-50 via-white to-cyan-50/60 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">

                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 sm:h-14 sm:w-14">
                      <Building2 size={23} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-black text-slate-900 sm:text-xl">
                        {department.name}
                      </h2>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <p className="text-sm font-semibold text-emerald-600">
                          Active
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      requestDeleteDepartment(
                        department
                      )
                    }
                    disabled={
                      deletingDepartmentId ===
                      department.id
                    }
                    title="Delete department"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                  >
                    {deletingDepartmentId ===
                    department.id ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* DESIGNATIONS */}

              <div className="border-t border-slate-200 p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                      <BriefcaseBusiness size={17} />
                    </div>

                    <h3 className="text-base font-black text-slate-800">
                      Designations
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      openDesignationModal(
                        department
                      )
                    }
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-2.5 text-sm font-bold text-teal-700 transition hover:border-teal-200 hover:bg-teal-100 sm:w-auto"
                  >
                    <Plus size={16} />
                    Add Designation
                  </button>
                </div>

                {department.loadingDesignations ? (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-500">
                    <Loader2
                      size={18}
                      className="animate-spin text-teal-500"
                    />
                    Loading designations...
                  </div>
                ) : department.designations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No designations added yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Add a designation to this department.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {department.designations.map(
                      (designation) => (
                        <div
                          key={designation.id}
                          className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400" />

                            <span className="min-w-0 break-words text-sm font-semibold text-slate-700 sm:text-base">
                              {designation.name}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              requestDeleteDesignation(
                                department,
                                designation
                              )
                            }
                            disabled={
                              deletingDesignationId ===
                              designation.id
                            }
                            title="Delete designation"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingDesignationId ===
                            designation.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ADD DEPARTMENT MODAL */}

      {departmentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-7">

            <ModalHeader
              icon={<Building2 size={21} />}
              title="Add Department"
              description="Create a new department for your organization."
              onClose={() => {
                if (!savingDepartment) {
                  setDepartmentName("");
                  setDepartmentModalOpen(false);
                }
              }}
            />

            <InputField
              label="Department Name"
              value={departmentName}
              placeholder="e.g. Research & Development"
              disabled={savingDepartment}
              onChange={setDepartmentName}
              onEnter={handleCreateDepartment}
            />

            <ModalActions
              onCancel={() =>
                setDepartmentModalOpen(false)
              }
              onConfirm={handleCreateDepartment}
              loading={savingDepartment}
              text="Create Department"
            />
          </div>
        </div>
      )}

      {/* ADD DESIGNATION MODAL */}

      {designationModalOpen &&
        selectedDepartment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-7">

              <ModalHeader
                icon={
                  <BriefcaseBusiness size={21} />
                }
                title="Add Designation"
                description={
                  <>
                    Add a designation under{" "}
                    <span className="font-bold text-teal-600">
                      {selectedDepartment.name}
                    </span>
                    .
                  </>
                }
                onClose={() => {
                  if (!savingDesignation) {
                    setDesignationName("");
                    setDesignationModalOpen(false);
                    setSelectedDepartment(null);
                  }
                }}
              />

              <InputField
                label="Designation Name"
                value={designationName}
                placeholder="e.g. Senior Software Engineer"
                disabled={savingDesignation}
                onChange={setDesignationName}
                onEnter={handleCreateDesignation}
              />

              <ModalActions
                onCancel={() => {
                  setDesignationModalOpen(false);
                  setSelectedDepartment(null);
                }}
                onConfirm={handleCreateDesignation}
                loading={savingDesignation}
                text="Add Designation"
              />
            </div>
          </div>
        )}

      {/* NORMAL DELETE CONFIRMATION */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">

            <div className="border-b border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50 px-6 py-6 sm:px-7 sm:py-7">
              <div className="flex items-start justify-between gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <ShieldAlert size={25} />
                </div>

                <button
                  onClick={closeDeleteModal}
                  disabled={
                    !!deletingDepartmentId ||
                    !!deletingDesignationId
                  }
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900 sm:text-2xl">
                {deleteTarget.type === "department"
                  ? "Delete department?"
                  : "Delete designation?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                You are about to remove{" "}
                <span className="font-bold text-slate-900">
                  "
                  {deleteTarget.type === "department"
                    ? deleteTarget.department.name
                    : deleteTarget.designation.name}
                  "
                </span>{" "}
                from your organization.
              </p>
            </div>

            <div className="px-6 py-6 sm:px-7">
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={19}
                />

                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Please confirm this action
                  </p>

                  <p className="mt-1 text-sm leading-5 text-amber-700">
                    {deleteTarget.type === "department"
                      ? "The department will be removed from the active organization list."
                      : "The designation will be removed from the organization."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  onClick={closeDeleteModal}
                  disabled={
                    !!deletingDepartmentId ||
                    !!deletingDesignationId
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={
                    !!deletingDepartmentId ||
                    !!deletingDesignationId
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {deletingDepartmentId ||
                  deletingDesignationId ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANNOT DELETE ERROR MODAL */}

      {deleteError && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">

            <div className="px-6 py-7 sm:px-7 sm:py-8">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle size={27} />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900 sm:text-2xl">
                Cannot delete
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                {deleteError}
              </p>

              <div className="mt-7 flex justify-end">
                <button
                  onClick={() => setDeleteError(null)}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  OK
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// REUSABLE MODAL HEADER
// =========================================================

function ModalHeader({
  icon,
  title,
  description,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
          {icon}
        </div>

        <h2 className="text-xl font-black text-slate-900">
          {title}
        </h2>

        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <button
        onClick={onClose}
        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={21} />
      </button>
    </div>
  );
}

// =========================================================
// INPUT
// =========================================================

function InputField({
  label,
  value,
  placeholder,
  disabled,
  onChange,
  onEnter,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
}) {
  return (
    <div className="mt-7">
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus
        onChange={(event) =>
          onChange(event.target.value)
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onEnter();
          }
        }}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
      />
    </div>
  );
}

// =========================================================
// MODAL ACTIONS
// =========================================================

function ModalActions({
  onCancel,
  onConfirm,
  loading,
  text,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  text: string;
}) {
  return (
    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

      <button
        onClick={onCancel}
        disabled={loading}
        className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
      >
        Cancel
      </button>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60 sm:w-auto"
      >
        {loading && (
          <Loader2
            size={17}
            className="animate-spin"
          />
        )}

        {loading ? "Saving..." : text}
      </button>

    </div>
  );
}

export default OrganizationPage;