import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import type { ReactNode } from "react";
import api from "../api/api";

import {
  getCurrentUser,
  type User,
} from "../api/user";

interface AuthContextType {
  token: string | null;
  user: User | null;
  setUser: (user: User | null) => void;

  login: (token: string) => void;
  logout: () => void;

  isAuthenticated: boolean;
}

const AuthContext =
  createContext<AuthContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: Props) {
  const [token, setToken] =
    useState<string | null>(
      localStorage.getItem(
        "access_token"
      )
    );

  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!token) return;

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        console.error(
          "Failed to load user:",
          error
        );

        logout();
      }
    }

    loadUser();
  }, [token]);

  function login(token: string) {
    localStorage.setItem(
      "access_token",
      token
    );

    setToken(token);
  }

 async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error(
      "Logout failed:",
      error
    );
  }

  localStorage.removeItem(
    "access_token"
  );

  setToken(null);
  setUser(null);
}
  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        setUser,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}