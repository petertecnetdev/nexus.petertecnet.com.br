// src/components/order/OrderWizardController.jsx
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import GlobalModal from "../GlobalModal";
import OrderStepServices from "./Ordeervices";
import OrderStepEmployer from "./OrderStepEmployer";
import OrderStepDate from "./OrderStepDate";
import OrderStepTime from "./OrderStepTime";
import OrderStepConfirm from "./OrderStepConfirm";
import { apiBaseUrl } from "../../config";

dayjs.extend(utc);
dayjs.extend(tz);

let state = {};

const setState = (patch) => {
  state = { ...state, ...patch };
};

export default class OrderWizardController {
  static open({
    services = [],
    employers = [],
    loadAvailableTimes,
    imageUrl,
    establishment = null,
    preselectedItem = null,
    preselectedEmployer = null,
  }) {
    state = {
      step: 1,
      services,
      employers,
      loadAvailableTimes,
      imageUrl,
      establishment,
      preselectedItem,
      preselectedEmployer,
      selectedServices: preselectedItem ? [preselectedItem] : [],
      selectedEmployer: preselectedEmployer || null,
      selectedDate: null,
      availableTimes: [],
      selectedTime: null,
      customerCpf: "",
      customerPhone: "",
      loading: false,
    };

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        state.customerCpf = parsed.profile?.cpf || parsed.cpf || "";
        state.customerPhone = parsed.profile?.phone || parsed.phone || "";
      } catch {}
    }

    OrderWizardController.render();
  }

  static close() {
    GlobalModal.close();
    state = {};
  }

  static totalDuration() {
    return state.selectedServices.reduce(
      (s, x) => s + (parseInt(x.duration, 10) || 30),
      0
    );
  }

  static totalValue() {
    return state.selectedServices.reduce(
      (s, x) => s + (parseFloat(x.price) || 0),
      0
    );
  }

  static async next() {
    const {
      step,
      selectedServices,
      selectedEmployer,
      preselectedEmployer,
      selectedDate,
      loadAvailableTimes,
    } = state;

    const hasPreselectedEmployer = !!preselectedEmployer;

    if (step === 1) {
      if (!selectedServices.length) return;
      setState({ step: 2 });
      return OrderWizardController.render();
    }

    if (!hasPreselectedEmployer && step === 2) {
      if (!selectedEmployer) return;
      setState({ step: 3 });
      return OrderWizardController.render();
    }

    if (step === (hasPreselectedEmployer ? 2 : 3)) {
      if (!selectedDate) return;
      setState({ loading: true });

      const times = await loadAvailableTimes(
        selectedDate,
        selectedEmployer || preselectedEmployer,
        OrderWizardController.totalDuration()
      );

      setState({
        availableTimes: Array.isArray(times) ? times : [],
        loading: false,
        step: step + 1,
      });

      return OrderWizardController.render();
    }

    if (step === (hasPreselectedEmployer ? 3 : 4)) {
      if (!state.selectedTime) return;
      setState({ step: step + 1 });
      return OrderWizardController.render();
    }

    if (step === (hasPreselectedEmployer ? 4 : 5)) {
      return OrderWizardController.submit();
    }
  }

  static back() {
    setState({ step: Math.max(1, state.step - 1) });
    OrderWizardController.render();
  }

  static async submit() {
    const {
      selectedServices,
      selectedEmployer,
      preselectedEmployer,
      selectedDate,
      selectedTime,
      customerCpf,
      customerPhone,
      establishment,
    } = state;

    if (!customerCpf || !customerPhone) {
      GlobalModal.open({
        title: "Dados obrigatórios",
        html: "Informe CPF e telefone.",
        showCancel: false,
      });
      return;
    }

    setState({ loading: true });

    const datetimeSP = dayjs.tz(
      `${selectedDate} ${selectedTime}`,
      "YYYY-MM-DD HH:mm",
      "America/Sao_Paulo"
    );

    let customerName = "Cliente App";
    let clientId = null;
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      clientId = parsed.id || null;
      customerName =
        `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim() ||
        parsed.user_name ||
        customerName;
    }

    const entityId =
      establishment?.id ||
      selectedEmployer?.establishment_id ||
      preselectedEmployer?.establishment_id ||
      null;

    const payload = {
      mode: "order",
      app_id: establishment?.app_id || 2,
      entity_name: "establishment",
      entity_id: entityId,
      items: selectedServices.map((s) => ({
        item_id: s.id || s.item_id,
        quantity: 1,
      })),
      client_id: clientId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_cpf: customerCpf,
      origin: "App",
      fulfillment: "appointment",
      payment_status: "pending",
      payment_method: "Pix",
      notes: "Ordem de serviço agendada pelo app.",
      order_datetime: datetimeSP.format("YYYY-MM-DDTHH:mm:ssZ"),
      attendant_id: selectedEmployer?.id || preselectedEmployer?.id,
    };

    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBaseUrl}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    setState({ loading: false });

    if (res.ok) {
      GlobalModal.open({
        title: "Pedido criado",
        html: "Ordem de serviço agendada com sucesso.",
        showCancel: false,
        onConfirm: OrderWizardController.close,
      });
    } else {
      GlobalModal.open({
        title: "Erro",
        html: data?.message || "Erro ao criar pedido.",
        showCancel: false,
      });
    }
  }

  static render() {
    const {
      step,
      services,
      employers,
      imageUrl,
      preselectedEmployer,
      selectedServices,
      selectedEmployer,
      selectedDate,
      availableTimes,
      selectedTime,
      customerCpf,
      customerPhone,
    } = state;

    const hasPreselectedEmployer = !!preselectedEmployer;
    const finalStep = hasPreselectedEmployer ? 4 : 5;

    let body = null;

    if (step === 1) {
      body = (
        <OrderStepServices
          services={services}
          selected={selectedServices}
          onChange={(v) => setState({ selectedServices: v })}
        />
      );
    }

    if (!hasPreselectedEmployer && step === 2) {
      body = (
        <OrderStepEmployer
          employers={employers}
          selected={selectedEmployer}
          onChange={(e) => setState({ selectedEmployer: e })}
          imageUrl={imageUrl}
        />
      );
    }

    if (step === (hasPreselectedEmployer ? 2 : 3)) {
      body = <OrderStepDate onChange={(d) => setState({ selectedDate: d })} />;
    }

    if (step === (hasPreselectedEmployer ? 3 : 4)) {
      body = (
        <OrderStepTime
          availableTimes={availableTimes}
          selected={selectedTime}
          onChange={(t) => setState({ selectedTime: t })}
        />
      );
    }

    if (step === finalStep) {
      body = (
        <OrderStepConfirm
          services={selectedServices}
          employer={selectedEmployer || preselectedEmployer}
          date={selectedDate}
          time={selectedTime}
          total={OrderWizardController.totalValue()}
          duration={OrderWizardController.totalDuration()}
          customerCpf={customerCpf}
          customerPhone={customerPhone}
          onCpfChange={(v) => setState({ customerCpf: v })}
          onPhoneChange={(v) => setState({ customerPhone: v })}
        />
      );
    }

    GlobalModal.open({
      title: "Agendar Ordem de Serviço",
      width: 900,
      html: body,
      confirmText: step === finalStep ? "Confirmar" : "Avançar",
      cancelText: step > 1 ? "Voltar" : "Cancelar",
      showCancel: true,
      onConfirm: OrderWizardController.next,
      onCancel: step > 1 ? OrderWizardController.back : OrderWizardController.close,
    });
  }
}
