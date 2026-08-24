import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Nav, Spinner, Badge } from "react-bootstrap";
import authService from "../services/AuthService";
import { storageUrl } from "../config";

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.me();
        setUser(userData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        setLoadingMenu(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const userNotifications = await authService.getNotifications();
        setNotifications(userNotifications);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchUserData();
    fetchNotifications();
  }, []);

  const renderCorporateMenu = () => (
    <>
      <Link to="/barbershop" className="nav-link">Minhas Barbearias</Link>
      <Link to="/appointments/manage" className="nav-link">Gerenciar Agendamentos</Link>
      <Link to="/service/manage" className="nav-link">Gerenciar Serviços</Link>
      <Link to="/reports" className="nav-link">Relatórios</Link>
    </>
  );

  const renderAdminMenu = () => (
    <>
      <Link to="/user/list" className="nav-link">Usuários</Link>
      <Link to="/barber/list" className="nav-link">Barbeiros</Link>
      <Link to="/service/list" className="nav-link">Serviços</Link>
      <Link to="/appointments/list" className="nav-link">Agendamentos</Link>
    </>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="rounded-circle"
            style={{ width: "60px", height: "60px" }}
          />
        </Link>
      </div>

      <Nav className="flex-column">
        {loadingNotifications ? (
          <Spinner animation="border" variant="light" aria-live="polite" />
        ) : (
          <div className="nav-item notifications">
            <span>
              <i className="fa fa-globe" aria-hidden="true"></i> 
              {notifications.length > 0 && (
                <Badge bg="light" text="dark">{notifications.length}</Badge>
              )}
            </span>
            {notifications.length === 0 ? (
              <span>Sem notificações</span>
            ) : (
              notifications.map((notification, index) => (
                <div key={index} className="nav-item">{notification.message}</div>
              ))
            )}
          </div>
        )}

        <Link to="/services" className="nav-link">
          <i className="fa fa-scissors" aria-hidden="true"></i> Serviços
        </Link>
        <Link to="/barbers" className="nav-link">
          <i className="fa fa-user" aria-hidden="true"></i> Barbeiros
        </Link>
        <Link to="/appointments" className="nav-link">
          <i className="fa fa-calendar" aria-hidden="true"></i> Agendamentos
        </Link>

        {loadingMenu ? (
          <Spinner animation="border" variant="light" size="sm" className="m-2" />
        ) : (
          <>
            {user && user.profile && user.profile.name === 'Gerente de Barbearia' && renderCorporateMenu()}
            {user && user.profile && user.profile.name === 'Administrador' && (
              <>
                {renderCorporateMenu()}
                {renderAdminMenu()}
              </>
            )}
          </>
        )}
      </Nav>

      <div className="sidebar-footer">
        {loading ? (
          <Spinner animation="border" variant="light" aria-live="polite" />
        ) : (
          <>
            {user && (
              <div className="profile-dropdown">
                {user.first_name}
                <div className="dropdown-menu">
                  <Link to={`/user/edit`} className="dropdown-item">Gerenciar conta</Link>
                  <Link to="/settings" className="dropdown-item">Configurações</Link>
                  <Link to="/logout" className="dropdown-item">Sair</Link>
                </div>
                <img
                  src={user && user.avatar ? `${storageUrl}/${user.avatar}` : "/images/logo.png"}
                  alt="Avatar"
                  className="avatar m-2"
                  style={{ maxWidth: "40px", borderRadius: "50%" }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default Navigation;
