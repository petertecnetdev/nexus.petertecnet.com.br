// src/App.jsx
import React, {
  Suspense,
  createContext,
  lazy,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import SeoManager from "./components/SeoManager";
import { LoadingContext, LoadingProvider } from "./contexts/LoadingContext";
import { appId } from "./config";
import api from "./services/api";

// Critical public journey stays in the initial bundle so navigation from discovery
// to company/catalog/item is immediate. Heavier/private flows are split by route.
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ItemViewPage from "./pages/item/ItemViewPage";
import EstablishmentViewPage from "./pages/establishment/EstablishmentViewPage";
import CatalogPage from "./pages/catalog/CatalogPage";

import "./index.css";
import "./styles/readability.css";
import "./styles/form-contrast-dark.css";
import "./styles/page-consistency.css";
import "./styles/form-visibility-guard.css";

const PeterFrontendCoreGateway = lazy(() => import("./components/PeterFrontendCoreGateway"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const EmailVerifyPage = lazy(() => import("./pages/auth/EmailVerifyPage"));
const LogoutPage = lazy(() => import("./pages/auth/LogoutPage"));
const PasswordEmailPage = lazy(() => import("./pages/auth/PasswordEmailPage"));
const PasswordResetPage = lazy(() => import("./pages/auth/PasswordResetPage"));
const PasswordPage = lazy(() => import("./pages/auth/PasswordPage"));
const InviteCompletePage = lazy(() => import("./pages/auth/InviteCompletePage"));
const UserUpdatePage = lazy(() => import("./pages/user/UserUpdatePage"));
const ItemCreatePage = lazy(() => import("./pages/item/ItemCreatePage"));
const ItemUpdatePage = lazy(() => import("./pages/item/ItemUpdatePage"));
const EstablishmentCreatePage = lazy(() => import("./pages/establishment/EstablishmentCreatePage"));
const EstablishmentUpdatePage = lazy(() => import("./pages/establishment/EstablishmentUpdatePage"));
const EstablishmentMyPage = lazy(() => import("./pages/establishment/EstablishmentMyPage"));
const EstablishmentItemPage = lazy(() => import("./pages/establishment/EstablishmentItemPage"));
const CheckoutPage = lazy(() => import("./pages/commerce/CheckoutPage"));
const PurchasePage = lazy(() => import("./pages/commerce/PurchasePage"));
const MyPurchasesPage = lazy(() => import("./pages/commerce/MyPurchasesPage"));
const SellerOrdersPage = lazy(() => import("./pages/commerce/SellerOrdersPage"));
const OrderScannerPage = lazy(() => import("./pages/commerce/OrderScannerPage"));
const RedeemOrderPage = lazy(() => import("./pages/commerce/RedeemOrderPage"));

export const AuthContext = createContext(null);

const AUTH_FREE_PATHS = new Set([
  "/",
  "/register",
  "/login",
  "/password-email",
  "/password-reset",
  "/invite-complete",
  "/logout",
  "/establishments",
]);

const isPublicPath = (pathname) => {
  if (AUTH_FREE_PATHS.has(pathname)) return true;

  return /^\/(?:catalog|catalogo)\/[^/]+\/?$/.test(pathname)
    || /^\/(?:establishment\/view|empresa)\/[^/]+\/?$/.test(pathname)
    || /^\/item(?:\/view)?\/[^/]+\/?$/.test(pathname)
    || /^\/redeem\/[^/]+\/?$/.test(pathname);
};

function CatalogRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/catalog/${encodeURIComponent(slug || "")}`} replace />;
}

function RouteFallback() {
  return <ProcessingIndicatorComponent messages={["Abrindo a página…", "Carregando somente o necessário…"]} />;
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
        resetAuth();
        setInitialLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/account/context", {
          params: { app_id: appId },
        });
        if (cancelled) return;
        applySession(data);
      } catch {
        localStorage.removeItem("token");
        if (!cancelled) resetAuth();
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    loadAuth();

    const onAuthChanged = (event) => {
      if (cancelled) return;
      if (event?.detail?.user) {
        applySession(event.detail);
        setInitialLoading(false);
        return;
      }
      loadAuth();
    };

    window.addEventListener("authChanged", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("authChanged", onAuthChanged);
    };
  }, []);

  if (initialLoading && !isPublicPath(window.location.pathname)) {
    return <ProcessingIndicatorComponent messages={["Conectando à Nexus…", "Preparando sua experiência…"]} />;
  }

  const protectedRoute = (element) => user
    ? (user.email_verified_at ? element : <Navigate to="/email-verify" replace />)
    : <Navigate to="/login" replace />;
  const emailVerifiedRoute = (element) => user
    ? (!user.email_verified_at ? element : <Navigate to="/establishment/my" replace />)
    : <Navigate to="/login" replace />;
  const restrictedRoute = (element) => user
    ? <Navigate to="/establishment/my" replace />
    : element;

  return (
    <AuthContext.Provider value={{ user, setUser, employer, isEmployer, establishments }}>
      {isLoading && <ProcessingIndicatorComponent messages={["Salvando suas alterações…", "Atualizando a Nexus…"]} />}
      <Router>
        <SeoManager />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
            <Route path="/login" element={restrictedRoute(<LoginPage />)} />
            <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
            <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
            <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
            <Route path="/password" element={protectedRoute(<PasswordPage />)} />
            <Route path="/invite-complete" element={restrictedRoute(<InviteCompletePage redirectTo="/login" />)} />
            <Route path="/logout" element={<LogoutPage />} />

            <Route path="/catalog/:slug" element={<CatalogPage />} />
            <Route path="/catalogo/:slug" element={<CatalogRedirect />} />
            <Route path="/establishment/view/:slug" element={<EstablishmentViewPage />} />
            <Route path="/empresa/:slug" element={<EstablishmentViewPage />} />
            <Route path="/establishments" element={<Navigate to="/" replace />} />
            <Route path="/item/view/:slug" element={<ItemViewPage />} />
            <Route path="/item/:slug" element={<ItemViewPage />} />

            <Route path="/checkout" element={protectedRoute(<CheckoutPage />)} />
            <Route path="/purchase/:publicId" element={protectedRoute(<PurchasePage />)} />
            <Route path="/purchases" element={protectedRoute(<MyPurchasesPage />)} />
            <Route path="/orders/manage" element={protectedRoute(<SellerOrdersPage />)} />
            <Route path="/orders/scan" element={protectedRoute(<OrderScannerPage />)} />
            <Route path="/redeem/:publicId" element={<RedeemOrderPage />} />

            <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />
            <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
            <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />
            <Route path="/establishment/my" element={protectedRoute(<EstablishmentMyPage />)} />
            <Route path="/establishment/item/:slug" element={protectedRoute(<EstablishmentItemPage />)} />
            <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
            <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />

            <Route path="/dashboard" element={<Navigate to="/establishment/my" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
        <PeterFrontendCoreGateway />
      </Suspense>
      <LoadingProvider>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""} locale="pt-BR">
          <AppInner />
        </GoogleOAuthProvider>
      </LoadingProvider>
    </>
  );
}
