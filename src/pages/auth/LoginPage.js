// src/pages/auth/LoginPage.jsx

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiBaseUrl, appId } from "../../config";

import GlobalNav from "../../components/GlobalNav";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [processing, setProcessing] = useState(false);

  const from = location?.state?.from?.pathname || "/";

  const handleSuccess = () => {
    navigate(from, { replace: true });
  };

  /* =================== BLOQUEIO DA INTERFACE =================== */

  if (processing) {
    return (
      <ProcessingIndicatorComponent
        gifSrc="/images/logo.gif"
        minDuration={900}
      />
    );
  }

  /* =================== RENDER =================== */

  return (
    <>
      <GlobalNav />

      <main className="lp-wrapper">
        <div className="lp-bg-effect" aria-hidden="true" />

        <div className="lp-content">
          <section className="lp-card" aria-labelledby="login-title">
            <header className="lp-card__header">
              <div className="lp-logo-wrapper">
                <img
                  src="/images/logo.png"
                  alt="Nexus"
                  className="lp-logo"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/images/logo.gif";
                  }}
                />
              </div>

              <h1 id="login-title" className="lp-title">
                Bem-vindo à Nexus
              </h1>

              <p className="lp-subtitle">
              Acesse sua conta para gerenciar sua empresa, seus catálogos e tudo o que faz parte do seu negócio.
              </p>
            </header>

            <div className="lp-card__body">
              <LoginFormComponent
                onStart={() => setProcessing(true)}
                onSuccess={handleSuccess}
                onError={() => setProcessing(false)}
                redirectTo={from}
                apiBaseUrl={apiBaseUrl}
                appId={appId}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}