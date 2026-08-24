// src/pages/auth/LogoutPage.jsx
import React, { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Erro ao limpar o localStorage:", error);
    } finally {
      window.location.replace("/login");
    }
  }, []);

  return null;
}
