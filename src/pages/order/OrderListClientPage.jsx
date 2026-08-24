// src/pages/order/OrderListClientPage.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import GlobalNav from "../../components/GlobalNav";
import GlobalHeroList from "../../components/GlobalHeroList";
import GlobalButton from "../../components/GlobalButton";
import useOrderListClient from "../../hooks/useOrderListClient";
import useImageUtils from "../../hooks/useImageUtils";
import { i18nOrder } from "../../utils/i18nOrder";
import * as dateUtils from "../../utils/dateUtils";
import "./OrderListPage.css";

const PLACEHOLDER = "/images/logo.png";
const AVATAR_PLACEHOLDER = "/images/logo.png";

export default function OrderListClientPage() {
  const navigate = useNavigate();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);
  const { orders, loading, apiError, refetch } = useOrderListClient();

  const fmtBRL = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const getAttendantUser = (order) =>
    order?.employer?.user || order?.attendant_user || null;

  const getAttendantName = (order) => {
    const u = getAttendantUser(order);
    if (!u) return "Não definido";
    return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.user_name;
  };

  const getAttendantAvatar = (order) => {
    const user = getAttendantUser(order);
    if (!user?.files) return null;
    return user.files.find((f) => f.type === "avatar")?.public_url || null;
  };

  const heroData = useMemo(
    () => ({
      logo: PLACEHOLDER,
      background: null,
      title: "Meus Pedidos",
      subtitle: "Histórico de pedidos realizados",
      description: "Lista de pedidos do cliente autenticado",
      metrics: [
        { label: "Pedidos", value: orders.length },
        {
          label: "Agendamentos",
          value: orders.filter((o) => o?.type === "appointment").length,
        },
      ],
    }),
    [orders]
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
          <div className="text-muted small">Meus pedidos</div>
          <GlobalButton
            variant="neon"
            onClick={refetch}
            className="olp-btn"
            disabled={loading}
          >
            Atualizar
          </GlobalButton>
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
              const start = dateUtils.normalizeDateLike(order.order_datetime);
              const end =
                start && order.total_duration
                  ? start.plus({ minutes: order.total_duration })
                  : null;

              return (
                <Col xs={12} key={order.id}>
                  <div className="olp-card">
                    <Row className="g-3">
                      {/* Data do atendimento destacada */}
                      <Col xs={12} className="text-center mb-3">
                        <h5 className="olp-date-highlight text-primary">
                          {dateUtils.fmtFriendlyDate(order.order_datetime)}{" "}
                          {end && `- ${dateUtils.toHourMin(end)}`}
                        </h5>
                        <div className="olp-order-created text-secondary">
                          Pedido criado em:{" "}
                          {dateUtils.fmtFriendlyDate(order.created_at)}
                        </div>
                      </Col>

                      <Col xs={12} md={3}>
                        <div className="olp-order-number">
                          #{order.order_number || order.id}
                        </div>
                        <Badge bg="secondary" className="me-2">
                          {i18nOrder.status(order.status)}
                        </Badge>
                        <Badge bg="dark">{i18nOrder.type(order.type)}</Badge>
                      </Col>

                      <Col xs={12} md={6}>
                        <div className="olp-line olp-attendant">
                          <span className="olp-label">Profissional:</span>
                          <div
                            className="olp-attendant-box olp-clickable"
                            onClick={() =>
                              order.attendant?.user?.user_name &&
                              navigate(
                                `/employer/${order.attendant.user.user_name}`
                              )
                            }
                          >
                            <img
                              src={imageUrl(
                                getAttendantAvatar(order) || AVATAR_PLACEHOLDER
                              )}
                              alt="Avatar"
                              className="olp-avatar"
                              onError={handleImgError}
                            />
                            <span className="olp-attendant-link">
                              {getAttendantName(order)}
                            </span>
                          </div>
                        </div>

                        <div className="olp-items">
                          {order?.items?.map((it) => (
                            <div
                              key={it.id}
                              className="olp-item olp-clickable"
                              onClick={() =>
                                navigate(`/item/view/${it.item?.id}`)
                              }
                            >
                              {it.quantity}x {it.item?.name} —{" "}
                              {fmtBRL(it.total_price)}
                            </div>
                          ))}
                        </div>

                        <div className="olp-meta">
                          <div>
                            Duração:{" "}
                            {order.total_duration
                              ? `${order.total_duration} min`
                              : "-"}
                          </div>
                          <div>
                            Pagamento:{" "}
                            {i18nOrder.paymentStatus(order.payment_status)}
                          </div>
                          <div>Origem: {i18nOrder.origin(order.origin)}</div>
                        </div>
                      </Col>

                      <Col xs={12} md={6}>
                        <div className="olp-line olp-establishment">
                          <span className="olp-label">Estabelecimento:</span>
                          <div
                            className="olp-attendant-box olp-clickable"
                            onClick={() =>
                              order.establishment?.slug &&
                              navigate(
                                `/establishment/view/${order.establishment.slug}`
                              )
                            }
                          >
                            <img
                              src={imageUrl(
                                order.establishment?.files?.find(
                                  (f) => f.type === "logo"
                                )?.public_url || AVATAR_PLACEHOLDER
                              )}
                              alt="Logo"
                              className="olp-avatar"
                              onError={handleImgError}
                            />
                            <span className="olp-attendant-link">
                              {order.establishment?.name || "Não definido"}
                            </span>
                          </div>
                        </div>
                      </Col>

                      <Col xs={12} md={3} className="text-md-end">
                        <div className="olp-price">
                          {fmtBRL(order.total_price)}
                        </div>
                        <GlobalButton
                          variant="outline"
                          onClick={() => navigate(`/order/${order.id}`)}
                        >
                          Ver
                        </GlobalButton>
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
