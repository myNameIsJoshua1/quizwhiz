import { useState, useEffect, createContext, useContext } from "react";

const TOAST_TIMEOUT = 5000;

const ToastContext = createContext({
  toasts: [],
  addToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = ({ title, description, action, ...props }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, title, description, action, ...props },
    ]);

    return id;
  };

  const dismissToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const timeouts = toasts.map((toast) => {
      if (toast.duration !== Infinity) {
        return setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration || TOAST_TIMEOUT);
      }
      return undefined;
    });

    return () => {
      timeouts.forEach((timeout) => timeout && clearTimeout(timeout));
    };
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
} 