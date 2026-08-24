// src/components/employer/EmployerScheduleAddForm.jsx
import React, { useMemo } from "react";
import { Card, Row, Col, Form, Button, Alert } from "react-bootstrap";
import PropTypes from "prop-types";
import "./EmployerScheduleAddForm.css";

export default function EmployerScheduleAddForm({
  days,
  addDay,
  setAddDay,
  addStart,
  setAddStart,
  addEnd,
  setAddEnd,
  onAdd,
}) {
  const isInvalidRange = useMemo(() => {
    if (!addStart || !addEnd) return false;
    return addEnd <= addStart;
  }, [addStart, addEnd]);

  return (
    <Card className="esaf-card mb-4">
      <Card.Body>
        <div className="esaf-header mb-3">
          <div className="esaf-title">
            <i className="bi bi-plus-circle-fill me-2" />
            Adicionar horário
          </div>
          <div className="esaf-subtitle">
            Crie novos períodos de atendimento para sua agenda
          </div>
        </div>

        {isInvalidRange && (
          <Alert variant="danger" className="py-2">
            O horário de término deve ser posterior ao horário de início.
          </Alert>
        )}

        <Row className="align-items-end g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Dia da semana</Form.Label>
              <Form.Select
                value={addDay}
                onChange={(e) => setAddDay(e.target.value)}
              >
                {days.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Início</Form.Label>
              <Form.Control
                type="time"
                value={addStart}
                onChange={(e) => setAddStart(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Fim</Form.Label>
              <Form.Control
                type="time"
                value={addEnd}
                onChange={(e) => setAddEnd(e.target.value)}
                isInvalid={isInvalidRange}
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Button
              className="w-100 esaf-add-btn"
              disabled={isInvalidRange}
              onClick={onAdd}
            >
              Adicionar
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

EmployerScheduleAddForm.propTypes = {
  days: PropTypes.array.isRequired,
  addDay: PropTypes.string.isRequired,
  setAddDay: PropTypes.func.isRequired,
  addStart: PropTypes.string.isRequired,
  setAddStart: PropTypes.func.isRequired,
  addEnd: PropTypes.string.isRequired,
  setAddEnd: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};
