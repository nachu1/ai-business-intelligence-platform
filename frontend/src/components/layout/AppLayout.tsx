import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface Props {
  children: ReactNode;
}

function AppLayout({ children }: Props) {
  const { pathname } = useLocation();
  const isChatPage = pathname === "/chat";
  const isProfilePage = pathname === "/profile";
  const isChangePasswordPage = pathname === "/change-password";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />

        <main
          className={`flex-1 min-h-0 bg-slate-100 ${
            isChatPage ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
  className={
    isChatPage || isProfilePage || isChangePasswordPage
      ? "h-full"
      : "mx-auto max-w-[1700px] p-6 lg:p-8"
  }
>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}



export default AppLayout;