// src/components/employer/EmployerScheduleDayCard.jsx
import React from "react";
import { Card, Spinner, Table, Button } from "react-bootstrap";
import PropTypes from "prop-types";

export default function EmployerScheduleDayCard({
  label,
  list,
  loading,
  onRemove,
}) {
  return (
    <Card className="mb-3">
      <Card.Header>{label}</Card.Header>
      <Card.Body>
        {loading ? (
          <Spinner animation="border" />
        ) : list.length === 0 ? (
          <div className="text-muted">Nenhum horário cadastrado.</div>
        ) : (
          <Table responsive bordered size="sm">
            <thead>
              <tr>
                <th>Início</th>
                <th>Fim</th>
                <th width="1%" />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{s.start_time}</td>
                  <td>{s.end_time}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRemove(s)}
                    >
                      Remover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}

EmployerScheduleDayCard.propTypes = {
  label: PropTypes.string.isRequired,
  list: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onRemove: PropTypes.func.isRequired,
};
