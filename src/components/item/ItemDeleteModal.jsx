import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function ItemDeleteModal({ show, item, onHide, onConfirm }) {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Excluir Item</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {item ? (
          <>Tem certeza que deseja excluir o item <strong>{item.name}</strong>?</>
        ) : (
          "Selecione um item para excluir."
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>

        <Button variant="danger" onClick={onConfirm}>
          Excluir
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
