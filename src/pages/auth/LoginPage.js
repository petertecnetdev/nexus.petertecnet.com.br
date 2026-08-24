// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import "./LoginPage.css";

import GlobalNav from "../../components/GlobalNav";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [processing, setProcessing] = useState(false);

  const from = location?.state?.from?.pathname || "/";

  const handleSuccess = () => {
    navigate(from, { replace: true });
  };

  // 🔒 BLOQUEIO TOTAL DA UI
  if (processing) {
    return (
      <ProcessingIndicatorComponent
        gifSrc="/images/logo.gif"
        minDuration={900}
      />
    );
  }

  return (
    <>
      <GlobalNav />

      <div className="lp-wrapper">
        <div className="lp-bg-effect" />

        <div className="lp-content">
          <div className="lp-card">
            <div className="lp-card__header">
              <div className="lp-logo-wrapper">
                <img
                  src="/images/logo.png"
                  alt="Inkap"
                  className="lp-logo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/logo.gif";
                  }}
                />
              </div>

              <h1 className="lp-title">Bem-vindo à Inkap</h1>
              <p className="lp-subtitle">
                Entre para gerenciar seus agendamentos, estúdios e serviços
              </p>
            </div>

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
          </div>
        </div>
      </div>
    </>
  );
}
