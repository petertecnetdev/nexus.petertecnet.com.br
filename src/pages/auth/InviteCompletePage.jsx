import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../../config";

export default function InviteCompleteFormComponent({ redirectTo }) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    verification_code: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${apiBaseUrl}/auth/invite-complete`, form);
      Swal.fire("Sucesso!", "Senha criada. Agora você pode acessar.", "success");
      window.location.href = redirectTo;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Erro ao finalizar convite.";
      Swal.fire("Erro", msg, "error");
    }

    setLoading(false);
  };

  return (
    <Form onSubmit={handleSubmit} className="text-start">

      <Form.Group className="mb-3">
        <Form.Label>E-mail</Form.Label>
        <Form.Control
          type="email"
          name="email"
          placeholder="Digite o e-mail"
          value={form.email}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Código de Verificação</Form.Label>
        <Form.Control
          type="text"
          name="verification_code"
          placeholder="Código recebido no e-mail"
          value={form.verification_code}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Nova Senha</Form.Label>
        <Form.Control
          type="password"
          name="password"
          placeholder="Crie sua senha"
          value={form.password}
          onChange={handleChange}
        />
      </Form.Group>

      <Button
        type="submit"
        className="w-100 mt-2 login-btn"
        disabled={loading}
      >
        {loading ? <Spinner size="sm" /> : "Finalizar convite"}
      </Button>
    </Form>
  );
}
