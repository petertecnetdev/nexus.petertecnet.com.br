import React, { useState } from "react";
import GlobalNav from "../../components/GlobalNav";
import InviteFormComponent from "../../components/auth/InviteFormComponent";
import { Container, Row, Col, Card, Modal } from "react-bootstrap";
import GlobalButton from "../../components/GlobalButton";
import "./InvitePage.css";

export default function InvitePage() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  return (
    <>
      <GlobalNav />

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card
              className="p-4"
              style={{
                background: "rgba(15,15,17,0.65)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                borderRadius: "14px",
              }}
            >
              <h3 className="text-center mb-3" style={{ color: "#e5e5e5" }}>
                Convidar Usuário
              </h3>

              <InviteFormComponent
                onSuccess={() => setShowSuccessModal(true)}
              />
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal
        centered
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
      >
        <Modal.Body
          style={{
            background: "#0f0f11",
            borderRadius: "14px",
            color: "#e5e7eb",
            textAlign: "center",
            padding: "32px",
          }}
        >
          <h4 style={{ marginBottom: "12px" }}>Convite enviado com sucesso</h4>
          <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
            O usuário receberá um e-mail com o convite para acessar a plataforma.
          </p>

          <GlobalButton
            variant="primary"
            full
            rounded
            onClick={() => setShowSuccessModal(false)}
          >
            Ok
          </GlobalButton>
        </Modal.Body>
      </Modal>
    </>
  );
}
