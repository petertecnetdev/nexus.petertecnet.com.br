import React, { forwardRef, useImperativeHandle } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const TZ = "America/Sao_Paulo";

const GlobalAppointmentPopup = forwardRef(
  ({ employers = [], services = [], loadAvailableTimes, handleCreateAppointment, imageUrl }, ref) => {
    useImperativeHandle(ref, () => ({
      open: (options = {}) => openPopup(options),
    }));

    const toDateKey = (d) =>
      new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

    const openPopup = async (options = {}) => {
      const isEmployerMode = !!options.employer;
      let selectedEmployer = options.employer || null;
      let selectedServices = options.service
        ? [{ ...options.service, id: options.service.id || options.service.item_id }]
        : [];
      let selectedDateKey = options.date ? toDateKey(new Date(options.date)) : null;

      const now = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        return {
          key: toDateKey(d),
          label: d.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          }),
        };
      });

      const getTotalDuration = () => {
        if (!selectedServices.length) return 0;
        return selectedServices.reduce((sum, s) => sum + (parseInt(s.duration) || 30), 0);
      };

      const title = isEmployerMode
        ? `Agendar com ${selectedEmployer?.user?.first_name || "profissional"}`
        : selectedServices.length
        ? `Agendar ${selectedServices[0].name}`
        : "Agendar Atendimento";

      await MySwal.fire({
        width: "900px",
        background: "#0a0a0c",
        title: `<div style="font-size:20px;font-weight:700;color:#fff;">${title}</div>`,
        html: `
          <style>
            .swl-container{color:#fff;text-align:center;max-height:85vh;overflow-y:auto;padding:10px}
            .swl-section{margin-top:10px;}
            .swl-days,.swl-emps,.swl-services,.swl-times{
              display:flex;justify-content:center;flex-wrap:wrap;gap:8px;
            }
            .swl-day,.swl-emp,.swl-service,.swl-time{
              background:#111;color:#fff;border:1px solid #00aaff;border-radius:8px;
              padding:8px 12px;cursor:pointer;transition:0.3s;user-select:none;
            }
            .swl-day:hover,.swl-emp:hover,.swl-service:hover,.swl-time:hover{
              background:#00aaff;color:#000;
            }
            .swl-day.active,.swl-emp.active,.swl-service.active{
              background:#00ffff;color:#000;
              box-shadow:0 0 10px rgba(0,255,255,0.5);
            }
            .swl-selected-list{margin-top:10px;text-align:center;}
            .swl-selected-item{display:inline-block;background:#00ffff22;color:#00ffff;
              padding:5px 10px;border-radius:12px;margin:3px;font-size:13px;}
            .swl-remove{cursor:pointer;margin-left:6px;color:#ff5555;}
            .swl-duration{margin-top:8px;font-size:13px;color:#88eeff}
          </style>

          <div class="swl-container">
            ${
              !isEmployerMode
                ? `
            <div class="swl-section">
              <div>Selecione o profissional</div>
              <div class="swl-emps" id="swl-emps">
                ${employers
                  .map(
                    (e) => `
                  <div class="swl-emp" data-id="${e.id}">
                    <img src="${imageUrl(e.user?.avatar)}" onerror="this.src='/images/logo.png'"
                      style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:4px;"/>
                    <div style="font-size:13px;">${e.user?.first_name || "Profissional"}</div>
                  </div>`
                  )
                  .join("")}
              </div>
            </div>`
                : `
            <div class="swl-section">
              <div>Profissional selecionado</div>
              <div class="swl-emps">
                <div class="swl-emp active" style="pointer-events:none;">
                  <img src="${imageUrl(selectedEmployer.user?.avatar)}" onerror="this.src='/images/logo.png'"
                    style="width:70px;height:70px;border-radius:50%;object-fit:cover;margin-bottom:6px;"/>
                  <div style="font-size:14px;">${selectedEmployer.user?.first_name || "Profissional"}</div>
                </div>
              </div>
            </div>`
            }

            <div class="swl-section">
              <div>Selecione os serviços</div>
              <div class="swl-services" id="swl-services">
                ${services
                  .map(
                    (s) => `
                  <div class="swl-service ${
                    selectedServices.find(
                      (ss) => ss.id === (s.id || s.item_id)
                    )
                      ? "active"
                      : ""
                  }" data-id="${s.id || s.item_id}">
                    <div style="font-weight:600;font-size:13px;">${s.name}</div>
                    <div style="font-size:12px;color:#00aaff;">R$ ${Number(s.price)
                      .toFixed(2)
                      .replace(".", ",")}</div>
                    <div style="font-size:11px;color:#999;">${s.duration || 30}min</div>
                  </div>`
                  )
                  .join("")}
              </div>
            </div>

            <div class="swl-section">
              <div>Selecione a data</div>
              <div class="swl-days" id="swl-days">
                ${days
                  .map(
                    (d) =>
                      `<button class="swl-day ${
                        selectedDateKey === d.key ? "active" : ""
                      }" data-key="${d.key}">${d.label}</button>`
                  )
                  .join("")}
              </div>
            </div>

            <div class="swl-section">
              <div>Horários disponíveis</div>
              <div id="swl-times" class="swl-times"></div>
            </div>
          </div>
        `,
        showConfirmButton: false,
        didOpen: async () => {
          const root = MySwal.getHtmlContainer();
          const empWrap = root.querySelector("#swl-emps");
          const daysWrap = root.querySelector("#swl-days");
          const timesDiv = root.querySelector("#swl-times");

          if (empWrap && !isEmployerMode) {
            empWrap.querySelectorAll(".swl-emp").forEach((btn) => {
              btn.addEventListener("click", async () => {
                empWrap
                  .querySelectorAll(".swl-emp")
                  .forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                const id = Number(btn.getAttribute("data-id"));
                selectedEmployer = employers.find((e) => e.id === id) || null;
                if (selectedEmployer && selectedDateKey && selectedServices.length) {
                  await renderTimes(timesDiv, selectedEmployer, selectedDateKey, selectedServices);
                }
              });
            });
          }

          if (daysWrap) {
            daysWrap.querySelectorAll(".swl-day").forEach((btn) => {
              btn.addEventListener("click", async () => {
                daysWrap
                  .querySelectorAll(".swl-day")
                  .forEach((d) => d.classList.remove("active"));
                btn.classList.add("active");
                selectedDateKey = btn.getAttribute("data-key");
                if (selectedEmployer && selectedServices.length)
                  await renderTimes(timesDiv, selectedEmployer, selectedDateKey, selectedServices);
              });
            });
          }
        },
      });
    };

    const renderTimes = async (timesDiv, selectedEmployer, selectedDateKey, selectedServices) => {
      timesDiv.innerHTML = '<div class="text-muted small">Carregando horários...</div>';
      const duration = selectedServices.reduce(
        (sum, s) => sum + (parseInt(s.duration) || 30),
        0
      );
      const times = await loadAvailableTimes(selectedDateKey, selectedEmployer, duration);
      timesDiv.innerHTML = times.length
        ? times
            .map(
              (t) => `<button class="swl-time" data-time="${t}">${t}</button>`
            )
            .join("")
        : '<div class="text-muted small">Nenhum horário disponível.</div>';

      timesDiv.querySelectorAll(".swl-time").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await handleCreateAppointment(
            selectedServices,
            selectedEmployer,
            selectedDateKey,
            btn.getAttribute("data-time")
          );
        });
      });
    };

    return null;
  }
);

export default GlobalAppointmentPopup;
