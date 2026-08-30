import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface LayoutContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const LayoutContext =
  createContext<LayoutContextType | null>(null);

export function LayoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error(
      "useLayout must be used inside LayoutProvider"
    );
  }

  return context;
}