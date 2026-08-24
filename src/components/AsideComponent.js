import React, { useState } from "react";
import { FaUser, FaCogs, FaBriefcase, FaShoppingCart } from "react-icons/fa";

const AsideComponent = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleAside = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`aside ${isCollapsed ? "collapsed" : ""}`}>
      <button className={`toggle-button ${isCollapsed ? "collapsed" : ""}`} onClick={toggleAside}>
        {isCollapsed ? ">" : "<"}
      </button>
      <div className="menu-item">
        <FaUser />
        <span>Perfil</span>
      </div>
      <div className="menu-item">
        <FaCogs />
        <span>Configurações</span>
      </div>
      <div className="menu-item">
        <FaBriefcase />
        <span>Minhas Produções</span>
      </div>
      <div className="menu-item">
        <FaShoppingCart />
        <span>Minhas Vendas</span>
      </div>
    </div>
  );
};

export default AsideComponent;
