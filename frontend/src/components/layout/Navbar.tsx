import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Menu,
  User,
  KeyRound,
  LogOut,
} from "lucide-react";

import { useLayout } from "../../context/LayoutContext";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";
import GlobalSearch from "../search/GlobalSearch";

function Navbar() {
  const { toggleSidebar } = useLayout();
  const { user } = useUser();
  const navigate = useNavigate();

  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
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

  const initials =
    user?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="relative z-50 flex h-20 items-center justify-between border-b border-slate-200 bg-slate-100 px-6 lg:px-8">

      {/* Left */}

      <button
        onClick={toggleSidebar}
        className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
      >
        <Menu size={24} />
      </button>


      {/* Right */}

      <div className="flex items-center gap-5">

        {/* Search */}

        <GlobalSearch/>


        {/* Notification */}

        <NotificationBell />


        {/* Profile */}

        <div
          ref={dropdownRef}
          className="relative"
        >

          <button
            onClick={() =>
              setOpen(!open)
            }
            className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100"
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 font-bold text-white">
              {initials}
            </div>

            <ChevronDown
              size={18}
              className={`transition ${
                open ? "rotate-180" : ""
              }`}
            />

          </button>


          {open && (

            <div className="absolute right-0 z-[100] mt-3 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl">

              {/* Header */}

              <div className="border-b p-6 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-xl font-bold text-white">
                  {initials}
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {user?.name}
                </h3>

                <p className="text-sm text-slate-500">
                  {user?.role === "admin"
                    ? "Administrator"
                    : user?.role === "manager"
                    ? "Manager"
                    : "Employee"}
                </p>

                <p className="mt-2 text-sm font-medium text-teal-600">
                  {user?.company.name}
                </p>

              </div>


              {/* Menu */}

              <div className="p-2">

                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-slate-100"
                >
                  <User size={18} />
                  My Profile
                </button>


                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/change-password");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-slate-100"
                >
                  <KeyRound size={18} />
                  Change Password
                </button>


                <hr className="my-2" />


                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-500 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}

export default Navbar;

    