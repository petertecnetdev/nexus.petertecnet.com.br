// src/pages/item/ItemInteractionsPage.jsx
import React from "react";
import { Table, Container, Spinner, Alert } from "react-bootstrap";
import useItemView from "../../hooks/useItemView";

export default function ItemInteractionsPage({ apiBaseUrl, slug, token, navigate }) {
  const {
    item,
    interactionSummary,
    userInteractions,
    loading,
    error,
  } = useItemView(apiBaseUrl, slug, token, navigate);

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" />
        <p>Carregando interações...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h2>Interações do item: {item?.name ?? "Desconhecido"}</h2>
      {userInteractions.length === 0 ? (
        <Alert variant="info">Nenhuma interação encontrada para este item.</Alert>
      ) : (
        <Table striped bordered hover responsive className="mt-3">
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Tipo</th>
              <th>IP</th>
              <th>User Agent</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {userInteractions.map((interaction) => (
              <tr key={interaction.id}>
                <td>{interaction.id}</td>
                <td>{interaction.user_id ?? "Anônimo"}</td>
                <td>{interaction.interaction_type}</td>
                <td>{interaction.content?.ip ?? "-"}</td>
                <td>{interaction.content?.user_agent ?? "-"}</td>
                <td>{new Date(interaction.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
