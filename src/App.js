// src/App.jsx
import React, { useEffect, useState, useContext, createContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { GoogleOAuthProvider } from "@react-oauth/google";

import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import { LoadingProvider, LoadingContext } from "./contexts/LoadingContext";
import { apiBaseUrl } from "./config";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import LogoutPage from "./pages/auth/LogoutPage";
import PasswordEmailPage from "./pages/auth/PasswordEmailPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";
import PasswordPage from "./pages/auth/PasswordPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";

import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemViewPage from "./pages/item/ItemViewPage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";

import EstablishmentCreatePage from "./pages/establishment/EstablishmentCreatePage";
import EstablishmentUpdatePage from "./pages/establishment/EstablishmentUpdatePage";
import EstablishmentMyPage from "./pages/establishment/EstablishmentMyPage";
import EstablishmentItemPage from "./pages/establishment/EstablishmentItemPage";
import EstablishmentHome from "./pages/establishment/EstablishmentHomePage";
import CatalogPage from "./pages/catalog/CatalogPage";

import "./index.css";

export const AuthContext = createContext(null);

function AppInner() {
  const { isLoading } = useContext(LoadingContext);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [establishments, setEstablishments] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setEmployer(null);
        setIsEmployer(false);
        setEstablishments([]);
        setInitialLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        setUser(data.user ?? null);
        setEmployer(data.employer ?? null);
        setIsEmployer(!!data.is_employer);
        setEstablishments(data.establishments ?? []);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setEmployer(null);
        setIsEmployer(false);
        setEstablishments([]);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    loadAuth();
    const onAuthChanged = () => loadAuth();
    window.addEventListener("authChanged", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("authChanged", onAuthChanged);
    };
  }, []);

  if (initialLoading) {
    return <ProcessingIndicatorComponent interval={1000} gifSrc="/images/logo.gif" />;
  }

  const protectedRoute = (element) =>
    user ? (
      user.email_verified_at ? element : <Navigate to="/email-verify" replace />
    ) : (
      <Navigate to="/login" replace />
    );

  const emailVerifiedRoute = (element) =>
    user ? (
      !user.email_verified_at ? element : <Navigate to="/establishment/my" replace />
    ) : (
      <Navigate to="/login" replace />
    );

  const restrictedRoute = (element) =>
    user ? <Navigate to="/establishment/my" replace /> : element;

  return (
    <AuthContext.Provider value={{ user, setUser, employer, isEmployer, establishments }}>
      {isLoading && (
        <ProcessingIndicatorComponent interval={1000} gifSrc="/images/logo.gif" />
      )}

      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
          <Route path="/login" element={restrictedRoute(<LoginPage />)} />
          <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
          <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
          <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
          <Route path="/password" element={protectedRoute(<PasswordPage />)} />
          <Route path="/logout" element={<LogoutPage />} />

          <Route path="/catalogo/:slug" element={<CatalogPage />} />
          <Route path="/establishment/view/:slug" element={<CatalogPage />} />
          <Route path="/establishments" element={<EstablishmentHome />} />
          <Route path="/item/view/:slug" element={<ItemViewPage />} />
          <Route path="/item/:slug" element={<ItemViewPage />} />

          <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />
          <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
          <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />
          <Route path="/establishment/my" element={protectedRoute(<EstablishmentMyPage />)} />
          <Route path="/establishment/item/:slug" element={protectedRoute(<EstablishmentItemPage />)} />
          <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
          <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />

          <Route path="/dashboard" element={<Navigate to="/establishment/my" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <LoadingProvider>
      <GoogleOAuthProvider
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        locale="pt-BR"
      >
        <AppInner />
      </GoogleOAuthProvider>
    </LoadingProvider>
  );
}
