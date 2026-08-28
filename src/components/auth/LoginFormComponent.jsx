import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import PropTypes from "prop-types";
import useLogin from "../../hooks/useLogin";
import NexusFeedback from "../NexusFeedback";
import "./LoginFormComponent.css";

export default function LoginFormComponent({
  onStart,
  onSuccess,
  onError,
  redirectTo,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { login, loginGoogle } = useLogin(
    (token) => {
      setErrorMessage("");
      onSuccess?.(token);
    },
    redirectTo
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    onStart?.();

    try {
      await login(username, password);
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível entrar na sua conta.");
      onError?.(error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMessage("");
    onStart?.();

    try {
      await loginGoogle(credentialResponse?.credential || null);
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível entrar com o Google.");
      onError?.(error);
    }
  };

  const handleGoogleError = () => {
    const message = "O Google não concluiu o acesso. Tente novamente ou use seu e-mail e senha.";
    setErrorMessage(message);
    onError?.(new Error(message));
  };

  return (
    <Form onSubmit={handleSubmit} className="login-form-component mt-4">
      {errorMessage && (
        <NexusFeedback type="error" title="Não conseguimos entrar" compact className="mb-3">
          {errorMessage}
        </NexusFeedback>
      )}

      <Form.Control
        type="text"
        placeholder="Usuário ou e-mail"
        className="neon-input mb-3"
        value={username}
        onChange={(event) => {
          setUsername(event.target.value);
          if (errorMessage) setErrorMessage("");
        }}
        autoComplete="username"
        required
      />

      <Form.Control
        type="password"
        placeholder="Senha"
        className="neon-input mb-4"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (errorMessage) setErrorMessage("");
        }}
        autoComplete="current-password"
        required
      />

      <Button type="submit" className="neon-button w-100 mb-3">
        Entrar
      </Button>

      <div className="w-100 mb-3 d-flex justify-content-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          width="100%"
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
        />
      </div>

      <div className="login-links">
        <a href="/register">Registrar-se</a>
        <span className="sep">|</span>
        <a href="/password-email">Recuperar senha</a>
      </div>
    </Form>
  );
}

LoginFormComponent.propTypes = {
  onStart: PropTypes.func,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  redirectTo: PropTypes.string,
};
