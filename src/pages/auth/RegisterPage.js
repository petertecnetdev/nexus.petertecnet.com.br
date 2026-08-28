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

      <main className="rp-wrapper">
        <div className="rp-bg-effect" aria-hidden="true" />

        <div className="rp-content">
          <section className="rp-card" aria-labelledby="register-title">
            <header className="rp-card__header">
              <div className="rp-logo-wrapper">
                <img src="/images/logo.png" alt="Nexus" className="rp-logo" />
              </div>

              <h1 id="register-title" className="rp-title">Criar conta</h1>
              <p className="rp-subtitle">
                Crie sua conta para cadastrar empresas, itens e compartilhar seus catálogos pela Nexus.
              </p>
            </header>

            <div className="rp-card__body">
              <RegisterFormComponent onSuccess={handleSuccess} />
            </div>

            <footer className="rp-card__footer">
              <span>Já possui uma conta?</span>
              <button type="button" className="rp-link" onClick={() => navigate("/login")}>
                Entrar
              </button>
            </footer>
          </section>
        </div>
      </main>
    </>
  );
}
