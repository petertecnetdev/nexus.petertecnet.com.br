import React from "react";
import { Card, Badge } from "react-bootstrap";
import { weekdayPt, shortPt, toHourMin } from "../../../utils/dateUtils";
import { translateStatus } from "../../../utils/statusUtils";

export default function RecentAppointmentsCard({ recentAppointments, flashIds }) {
  return (
    <Card className="glass-card card-recents">
      <Card.Body>
        <h5 className="card-title-underline text-success">
          🆕 Agendamentos Recentes
        </h5>

        {recentAppointments.length ? (
          recentAppointments.map((a) => (
            <div
              key={a.id}
              className={`recent-item ${flashIds.has(a.id) ? "pulse-card" : ""}`}
            >
              {/* Cabeçalho */}
              <div className="recent-item__head">
                <b className="recent-item__client">{a.customer_name}</b>
                <Badge bg="dark">#{a.order_number}</Badge>
              </div>

              {/* Data */}
              <div className="recent-item__body">
                {weekdayPt(a.order_datetime)} — {shortPt(a.order_datetime)} às{" "}
                {toHourMin(a.order_datetime)}
              </div>

              {/* Status */}
              <div className="recent-item__status">
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
            </div>
          ))
        ) : (
          <div className="text-center text-muted p-3">
            Sem novidades por enquanto.
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
