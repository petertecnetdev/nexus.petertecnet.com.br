import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import { apiBaseUrl } from "../../config";
import GlobalNav from "../../components/GlobalNav";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

import "./PasswordEmailPage.css";

export default function PasswordEmailPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (targetEmail) => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/auth/password-email`,
        { email: targetEmail }
      );

      Swal.fire({
        title: "Sucesso",
        text:
          data.message ||
          "Código enviado para seu e-mail. Verifique sua caixa de entrada.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Recebi o código",
        cancelButtonText: "Reenviar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/password-reset");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "Reenviar código",
            input: "email",
            inputValue: targetEmail,
            inputPlaceholder: "Digite seu e-mail",
            showCancelButton: true,
            confirmButtonText: "Reenviar",
            cancelButtonText: "Cancelar",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          }).then((resend) => {
            if (resend.isConfirmed) {
              setEmail(resend.value);
              sendCode(resend.value);
            }
          });
        }
      });
    } catch (err) {
      Swal.fire({
        title: "Erro",
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Erro ao enviar o código. Tente novamente.",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    sendCode(email);
  };

  return (
    <>
      <GlobalNav />

      {loading && (
        <ProcessingIndicatorComponent
          messages={[
            "Enviando código...",
            "Validando e-mail...",
            "Quase lá...",
            "Verifique seu e-mail",
          ]}
        />
      )}

      {!loading && (
        <div className="pe-wrapper">
          <div className="pe-bg-effect" />

          <div className="pe-content">
            <div className="pe-card">
              <div className="pe-card__header">
                <div className="pe-logo-wrapper">
                  <img
                    src="/images/logo.png"
                    alt="Inkap"
                    className="pe-logo"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <h1 className="pe-title">Recuperar senha</h1>
                <p className="pe-subtitle">
                  Informe seu e-mail para receber o código de recuperação
                </p>
              </div>

              <form className="pe-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Digite seu e-mail"
                  className="pe-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <button type="submit" className="pe-button">
                  Enviar código
                </button>
              </form>

              <div className="pe-footer">
                <button
                  type="button"
                  className="pe-link"
                  onClick={() => navigate("/login")}
                >
                  Voltar para o login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
