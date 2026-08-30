import { useEffect, useRef, useState } from "react";
import { FileText, Search, User, Building2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getUsers, type User as UserType } from "../../api/user";
import {
  getDocuments,
  type DocumentItem,
} from "../../api/document";
import {
  getDepartments,
  type Department,
} from "../../api/company";

type SearchResults = {
  users: UserType[];
  documents: DocumentItem[];
  departments: Department[];
};

function GlobalSearch() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    users: [],
    documents: [],
    departments: [],
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults({
        users: [],
        documents: [],
        departments: [],
      });
      setLoading(false);
      setOpen(false);
      return;
    }

    setOpen(true);

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const [users, documents, departments] =
          await Promise.all([
            getUsers({
              search: query.trim(),
              page: 1,
              limit: 5,
            }),
            getDocuments({
              search: query.trim(),
              sort: "newest",
            }),
            getDepartments(),
          ]);

        const departmentResults = departments
          .filter((department) =>
            department.name
              .toLowerCase()
              .includes(query.trim().toLowerCase())
          )
          .slice(0, 5);

        setResults({
          users: users.slice(0, 5),
          documents: documents.slice(0, 5),
          departments: departmentResults,
        });
      } catch (error) {
        console.error(
          "Global search failed:",
          error
        );

        setResults({
          users: [],
          documents: [],
          departments: [],
        });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const hasResults =
    results.users.length > 0 ||
    results.documents.length > 0 ||
    results.departments.length > 0;

  function closeSearch() {
    setOpen(false);
  }

  function openUsers() {
    closeSearch();
    navigate("/users");
  }

  function openDocuments() {
    closeSearch();
    navigate("/documents");
  }

  function openDepartments() {
    closeSearch();
    navigate("/settings/organization");
  }

  return (
    <div
      ref={searchRef}
      className="relative hidden lg:block"
    >
      <Search
        size={18}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        value={query}
        onChange={(event) =>
          setQuery(event.target.value)
        }
        onFocus={() => {
          if (query.trim()) {
            setOpen(true);
          }
        }}
        placeholder="Search..."
        className="
          w-72
          rounded-2xl
          border
          border-slate-200
          bg-slate-50
          py-3
          pl-11
          pr-4
          text-sm
          text-slate-800
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-teal-500
          focus:bg-white
          focus:ring-4
          focus:ring-teal-500/10
        "
      />

      {open && (
        <div className="absolute right-0 top-full z-[200] mt-3 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="px-5 py-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-200" />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                No results found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try another name, document, or department.
              </p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {/* USERS */}

              {results.users.length > 0 && (
                <SearchSection
                  title="Users"
                  icon={User}
                  onViewAll={openUsers}
                >
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={openUsers}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <User className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </SearchSection>
              )}

              {/* DOCUMENTS */}

              {results.documents.length > 0 && (
                <SearchSection
                  title="Documents"
                  icon={FileText}
                  onViewAll={openDocuments}
                >
                  {results.documents.map(
                    (document) => (
                      <button
                        key={document.id}
                        onClick={openDocuments}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {
                              document.original_filename
                            }
                          </p>

                          <p className="mt-0.5 text-xs capitalize text-slate-400">
                            {document.document_type} ·{" "}
                            {document.status}
                          </p>
                        </div>
                      </button>
                    )
                  )}
                </SearchSection>
              )}

              {/* DEPARTMENTS */}

              {results.departments.length > 0 && (
                <SearchSection
                  title="Departments"
                  icon={Building2}
                  onViewAll={openDepartments}
                >
                  {results.departments.map(
                    (department) => (
                      <button
                        key={department.id}
                        onClick={openDepartments}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Building2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {department.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            Department
                          </p>
                        </div>
                      </button>
                    )
                  )}
                </SearchSection>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  icon: Icon,
  onViewAll,
  children,
}: {
  title: string;
  icon: typeof User;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            {title}
          </span>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-bold text-teal-600 transition hover:text-teal-700"
        >
          View all
        </button>
      </div>

      {children}
    </div>
  );
}

export default GlobalSearch;