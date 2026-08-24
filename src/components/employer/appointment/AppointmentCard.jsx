import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { CheckCircle, XCircle } from "react-bootstrap-icons";
import { weekdayPt, shortPt, toHourMin } from "../../../utils/dateUtils";
import { translateStatus } from "../../../utils/statusUtils";
import { money } from "../../../utils/moneyUtils";

export default function AppointmentCard({ a, handleAction }) {
  return (
    <Card className="appointment-card">
      <Card.Body>
        {/* Cabeçalho */}
        <div className="appointment-card__head">
          <div className="appointment-card__client">{a.customer_name}</div>

          <Badge
            className={
              a.appointment_status === "pending"
                ? "badge status-pendente"
                : a.appointment_status === "confirmed"
                ? "badge status-confirmado"
                : a.appointment_status === "attended"
                ? "badge status-atendido"
                : a.appointment_status === "not_attended"
                ? "badge status-nao-atendido"
                : "badge bg-secondary"
            }
          >
            {translateStatus(a.appointment_status)}
          </Badge>
        </div>

        {/* Quando */}
        <div className="appointment-card__row">
          <span className="appointment-card__label">Quando</span>
          <span className="appointment-card__value">
            {weekdayPt(a.order_datetime)} — {shortPt(a.order_datetime)} às{" "}
            {toHourMin(a.order_datetime)}
          </span>
        </div>

        {/* Pedido */}
        <div className="appointment-card__row">
          <span className="appointment-card__label">Pedido</span>
          <span className="appointment-card__value">#{a.order_number}</span>
        </div>

        {/* Valor */}
        <div className="appointment-card__row">
          <span className="appointment-card__label">Valor</span>
          <span className="appointment-card__value">R${money(a.total_price)}</span>
        </div>

        {/* Serviços */}
        {Array.isArray(a.services) && a.services.length > 0 && (
          <div className="appointment-card__row">
            <span className="appointment-card__label">Serviços</span>
            <span className="appointment-card__value">
              {a.services.map((s) => s.name).join(", ")}
            </span>
          </div>
        )}

        {/* Ações */}
        <div className="d-flex gap-2 mt-2">
          {a.appointment_status === "pending" && (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleAction(a, "confirm")}
            >
              <CheckCircle className="me-1" /> Confirmar
            </Button>
          )}

          {["pending", "confirmed"].includes(a.appointment_status) && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleAction(a, "cancel")}
            >
              <XCircle className="me-1" /> Cancelar
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
