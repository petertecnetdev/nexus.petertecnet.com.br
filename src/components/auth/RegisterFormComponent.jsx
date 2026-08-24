import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./RegisterFormComponent.css";

export default function RegisterFormComponent({ redirectTo }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      Swal.fire({
        title: "Erro",
        text: "As senhas não coincidem.",
        icon: "error",
        confirmButtonText: "Ok",
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

      Swal.fire({
        title: "Sucesso",
        text: "Cadastro realizado com sucesso!",
        icon: "success",
        confirmButtonText: "Entrar",
      }).then(() => {
        window.location.href = redirectTo;
      });
    } catch (err) {
      let msg = "Ocorreu um erro.";

      if (err.response) {
        // Mostra todas as mensagens de validação da API
        if (err.response.data.errors) {
          msg = Object.values(err.response.data.errors)
            .flat()
            .join(" ");
        } else if (err.response.data.message) {
          msg = err.response.data.message;
        }
      }

      Swal.fire({
        title: "Erro",
        text: msg,
        icon: "error",
        confirmButtonText: "Ok",
      });

      setLoading(false);
    }
  };

  return (
    <>
     
      {!loading && (
        <Form onSubmit={handleSubmit} className="login-form-component mt-4">
          <Form.Control
            type="text"
            placeholder="Nome"
            className="neon-input mb-3"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <Form.Control
            type="email"
            placeholder="E-mail"
            className="neon-input mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Form.Control
            type="password"
            placeholder="Senha"
            className="neon-input mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Form.Control
            type="password"
            placeholder="Confirmar Senha"
            className="neon-input mb-4"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />

          <Button type="submit" className="neon-button w-100 mb-3">
            Registrar
          </Button>

          <div className="login-links">
            <a href="/login">Já tenho conta</a>
            <span className="sep">|</span>
            <a href="/password-email">Recuperar senha</a>
          </div>
        </Form>
      )}
    </>
  );
}

RegisterFormComponent.propTypes = {
  redirectTo: PropTypes.string,
};

RegisterFormComponent.defaultProps = {
  redirectTo: "/login",
};
