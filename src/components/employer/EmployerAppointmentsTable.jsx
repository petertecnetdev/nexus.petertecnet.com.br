// src/components/employer/EmployerAppointmentsTable.jsx
import React from "react";
import { Table, Spinner, Alert, Badge } from "react-bootstrap";
import PropTypes from "prop-types";

export default function EmployerAppointmentsTable({
  loading,
  appointments,
  statusMap,
  fmtDate,
}) {
  if (loading) {
    return <Spinner animation="border" />;
  }

  if (appointments.length === 0) {
    return <Alert variant="info">Nenhum agendamento encontrado.</Alert>;
  }

  return (
    <Table responsive bordered hover>
      <thead>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Data</th>
          <th>Status</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((o) => {
          const status = statusMap[o.appointment_status] || {};

          return (
            <tr key={o.id}>
              <td>{o.order_number}</td>
              <td>{o.customer_name}</td>
              <td>{fmtDate(o.order_datetime)}</td>
              <td>
                <Badge bg={status.variant || "secondary"}>
                  {status.text || o.appointment_status}
                </Badge>
              </td>
              <td>
                {(o.total_price || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

EmployerAppointmentsTable.propTypes = {
  loading: PropTypes.bool.isRequired,
  appointments: PropTypes.array.isRequired,
  statusMap: PropTypes.object.isRequired,
  fmtDate: PropTypes.func.isRequired,
};
