"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GlobalLoaderContextValue = {
  loading: boolean;
  setLoading: (next: boolean) => void;
  withLoading: <T,>(work: () => Promise<T> | T) => Promise<T>;
};

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | null>(null);

export function useGlobalLoader(): GlobalLoaderContextValue {
  const ctx = useContext(GlobalLoaderContext);
  if (!ctx) {
    throw new Error("useGlobalLoader must be used within a GlobalLoaderProvider");
  }
  return ctx;
}

export default function GlobalLoaderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(async <T,>(work: () => Promise<T> | T) => {
    setLoading(true);
    try {
      return await work();
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<GlobalLoaderContextValue>(
    () => ({ loading, setLoading, withLoading }),
    [loading, withLoading]
  );

  return (
    <GlobalLoaderContext.Provider value={value}>
      {children}
      {loading ? (
        <div
          aria-live="polite"
          aria-busy="true"
          className="fixed inset-0 z-[999998] flex items-center justify-center bg-background/60 backdrop-blur-sm"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : null}
    </GlobalLoaderContext.Provider>
  );
}
