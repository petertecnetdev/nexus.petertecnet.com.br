// src/pages/order/OrderListPage.jsx
import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import GlobalNav from "../../components/GlobalNav";
import GlobalHeroList from "../../components/GlobalHeroList";
import GlobalButton from "../../components/GlobalButton";
import useOrderListBySlug from "../../hooks/useOrderListBySlug";
import useImageUtils from "../../hooks/useImageUtils";
import "./OrderListPage.css";

const PLACEHOLDER = "/images/logo.png";
const AVATAR_PLACEHOLDER = "/images/logo.png";

export default function OrderListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  const { establishment, orders, loading, apiError, refetch } =
    useOrderListBySlug(slug);

  const fmtBRL = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const fmtDate = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR");
  };

  const getPersonName = (u) => {
    if (!u) return null;
    const full = `${u.first_name || ""} ${u.last_name || ""}`.trim();
    return full || u.user_name || u.email || null;
  };

  const getAttendantUser = (order) =>
    order?.attendant_user || order?.attendant?.user || null;

  const getAttendantName = (order) => getPersonName(getAttendantUser(order));

  const getAttendantAvatar = (order) =>
    getAttendantUser(order)?.avatar || null;

  const getEmployerId = (order) => order?.attendant?.id || null;

  const goEmployerProfile = (order) => {
    const employerId = getEmployerId(order);
    const user = getAttendantUser(order);
    const username = user?.user_name;

    if (username) {
      navigate(`/employer/${username}`);
      return;
    }

    if (employerId) {
      navigate(`/employer/view/${employerId}`);
      return;
    }

    if (user?.id) {
      navigate(`/user/${user.id}`);
      return;
    }
  };

  const heroData = useMemo(
    () => ({
      logo: establishment?.logo || PLACEHOLDER,
      background: null,
      title: "Pedidos",
      subtitle: establishment
        ? `${establishment.fantasy || establishment.name} · ${establishment.city} - ${establishment.uf}`
        : "",
      description: "Lista de pedidos do estabelecimento",
      metrics: [
        { label: "Pedidos", value: orders.length },
        {
          label: "Agendados",
          value: orders.filter((o) => o?.type === "appointment").length,
        },
      ],
    }),
    [establishment, orders]
  );

  return (
    <>
      <GlobalNav />

      <GlobalHeroList
        logo={heroData.logo}
        background={heroData.background}
        title={heroData.title}
        subtitle={heroData.subtitle}
        description={heroData.description}
        metrics={heroData.metrics}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
      />

      <Container className="py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="text-muted small">
            {establishment ? `Estabelecimento #${establishment.id}` : ""}
          </div>
          <div className="d-flex gap-2">
            <GlobalButton
              variant="outline"
              onClick={() => navigate(-1)}
              className="olp-btn"
            >
              Voltar
            </GlobalButton>
            <GlobalButton
              variant="neon"
              onClick={refetch}
              className="olp-btn"
              disabled={loading}
            >
              Atualizar
            </GlobalButton>
          </div>
        </div>

        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" />
          </div>
        )}

        {!loading && apiError && <Alert variant="danger">{apiError}</Alert>}

        {!loading && !apiError && orders.length === 0 && (
          <Alert variant="secondary" className="text-center">
            Nenhum pedido encontrado.
          </Alert>
        )}

        {!loading && !apiError && orders.length > 0 && (
          <Row className="gy-3">
            {orders.map((order) => {
              const attendantName = getAttendantName(order);
              const attendantAvatar = getAttendantAvatar(order);
              const clientName =
                order?.customer_name ||
                getPersonName(order?.client) ||
                "Não informado";

              const canOpenEmployer =
                !!getEmployerId(order) ||
                !!getAttendantUser(order)?.user_name ||
                !!getAttendantUser(order)?.id;

              return (
                <Col xs={12} key={order.id}>
                  <div className="olp-card">
                    <Row className="align-items-center g-3">
                      <Col xs={12} md={3} className="olp-left">
                        <div className="olp-order-number">
                          #{order.order_number || order.id}
                        </div>
                        <div className="olp-date">{fmtDate(order.order_datetime)}</div>
                        <div className="olp-badges">
                          <Badge bg="secondary" className="me-2">
                            {order.status || "-"}
                          </Badge>
                          <Badge bg="dark" className="border border-secondary">
                            {order.type || "-"}
                          </Badge>
                        </div>
                      </Col>

                      <Col xs={12} md={6}>
                        <div className="olp-line">
                          <span className="olp-label">Cliente:</span>{" "}
                          <span className="olp-value">{clientName}</span>
                        </div>

                        <div className="olp-line olp-attendant">
                          <span className="olp-label">Profissional:</span>{" "}
                          <div className="olp-attendant-box">
                            <img
                              src={imageUrl(attendantAvatar || AVATAR_PLACEHOLDER)}
                              alt="Avatar"
                              className="olp-avatar"
                              onError={handleImgError}
                            />
                            <button
                              type="button"
                              className="olp-attendant-link"
                              onClick={() => canOpenEmployer && goEmployerProfile(order)}
                              disabled={!canOpenEmployer}
                              title={canOpenEmployer ? "Ver perfil" : "Sem perfil disponível"}
                            >
                              {attendantName || "Não definido"}
                            </button>
                          </div>
                        </div>

                        <div className="olp-meta">
                          <div className="olp-meta-item">
                            <span className="olp-meta-k">Duração</span>
                            <span className="olp-meta-v">
                              {order?.total_duration ? `${order.total_duration} min` : "-"}
                            </span>
                          </div>

                          <div className="olp-meta-item">
                            <span className="olp-meta-k">Pagamento</span>
                            <span className="olp-meta-v">
                              {order?.payment_method || "-"} ·{" "}
                              {order?.payment_status || "-"}
                            </span>
                          </div>

                          <div className="olp-meta-item">
                            <span className="olp-meta-k">Origem</span>
                            <span className="olp-meta-v">{order?.origin || "-"}</span>
                          </div>
                        </div>
                      </Col>

                      <Col xs={12} md={3} className="text-md-end">
                        <div className="olp-price">{fmtBRL(order.total_price)}</div>

                        <div className="d-flex justify-content-md-end gap-2 mt-2">
                          <GlobalButton
                            variant="outline"
                            className="olp-btn"
                            onClick={() => navigate(`/order/${order.id}`)}
                          >
                            Ver
                          </GlobalButton>

                          {canOpenEmployer && (
                            <GlobalButton
                              variant="ghost"
                              className="olp-btn"
                              onClick={() => goEmployerProfile(order)}
                            >
                              Perfil
                            </GlobalButton>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </>
  );
}
