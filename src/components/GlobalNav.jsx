// src/components/GlobalNav.jsx
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";

import { AuthContext } from "../App";
import useImageUtils from "../hooks/useImageUtils";
import CitySelectorModal from "./CitySelectorModal";
import ProcessingIndicatorComponent from "./ProcessingIndicatorComponent";

import "./GlobalNav.css";

export default function GlobalNav({ loadingMenu, handleLogout }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  /* =================== PROCESSING (LOGOUT) =================== */
  const [processing, setProcessing] = useState(false);

  /* =================== AUTH =================== */
  const isAuthed = !!user;

  const fullName = useMemo(() => {
    if (!user) return "Minha conta";
    const fn = (user.first_name || "").trim();
    const ln = (user.last_name || "").trim();
    return (
      `${fn} ${ln}`.trim() ||
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
    const raw =
      user?.images?.avatar ||
      user?.images?.profile ||
      user?.avatar ||
      null;

    return imageUrl(raw) || placeholderSvg || "/images/user.png";
  }, [user, imageUrl, placeholderSvg]);

  /* =================== UI =================== */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileRef = useRef(null);

  const closeAll = () => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  /* =================== CITY =================== */
  const [showCityModal, setShowCityModal] = useState(false);
  const [currentCity, setCurrentCity] = useState(
    localStorage.getItem("selectedCity")
  );
  const [currentUF, setCurrentUF] = useState(
    localStorage.getItem("selectedUF")
  );

  const handleSelectCity = ({ city, uf }) => {
    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedUF", uf);
    setCurrentCity(city);
    setCurrentUF(uf);
    setShowCityModal(false);
  };

  const locationText =
    currentCity && currentUF
      ? `${currentCity} / ${currentUF}`
      : "Localização não definida";

  /* =================== LOGOUT =================== */
  const onLogout = async () => {
    setProcessing(true);

    try {
      if (handleLogout) {
        await handleLogout();
      }
    } catch {
      // ignora erro
    } finally {
      localStorage.clear();
      closeAll();
      window.dispatchEvent(new Event("authChanged"));
      window.location.replace("/login");
    }
  };

  /* =================== EFFECTS =================== */
  useEffect(() => closeAll(), [location.pathname]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () =>
      document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const navIsLoading = !!loadingMenu;

  /* =================== BLOCK UI DURING LOGOUT =================== */
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
          {/* LEFT */}
          <div className="globalnav__left">
            <Link to="/" className="globalnav__brand">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="globalnav__logo"
              />
            </Link>

            <nav className="globalnav__links">
              <Link to="/establishments" className="globalnav__link">
                Estabelecimentos
              </Link>
              <Link to="/employers" className="globalnav__link">
                Profissionais
              </Link>
              <Link to="/item/services" className="globalnav__link">
                Serviços
              </Link>
              <Link to="/item/products" className="globalnav__link">
                Produtos
              </Link>
            </nav>

            <div className="globalnav__locationWrap">
              <div className="globalnav__location">
                <span className="globalnav__locationDot" />
                <span className="globalnav__locationText">
                  {locationText}
                </span>
              </div>

              <button
                className="globalnav__changeCityBtn"
                onClick={() => setShowCityModal(true)}
              >
                Trocar cidade
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="globalnav__right">
            {!navIsLoading && !isAuthed && (
              <div className="globalnav__authActions">
                <Link
                  to="/login"
                  className="globalnav__btn globalnav__btn--ghost"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="globalnav__btn globalnav__btn--primary"
                >
                  Criar conta
                </Link>
              </div>
            )}

            {!navIsLoading && isAuthed && (
              <div className="globalnav__user" ref={userMenuRef}>
                <button
                  className="globalnav__userBtn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <img
                    src={avatarSrc}
                    alt={fullName}
                    className="globalnav__avatar"
                    onError={handleImgError}
                  />
                  <span className="globalnav__userName">
                    {fullName}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="globalnav__userMenu">
                    <Link
                      to="/user/update"
                      className="globalnav__userMenuItem"
                      onClick={closeAll}
                    >
                      Meus dados
                    </Link>

                    <div className="globalnav__divider" />

                    <Link
                      to="/order/my"
                      className="globalnav__userMenuItem"
                      onClick={closeAll}
                    >
                      Meus agendamentos
                    </Link>

                    <div className="globalnav__divider" />

                    <Link
                      to="/establishment/my"
                      className="globalnav__userMenuItem"
                      onClick={closeAll}
                    >
                      Meus estabelecimentos
                    </Link>

                    <Link
                      to="/establishment/create"
                      className="globalnav__userMenuItem"
                      onClick={closeAll}
                    >
                      Criar estabelecimento
                    </Link>

                    <div className="globalnav__divider" />

                    <Link
                      to="/employer/dashboard"
                      className="globalnav__userMenuItem"
                      onClick={closeAll}
                    >
                      Área do colaborador
                    </Link>

                    <div className="globalnav__divider" />

                    <Link
                      to="/dashboard"
                      className="globalnav__userMenuItem"
                      onClick={closeAll}
                    >
                      Dashboard
                    </Link>

                    <button
                      className="globalnav__userMenuItem globalnav__logout"
                      onClick={onLogout}
                    >
                      Sair
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
