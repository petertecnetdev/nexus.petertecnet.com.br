import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import api from "../../services/api";
import NexusFeedback from "../NexusFeedback";
import "./RegisterFormComponent.css";

export default function RegisterFormComponent({ onSuccess }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const clearFeedback = () => {
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (password !== passwordConfirmation) {
      setFeedback({
        type: "error",
        title: "As senhas não conferem",
        message: "Digite a mesma senha nos dois campos antes de continuar.",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        first_name: firstName,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setFeedback({
        type: "success",
        title: "Conta criada com sucesso",
        message: "Seu cadastro foi concluído. Você já pode entrar na Nexus.",
      });

      window.setTimeout(() => onSuccess?.(), 700);
    } catch (error) {
      let message = "Não foi possível criar sua conta. Revise os dados e tente novamente.";

      if (error?.response?.data?.errors) {
        message = Object.values(error.response.data.errors).flat().join(" ");
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }

      setFeedback({
        type: "error",
        title: "Não conseguimos criar sua conta",
        message,
      });
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="login-form-component mt-4">
      {feedback && (
        <NexusFeedback type={feedback.type} title={feedback.title} compact className="mb-3">
          {feedback.message}
        </NexusFeedback>
      )}

      <Form.Control
        type="text"
        placeholder="Nome"
        className="neon-input mb-3"
        value={firstName}
        onChange={(event) => {
          setFirstName(event.target.value);
          clearFeedback();
        }}
        autoComplete="name"
        required
        disabled={loading}
      />

      <Form.Control
        type="email"
        placeholder="E-mail"
        className="neon-input mb-3"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          clearFeedback();
        }}
        autoComplete="email"
        required
        disabled={loading}
      />

      <Form.Control
        type="password"
        placeholder="Senha"
        className="neon-input mb-3"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          clearFeedback();
        }}
        autoComplete="new-password"
        required
        disabled={loading}
      />

      <Form.Control
        type="password"
        placeholder="Confirmar senha"
        className="neon-input mb-4"
        value={passwordConfirmation}
        onChange={(event) => {
          setPasswordConfirmation(event.target.value);
          clearFeedback();
        }}
        autoComplete="new-password"
        required
        disabled={loading}
      />

      <Button type="submit" className="neon-button w-100 mb-3" disabled={loading}>
        {loading ? "Criando conta…" : "Criar conta"}
      </Button>

      <div className="login-links">
        <a href="/login">Já tenho conta</a>
        <span className="sep">|</span>
        <a href="/password-email">Recuperar senha</a>
      </div>
    </Form>
  );
}

RegisterFormComponent.propTypes = {
  onSuccess: PropTypes.func,
};
