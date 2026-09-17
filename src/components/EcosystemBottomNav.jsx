import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaSearch, FaShoppingBag, FaStore, FaUser } from "react-icons/fa";
import { AuthContext } from "../App";
import "./EcosystemBottomNav.css";

const itemClass = ({ isActive }) => `ecosystem-bottom-nav__item${isActive ? " active" : ""}`;

export default function EcosystemBottomNav() {
  const { user } = useContext(AuthContext);
  if (!user) return null;

  return (
    <nav className="ecosystem-bottom-nav" aria-label="Navegação principal mobile">
      <NavLink to="/" end className={itemClass}>
        <FaHome aria-hidden="true" />
        <span>Início</span>
      </NavLink>
      <NavLink to="/establishment/my" className={itemClass}>
        <FaStore aria-hidden="true" />
        <span>Catálogos</span>
      </NavLink>
      <NavLink to="/" className={itemClass} onClick={(event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.setTimeout(() => document.querySelector('.globalnav__searchBox input')?.focus(), 250);
      }}>
        <FaSearch aria-hidden="true" />
        <span>Buscar</span>
      </NavLink>
      <NavLink to="/purchases" className={itemClass}>
        <FaShoppingBag aria-hidden="true" />
        <span>Compras</span>
      </NavLink>
      <NavLink to="/user/update" className={itemClass}>
        <FaUser aria-hidden="true" />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}
