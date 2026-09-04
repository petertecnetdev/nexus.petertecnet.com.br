// src/components/GlobalNav.jsx
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBuilding,
  FaChevronRight,
  FaClipboardList,
  FaHome,
  FaPlusCircle,
  FaQrcode,
  FaSearch,
  FaShoppingBag,
  FaShoppingCart,
  FaSignInAlt,
  FaSignOutAlt,
  FaStore,
  FaTimes,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa6";

import { AuthContext } from "../App";
import useImageUtils from "../hooks/useImageUtils";
import api from "../services/api";
import { appId } from "../config";
import { cartCount, CART_EVENT } from "../services/cart";
import "./GlobalNav.css";

const publicNavigation = [
  { label: "Início", path: "/", end: true, icon: FaHome },
];

const commerceNavigation = [
  { label: "Minhas compras", path: "/purchases", icon: FaShoppingBag },
  { label: "Pedidos recebidos", path: "/orders/manage", icon: FaClipboardList },
  { label: "Ler QR de retirada", path: "/orders/scan", icon: FaQrcode },
];

const catalogNavigation = [
  { label: "Meus catálogos", path: "/establishment/my", icon: FaStore },
  { label: "Cadastrar empresa", path: "/establishment/create", icon: FaPlusCircle },
];

const profileNavigation = [
  { label: "Minha conta", path: "/user/update", icon: FaUser },
];

const accountNavigation = [
  ...commerceNavigation,
  ...catalogNavigation,
  ...profileNavigation,
];

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function MobileNavLink({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => [
        "globalnav__mobileLink",
        isActive ? "globalnav__mobileLink--active" : "",
      ].filter(Boolean).join(" ")}
    >
      <span className="globalnav__mobileLinkIcon"><Icon aria-hidden="true" /></span>
      <span>{item.label}</span>
      <FaChevronRight className="globalnav__mobileLinkArrow" aria-hidden="true" />
    </NavLink>
  );
}

MobileNavLink.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    end: PropTypes.bool,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default function GlobalNav({ loadingMenu, handleLogout }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState({ companies: [], items: [] });
  const [cartItems, setCartItems] = useState(() => cartCount());
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const searchRef = useRef(null);
  const isAuthed = Boolean(user);
  const navIsLoading = Boolean(loadingMenu);

  const fullName = useMemo(() => {
    if (!user) return "Minha conta";
    return `${(user.first_name || "").trim()} ${(user.last_name || "").trim()}`.trim()
      || user.name
      || user.username
      || user.email
      || "Minha conta";
  }, [user]);

  const { imageUrl, handleImgError, placeholderSvg } = useImageUtils({
    fallbackText: fullName,
    fallbackShape: "round",
  });
  const avatarSrc = useMemo(
    () => imageUrl(user?.images?.avatar || user?.images?.profile || user?.avatar || null)
      || placeholderSvg
      || "/images/user.png",
    [user, imageUrl, placeholderSvg],
  );

  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const goToResult = (path) => {
    closeSearch();
    closeMobileMenu();
    setSearch("");
    navigate(path);
  };

  const goToCheckout = () => {
    closeMobileMenu();
    if (isAuthed) {
      navigate("/checkout");
      return;
    }
    navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };

  const openMobileMenu = () => {
    closeUserMenu();
    closeSearch();
    setMobileMenuOpen(true);
  };

  useEffect(() => {
    const sync = () => setCartItems(cartCount());
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults({ companies: [], items: [] });
      setSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await api.get("/nexus/search", {
          params: { app_id: appId, q: term, limit: 7 },
          signal: controller.signal,
        });
        setResults({
          companies: Array.isArray(data?.companies) ? data.companies : [],
          items: Array.isArray(data?.items) ? data.items : [],
        });
        setSearchOpen(true);
      } catch (error) {
        if (error?.code !== "ERR_CANCELED") {
          setResults({ companies: [], items: [] });
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const onLogout = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      if (handleLogout) await handleLogout();
    } catch {
      // O logout local continua mesmo se a chamada remota falhar.
    } finally {
      localStorage.removeItem("token");
      closeUserMenu();
      closeMobileMenu();
      window.dispatchEvent(new Event("authChanged"));
      window.location.replace("/login");
    }
  };

  useEffect(() => {
    closeUserMenu();
    closeSearch();
    closeMobileMenu();
  }, [location.pathname, closeUserMenu, closeSearch, closeMobileMenu]);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) closeUserMenu();
      if (searchRef.current && !searchRef.current.contains(event.target)) closeSearch();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeUserMenu();
        closeSearch();
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeUserMenu, closeSearch, closeMobileMenu]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";

    const drawer = mobileMenuRef.current;
    const focusable = drawer ? Array.from(drawer.querySelectorAll(FOCUSABLE_SELECTOR)) : [];
    focusable[0]?.focus();

    const trapFocus = (event) => {
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      } else {
        mobileMenuButtonRef.current?.focus();
      }
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 901px)");
    const handleDesktop = (event) => {
      if (event.matches) closeMobileMenu();
    };
    media.addEventListener?.("change", handleDesktop);
    return () => media.removeEventListener?.("change", handleDesktop);
  }, [closeMobileMenu]);

  const hasResults = results.companies.length > 0 || results.items.length > 0;
  const cartLabel = cartItems > 99 ? "99+" : String(cartItems);

  return (
    <header className="globalnav">
      <div className="globalnav__bar">
        <div className="globalnav__left">
          <Link to="/" className="globalnav__brand" aria-label="Ir para o início da Nexus" title="Nexus">
            <span className="globalnav__brandMark">
              <img src="/images/logo.png" alt="" className="globalnav__logo" />
            </span>
            <span className="globalnav__brandName">Nexus</span>
          </Link>
          <nav className="globalnav__links" aria-label="Navegação principal">
            {publicNavigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => [
                  "globalnav__link",
                  isActive ? "globalnav__link--active" : "",
                ].filter(Boolean).join(" ")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="globalnav__searchWrap" ref={searchRef}>
          <div className="globalnav__searchBox">
            <FaSearch aria-hidden="true" />
            <input
              value={search}
              onFocus={() => search.trim().length >= 2 && setSearchOpen(true)}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar empresas, produtos e serviços"
              aria-label="Pesquisar na Nexus"
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                className="globalnav__searchClear"
                onClick={() => {
                  setSearch("");
                  closeSearch();
                }}
                aria-label="Limpar pesquisa"
              >
                <FaTimes aria-hidden="true" />
              </button>
            )}
          </div>

          {searchOpen && search.trim().length >= 2 && (
            <div className="globalnav__searchResults" aria-live="polite">
              <div className="globalnav__searchTop">
                <strong>Resultados</strong>
                <span>{searching ? "Buscando…" : `${results.companies.length + results.items.length} encontrados`}</span>
              </div>
              {!searching && !hasResults && (
                <div className="globalnav__searchEmpty">Nenhum resultado para “{search.trim()}”.</div>
              )}
              {results.companies.length > 0 && (
                <div className="globalnav__searchGroup">
                  <small>Empresas</small>
                  {results.companies.map((company) => (
                    <button
                      type="button"
                      key={`company-${company.id}`}
                      onClick={() => goToResult(`/catalog/${company.slug}`)}
                    >
                      <FaBuilding aria-hidden="true" />
                      <span>
                        <strong>{company.fantasy || company.name}</strong>
                        <em>{[company.category, company.city, company.uf].filter(Boolean).join(" · ")}</em>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results.items.length > 0 && (
                <div className="globalnav__searchGroup">
                  <small>Itens</small>
                  {results.items.map((item) => (
                    <button
                      type="button"
                      key={`item-${item.id}`}
                      onClick={() => goToResult(`/item/view/${item.slug}`)}
                    >
                      <FaBoxOpen aria-hidden="true" />
                      <span>
                        <strong>{item.name}</strong>
                        <em>{[
                          item.type,
                          item.category,
                          item.establishment?.fantasy || item.establishment?.name,
                        ].filter(Boolean).join(" · ")}</em>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="globalnav__right">
          {cartItems > 0 && (
            <button
              type="button"
              className="globalnav__cartButton"
              onClick={goToCheckout}
              aria-label={`Abrir carrinho com ${cartItems} ${cartItems === 1 ? "item" : "itens"}`}
            >
              <FaShoppingCart aria-hidden="true" />
              <span className="globalnav__cartBadge">{cartLabel}</span>
            </button>
          )}

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
                <FaChevronRight className={`globalnav__userChevron ${userMenuOpen ? "globalnav__userChevron--open" : ""}`} aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <div className="globalnav__userMenu" role="menu" aria-label="Menu da conta">
                  {accountNavigation.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <React.Fragment key={item.path}>
                        {(index === commerceNavigation.length || index === commerceNavigation.length + catalogNavigation.length) && (
                          <div className="globalnav__divider" role="separator" />
                        )}
                        <Link
                          to={item.path}
                          className="globalnav__userMenuItem"
                          onClick={closeUserMenu}
                          role="menuitem"
                        >
                          <Icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </React.Fragment>
                    );
                  })}
                  <div className="globalnav__divider" role="separator" />
                  <button
                    type="button"
                    className="globalnav__userMenuItem globalnav__logout"
                    onClick={onLogout}
                    disabled={processing}
                    aria-busy={processing}
                    role="menuitem"
                  >
                    <FaSignOutAlt aria-hidden="true" />
                    <span>{processing ? "Saindo…" : "Sair da conta"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="globalnav__menuButton"
            onClick={openMobileMenu}
            aria-label="Abrir menu"
            aria-controls="nexus-mobile-menu"
            aria-expanded={mobileMenuOpen}
          >
            <FaBars aria-hidden="true" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="globalnav__mobileLayer">
          <button
            type="button"
            className="globalnav__mobileBackdrop"
            onClick={closeMobileMenu}
            aria-label="Fechar menu"
          />
          <aside
            id="nexus-mobile-menu"
            ref={mobileMenuRef}
            className="globalnav__mobileDrawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu da Nexus"
          >
            <div className="globalnav__mobileHeader">
              <Link to="/" className="globalnav__mobileBrand" onClick={closeMobileMenu}>
                <span className="globalnav__mobileBrandMark">
                  <img src="/images/logo.png" alt="" />
                </span>
                <span>
                  <strong>Nexus</strong>
                  <small>Seu catálogo em todo lugar</small>
                </span>
              </Link>
              <button type="button" className="globalnav__mobileClose" onClick={closeMobileMenu} aria-label="Fechar menu">
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            {isAuthed && (
              <div className="globalnav__mobileUserCard">
                <img src={avatarSrc} alt="" onError={handleImgError} />
                <span>
                  <strong>{fullName}</strong>
                  <small>{user?.email || "Conta Peter Tecnet"}</small>
                </span>
              </div>
            )}

            <div className="globalnav__mobileScroll">
              <section className="globalnav__mobileSection" aria-label="Navegação">
                <span className="globalnav__mobileSectionTitle">Navegação</span>
                {publicNavigation.map((item) => (
                  <MobileNavLink key={item.path} item={item} onClick={closeMobileMenu} />
                ))}
                {cartItems > 0 && (
                  <button type="button" className="globalnav__mobileLink globalnav__mobileCartLink" onClick={goToCheckout}>
                    <span className="globalnav__mobileLinkIcon"><FaShoppingCart aria-hidden="true" /></span>
                    <span>Carrinho</span>
                    <span className="globalnav__mobileCartCount">{cartLabel}</span>
                    <FaChevronRight className="globalnav__mobileLinkArrow" aria-hidden="true" />
                  </button>
                )}
              </section>

              {isAuthed && (
                <>
                  <section className="globalnav__mobileSection" aria-label="Compras e pedidos">
                    <span className="globalnav__mobileSectionTitle">Compras e pedidos</span>
                    {commerceNavigation.map((item) => (
                      <MobileNavLink key={item.path} item={item} onClick={closeMobileMenu} />
                    ))}
                  </section>

                  <section className="globalnav__mobileSection" aria-label="Catálogos">
                    <span className="globalnav__mobileSectionTitle">Catálogos</span>
                    {catalogNavigation.map((item) => (
                      <MobileNavLink key={item.path} item={item} onClick={closeMobileMenu} />
                    ))}
                  </section>

                  <section className="globalnav__mobileSection" aria-label="Conta">
                    <span className="globalnav__mobileSectionTitle">Conta</span>
                    {profileNavigation.map((item) => (
                      <MobileNavLink key={item.path} item={item} onClick={closeMobileMenu} />
                    ))}
                    <button
                      type="button"
                      className="globalnav__mobileLink globalnav__mobileLogout"
                      onClick={onLogout}
                      disabled={processing}
                      aria-busy={processing}
                    >
                      <span className="globalnav__mobileLinkIcon"><FaSignOutAlt aria-hidden="true" /></span>
                      <span>{processing ? "Saindo…" : "Sair da conta"}</span>
                    </button>
                  </section>
                </>
              )}

              {!navIsLoading && !isAuthed && (
                <section className="globalnav__mobileAuth" aria-label="Acessar conta">
                  <p>Entre para comprar, acompanhar pedidos e administrar seus catálogos.</p>
                  <Link to="/login" className="globalnav__mobileAuthBtn globalnav__mobileAuthBtn--ghost" onClick={closeMobileMenu}>
                    <FaSignInAlt aria-hidden="true" /> Entrar
                  </Link>
                  <Link to="/register" className="globalnav__mobileAuthBtn globalnav__mobileAuthBtn--primary" onClick={closeMobileMenu}>
                    <FaUserPlus aria-hidden="true" /> Criar conta
                  </Link>
                </section>
              )}
            </div>
          </aside>
        </div>
      )}
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
