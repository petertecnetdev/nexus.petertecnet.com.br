// src/components/GlobalNav.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, NavLink, useLocation } from "react-router-dom";

import { AuthContext } from "../App";
import useImageUtils from "../hooks/useImageUtils";

import "./GlobalNav.css";

const publicNavigation = [
  { label: "Início", path: "/", end: true },
];

const accountNavigation = [
  { label: "Meus catálogos", path: "/establishment/my" },
  { label: "Cadastrar empresa", path: "/establishment/create" },
  { label: "Minha conta", path: "/user/update" },
];

export default function GlobalNav({ loadingMenu, handleLogout }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const isAuthed = Boolean(user);
  const navIsLoading = Boolean(loadingMenu);

  const fullName = useMemo(() => {
    if (!user) return "Minha conta";
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

  const { imageUrl, handleImgError, placeholderSvg } = useImageUtils({
    fallbackText: fullName,
    fallbackShape: "round",
  });

  const avatarSrc = useMemo(() => {
    const rawAvatar = user?.images?.avatar || user?.images?.profile || user?.avatar || null;
    return imageUrl(rawAvatar) || placeholderSvg || "/images/user.png";
  }, [user, imageUrl, placeholderSvg]);

  const closeUserMenu = () => setUserMenuOpen(false);

  const onLogout = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      if (handleLogout) await handleLogout();
    } catch {
      // O encerramento local deve continuar mesmo se a API de logout falhar.
    } finally {
      localStorage.removeItem("token");
      closeUserMenu();
      window.dispatchEvent(new Event("authChanged"));
      window.location.replace("/login");
    }
  };

  useEffect(() => closeUserMenu(), [location.pathname]);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) closeUserMenu();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeUserMenu();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="globalnav">
      <div className="globalnav__bar">
        <div className="globalnav__left">
          <Link to="/" className="globalnav__brand" aria-label="Ir para o início da Nexus" title="Nexus">
            <img src="/images/logo.png" alt="Nexus" className="globalnav__logo" />
          </Link>

          <nav className="globalnav__links" aria-label="Navegação principal">
            {publicNavigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  ["globalnav__link", isActive ? "globalnav__link--active" : ""]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="globalnav__right">
          {!navIsLoading && !isAuthed && (
            <div className="globalnav__authActions">
              <Link to="/login" className="globalnav__btn globalnav__btn--ghost">Entrar</Link>
              <Link to="/register" className="globalnav__btn globalnav__btn--primary">Criar conta</Link>
            </div>
          )}

          {!navIsLoading && isAuthed && (
            <div className="globalnav__user" ref={userMenuRef}>
              <button
                type="button"
                className="globalnav__userBtn"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <img src={avatarSrc} alt="" className="globalnav__avatar" onError={handleImgError} />
                <span className="globalnav__userName">{fullName}</span>
              </button>

              {userMenuOpen && (
                <div className="globalnav__userMenu" role="menu" aria-label="Menu da conta">
                  {accountNavigation.map((item, index) => (
                    <React.Fragment key={item.path}>
                      {index === 2 && <div className="globalnav__divider" role="separator" />}
                      <Link
                        to={item.path}
                        className="globalnav__userMenuItem"
                        onClick={closeUserMenu}
                        role="menuitem"
                      >
                        {item.label}
                      </Link>
                    </React.Fragment>
                  ))}
                  <button
                    type="button"
                    className="globalnav__userMenuItem globalnav__logout"
                    onClick={onLogout}
                    disabled={processing}
                    aria-busy={processing}
                    role="menuitem"
                  >
                    {processing ? "Saindo…" : "Sair da conta"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
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
