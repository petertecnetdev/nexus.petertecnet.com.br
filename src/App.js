// src/App.jsx
import React, { useEffect, useState, useContext, createContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import { LoadingProvider, LoadingContext } from "./contexts/LoadingContext";
import { appId } from "./config";
import api from "./services/api";

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
import CatalogPage from "./pages/catalog/CatalogPage";

import "./index.css";
import "./styles/readability.css";

export const AuthContext = createContext(null);

function CatalogRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/catalog/${encodeURIComponent(slug || "")}`} replace />;
}

function AppInner() {
  const { isLoading } = useContext(LoadingContext);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [establishments, setEstablishments] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resetAuth = () => {
      setUser(null);
      setEmployer(null);
      setIsEmployer(false);
      setEstablishments([]);
    };

    const applySession = (data) => {
      if (!data?.user) {
        resetAuth();
        return false;
      }

      setUser(data.user);
      setEmployer(data.employer ?? null);
      setIsEmployer(!!data.is_employer);
      setEstablishments(Array.isArray(data.establishments) ? data.establishments : []);
      return true;
    };

    const loadAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) {
          resetAuth();
          setInitialLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get("/account/context", {
          params: { app_id: appId },
        });
        if (!cancelled) applySession(data);
      } catch {
        localStorage.removeItem("token");
        if (!cancelled) resetAuth();
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    const onAuthChanged = (event) => {
      if (cancelled) return;

      if (event?.detail?.user) {
        applySession(event.detail);
        setInitialLoading(false);
        return;
      }

      loadAuth();
    };

    loadAuth();
    window.addEventListener("authChanged", onAuthChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("authChanged", onAuthChanged);
    };
  }, []);

  if (initialLoading || isLoading) {
    return <ProcessingIndicatorComponent />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        employer,
        setEmployer,
        isEmployer,
        setIsEmployer,
        establishments,
        setEstablishments,
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-verify" element={<EmailVerifyPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/password/email" element={<PasswordEmailPage />} />
        <Route path="/password/reset/:token" element={<PasswordResetPage />} />
        <Route path="/password" element={<PasswordPage />} />
        <Route path="/user/update" element={<UserUpdatePage />} />

        <Route path="/item/create/:establishmentId?" element={<ItemCreatePage />} />
        <Route path="/item/view/:slug" element={<ItemViewPage />} />
        <Route path="/item/update/:id" element={<ItemUpdatePage />} />

        <Route path="/establishment/create" element={<EstablishmentCreatePage />} />
        <Route path="/establishment/update/:id" element={<EstablishmentUpdatePage />} />
        <Route path="/establishment/my" element={<EstablishmentMyPage />} />
        <Route path="/establishment/:id/items" element={<EstablishmentItemPage />} />

        <Route path="/catalog/:slug" element={<CatalogPage />} />
        <Route path="/establishment/catalog/:slug" element={<CatalogRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}>
      <Router>
        <LoadingProvider>
          <AppInner />
        </LoadingProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}
