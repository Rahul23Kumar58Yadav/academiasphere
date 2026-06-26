// src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>.\n" +
      "Make sure your app is wrapped with <AuthProvider> in main.jsx"
    );
  }

  return context;
}

export default useAuth;