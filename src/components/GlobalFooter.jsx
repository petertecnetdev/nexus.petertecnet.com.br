import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../App";

import "./GlobalFooter.css";

export default function GlobalFooter() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(`${path}/`));

  return (
    <footer className="nexusfooter">
      <nav className="nexusfooter__nav" aria-label="Navegação rápida">
        <Link to="/" aria-label="Início" className={`nexusfooter__item ${isActive("/") ? "active" : ""}`}>
          <i className="fas fa-home" />
        </Link>

        <Link
          to="/establishments"
          aria-label="Catálogos"
          className={`nexusfooter__item ${isActive("/establishments") ? "active" : ""}`}
        >
          <i className="fas fa-store" />
        </Link>

        {user && (
          <Link
            to="/establishment/create"
            aria-label="Cadastrar empresa"
            className={`nexusfooter__item nexusfooter__item--create ${isActive("/establishment/create") ? "active" : ""}`}
          >
            <i className="fas fa-plus" />
          </Link>
        )}

        <Link
          to={user ? "/establishment/my" : "/login"}
          aria-label={user ? "Meus catálogos" : "Entrar"}
          className={`nexusfooter__item ${isActive("/establishment/my") || isActive("/login") ? "active" : ""}`}
        >
          <i className="fas fa-user-circle" />
        </Link>
      </nav>
    </footer>
  );
}
