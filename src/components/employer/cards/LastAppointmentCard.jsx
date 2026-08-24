import React from "react";
import { Card, Badge } from "react-bootstrap";
import { weekdayPt, shortPt, toHourMin } from "../../../utils/dateUtils";
import { translateStatus } from "../../../utils/statusUtils";

export default function LastAppointmentCard({ lastAppointment }) {
  return (
    <Card className="glass-card card-last">
      <Card.Body>
        <h5 className="card-title-underline text-light">
          📅 Último Agendamento Marcado
        </h5>

        {lastAppointment ? (
          <>
            {/* Cliente */}
            <div className="row-info">
              <div className="row-info__left">
                <div className="row-info__label">Cliente</div>
                <div className="row-info__value">
                  {lastAppointment.customer_name}
                </div>
              </div>

              <div className="row-info__right">
                <Badge
                  className={
                    lastAppointment.appointment_status === "pending"
                      ? "badge status-pendente"
                      : lastAppointment.appointment_status === "confirmed"
                      ? "badge status-confirmado"
                      : lastAppointment.appointment_status === "attended"
                      ? "badge status-atendido"
                      : lastAppointment.appointment_status === "not_attended"
                      ? "badge status-nao-atendido"
                      : "badge bg-secondary"
                  }
                >
                  {translateStatus(lastAppointment.appointment_status)}
                </Badge>
              </div>
            </div>

            {/* Data */}
            <div className="row-info">
              <div className="row-info__left">
                <div className="row-info__label">Data</div>
                <div className="row-info__value">
                  {weekdayPt(lastAppointment.order_datetime)} —{" "}
                  {shortPt(lastAppointment.order_datetime)} às{" "}
                  {toHourMin(lastAppointment.order_datetime)}
                </div>
              </div>

              <div className="row-info__right">
                <Badge bg="dark">#{lastAppointment.order_number}</Badge>
              </div>
            </div>
          </>
        ) : (
          <div className="text-muted">Nenhum atendimento anterior.</div>
        )}
      </Card.Body>
    </Card>
  );
}
