// src/components/nav/GlobalNavMenu.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { storageUrl } from "../../config";

import GlobalNavAdminMenu from "./GlobalNavAdminMenu";
import GlobalNavEstablishments from "./GlobalNavEstablishments";
import "./GlobalNavMenu.css";

export default function GlobalNavMenu({
  user,
  loading,
  showAdminSubmenu,
  setShowAdminSubmenu,
  showEstSubmenu,
  setShowEstSubmenu,
  handleToggleMobileMenu,
  handleLogout,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = user?.profile?.name === "Administrador";
  const isAuthed = !!user;

  const avatarSrc = useMemo(() => {
    const paths = [user?.avatar, user?.images?.avatar, user?.images?.profile].filter(Boolean);
    if (!paths.length) return "/images/user.png";
    return paths[0].startsWith("http") ? paths[0] : `${storageUrl}/${paths[0]}`;
  }, [user]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/user.png";
  };

  const handleLogoutClick = () => {
    handleToggleMobileMenu();
    handleLogout();
  };

  return (
    <div className="navlog__mobile-menu">
      <div className="navlog__mobile-close">
        <button onClick={handleToggleMobileMenu} className="navlog__close-btn" aria-label="Fechar menu">
          ×
        </button>
      </div>

      <div className="navlog__mobile-content">
        {loading ? (
          <p className="navlog__loading">Carregando...</p>
        ) : (
          <>
            {/* HEADER */}
            {!isAuthed ? (
              <div className="navlog__guest">
                <img
                  src="/images/logo.png"
                  alt="Inkap"
                  className="navlog__guest-logo"
                  draggable={false}
                />
                <p className="navlog__guest-text">
                  Entre para gerenciar sua conta e seus estabelecimentos.
                </p>

                <div className="navlog__guest-actions">
                  <Link
                    to="/login"
                    onClick={handleToggleMobileMenu}
                    className="navlog__guest-btn navlog__guest-btn--primary"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    onClick={handleToggleMobileMenu}
                    className="navlog__guest-btn"
                  >
                    Criar conta
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* ✅ AUTENTICADO: avatar + nome (sem Entrar / Criar conta) */}
                <button
                  type="button"
                  className="navlog__userbar"
                  onClick={() => setShowUserMenu((p) => !p)}
                >
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    onError={handleImageError}
                    className="navlog__avatar"
                  />

                  <div className="navlog__userbar-info">
                    <div className="navlog__user-name">
                      {user?.first_name || user?.name || "Conta"}
                    </div>
                    <div className="navlog__user-role">
                      {isAdmin ? "Administrador" : user?.isEmployer ? "Profissional" : "Usuário"}
                    </div>
                  </div>

                  <span className={`navlog__chevron ${showUserMenu ? "is-open" : ""}`}>⌄</span>
                </button>

                {/* ✅ AUTENTICADO: menu privado aparece ao clicar no header */}
                {showUserMenu && (
                  <div className="navlog__user-panel">
                    <Link
                      to="/user/update"
                      onClick={handleToggleMobileMenu}
                      className="navlog__link navlog__link--soft"
                    >
                      Gerenciar Conta
                    </Link>

                    {!isAdmin && (
                      <Link to="/order/my" onClick={handleToggleMobileMenu} className="navlog__link">
                        Meus Agendamentos
                      </Link>
                    )}

                    {user?.isEmployer && (
                      <Link to="/employer/dashboard" onClick={handleToggleMobileMenu} className="navlog__link">
                        Painel do Profissional
                      </Link>
                    )}

                    <Link to="/invite" onClick={handleToggleMobileMenu} className="navlog__link">
                      Convidar Usuário
                    </Link>

                    {/* Submenus */}
                    <div className="navlog__submenu-area">
                      <GlobalNavEstablishments
                        showEstSubmenu={showEstSubmenu}
                        setShowEstSubmenu={setShowEstSubmenu}
                        handleToggleMobileMenu={handleToggleMobileMenu}
                      />

                      {isAdmin && (
                        <GlobalNavAdminMenu
                          showAdminSubmenu={showAdminSubmenu}
                          setShowAdminSubmenu={setShowAdminSubmenu}
                          handleToggleMobileMenu={handleToggleMobileMenu}
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="navlog__link navlog__link--danger navlog__logout-btn"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </>
            )}

            {/* LINKS PÚBLICOS (sempre visíveis, autenticado ou não) */}
            <nav className="navlog__mobile-links">
              <Link to="/establishments" onClick={handleToggleMobileMenu} className="navlog__link">
                Estabelecimentos
              </Link>
              <Link to="/employers" onClick={handleToggleMobileMenu} className="navlog__link">
                Profissionais
              </Link>
              <Link to="/item/services" onClick={handleToggleMobileMenu} className="navlog__link">
                Serviços
              </Link>
              <Link to="/item/products" onClick={handleToggleMobileMenu} className="navlog__link">
                Produtos
              </Link>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
