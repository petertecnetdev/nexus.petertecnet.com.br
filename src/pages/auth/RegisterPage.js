import React from "react";
import { useNavigate } from "react-router-dom";

import "./RegisterPage.css";

import GlobalNav from "../../components/GlobalNav";
import RegisterFormComponent from "../../components/auth/RegisterFormComponent";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/login", { replace: true });
  };

  return (
    <>
      <GlobalNav />

      <div className="rp-wrapper">
        <div className="rp-bg-effect" />

        <div className="rp-content">
          <div className="rp-card">
            <div className="rp-card__header">
              <div className="rp-logo-wrapper">
                <img
                  src="/images/logo.png"
                  alt="Inkap"
                  className="rp-logo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/logo.gif";
                  }}
                />
              </div>

              <h1 className="rp-title">Criar conta</h1>
              <p className="rp-subtitle">
                Cadastre-se para começar a usar a Inkap
              </p>
            </div>

            <div className="rp-card__body">
              <RegisterFormComponent onSuccess={handleSuccess} />
            </div>

            <div className="rp-card__footer">
              <span>Já possui uma conta?</span>
              <button
                type="button"
                className="rp-link"
                onClick={() => navigate("/login")}
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
