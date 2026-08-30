// src/components/GlobalNav.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaBuilding, FaSearch, FaTimes } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa6";

import { AuthContext } from "../App";
import useImageUtils from "../hooks/useImageUtils";
import api from "../services/api";
import { appId } from "../config";

import "./GlobalNav.css";

const publicNavigation = [{ label: "Início", path: "/", end: true }];
const accountNavigation = [
  { label: "Meus catálogos", path: "/establishment/my" },
  { label: "Cadastrar empresa", path: "/establishment/create" },
  { label: "Minha conta", path: "/user/update" },
];

export default function GlobalNav({ loadingMenu, handleLogout }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState({ companies: [], items: [] });
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const isAuthed = Boolean(user);
  const navIsLoading = Boolean(loadingMenu);

  const fullName = useMemo(() => {
    if (!user) return "Minha conta";
    return `${(user.first_name || "").trim()} ${(user.last_name || "").trim()}`.trim() || user.name || user.username || user.email || "Minha conta";
  }, [user]);

  const { imageUrl, handleImgError, placeholderSvg } = useImageUtils({ fallbackText: fullName, fallbackShape: "round" });
  const avatarSrc = useMemo(() => imageUrl(user?.images?.avatar || user?.images?.profile || user?.avatar || null) || placeholderSvg || "/images/user.png", [user, imageUrl, placeholderSvg]);
  const closeUserMenu = () => setUserMenuOpen(false);
  const closeSearch = () => setSearchOpen(false);

  const goToResult = (path) => {
    closeSearch();
    setSearch("");
    navigate(path);
  };

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
        const { data } = await api.get("/nexus/search", { params: { app_id: appId, q: term, limit: 7 }, signal: controller.signal });
        setResults({ companies: Array.isArray(data?.companies) ? data.companies : [], items: Array.isArray(data?.items) ? data.items : [] });
        setSearchOpen(true);
      } catch (error) {
        if (error?.code !== "ERR_CANCELED") setResults({ companies: [], items: [] });
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 280);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search]);

  const onLogout = async () => {
    if (processing) return;
    setProcessing(true);
    try { if (handleLogout) await handleLogout(); } catch { /* logout local continua */ }
    finally {
      localStorage.removeItem("token"); closeUserMenu(); window.dispatchEvent(new Event("authChanged")); window.location.replace("/login");
    }
  };

  useEffect(() => { closeUserMenu(); closeSearch(); }, [location.pathname]);
  useEffect(() => {
    const onMouseDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) closeUserMenu();
      if (searchRef.current && !searchRef.current.contains(event.target)) closeSearch();
    };
    const onKeyDown = (event) => { if (event.key === "Escape") { closeUserMenu(); closeSearch(); } };
    document.addEventListener("mousedown", onMouseDown); document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("mousedown", onMouseDown); document.removeEventListener("keydown", onKeyDown); };
  }, []);

  const hasResults = results.companies.length > 0 || results.items.length > 0;

  return (
    <header className="globalnav">
      <div className="globalnav__bar">
        <div className="globalnav__left">
          <Link to="/" className="globalnav__brand" aria-label="Ir para o início da Nexus" title="Nexus"><img src="/images/logo.png" alt="Nexus" className="globalnav__logo" /></Link>
          <nav className="globalnav__links" aria-label="Navegação principal">
            {publicNavigation.map((item) => <NavLink key={item.path} to={item.path} end={item.end} className={({ isActive }) => ["globalnav__link", isActive ? "globalnav__link--active" : ""].filter(Boolean).join(" ")}>{item.label}</NavLink>)}
          </nav>
        </div>

        <div className="globalnav__searchWrap" ref={searchRef}>
          <div className="globalnav__searchBox">
            <FaSearch aria-hidden="true" />
            <input value={search} onFocus={() => search.trim().length >= 2 && setSearchOpen(true)} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar empresas, produtos, serviços..." aria-label="Pesquisar na Nexus" autoComplete="off" />
            {search && <button type="button" className="globalnav__searchClear" onClick={() => { setSearch(""); closeSearch(); }} aria-label="Limpar pesquisa"><FaTimes /></button>}
          </div>
          {searchOpen && search.trim().length >= 2 && (
            <div className="globalnav__searchResults">
              <div className="globalnav__searchTop"><strong>Resultados</strong><span>{searching ? "Buscando…" : `${results.companies.length + results.items.length} encontrados`}</span></div>
              {!searching && !hasResults && <div className="globalnav__searchEmpty">Nenhum resultado para “{search.trim()}”.</div>}
              {results.companies.length > 0 && <div className="globalnav__searchGroup"><small>Empresas</small>{results.companies.map((company) => <button type="button" key={`company-${company.id}`} onClick={() => goToResult(`/catalog/${company.slug}`)}><FaBuilding /><span><strong>{company.fantasy || company.name}</strong><em>{[company.category, company.city, company.uf].filter(Boolean).join(" · ")}</em></span></button>)}</div>}
              {results.items.length > 0 && <div className="globalnav__searchGroup"><small>Itens</small>{results.items.map((item) => <button type="button" key={`item-${item.id}`} onClick={() => goToResult(`/item/view/${item.slug}`)}><FaBoxOpen /><span><strong>{item.name}</strong><em>{[item.type, item.category, item.establishment?.fantasy || item.establishment?.name].filter(Boolean).join(" · ")}</em></span></button>)}</div>}
            </div>
          )}
        </div>

        <div className="globalnav__right">
          {!navIsLoading && !isAuthed && <div className="globalnav__authActions"><Link to="/login" className="globalnav__btn globalnav__btn--ghost">Entrar</Link><Link to="/register" className="globalnav__btn globalnav__btn--primary">Criar conta</Link></div>}
          {!navIsLoading && isAuthed && <div className="globalnav__user" ref={userMenuRef}>
            <button type="button" className="globalnav__userBtn" onClick={() => setUserMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={userMenuOpen}><img src={avatarSrc} alt="" className="globalnav__avatar" onError={handleImgError} /><span className="globalnav__userName">{fullName}</span></button>
            {userMenuOpen && <div className="globalnav__userMenu" role="menu" aria-label="Menu da conta">{accountNavigation.map((item, index) => <React.Fragment key={item.path}>{index === 2 && <div className="globalnav__divider" role="separator" />}<Link to={item.path} className="globalnav__userMenuItem" onClick={closeUserMenu} role="menuitem">{item.label}</Link></React.Fragment>)}<button type="button" className="globalnav__userMenuItem globalnav__logout" onClick={onLogout} disabled={processing} aria-busy={processing} role="menuitem">{processing ? "Saindo…" : "Sair da conta"}</button></div>}
          </div>}
        </div>
      </div>
    </header>
  );
}

GlobalNav.propTypes = { loadingMenu: PropTypes.bool, handleLogout: PropTypes.func };
GlobalNav.defaultProps = { loadingMenu: false, handleLogout: undefined };
