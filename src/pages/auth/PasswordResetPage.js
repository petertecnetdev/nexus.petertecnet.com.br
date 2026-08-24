import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import { apiBaseUrl } from "../../config";
import GlobalNav from "../../components/GlobalNav";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

import "./PasswordResetPage.css";

export default function PasswordResetPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
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
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/password-reset`, {
        email,
        reset_password_code: resetCode,
        password,
      });

      Swal.fire({
        title: "Senha alterada",
        text: data.message || "Sua senha foi redefinida com sucesso.",
        icon: "success",
        confirmButtonText: "Entrar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then(() => {
        navigate("/login", { replace: true });
      });
    } catch (err) {
      Swal.fire({
        title: "Erro",
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Não foi possível redefinir a senha.",
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalNav />

      {loading && (
        <ProcessingIndicatorComponent
          messages={[
            "Redefinindo senha...",
            "Validando código...",
            "Finalizando...",
          ]}
        />
      )}

      {!loading && (
        <div className="pr-wrapper">
          <div className="pr-bg-effect" />

          <div className="pr-content">
            <div className="pr-card">
              <div className="pr-card__header">
                <div className="pr-logo-wrapper">
                  <img
                    src="/images/logo.png"
                    alt="Inkap"
                    className="pr-logo"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <h1 className="pr-title">Redefinir senha</h1>
                <p className="pr-subtitle">
                  Informe o código recebido e defina sua nova senha
                </p>
              </div>

              <form className="pr-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="pr-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Código de redefinição"
                  className="pr-input"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Nova senha"
                  className="pr-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Confirmar nova senha"
                  className="pr-input"
                  value={passwordConfirmation}
                  onChange={(e) =>
                    setPasswordConfirmation(e.target.value)
                  }
                  required
                />

                <button type="submit" className="pr-button">
                  Alterar senha
                </button>
              </form>

              <div className="pr-footer">
                <button
                  type="button"
                  className="pr-link"
                  onClick={() => navigate("/password-email")}
                >
                  Pedir novo código
                </button>
                <span className="pr-sep">•</span>
                <button
                  type="button"
                  className="pr-link"
                  onClick={() => navigate("/login")}
                >
                  Voltar ao login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
