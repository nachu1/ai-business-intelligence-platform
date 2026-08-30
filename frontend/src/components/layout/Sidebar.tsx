import {
  LayoutDashboard,
  Users,
  FileText,
  MessageCircle,
  MessageSquare,
  BarChart3,
  Building2,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useLayout } from "../../context/LayoutContext";
import { useUser } from "../../context/UserContext";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: ["admin", "manager", "employee"],
  },
  {
    title: "Users",
    icon: Users,
    path: "/users",
    roles: ["admin", "manager"],
  },
  {
    title: "Documents",
    icon: FileText,
    path: "/documents",
    roles: ["admin", "manager", "employee"],
  },
  {
    title: "Chat",
    icon: MessageCircle,
    path: "/messages",
    roles: ["admin", "manager", "employee"],
  },
  {
    title: "AI Chat",
    icon: MessageSquare,
    path: "/chat",
    roles: ["admin", "manager","employee"],
  },
  {
    title: "Reports",
    icon: BarChart3,
    path: "/reports",
    roles: ["admin", "manager"],
  },
  {
    title: "Organization",
    icon: Building2,
    path: "/settings",
    roles: ["admin"],
  },
];

function Sidebar() {
  const { sidebarOpen } = useLayout();
  const { user } = useUser();

  const visibleItems = menuItems.filter(
    (item) =>
      user && item.roles.includes(user.role)
  );

  return (
  <aside
  className={`
    h-screen
    shrink-0
    overflow-hidden
    border-r
    border-slate-800
    bg-slate-950
    transition-[width]
    duration-150
    ease-out
    ${
      sidebarOpen
        ? "w-72"
        : "w-0 border-r-0"
    }
  `}
>
  <div className="flex h-full w-72 flex-col">

        {/* LOGO */}

        <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-6">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500">
            <Building2 className="h-7 w-7 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-black text-white">
              BizInsight
            </h1>

           
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 space-y-2 px-4 py-6">

          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  px-4
                  py-3
                  text-base
                  font-semibold
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }
                `}
              >
                <Icon size={22} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}

        </nav>

      </div>
    </aside>
  );
}

export default Sidebar;