// src/hooks/useAuthPrompt.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import { apiBaseUrl } from "../config";

const MySwal = withReactContent(Swal);

export default function useAuthPrompt() {
  const askLogin = async () => {
    const { value: data } = await MySwal.fire({
      title: "Entrar para continuar",
      html: `
        <input id="swal-username" class="swal2-input" placeholder="Usuário ou e-mail" />
        <input id="swal-password" type="password" class="swal2-input" placeholder="Senha" />
      `,
      confirmButtonText: "Entrar",
      showCancelButton: true,
      background: "#0a0a0c",
      color: "#fff",
      preConfirm: async () => {
        const username = document.getElementById("swal-username").value;
        const password = document.getElementById("swal-password").value;
        if (!username || !password) {
          Swal.showValidationMessage("Informe usuário e senha");
          return false;
        }
        const { data } = await axios.post(`${apiBaseUrl}/auth/login`, { username, password });
        const token =
          data.token?.access_token ||
          data.token?.original?.access_token ||
          data.access_token ||
          data.token;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(data.user));
        return data.user;
      },
    });
    return data;
  };

  return { askLogin };
}
