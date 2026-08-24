import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { CheckCircle, XCircle, Clock } from "react-bootstrap-icons";
import { weekdayPt, shortPt, toHourMin } from "../../../utils/dateUtils";

export default function NextPendingCard({ nextPendingAppointment, handleAction }) {
  return (
    <Card
      className={`glass-card card-next-pending ${
        nextPendingAppointment ? "pulse-card" : ""
      }`}
    >
      <Card.Body>
        <h5 className="card-title-underline text-warning">
          <Clock className="me-2" />
          Próximo Agendamento Pendente
        </h5>

        {nextPendingAppointment ? (
          <>
            <div className="row-info">
              <div className="row-info__left">
                <div className="row-info__label">Cliente</div>
                <div className="row-info__value">
                  {nextPendingAppointment.customer_name}
                </div>
              </div>
              <div className="row-info__right">
                <Badge bg="warning" className="badge status-pendente">
                  Pendente
                </Badge>
              </div>
            </div>

            <div className="row-info">
              <div className="row-info__left">
                <div className="row-info__label">Data</div>
                <div className="row-info__value">
                  {weekdayPt(nextPendingAppointment.order_datetime)} —{" "}
                  {shortPt(nextPendingAppointment.order_datetime)} às{" "}
                  {toHourMin(nextPendingAppointment.order_datetime)}
                </div>
              </div>
              <div className="row-info__right">
                <Badge bg="dark">
                  #{nextPendingAppointment.order_number}
                </Badge>
              </div>
            </div>

            <div className="d-flex gap-2 mt-3">
              <Button
                size="sm"
                variant="success"
                onClick={() => handleAction(nextPendingAppointment, "confirm")}
              >
                <CheckCircle className="me-1" /> Confirmar
              </Button>

              <Button
                size="sm"
                variant="danger"
                onClick={() => handleAction(nextPendingAppointment, "cancel")}
              >
                <XCircle className="me-1" /> Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="text-muted">
            Nenhum agendamento pendente a decidir.
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
