// src/components/useAppointment.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";

const MySwal = withReactContent(Swal);

export default function useAppointment(apiBaseUrl, appId, token, establishment) {
  const loadAvailableTimes = async (dayKey, collaborator, durationMin) => {
    try {
      if (!dayKey || !collaborator || !durationMin) return [];
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
      const { data } = await axios.get(`${apiBaseUrl}/employer-schedule/available`, {
        params: {
          employer_id: collaborator.id,
          date: dayKey,
          duration: durationMin,
        },
        headers,
      });

      return Array.isArray(data.available_times) ? data.available_times : [];
    } catch (err) {
      console.error("Erro ao carregar horários:", err);
      return [];
    }
  };

  const handleCreateAppointment = async (service, collaborator, dateKey, timeStr) => {
    try {
      if (!token) {
        const { value: loginData } = await MySwal.fire({
          title: "Entrar para agendar",
          html: `
            <input id="swal-username" class="swal2-input" placeholder="Usuário ou e-mail" />
            <input id="swal-password" type="password" class="swal2-input" placeholder="Senha" />
          `,
          focusConfirm: false,
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
            try {
              const { data } = await axios.post(`${apiBaseUrl}/auth/login`, {
                username,
                password,
              });
              const token =
                data.token?.access_token ||
                data.token?.original?.access_token ||
                data.access_token ||
                data.token;
              if (!token) throw new Error("Token não recebido");
              localStorage.setItem("token", token);
              localStorage.setItem("user", JSON.stringify(data.user));
              return { token, user: data.user };
            } catch (err) {
              Swal.showValidationMessage(
                err.response?.data?.error ||
                  err.response?.data?.message ||
                  "Falha ao autenticar"
              );
              return false;
            }
          },
        });

        if (!loginData) return;
        window.location.reload();
        return;
      }

      if (!collaborator || !dateKey || !service) return;

      const [h, m] = timeStr.split(":").map((n) => parseInt(n, 10));
      const [year, month, day] = dateKey.split("-").map(Number);
      const start = new Date(year, month - 1, day, h, m, 0);

      const user = JSON.parse(localStorage.getItem("user") || "null");
      let customerName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : "";

      if (!customerName) {
        const { value: name } = await MySwal.fire({
          title: "Informe seu nome",
          input: "text",
          confirmButtonText: "Continuar",
          inputValidator: (v) =>
            !v ? "Por favor, informe seu nome para continuar." : undefined,
        });
        if (!name) return;
        customerName = name.trim();
      }

      const localISO = `${dateKey}T${timeStr}:00-03:00`;

      const payload = {
        app_id: appId,
        entity_name: "establishment",
        entity_id: establishment.id,
        items: [
          {
            item_id: service.id,
            quantity: 1,
            additions: [],
            removals: [],
          },
        ],
        customer_name: customerName,
        origin: "App",
        fulfillment: "dine-in",
        payment_status: "pending",
        payment_method: "Pix",
        notes: "",
        order_datetime: localISO,
        attendant_id: collaborator.id,
        appointment_status: "pending",
      };

      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const { data } = await axios.post(`${apiBaseUrl}/order`, payload, { headers });

      await MySwal.fire({
        icon: "success",
        title: "Agendamento confirmado!",
        text: data?.message || "Seu agendamento foi registrado com sucesso.",
        background: "#0a0a0c",
        color: "#fff",
      });
    } catch (err) {
      const data = err.response?.data || {};
      const msg =
        data.error || data.message || "Não foi possível criar o agendamento.";

      await MySwal.fire({
        icon: "error",
        title: "Horário indisponível",
        html: `
          <div style="color:#fff;text-align:left">
            <p>${msg}</p>
          </div>
        `,
        background: "#0a0a0c",
        color: "#fff",
        confirmButtonText: "Fechar",
      });
    }
  };

  return { loadAvailableTimes, handleCreateAppointment };
}
