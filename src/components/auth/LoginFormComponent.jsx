// src/components/auth/LoginFormComponent.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import PropTypes from "prop-types";
import useLogin from "../../hooks/useLogin";
import "./LoginFormComponent.css";

export default function LoginFormComponent({
  onStart,
  onSuccess,
  onError,
  redirectTo,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login, loginGoogle } = useLogin(
    (token) => {
      onSuccess?.(token);
    },
    redirectTo
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart?.();
    login(username, password).catch(() => onError?.());
  };

  const handleGoogleSuccess = (credentialResponse) => {
    onStart?.();
    loginGoogle(credentialResponse?.credential || null).catch(() =>
      onError?.()
    );
  };

  return (
    <Form onSubmit={handleSubmit} className="login-form-component mt-4">
      <Form.Control
        type="text"
        placeholder="Usuário ou e-mail"
        className="neon-input mb-3"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <Form.Control
        type="password"
        placeholder="Senha"
        className="neon-input mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" className="neon-button w-100 mb-3">
        Entrar
      </Button>

      <div className="w-100 mb-3 d-flex justify-content-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={onError}
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
