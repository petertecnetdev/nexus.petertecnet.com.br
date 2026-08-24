// src/components/auth/InviteFormComponent.jsx
import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../../config";
import "./InviteFormComponent.css";

export default function InviteFormComponent({ redirectTo }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    email: "",
    app_id: appId,
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${apiBaseUrl}/invite`, form);

      await Swal.fire({
        title: "Convite enviado!",
        text: "O usuário recebeu o código por email.",
        icon: "success",
        confirmButtonText: "OK",
      });

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message || "Erro ao enviar convite.";
      await Swal.fire("Erro", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="invite-form-component">
      <Form.Group className="mb-3" controlId="inviteFirstName">
        <Form.Label>Nome</Form.Label>
        <Form.Control
          type="text"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="Nome do usuário"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="inviteEmail">
        <Form.Label>E-mail</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="email@exemplo.com"
          required
        />
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className="w-100 mt-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Enviando...
          </>
        ) : (
          "Enviar convite"
        )}
      </Button>
    </Form>
  );
}
