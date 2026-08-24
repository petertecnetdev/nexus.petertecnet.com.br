// src/hooks/useAppointment.js
import { useCallback } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function useAppointment(
  apiBaseUrl,
  appId,
  token,
  establishment
) {
  const getToken = () => localStorage.getItem("token");
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  const loadAvailableTimes = useCallback(
    async (date, employer, totalDuration) => {
      try {
        const userToken = getToken();
        if (!userToken || !employer?.id || !date) return [];

        const payload = {
          employer_id: employer.id,
          date: typeof date === "string" ? date : new Date(date).toISOString(),
          duration: Number(totalDuration || 0),
        };

        const res = await axios.post(
          `${apiBaseUrl}/employer/available-times`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        return Array.isArray(res.data?.available_times)
          ? res.data.available_times
          : [];
      } catch {
        return [];
      }
    },
    [apiBaseUrl]
  );

  const handleCreateAppointment = useCallback(
    async (initialService, preselectedEmployer = null) => {
      const userToken = getToken();
      const authUser = getUser();

      if (!userToken || !authUser?.id) {
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "info",
          title: "Entrar para agendar",
          text: "Você precisa estar logado para fazer um agendamento.",
          confirmButtonColor: "#00aaff",
        });
        return null;
      }

      try {
        let selectedServices = Array.isArray(initialService)
          ? [...initialService]
          : [initialService];
        let selectedEmployer = preselectedEmployer;
        let selectedDate = null;
        let selectedTime = null;

        const { value: servicesConfirmed } = await Swal.fire({
          title: "Escolha os serviços",
          background: "#0a0a0c",
          color: "#fff",
          html: `
            <div style="text-align:left;max-height:250px;overflow-y:auto;padding:10px;">
              ${selectedServices
                .map(
                  (s, i) => `
                  <div>
                    <input type="checkbox" id="srv-${i}" checked>
                    <label for="srv-${i}">
                      ${s.name || s.title} - R$ ${parseFloat(s.price || 0)
                        .toFixed(2)
                        .replace(".", ",")}
                    </label>
                  </div>
                `
                )
                .join("")}
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "Avançar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#00ffcc",
          cancelButtonColor: "#ff5555",
          preConfirm: () => selectedServices,
        });

        if (!servicesConfirmed) return false;

        if (!selectedEmployer) {
          const { value: employer } = await Swal.fire({
            title: "Escolha o profissional",
            background: "#0a0a0c",
            color: "#fff",
            html: `<div id="employers" style="text-align:left;max-height:250px;overflow-y:auto;padding:10px;">Carregando...</div>`,
            confirmButtonText: "Avançar",
            showCancelButton: true,
            cancelButtonText: "Voltar",
            confirmButtonColor: "#00ffcc",
            cancelButtonColor: "#ff5555",
            didOpen: async () => {
              const res = await axios.get(`${apiBaseUrl}/employer/list`, {
                headers: { Authorization: `Bearer ${userToken}` },
              });

              const container =
                Swal.getPopup().querySelector("#employers");

              container.innerHTML = res.data
                .map((emp) => {
                  const isSelf =
                    Number(emp.id) === Number(authUser.id);

                  return `
                    <div style="margin-bottom:8px;">
                      <input 
                        type="radio" 
                        name="emp" 
                        id="emp-${emp.id}"
                        value='${JSON.stringify(emp)}'
                        ${isSelf ? "disabled" : ""}
                      >
                      <label for="emp-${emp.id}" style="${
                    isSelf
                      ? "color:#ff7777;font-style:italic;"
                      : ""
                  }">
                        ${emp.name}
                        ${
                          isSelf
                            ? " (você não pode agendar consigo mesmo)"
                            : ""
                        }
                      </label>
                    </div>
                  `;
                })
                .join("");
            },
            preConfirm: () => {
              const checked = Swal.getPopup().querySelector(
                "input[name='emp']:checked"
              );
              return checked ? JSON.parse(checked.value) : null;
            },
          });

          if (!employer) return false;
          selectedEmployer = employer;
        }

        if (Number(selectedEmployer.id) === Number(authUser.id)) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Agendamento inválido",
            text: "Você não pode criar um agendamento onde o profissional e o cliente são a mesma pessoa.",
            confirmButtonColor: "#ff5555",
          });
          return false;
        }

        const { value: date } = await Swal.fire({
          title: "Escolha a data",
          background: "#0a0a0c",
          color: "#fff",
          input: "date",
          showCancelButton: true,
          confirmButtonColor: "#00ffcc",
        });

        if (!date) return false;
        selectedDate = date;

        const totalDuration = selectedServices.reduce(
          (sum, s) => sum + (parseInt(s?.duration) || 0),
          0
        );

        const availableTimes = await loadAvailableTimes(
          selectedDate,
          selectedEmployer,
          totalDuration
        );

        if (!availableTimes.length) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Sem horários",
            text: "Nenhum horário disponível para essa data.",
          });
          return false;
        }

        const { value: time } = await Swal.fire({
          title: "Escolha o horário",
          background: "#0a0a0c",
          color: "#fff",
          html: `
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
              ${availableTimes
                .map(
                  (t) =>
                    `<button type="button" class="swal2-confirm swal2-styled" data-time="${t}">${t}</button>`
                )
                .join("")}
            </div>
          `,
          showCancelButton: true,
          cancelButtonText: "Voltar",
          didOpen: () => {
            Swal.getPopup()
              .querySelectorAll("[data-time]")
              .forEach((btn) =>
                btn.addEventListener("click", () =>
                  Swal.clickConfirm(btn.dataset.time)
                )
              );
          },
          preConfirm: (v) => v,
        });

        if (!time) return false;
        selectedTime = time;

        const payload = {
          app_id: appId,
          entity_name: "establishment",
          entity_id: establishment?.id,
          items: selectedServices.map((s) => ({
            item_id: Number(s?.item_id ?? s?.id),
            quantity: 1,
          })),
          customer_name: authUser.name,
          customer_phone: authUser.phone ?? null,
          order_datetime: `${selectedDate}T${selectedTime}:00`,
          attendant_id: selectedEmployer.id,
          appointment_status: "pending",
        };

        await axios.post(`${apiBaseUrl}/order`, payload, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "success",
          title: "Agendamento confirmado",
          confirmButtonColor: "#00ffcc",
        });

        return true;
      } catch (error) {
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "error",
          title: "Erro",
          text:
            error?.response?.data?.message ||
            "Erro ao realizar o agendamento.",
        });
        return false;
      }
    },
    [apiBaseUrl, appId, establishment, loadAvailableTimes]
  );

  return { loadAvailableTimes, handleCreateAppointment };
}
