// src/pages/employer/EmployerOrdersPage.jsx
import React from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Card,
  Badge,
  ListGroup,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import GlobalNav from "../../components/GlobalNav";
import EmployerHero from "../../components/employer/EmployerHero";
import useEmployerOrders from "../../hooks/useEmployerOrders";
import useImageUtils from "../../hooks/useImageUtils";

export default function EmployerOrdersPage() {
  const {
    orders,
    employer,
    loading,
    apiError,
    actionLoading,
    updateOrderStatus,
  } = useEmployerOrders();

  const { imageUrl, handleImgError } = useImageUtils();

  const fmtBRL = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const fmtDateTime = (v) =>
    v ? new Date(v).toLocaleString("pt-BR") : "-";

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() + parts.at(-1)[0].toUpperCase();
  };

  const confirmAction = async (order, action) => {
    const map = {
      confirm: {
        title: "Confirmar agendamento?",
        text: `Confirmar o agendamento de ${order.customer?.name} em ${fmtDateTime(
          order.scheduled_start
        )}?`,
        confirm: "Sim, confirmar",
      },
      cancel: {
        title: "Cancelar agendamento?",
        text: `Cancelar o agendamento de ${order.customer?.name} em ${fmtDateTime(
          order.scheduled_start
        )}?`,
        confirm: "Sim, cancelar",
      },
      attended: {
        title: "Finalizar atendimento",
        text: `Confirmar que ${order.customer?.name} foi atendido?`,
        confirm: "Sim, atendido",
      },
      not_attended: {
        title: "Finalizar atendimento",
        text: `Confirmar que ${order.customer?.name} não compareceu?`,
        confirm: "Sim, não atendido",
      },
    };

    const cfg = map[action];
    if (!cfg) return;

    const res = await Swal.fire({
      title: cfg.title,
      text: cfg.text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: cfg.confirm,
      cancelButtonText: "Voltar",
      reverseButtons: true,
      background: "#0b1220",
      color: "#e5e7eb",
    });

    if (!res.isConfirmed) return;

    try {
      await updateOrderStatus(order.id, action);
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Status atualizado com sucesso.",
        timer: 1600,
        showConfirmButton: false,
        background: "#0b1220",
        color: "#e5e7eb",
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: e.message,
        background: "#0b1220",
        color: "#e5e7eb",
      });
    }
  };

  const now = new Date();

  if (loading) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!employer) {
    return (
      <>
        <GlobalNav />
        <Container className="py-4">
          <Alert variant="warning">
            Colaborador não encontrado ou não vinculado.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />
      <Container className="py-4">
        <EmployerHero
          title="Meus Atendimentos"
          subtitle="Agendamentos e pedidos vinculados a você"
          icon="bi-calendar-check-fill"
          badge="Painel do Profissional"
        />

        {apiError && <Alert variant="danger">{apiError}</Alert>}

        {orders.length === 0 && (
          <Alert variant="secondary">Nenhum atendimento encontrado.</Alert>
        )}

        {orders.map((order) => {
          const start = order.scheduled_start
            ? new Date(order.scheduled_start)
            : null;
          const end = order.scheduled_end
            ? new Date(order.scheduled_end)
            : null;

          const canConfirm =
            order.type === "appointment" &&
            order.appointment_status === "pending" &&
            start &&
            now < start;

          const canFinish =
            order.type === "appointment" &&
            order.appointment_status === "confirmed" &&
            end &&
            now >= end;

          const canCancelBeforeStart =
            order.type === "appointment" &&
            ["pending", "confirmed"].includes(order.appointment_status) &&
            start &&
            now < start;

          const statusLabel = {
            pending: "Pendente",
            confirmed: "Confirmado",
            attended: "Atendido",
            not_attended: "Não atendido",
            cancelled: "Cancelado",
          }[order.appointment_status];

          const avatar =
            imageUrl(order.customer?.avatar) ||
            imageUrl(order.customer?.images?.avatar);

          return (
            <Card
              key={order.id}
              className="mb-4"
              style={{
                background: "#0b1220",
                border: "1px solid rgba(148,163,184,.12)",
                borderRadius: 14,
              }}
            >
              <Card.Body>
                <Row className="mb-3 align-items-center">
                  <Col md={4} style={{ color: "#e5e7eb", fontWeight: 600 }}>
                    #{order.order_number}
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      {fmtDateTime(order.created_at)}
                    </div>
                  </Col>

                  <Col md={4}>
                    <Badge bg="secondary">{statusLabel}</Badge>
                  </Col>

                  <Col
                    md={4}
                    className="text-md-end"
                    style={{ color: "#e5e7eb", fontWeight: 600 }}
                  >
                    {fmtBRL(order.total_price)}
                  </Col>
                </Row>

                <Row className="mb-3 align-items-center">
                  <Col md={6} className="d-flex align-items-center gap-3">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={order.customer?.name}
                        width={48}
                        height={48}
                        onError={handleImgError}
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg,#1e293b,#020617)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#e5e7eb",
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(order.customer?.name)}
                      </div>
                    )}

                    <div style={{ color: "#e5e7eb" }}>
                      Cliente:{" "}
                      {order.customer?.user_name ? (
                        <Link
                          to={`/user/${order.customer.user_name}`}
                          style={{ color: "#60a5fa" }}
                        >
                          {order.customer.name}
                        </Link>
                      ) : (
                        order.customer?.name
                      )}
                    </div>
                  </Col>

                  {order.type === "appointment" && (
                    <Col md={6} style={{ color: "#94a3b8" }}>
                      Horário: {fmtDateTime(order.scheduled_start)} →{" "}
                      {fmtDateTime(order.scheduled_end)}
                    </Col>
                  )}
                </Row>

                <ListGroup variant="flush">
                  {order.items?.map((item, idx) => (
                    <ListGroup.Item
                      key={idx}
                      style={{
                        background: "transparent",
                        color: "#e5e7eb",
                        borderColor: "rgba(148,163,184,.12)",
                      }}
                    >
                      <Row>
                        <Col md={6}>{item.name}</Col>
                        <Col md={3}>
                          {item.quantity}x {fmtBRL(item.unit_price)}
                        </Col>
                        <Col md={3} className="text-md-end">
                          {fmtBRL(item.subtotal)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                <div className="d-flex gap-2 justify-content-end mt-3 flex-wrap">
                  {canConfirm && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={actionLoading === order.id}
                      onClick={() => confirmAction(order, "confirm")}
                    >
                      Confirmar
                    </Button>
                  )}

                  {canFinish && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        disabled={actionLoading === order.id}
                        onClick={() => confirmAction(order, "attended")}
                      >
                        Atendido
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={actionLoading === order.id}
                        onClick={() =>
                          confirmAction(order, "not_attended")
                        }
                      >
                        Não atendido
                      </Button>
                    </>
                  )}

                  {canCancelBeforeStart && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={actionLoading === order.id}
                      onClick={() => confirmAction(order, "cancel")}
                    >
                      Cancelar
                    </Button>
                  )}

                  <Button
                    as={Link}
                    to={`/order/view/${order.id}`}
                    size="sm"
                    variant="outline-primary"
                  >
                    Ver detalhes
                  </Button>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </Container>
    </>
  );
}
