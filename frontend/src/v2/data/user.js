import { createContext, useContext } from "react";

/** Signed-in trainer ({ user, setUser }); provided by App. */
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);
