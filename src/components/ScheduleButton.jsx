// src/components/ScheduleButton.jsx
import React from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function ScheduleButton({ service, apiBaseUrl, openSchedulePopup }) {
  const handleClick = async () => {
    const token = localStorage.getItem("token");

    // 🔒 Usuário não autenticado → exibe modal de login
    if (!token) {
      await MySwal.fire({
        width: "400px",
        background: "#0a0a0c",
        title: "Entrar para agendar",
        html: `
          <div style="text-align:center;">
            <img src="/images/logo.png" alt="Rasoio" style="width:120px;margin-bottom:10px;" />
            <input id="swal-username" class="swal2-input" placeholder="Usuário ou e-mail" />
            <input id="swal-password" type="password" class="swal2-input" placeholder="Senha" />
            <button id="swal-login-btn" class="swal2-confirm swal2-styled" 
              style="width:100%;margin-top:10px;background:#00bcd4;border:none;">
              Entrar
            </button>
            <div id="swal-google" style="margin-top:10px;"></div>
            <a href="/register" style="display:block;margin-top:10px;color:#00ffff;">Registrar-se</a>
            <a href="/password-email" style="display:block;margin-top:4px;color:#888;">Esqueceu a senha?</a>
          </div>
        `,
        showConfirmButton: false,
        didOpen: () => {
          const container = MySwal.getHtmlContainer();
          const loginBtn = container.querySelector("#swal-login-btn");
          const googleDiv = container.querySelector("#swal-google");

          loginBtn.addEventListener("click", async () => {
            const username = container.querySelector("#swal-username").value;
            const password = container.querySelector("#swal-password").value;

            if (!username || !password) {
              Swal.showValidationMessage("Informe usuário e senha");
              return;
            }

            try {
              const { data } = await axios.post(`${apiBaseUrl}/auth/login`, { username, password });
              const tokenFromApi =
                data.token?.access_token ||
                data.token?.original?.access_token ||
                data.access_token ||
                data.token;

              if (!tokenFromApi) throw new Error("Token não recebido");

              localStorage.setItem("token", tokenFromApi);
              localStorage.setItem("user", JSON.stringify(data.user || {}));

              Swal.close();
              window.location.reload();
            } catch (err) {
              Swal.showValidationMessage(
                err.response?.data?.error ||
                  err.response?.data?.message ||
                  "Falha ao autenticar"
              );
            }
          });

          import("@react-oauth/google").then(({ GoogleLogin, GoogleOAuthProvider }) => {
            const root = document.createElement("div");
            googleDiv.appendChild(root);
            const React = require("react");
            const ReactDOM = require("react-dom/client");
            const rootInstance = ReactDOM.createRoot(root);
            rootInstance.render(
              React.createElement(GoogleOAuthProvider, {
                clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                children: React.createElement(GoogleLogin, {
                  onSuccess: async ({ credential }) => {
                    try {
                      const { data } = await axios.post(`${apiBaseUrl}/auth/google`, {
                        token_id: credential,
                      });

                      const tokenFromApi =
                        data.token?.access_token ||
                        data.token?.original?.access_token ||
                        data.access_token ||
                        data.token;

                      if (!tokenFromApi) throw new Error("Token Google não recebido");

                      localStorage.setItem("token", tokenFromApi);
                      localStorage.setItem("user", JSON.stringify(data.user || {}));

                      Swal.close();
                      window.location.reload();
                    } catch (err) {
                      Swal.showValidationMessage(
                        err.response?.data?.error ||
                          err.response?.data?.message ||
                          "Falha no login com Google"
                      );
                    }
                  },
                  onError: () => {
                    Swal.showValidationMessage("Falha no login com Google");
                  },
                }),
              })
            );
          });
        },
      });
      return;
    }

    // ✅ Usuário autenticado → abre popup de agendamento
    openSchedulePopup(service);
  };

  return (
    <Button size="sm" className="flex-fill button" onClick={handleClick}>
      Agendar
    </Button>
  );
}

ScheduleButton.propTypes = {
  service: PropTypes.object.isRequired,
  apiBaseUrl: PropTypes.string.isRequired,
  openSchedulePopup: PropTypes.func.isRequired,
};
