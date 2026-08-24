import React from "react";
import { Row, Col, Form, Button, ButtonGroup } from "react-bootstrap";

export default function HomeToolbar({
  search,
  setSearch,
  cityFilter,
  setCityFilter,
  cities,
  sort,
  setSort,
}) {
  return (
    <Row className="hp-toolbar gx-2 gy-2 align-items-end">
      <Col xs={12} md={6} lg={5}>
        <Form.Group controlId="hp-search">
          <Form.Label className="hp-label">Buscar</Form.Label>
          <Form.Control
            type="search"
            placeholder="Nome, endereço ou cidade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="hp-input"
          />
        </Form.Group>
      </Col>

      <Col xs={6} md={3} lg={3}>
        <Form.Group controlId="hp-city">
          <Form.Label className="hp-label">Cidade</Form.Label>
          <Form.Select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="hp-select"
          >
            <option value="">Todas</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col xs={12} lg={2}>
        <Form.Label className="hp-label d-none d-lg-block">Ordenar</Form.Label>
        <ButtonGroup className="w-100">
          <Button
            size="sm"
            variant={sort === "name_asc" ? "warning" : "dark"}
            onClick={() => setSort("name_asc")}
          >
            A–Z
          </Button>
          <Button
            size="sm"
            variant={sort === "name_desc" ? "warning" : "dark"}
            onClick={() => setSort("name_desc")}
          >
            Z–A
          </Button>
        </ButtonGroup>
      </Col>
    </Row>
  );
}
