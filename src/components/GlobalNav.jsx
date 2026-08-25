// src/components/GlobalNav.jsx

import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PropTypes from "prop-types";
import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import { AuthContext } from "../App";
import useImageUtils from "../hooks/useImageUtils";

import CitySelectorModal from "./CitySelectorModal";
import ProcessingIndicatorComponent from "./ProcessingIndicatorComponent";

import "./GlobalNav.css";

/* =================== ITENS DE NAVEGAÇÃO =================== */

const publicNavigation = [
  {
    label: "Explorar",
    path: "/",
    end: true,
  },
  {
    label: "Negócios",
    path: "/establishments",
  },
  {
    label: "Especialistas",
    path: "/employers",
  },
  {
    label: "Serviços",
    path: "/item/services",
  },
  {
    label: "Produtos",
    path: "/item/products",
  },
];

export default function GlobalNav({
  loadingMenu,
  handleLogout,
}) {
  const { user } = useContext(AuthContext);

  const location = useLocation();

  /* =================== ESTADOS =================== */

  const [processing, setProcessing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const [currentCity, setCurrentCity] = useState(() =>
    localStorage.getItem("selectedCity")
  );

  const [currentUF, setCurrentUF] = useState(() =>
    localStorage.getItem("selectedUF")
  );

  const userMenuRef = useRef(null);

  /* =================== AUTENTICAÇÃO =================== */

  const isAuthed = Boolean(user);
  const navIsLoading = Boolean(loadingMenu);

  const fullName = useMemo(() => {
    if (!user) {
      return "Minha conta";
    }

    const firstName = (user.first_name || "").trim();
    const lastName = (user.last_name || "").trim();

    return (
      `${firstName} ${lastName}`.trim() ||
      user.name ||
      user.username ||
      user.email ||
      "Minha conta"
    );
  }, [user]);

  /* =================== AVATAR =================== */

  const {
    imageUrl,
    handleImgError,
    placeholderSvg,
  } = useImageUtils({
    fallbackText: fullName,
    fallbackShape: "round",
  });

  const avatarSrc = useMemo(() => {
    const rawAvatar =
      user?.images?.avatar ||
      user?.images?.profile ||
      user?.avatar ||
      null;

    return (
      imageUrl(rawAvatar) ||
      placeholderSvg ||
      "/images/user.png"
    );
  }, [user, imageUrl, placeholderSvg]);

  /* =================== LOCALIZAÇÃO =================== */

  const locationText = useMemo(() => {
    if (currentCity && currentUF) {
      return `${currentCity} / ${currentUF}`;
    }

    return "Escolha sua cidade";
  }, [currentCity, currentUF]);

  const handleSelectCity = ({ city, uf }) => {
    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedUF", uf);

    setCurrentCity(city);
    setCurrentUF(uf);
    setShowCityModal(false);
  };

  /* =================== INTERFACE =================== */

  const closeUserMenu = () => {
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen((currentValue) => !currentValue);
  };

  /* =================== LOGOUT =================== */

  const onLogout = async () => {
    setProcessing(true);

    try {
      if (handleLogout) {
        await handleLogout();
      }
    } catch {
      // A limpeza local será executada mesmo se a API falhar.
    } finally {
      localStorage.clear();

      closeUserMenu();

      window.dispatchEvent(new Event("authChanged"));
      window.location.replace("/login");
    }
  };

  /* =================== EFEITOS =================== */

  useEffect(() => {
    closeUserMenu();
  }, [location.pathname]);

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        closeUserMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeUserMenu();
      }
    };

    document.addEventListener(
      "mousedown",
      handleDocumentMouseDown
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentMouseDown
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* =================== PROCESSAMENTO =================== */

  if (processing) {
    return (
      <ProcessingIndicatorComponent
        gifSrc="/images/logo.gif"
        minDuration={0}
      />
    );
  }

  /* =================== RENDER =================== */

  return (
    <>
      <header className="globalnav">
        <div className="globalnav__bar">
          {/* =================== ESQUERDA =================== */}

          <div className="globalnav__left">
            <Link
              to="/"
              className="globalnav__brand"
              aria-label="Ir para o início da Nexus"
              title="Nexus"
            >
              <img
                src="/images/logo.png"
                alt="Nexus"
                className="globalnav__logo"
              />
            </Link>

            <nav
              className="globalnav__links"
              aria-label="Navegação principal"
            >
              {publicNavigation.map((navigationItem) => (
                <NavLink
                  key={navigationItem.path}
                  to={navigationItem.path}
                  end={navigationItem.end}
                  className={({ isActive }) =>
                    [
                      "globalnav__link",
                      isActive
                        ? "globalnav__link--active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  {navigationItem.label}
                </NavLink>
              ))}
            </nav>

            <div className="globalnav__locationWrap">
              <div className="globalnav__location">
                <span
                  className="globalnav__locationDot"
                  aria-hidden="true"
                />

                <span className="globalnav__locationText">
                  {locationText}
                </span>
              </div>

              <button
                type="button"
                className="globalnav__changeCityBtn"
                onClick={() => setShowCityModal(true)}
              >
                {currentCity && currentUF
                  ? "Alterar localização"
                  : "Definir localização"}
              </button>
            </div>
          </div>

          {/* =================== DIREITA =================== */}

          <div className="globalnav__right">
            {!navIsLoading && !isAuthed && (
              <div className="globalnav__authActions">
                <Link
                  to="/login"
                  className="
                    globalnav__btn
                    globalnav__btn--ghost
                  "
                >
                  Entrar
                </Link>

                <Link
                  to="/register"
                  className="
                    globalnav__btn
                    globalnav__btn--primary
                  "
                >
                  Criar conta
                </Link>
              </div>
            )}

            {!navIsLoading && isAuthed && (
              <div
                className="globalnav__user"
                ref={userMenuRef}
              >
                <button
                  type="button"
                  className="globalnav__userBtn"
                  onClick={toggleUserMenu}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label={`Abrir menu de ${fullName}`}
                >
                  <img
                    src={avatarSrc}
                    alt=""
                    className="globalnav__avatar"
                    onError={handleImgError}
                  />

                  <span className="globalnav__userName">
                    {fullName}
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    className="globalnav__userMenu"
                    role="menu"
                    aria-label="Menu da conta"
                  >
                    {/* Conta */}

                    <Link
                      to="/user/update"
                      className="globalnav__userMenuItem"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      Minha conta
                    </Link>

                    <Link
                      to="/order/my"
                      className="globalnav__userMenuItem"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      Minha agenda
                    </Link>

                    <div
                      className="globalnav__divider"
                      role="separator"
                    />

                    {/* Negócios */}

                    <Link
                      to="/establishment/my"
                      className="globalnav__userMenuItem"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      Meus negócios
                    </Link>

                    <Link
                      to="/establishment/create"
                      className="globalnav__userMenuItem"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      Cadastrar negócio
                    </Link>

                    <div
                      className="globalnav__divider"
                      role="separator"
                    />

                    {/* Profissionais */}

                    <Link
                      to="/employer/dashboard"
                      className="globalnav__userMenuItem"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      Área profissional
                    </Link>

                    {/* Gestão */}

                    <Link
                      to="/dashboard"
                      className="globalnav__userMenuItem"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      Central de gestão
                    </Link>

                    <div
                      className="globalnav__divider"
                      role="separator"
                    />

                    <button
                      type="button"
                      className="
                        globalnav__userMenuItem
                        globalnav__logout
                      "
                      onClick={onLogout}
                      role="menuitem"
                    >
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <CitySelectorModal
        user={user || {}}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleSelectCity}
      />
    </>
  );
}

GlobalNav.propTypes = {
  loadingMenu: PropTypes.bool,
  handleLogout: PropTypes.func,
};

GlobalNav.defaultProps = {
  loadingMenu: false,
  handleLogout: undefined,
};