import React from "react";
import { Card, Badge } from "react-bootstrap";
import { Clock } from "react-bootstrap-icons";
import { weekdayPt, shortPt, toHourMin } from "../../../utils/dateUtils";
import { translateStatus } from "../../../utils/statusUtils";

export default function NextAppointmentCard({ nextAppointment }) {
  return (
    <Card className="glass-card card-next">
      <Card.Body>
        <h5 className="card-title-underline text-info">
          <Clock className="me-2" />
          Próximo Agendamento
        </h5>

        {nextAppointment ? (
          <>
            {/* Cliente */}
            <div className="row-info">
              <div className="row-info__left">
                <div className="row-info__label">Cliente</div>
                <div className="row-info__value">
                  {nextAppointment.customer_name}
                </div>
              </div>

              <div className="row-info__right">
                <Badge
                  bg={
                    nextAppointment.appointment_status === "pending"
                      ? "warning"
                      : nextAppointment.appointment_status === "confirmed"
                      ? "info"
                      : "secondary"
                  }
                  className={
                    nextAppointment.appointment_status === "pending"
                      ? "status-pendente"
                      : nextAppointment.appointment_status === "confirmed"
                      ? "status-confirmado"
                      : "status-outros"
                  }
                >
                  {translateStatus(nextAppointment.appointment_status)}
                </Badge>
              </div>
            </div>

            {/* Datas */}
            <div className="row-info">
              <div className="row-info__left">
                <div className="row-info__label">Data</div>
                <div className="row-info__value">
                  {weekdayPt(nextAppointment.order_datetime)} —{" "}
                  {shortPt(nextAppointment.order_datetime)} às{" "}
                  {toHourMin(nextAppointment.order_datetime)}
                </div>
              </div>

              <div className="row-info__right">
                <Badge bg="dark">#{nextAppointment.order_number}</Badge>
              </div>
            </div>
          </>
        ) : (
          <div className="text-muted">Nenhum próximo agendamento.</div>
        )}
      </Card.Body>
    </Card>
  );
}
