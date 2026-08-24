import React from "react";
import { Row, Col, Button, ButtonGroup, Form } from "react-bootstrap";
import { Funnel, ListUl } from "react-bootstrap-icons";
import { STATUS_KEYS } from "../../../utils/statusUtils";

export default function EmployerFilters({ filters, setFilters, timeButtons }) {
  return (
    <>
      {/* STATUS */}
      <Row className="align-items-center mb-3 g-2">
        <Col md="9" sm="12">
          <div className="d-flex flex-wrap align-items-center">
            <Funnel className="me-2 text-info" />
            <span className="filters-bar__label me-2">Status:</span>

            <ButtonGroup className="filters-status flex-wrap">
              <Button
                size="sm"
                variant={filters.status === "all" ? "light" : "outline-light"}
                className={`btn-chip ${
                  filters.status === "all" ? "btn-chip--active" : ""
                }`}
                onClick={() => setFilters((f) => ({ ...f, status: "all" }))}
              >
                Todos
              </Button>

              {STATUS_KEYS.filter((s) => s !== "all").map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filters.status === s ? "light" : "outline-light"}
                  className={`btn-chip ${
                    filters.status === s ? "btn-chip--active" : ""
                  }`}
                  onClick={() => setFilters((f) => ({ ...f, status: s }))}
                >
                  {s}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </Col>

        {/* BUSCA */}
        <Col md="3" sm="12">
          <Form.Control
            placeholder="🔍 Buscar por cliente ou serviço..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
          />
        </Col>
      </Row>

      {/* TEMPO */}
      <Row className="align-items-center g-2">
        <Col>
          <div className="d-flex flex-wrap align-items-center">
            <ListUl className="me-2 text-info" />
            <span className="filters-bar__label me-2">Tempo:</span>

            <ButtonGroup className="filters-time flex-wrap">
              <Button
                size="sm"
                variant={filters.day === "all" ? "light" : "outline-light"}
                className={`btn-chip ${
                  filters.day === "all" ? "btn-chip--active" : ""
                }`}
                onClick={() => setFilters((f) => ({ ...f, day: "all" }))}
              >
                Todos
              </Button>

              {timeButtons.map((b) => (
                <Button
                  key={b.key}
                  size="sm"
                  variant={filters.day === b.key ? "light" : "outline-light"}
                  className={`btn-chip ${
                    filters.day === b.key ? "btn-chip--active" : ""
                  }`}
                  onClick={() => setFilters((f) => ({ ...f, day: b.key }))}
                >
                  {b.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </Col>
      </Row>
    </>
  );
}
