import { createContext, useContext } from "react";

export const ToastContext = createContext(() => {});
/** `toast(text, { tone: "error" })` from anywhere under ToastProvider. */
export const useToast = () => useContext(ToastContext);
