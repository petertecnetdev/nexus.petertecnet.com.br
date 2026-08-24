// src/components/GlobalFooter.jsx
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../App";

import "./GlobalFooter.css";

export default function GlobalFooter() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);

  return (
    <footer className="inkapfooter">
      <nav className="inkapfooter__nav">
        <Link
          to="/"
          className={`inkapfooter__item ${isActive("/") ? "active" : ""}`}
        >
          <i className="fas fa-home" />
        </Link>

        <Link
          to="/establishments"
          className={`inkapfooter__item ${
            isActive("/establishments") ? "active" : ""
          }`}
        >
          <i className="fas fa-store" />
        </Link>

        <Link
          to="/item/services"
          className={`inkapfooter__item ${
            isActive("/item/services") ? "active" : ""
          }`}
        >
          <i className="fas fa-bolt" />
        </Link>

        <Link
          to="/employers"
          className={`inkapfooter__item ${
            isActive("/employers") ? "active" : ""
          }`}
        >
          <i className="fas fa-user-tie" />
        </Link>

        <Link
          to={user ? "/dashboard" : "/login"}
          className={`inkapfooter__item ${
            isActive("/dashboard") || isActive("/login") ? "active" : ""
          }`}
        >
          <i className="fas fa-user-circle" />
        </Link>
      </nav>
    </footer>
  );
}
