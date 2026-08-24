// src/pages/employer/EmployerSchedulesPage.jsx
import React from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Card,
  Button,
} from "react-bootstrap";
import Swal from "sweetalert2";
import GlobalNav from "../../components/GlobalNav";
import EmployerHero from "../../components/employer/EmployerHero";
import EmployerScheduleAddForm from "../../components/employer/EmployerScheduleAddForm";
import useEmployerSchedules, {
  EMPLOYER_DAYS,
} from "../../hooks/useEmployerSchedules";

export default function EmployerSchedulesPage() {
  const {
    employerId,
    schedulesByDay,
    addDay,
    setAddDay,
    addStart,
    setAddStart,
    addEnd,
    setAddEnd,
    loading,
    saving,
    deleting,
    apiError,
    actionMessage,
    handleAddScheduleLocal,
    handleSaveSchedules,
    handleRemoveSchedule,
  } = useEmployerSchedules();

  const confirmRemove = async (schedule) => {
    const res = await Swal.fire({
      title: "Confirmar remoção",
      text: `Deseja remover o horário ${schedule.start_time} – ${schedule.end_time}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (res.isConfirmed) {
      await handleRemoveSchedule(schedule);
    }
  };

  const confirmSave = async () => {
    const res = await Swal.fire({
      title: "Salvar alterações?",
      text: "Deseja salvar os horários de atendimento?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (res.isConfirmed) {
      await handleSaveSchedules();
    }
  };

  if (loading) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!employerId) {
    return (
      <>
        <GlobalNav />
        <Container className="py-4">
          <Alert variant="warning">
            Colaborador não encontrado ou não vinculado.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <Container className="py-4">
        <EmployerHero
          title="Horários de Atendimento"
          subtitle="Defina sua disponibilidade semanal. Esses horários controlam quando clientes podem agendar."
          icon="bi-clock-fill"
          badge="Painel do Profissional"
        />

        {apiError && <Alert variant="danger">{apiError}</Alert>}
        {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

        <EmployerScheduleAddForm
          days={EMPLOYER_DAYS}
          addDay={addDay}
          setAddDay={setAddDay}
          addStart={addStart}
          setAddStart={setAddStart}
          addEnd={addEnd}
          setAddEnd={setAddEnd}
          onAdd={handleAddScheduleLocal}
        />

        {EMPLOYER_DAYS.map((day) => (
          <Card
            key={day.key}
            className="mb-3"
            style={{
              background: "#0b1220",
              border: "1px solid rgba(148,163,184,.12)",
              borderRadius: 12,
            }}
          >
            <Card.Header
              style={{
                background: "rgba(15,23,42,.85)",
                color: "#e5e7eb",
                fontWeight: 700,
                borderBottom: "1px solid rgba(148,163,184,.12)",
              }}
            >
              {day.label}
            </Card.Header>

            <Card.Body>
              {schedulesByDay[day.key]?.length === 0 && (
                <div style={{ color: "#94a3b8" }}>
                  Nenhum horário cadastrado
                </div>
              )}

              {schedulesByDay[day.key]?.map((s) => (
                <Row
                  key={s.id}
                  className="align-items-center mb-2"
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px dashed rgba(148,163,184,.15)",
                  }}
                >
                  <Col md={6} style={{ color: "#e5e7eb", fontWeight: 500 }}>
                    {s.start_time} – {s.end_time}
                  </Col>

                  <Col md={3}>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={deleting}
                      onClick={() => confirmRemove(s)}
                    >
                      Remover
                    </Button>
                  </Col>
                </Row>
              ))}
            </Card.Body>
          </Card>
        ))}

        <Row className="mt-4">
          <Col className="d-flex justify-content-end">
            <Button size="lg" disabled={saving} onClick={confirmSave}>
              {saving ? "Salvando..." : "Salvar horários"}
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}
