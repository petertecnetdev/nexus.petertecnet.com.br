import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import NavlogComponent from "../../components/NavlogComponent";

import useEmployerDashboard from "../../hooks/useEmployerDashboard";

import EmployerFilters from "../../components/employer/filters/EmployerFilters";
import EmployerKpiSection from "../../components/employer/kpi/EmployerKpiSection";

import NextPendingCard from "../../components/employer/cards/NextPendingCard";
import NextAppointmentCard from "../../components/employer/cards/NextAppointmentCard";
import LastAppointmentCard from "../../components/employer/cards/LastAppointmentCard";
import RecentAppointmentsCard from "../../components/employer/cards/RecentAppointmentsCard";

import AppointmentCard from "../../components/employer/appointment/AppointmentCard";

import EmployerNotificationStack from "../../components/employer/notification/EmployerNotificationStack";

import "./EmployerDashboard.css";

export default function EmployerDashboardPage() {
  const {
    summary,
    nextAppointment,
    lastAppointment,
    nextPendingAppointment,
    recentAppointments,
    flashIds,
    notifQueue,
    filteredAppointments,
    filters,
    setFilters,
    timeButtons,
    handleAction,
    money,
  } = useEmployerDashboard();

  return (
    <div className="dashboard-root">
      <NavlogComponent />

      <Container fluid className="dashboard-container">
        <div className="header-bar m-4 text-center text-md-start">
          Painel do Colaborador
        </div>

        {/* ====================  PENDENTE PARA FINALIZAR ==================== */}
        <NextPendingCard
          nextPendingAppointment={nextPendingAppointment}
          handleAction={handleAction}
        />

        {/* ====================  FILTROS ==================== */}
        <Card className="glass-card mb-4">
          <Card.Body>
            <EmployerFilters
              filters={filters}
              setFilters={setFilters}
              timeButtons={timeButtons}
            />
          </Card.Body>
        </Card>

        {/* ====================  KPIs ==================== */}
        <EmployerKpiSection summary={summary} money={money} />

        {/* ====================  CARDS SUPERIORES ==================== */}
        <Row className="mb-4">
          <Col md={3} className="mb-2">
            <NextAppointmentCard nextAppointment={nextAppointment} />
          </Col>

          <Col md={3} className="mb-2">
            <LastAppointmentCard lastAppointment={lastAppointment} />
          </Col>

          <Col md={3} className="mb-2">
            <RecentAppointmentsCard
              recentAppointments={recentAppointments}
              flashIds={flashIds}
            />
          </Col>
        </Row>

        {/* ==================== LISTA DE AGENDAMENTOS ==================== */}
        <Card className="glass-card">
          <Card.Body>
            <h5 className="card-title-underline text-light">
              📋 Lista de Agendamentos
            </h5>

            <Row>
              {filteredAppointments.map((a) => (
                <Col md={4} sm={6} xs={12} key={a.id} className="mb-3">
                  <AppointmentCard a={a} handleAction={handleAction} />
                </Col>
              ))}

              {!filteredAppointments.length && (
                <Col xs={12}>
                  <div className="text-center text-muted p-4">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* ==================== NOTIFICAÇÕES ==================== */}
        <EmployerNotificationStack notifQueue={notifQueue} />
      </Container>
    </div>
  );
}
