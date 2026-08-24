import React from "react";
import { Link } from "react-router-dom";
import "./GlobalNavEstablishments.css";

export default function GlobalNavEstablishments({
  user,
  handleToggleMobileMenu
}) {
  if (!user) return null;

  return (
    <Link
      to="/establishment/my"
      onClick={handleToggleMobileMenu}
      className="navlog__link"
    >
      Meus estabelecimentos
    </Link>
  );
}
