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

import InvitePage from "./pages/auth/InvitePage";
import InviteCompletePage from "./pages/auth/InviteCompletePage";

import DashboardPage from "./pages/DashboardPage";

import OrderCreatePage from "./pages/order/OrderCreatePage";
import OrderListPage from "./pages/order/OrderListPage";
import OrderEditPage from "./pages/order/OrderEditPage";
import OrderListClientPage from "./pages/order/OrderListClientPage";

import UserViewPage from "./pages/user/UserViewPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";

import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemViewPage from "./pages/item/ItemViewPage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";
import ItemServiceHomePage from "./pages/item/ItemServiceHomePage";
import ItemProductHomePage from "./pages/item/ItemProductHomePage";

import EmployerListPage from "./pages/employer/EmployerListPage";
import EmployerCreatePage from "./pages/employer/EmployerCreatePage";
import EmployerUpdatePage from "./pages/employer/EmployerUpdatePage";
import EmployerViewPage from "./pages/employer/EmployerViewPage";
import EmployerMePage from "./pages/employer/EmployerMePage";
import EmployerSchedulesPage from "./pages/employer/EmployerSchedulesPage";
import EmployerOrdersPage from "./pages/employer/EmployerOrdersPage";
import EmployerHome from "./pages/employer/EmployerHomePage";

import EstablishmentCreatePage from "./pages/establishment/EstablishmentCreatePage";
import EstablishmentViewPage from "./pages/establishment/EstablishmentViewPage";
import EstablishmentUpdatePage from "./pages/establishment/EstablishmentUpdatePage";
import EstablishmentOrderPage from "./pages/establishment/EstablishmentOrderPage";
import EstablishmentMyPage from "./pages/establishment/EstablishmentMyPage";
import EstablishmentEmployersPage from "./pages/establishment/EstablishmentEmployersPage";
import EstablishmentItemPage from "./pages/establishment/EstablishmentItemPage";
import EstablishmentHome from "./pages/establishment/EstablishmentHomePage";

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
    return (
      <ProcessingIndicatorComponent interval={1000} gifSrc="/images/logo.gif" />
    );
  }

  const protectedRoute = (el) =>
    user ? (
      user.email_verified_at ? (
        el
      ) : (
        <Navigate to="/email-verify" replace />
      )
    ) : (
      <Navigate to="/login" replace />
    );

  const emailVerifiedRoute = (el) =>
    user ? (
      !user.email_verified_at ? (
        el
      ) : (
        <Navigate to="/" replace />
      )
    ) : (
      <Navigate to="/login" replace />
    );

  const restrictedRoute = (el) => (user ? <Navigate to="/" replace /> : el);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        employer,
        isEmployer,
        establishments,
      }}
    >
      <>
        {isLoading && (
          <ProcessingIndicatorComponent
            interval={1000}
            gifSrc="/images/logo.gif"
          />
        )}

        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route
              path="/establishment/view/:slug"
              element={<EstablishmentViewPage />}
            />
            <Route
              path="/employer/view/:user_name"
              element={<EmployerViewPage />}
            />

            <Route
              path="/register"
              element={restrictedRoute(<RegisterPage />)}
            />
            <Route path="/login" element={restrictedRoute(<LoginPage />)} />
            <Route
              path="/password-email"
              element={restrictedRoute(<PasswordEmailPage />)}
            />
            <Route
              path="/password-reset"
              element={restrictedRoute(<PasswordResetPage />)}
            />
            <Route
              path="/email-verify"
              element={emailVerifiedRoute(<EmailVerifyPage />)}
            />
            <Route
              path="/password"
              element={protectedRoute(<PasswordPage />)}
            />
            <Route path="/logout" element={<LogoutPage />} />

            <Route path="/invite" element={<InvitePage />} />
            <Route path="/invite-complete" element={<InviteCompletePage />} />

            <Route
              path="/dashboard"
              element={protectedRoute(<DashboardPage />)}
            />

            <Route
              path="/order/list/:slug"
              element={protectedRoute(<OrderListPage />)}
            />
            <Route
              path="/order/create/:slug"
              element={protectedRoute(<OrderCreatePage />)}
            />
            <Route
              path="/order/edit/:entityId/:id"
              element={protectedRoute(<OrderEditPage />)}
            />

            <Route
              path="/order/my"
              element={protectedRoute(<OrderListClientPage />)}
            />

            <Route
              path="/user/update"
              element={protectedRoute(<UserUpdatePage />)}
            />
            <Route
              path="/user/:userName"
              element={protectedRoute(<UserViewPage />)}
            />

            <Route
              path="/item/list/:slug"
              element={protectedRoute(<ItemListPage />)}
            />
            <Route
              path="/item/create/:slug"
              element={protectedRoute(<ItemCreatePage />)}
            />
            <Route path="/item/view/:slug" element={<ItemViewPage />} />
            <Route
              path="/item/update/:id"
              element={protectedRoute(<ItemUpdatePage />)}
            />

            <Route path="/item/services" element={<ItemServiceHomePage />} />
            <Route path="/item/products" element={<ItemProductHomePage />} />

            <Route
              path="/employer/list/:slug"
              element={protectedRoute(<EmployerListPage />)}
            />
            <Route
              path="/employer/create/:slug"
              element={protectedRoute(<EmployerCreatePage />)}
            />
            <Route
              path="/employer/update/:id"
              element={protectedRoute(<EmployerUpdatePage />)}
            />
            <Route
              path="/employer/:id"
              element={protectedRoute(<EmployerViewPage />)}
            />
            <Route
              path="/employer/dashboard"
              element={protectedRoute(<EmployerMePage />)}
            />
            <Route
              path="/employer/schedules"
              element={protectedRoute(<EmployerSchedulesPage />)}
            />
            <Route
              path="/employer/orders"
              element={protectedRoute(<EmployerOrdersPage />)}
            />

            <Route path="/employers" element={<EmployerHome />} />

            <Route
              path="/establishment/create"
              element={protectedRoute(<EstablishmentCreatePage />)}
            />
            <Route
              path="/establishment/update/:id"
              element={protectedRoute(<EstablishmentUpdatePage />)}
            />
            <Route
              path="/establishment/my"
              element={protectedRoute(<EstablishmentMyPage />)}
            />
            <Route
              path="/establishment/orders/:slug"
              element={<EstablishmentOrderPage />}
            />
            <Route
              path="/establishment/item/:slug"
              element={<EstablishmentItemPage />}
            />
            <Route
              path="/establishment/employers/:slug"
              element={<EstablishmentEmployersPage />}
            />
            <Route path="/establishments" element={<EstablishmentHome />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </>
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
