import React from "react";
import { Link } from "react-router-dom";
import "./GlobalNavAdminMenu.css";

export default function GlobalNavAdminMenu({
  showAdminSubmenu,
  setShowAdminSubmenu,
  handleToggleMobileMenu
}) {
  return (
    <>
      <button
        className="navlog__admin-btn"
        onClick={() => setShowAdminSubmenu((v) => !v)}
      >
        Administrativo {showAdminSubmenu ? "▲" : "▼"}
      </button>

      {showAdminSubmenu && (
        <div className="navlog__admin-submenu">
          <Link to="/user/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">Usuários</Link>
          <Link to="/barber/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">Barbeiros</Link>
          <Link to="/service/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">Serviços</Link>
          <Link to="/appointments/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">Agendamentos</Link>
        </div>
      )}
    </>
  );
}
