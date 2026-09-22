"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";

type ToastVariant = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ToastInput = Omit<ToastItem, "id">;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const TOAST_STYLES: Record<
  ToastVariant,
  { shell: string; icon: string; iconWrap: string }
> = {
  success: {
    shell: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    icon: "fa-solid fa-circle-check text-emerald-600",
    iconWrap: "bg-emerald-100",
  },
  error: {
    shell: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-red-50",
    icon: "fa-solid fa-circle-xmark text-rose-600",
    iconWrap: "bg-rose-100",
  },
  warning: {
    shell: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    icon: "fa-solid fa-triangle-exclamation text-amber-600",
    iconWrap: "bg-amber-100",
  },
  info: {
    shell: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50",
    icon: "fa-solid fa-circle-info text-sky-600",
    iconWrap: "bg-sky-100",
  },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const nextToastId = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = `toast-${nextToastId.current++}`;
    setToasts((current) => [...current, { id, ...toast }]);
    window.setTimeout(() => removeToast(id), 3600);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isMounted
        ? createPortal(
            <div className="pointer-events-none fixed right-4 top-24 z-[140] flex max-h-[calc(100vh-7rem)] w-[min(360px,calc(100vw-2rem))] flex-col-reverse gap-3 overflow-y-auto pr-1 sm:top-28">
              {toasts.map((toast) => {
                const style = TOAST_STYLES[toast.variant];
                return (
                  <div
                    key={toast.id}
                    className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-[0_16px_45px_rgba(15,23,42,0.16)] backdrop-blur ${style.shell}`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
                        <i className={`${style.icon} text-lg`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-900">{toast.title}</p>
                        {toast.message ? (
                          <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{toast.message}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeToast(toast.id)}
                        className="rounded-full p-1 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}
