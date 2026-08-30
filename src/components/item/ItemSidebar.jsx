import React, { useCallback, useState } from "react";
import { Card, Button, Badge, Modal } from "react-bootstrap";
import PropTypes from "prop-types";
import LoginFormComponent from "../auth/LoginFormComponent";
import EntityImage from "../EntityImage";
import "./ItemSidebar.css";

const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ItemSidebar({ item, entity, metrics, ordersSummary, userInteractions, navigate, openSchedulePopup }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const isAuthenticated = () => !!localStorage.getItem("token");

  const handleScheduleClick = () => {
    if (!isAuthenticated()) { setPendingAction("schedule"); setShowLoginModal(true); return; }
    openSchedulePopup(item);
  };
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingAction === "schedule") setTimeout(() => { openSchedulePopup(item); setPendingAction(null); }, 300);
  };
  const isValid = useCallback((v) => v !== null && v !== undefined && v !== "" && v !== "null" && !(typeof v === "number" && isNaN(v)), []);
  if (!item) return <div className="sidebar-loading-skeleton"></div>;

  const establishment = entity || {};
  const itemFiles = Array.isArray(item.files) ? item.files : [];
  const itemImages = [item.image_url, item.image, item.images?.avatar, item.images?.cover, itemFiles.find((file) => file?.is_primary)?.public_url, itemFiles.find((file) => file?.type === "image")?.public_url, itemFiles[0]?.public_url];
  const establishmentFiles = Array.isArray(establishment.files) ? establishment.files : [];
  const establishmentImages = [establishment?.images?.logo, establishment.logo, establishmentFiles.find((file) => file?.type === "logo")?.public_url, establishment?.images?.background, establishmentFiles.find((file) => file?.is_primary)?.public_url, establishmentFiles[0]?.public_url];
  const establishmentName = establishment.fantasy || establishment.name || "Empresa";

  return (
    <>
      <div className="item-sidebar">
        <Card className="item-card">
          <Card.Header className="d-flex align-items-center justify-content-between"><span>🛍️ Item</span></Card.Header>
          <Card.Body>
            <div className="d-flex align-items-center mb-3">
              <div className="position-relative me-3"><div className="item-avatar-frame"><EntityImage src={itemImages} name={item.name} alt={item.name} className="item-avatar-img" loading="lazy" /></div></div>
              <div>
                <div className="fw-semibold text-light fs-5">{item.name}</div>
                {isValid(item.type) && <div className="text-info small mb-1">{item.type}</div>}
                <div className="text-secondary small mb-1">{fmtBRL.format(item.price || 0)}</div>
                <div className="text-secondary small">👁️ {(metrics?.total_views ?? item.total_views ?? 0)} visualizações • 👤 {(metrics?.unique_users ?? item.unique_users ?? 0)} usuários únicos</div>
              </div>
            </div>

            {establishment?.name && (
              <div className="item-establishment-highlight mb-3 p-2 rounded-3 text-center cursor-pointer" onClick={() => establishment.slug ? navigate(`/establishment/view/${establishment.slug}`) : null}>
                <div className="d-flex flex-column align-items-center">
                  <EntityImage src={establishmentImages} name={establishmentName} alt={establishmentName} shape="establishment" className="item-establishment-logo mb-2" loading="lazy" />
                  <div className="item-establishment-name text-light fw-semibold">{establishmentName}</div>
                  <div className="item-establishment-location text-secondary small">{establishment.city}{establishment.city && (establishment.uf || establishment.state) ? " - " : ""}{establishment.uf || establishment.state}</div>
                </div>
              </div>
            )}

            <Button variant="outline-warning" className="w-100" onClick={handleScheduleClick}>Adquirir {item.name}</Button>
            {metrics && <div className="mt-4"><div className="text-light small"><strong>Métricas</strong></div><div className="text-secondary small">Total de Visualizações: {metrics.total_views || 0}</div><div className="text-secondary small">Usuários Únicos: {metrics.unique_users || 0}</div></div>}
            {ordersSummary && <div className="mt-3"><div className="text-light small"><strong>Pedidos</strong></div><div className="text-secondary small">Confirmados: {ordersSummary.confirmed || 0}</div><div className="text-secondary small">Concluídos: {ordersSummary.completed || 0}</div><div className="text-secondary small">Cancelados: {ordersSummary.cancelled || 0}</div></div>}
            {userInteractions?.length > 0 && <div className="mt-4"><div className="text-light small mb-2"><strong>Últimas Interações</strong></div>{userInteractions.slice(0, 5).map((ui) => <div key={ui.user_id} className="text-secondary small mb-1 cursor-pointer" onClick={() => ui.user_name ? navigate(`/user/view/${ui.user_name}`) : null}>👤 {ui.name} • {ui.last_interaction}</div>)}</div>}
          </Card.Body>
        </Card>
      </div>
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered size="md" backdrop="static" className="login-modal"><Modal.Body className="bg-dark text-light p-4 rounded-3"><h5 className="text-center mb-3">Faça login para continuar</h5><LoginFormComponent onSuccess={handleLoginSuccess} /></Modal.Body></Modal>
    </>
  );
}

ItemSidebar.propTypes = { item: PropTypes.object, entity: PropTypes.object, metrics: PropTypes.object, ordersSummary: PropTypes.object, userInteractions: PropTypes.array, imageUrl: PropTypes.func, handleImgError: PropTypes.func, navigate: PropTypes.func.isRequired, openSchedulePopup: PropTypes.func.isRequired };
