import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { sanitizeAuthReturn } from "../../services/authReturn";

import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);

  const from = sanitizeAuthReturn(location?.state?.from);

  const handleSuccess = () => {
    setProcessing(false);
    navigate(from, { replace: true });
  };

  return (
    <>
      {processing && (
        <ProcessingIndicatorComponent
          messages={["Entrando na Nexus…", "Retomando o que você estava fazendo…"]}
        />
      )}

      <GlobalNav />

      <main className="lp-wrapper">
        <div className="lp-bg-effect" aria-hidden="true" />

        <div className="lp-content">
          <section className="lp-card" aria-labelledby="login-title">
            <header className="lp-card__header">
              <div className="lp-logo-wrapper">
                <img src="/images/logo.png" alt="Nexus" className="lp-logo" />
              </div>

              <h1 id="login-title" className="lp-title">Bem-vindo à Nexus</h1>
              <p className="lp-subtitle">
                Acesse sua conta para continuar com segurança.
              </p>
            </header>

            <div className="lp-card__body">
              <LoginFormComponent
                onStart={() => setProcessing(true)}
                onSuccess={handleSuccess}
                onError={() => setProcessing(false)}
                redirectTo={from}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
