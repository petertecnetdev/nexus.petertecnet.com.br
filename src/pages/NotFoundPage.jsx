import React from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import GlobalNav from "../components/GlobalNav";
import NexusFeedback from "../components/NexusFeedback";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <GlobalNav />
      <Container className="py-5">
        <NexusFeedback type="neutral" title="Página não encontrada">
          O endereço informado não existe na Nexus ou deixou de estar disponível.
        </NexusFeedback>
        <div className="d-flex gap-2 mt-3 flex-wrap">
          <Button onClick={() => navigate("/")}>Ir para a Nexus</Button>
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </Container>
    </>
  );
}
