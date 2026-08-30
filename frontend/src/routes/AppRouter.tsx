import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import ReportsPage from "../pages/Reports/ReportsPage";
import MyProfilePage from "../pages/Profile/MyProfilePage";

import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import CompanyRegisterPage from "../pages/CompanyRegister/CompanyRegisterPage";
import ActivateAccountPage from "../pages/Activation/ActivateAccountPage";
import Notifications from "../pages/Notifications";

import UsersPage from "../pages/Users/UsersPage";
import InviteUserPage from "../pages/Users/InviteUserPage";

import OrganizationPage from "../pages/Settings/Organization/OrganizationPage";

import MessagesPage from "../components/Messages/MessagesPage";
import ChatPage from "../pages/Chat/ChatPage";

import DocumentsPage from "../pages/documents/DocumentsPage";
import ForgotPasswordPage from "../pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPassword/ResetPasswordPage";
import ChangePasswordPage from "../pages/Profile/ChangePasswordPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC
        ===================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />
         <Route
  path="/forgot-password"
  element={<ForgotPasswordPage />}
/>

<Route
  path="/reset-password"
  element={<ResetPasswordPage />}
/>
<Route
  path="/notifications"
  element={<Notifications />}
/>
        <Route
          path="/company-register"
          element={<CompanyRegisterPage />}
        />

        <Route
          path="/activate-account"
          element={<ActivateAccountPage />}
        />

        <Route
          path="/test"
          element={
            <h1>
              Test Route Working
            </h1>
          }
        />

        {/* =====================================================
            DASHBOARD
            ALL ROLES
        ===================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            USERS
            ADMIN + MANAGER
        ===================================================== */}

        <Route
          path="/users"
          element={
            <ProtectedRoute
              roles={[
                "admin",
                "manager",
              ]}
            >
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <AppLayout>
        <MyProfilePage />
      </AppLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/change-password"
  element={
    <ProtectedRoute>
      <AppLayout>
        <ChangePasswordPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>

        {/* =====================================================
            INVITE USER
            ADMIN ONLY
        ===================================================== */}

        <Route
          path="/invite-user"
          element={
            <ProtectedRoute
              roles={["admin","manager"]}
            >
              <InviteUserPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            ORGANIZATION
            ADMIN ONLY
        ===================================================== */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute
              roles={["admin"]}
            >
              <Navigate
                to="/settings/organization"
                replace
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings/organization"
          element={
            <ProtectedRoute
              roles={["admin"]}
            >
              <AppLayout>
                <OrganizationPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            MESSAGES
            ALL ROLES
        ===================================================== */}

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MessagesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            AI CHAT
            ADMIN + MANAGER
        ===================================================== */}

        <Route
          path="/chat"
          element={
            <ProtectedRoute
              roles={[
                "admin",
                "manager",
                "employee",
              ]}
            >
              <AppLayout>
                <ChatPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            DOCUMENTS
            ALL ROLES
        ===================================================== */}

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DocumentsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================
    REPORTS
    ADMIN + MANAGER
===================================================== */}

<Route
  path="/reports"
  element={
    <ProtectedRoute
      roles={[
        "admin",
        "manager",
      ]}
    >
      <AppLayout>
        <ReportsPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}