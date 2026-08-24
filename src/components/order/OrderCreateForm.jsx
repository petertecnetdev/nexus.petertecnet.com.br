// src/components/order/OrderCreateForm.jsx
import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { Form, Row, Col, Spinner, Badge } from "react-bootstrap";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/pt-br";

import GlobalButton from "../GlobalButton";
import GlobalDateCarousel from "../GlobalDateCarousel";
import OrderItemsModal from "./OrderItemsModal";
import OrderEmployerModal from "./OrderEmployerModal";
import OrderClientSearch from "./OrderClientSearch";
import OrderSelectedEmployerCard from "./OrderSelectedEmployerCard";
import OrderSelectedClientCard from "./OrderSelectedClientCard";
import OrderSelectedItemsCard from "./OrderSelectedItemsCard";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(localeData);
dayjs.locale("pt-br");

export default function OrderCreateForm({
  establishment,
  items = [],
  employers = [],
  clients = [],
  searchingClients = false,
  searchClients,
  selectedClient,
  setSelectedClient,
  fetchAvailableTimes,
  onSubmit,
  isSubmitting = false,
}) {
  const [mode, setMode] = useState("direct");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");

  const [attendant, setAttendant] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);

  const [selectedItems, setSelectedItems] = useState({});
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showEmployerModal, setShowEmployerModal] = useState(false);

  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  useEffect(() => {
    if (!selectedClient) {
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerCpf("");
      return;
    }

    setCustomerName(
      `${selectedClient.first_name || ""} ${
        selectedClient.last_name || ""
      }`.trim()
    );
    setCustomerEmail(selectedClient.email || "");
    setCustomerPhone(selectedClient.phone || "");
    setCustomerCpf(selectedClient.cpf || "");
  }, [selectedClient]);

  const selectedArray = useMemo(
    () => Object.values(selectedItems),
    [selectedItems]
  );

  const totalDuration = useMemo(
    () =>
      selectedArray.reduce(
        (sum, i) => sum + Number(i.duration || 0) * Number(i.quantity || 1),
        0
      ),
    [selectedArray]
  );

  const totalPrice = useMemo(
    () =>
      selectedArray.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1),
        0
      ),
    [selectedArray]
  );

  useEffect(() => {
    if (
      mode !== "appointment" ||
      !attendant ||
      !date ||
      totalDuration <= 0
    ) {
      setAvailableTimes([]);
      setTime(null);
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoadingTimes(true);

        const payload = {
          employer_id: attendant.id,
          date: dayjs(date)
            .hour(14)
            .minute(0)
            .second(0)
            .format("YYYY-MM-DDTHH:mm:ss"),
          duration: totalDuration,
        };

        const times = await fetchAvailableTimes(payload);
        if (!active) return;

        setAvailableTimes(Array.isArray(times) ? times : []);
      } finally {
        if (active) setLoadingTimes(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [mode, attendant, date, totalDuration, fetchAvailableTimes]);

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      if (prev[item.id]) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }

      return {
        ...prev,
        [item.id]: {
          item_id: item.id,
          name: item.name,
          price: item.price,
          duration: item.duration || 0,
          quantity: 1,
          image: item.image || null,
          images: item.images || null,
        },
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!attendant) return;
    if (!selectedArray.length) return;
    if (!customerName) return;
    if (mode === "appointment" && (!date || !time)) return;

    await onSubmit({
      mode,
      type: mode,
      client_id: selectedClient?.id || null,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      customer_cpf: customerCpf || null,
      attendant_id: attendant.id,
      order_datetime:
        mode === "appointment"
          ? `${dayjs(date).format("YYYY-MM-DD")} ${time}`
          : null,
      items: selectedArray.map((i) => ({
        item_id: i.item_id,
        quantity: i.quantity,
      })),
    });
  };

  const uniqueTimes = useMemo(
    () => [...new Set(availableTimes)],
    [availableTimes]
  );

  return (
    <>
      <Form onSubmit={submit}>
        <Row className="mb-3">
          <Col>
            <Form.Check
              type="radio"
              label="Atendimento direto"
              checked={mode === "direct"}
              onChange={() => setMode("direct")}
            />
            <Form.Check
              type="radio"
              label="Agendamento"
              checked={mode === "appointment"}
              onChange={() => setMode("appointment")}
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            {!attendant ? (
              <GlobalButton
                type="button"
                onClick={() => setShowEmployerModal(true)}
                full
              >
                Selecionar colaborador
              </GlobalButton>
            ) : (
              <OrderSelectedEmployerCard
                employer={attendant}
                onClear={() => {
                  setAttendant(null);
                  setDate(null);
                  setTime(null);
                  setSelectedClient(null);
                }}
              />
            )}
          </Col>
        </Row>

        {attendant && (
          <Row className="mb-3">
            <Col>
              {!selectedClient ? (
                <OrderClientSearch
                  searchClients={searchClients}
                  clients={clients}
                  searching={searchingClients}
                  selectedClient={selectedClient}
                  onSelect={setSelectedClient}
                  onClear={() => setSelectedClient(null)}
                />
              ) : (
                <OrderSelectedClientCard
                  client={selectedClient}
                  onClear={() => setSelectedClient(null)}
                />
              )}
            </Col>
          </Row>
        )}

        <GlobalButton
          type="button"
          variant="secondary"
          onClick={() => setShowItemsModal(true)}
        >
          Selecionar serviços
        </GlobalButton>

        <OrderItemsModal
          show={showItemsModal}
          onHide={() => setShowItemsModal(false)}
          items={items}
          selectedItems={selectedItems}
          toggleItem={toggleItem}
        />

        {!!selectedArray.length && (
          <OrderSelectedItemsCard
            items={selectedItems}
            onIncrease={(id) =>
              setSelectedItems((prev) => ({
                ...prev,
                [id]: { ...prev[id], quantity: prev[id].quantity + 1 },
              }))
            }
            onDecrease={(id) =>
              setSelectedItems((prev) => ({
                ...prev,
                [id]: {
                  ...prev[id],
                  quantity: Math.max(1, prev[id].quantity - 1),
                },
              }))
            }
            onRemove={(id) =>
              setSelectedItems((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              })
            }
          />
        )}

        {mode === "appointment" && attendant && selectedArray.length > 0 && (
          <div className="step-container mt-4">
            <h4>Escolha a Data</h4>
            <GlobalDateCarousel
              selectedDate={date}
              onChange={(d) => setDate(d)}
              daysToShow={14}
            />
          </div>
        )}

        {mode === "appointment" && date && (
          <div className="step-container mt-4">
            <h4>Horários Disponíveis</h4>

            {loadingTimes && (
              <div className="text-center mt-2">
                <Spinner animation="border" size="sm" />
              </div>
            )}

            {!loadingTimes && uniqueTimes.length === 0 && (
              <div className="text-muted">Nenhum horário disponível</div>
            )}

            {!loadingTimes && uniqueTimes.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {uniqueTimes.map((t) => (
                  <Badge
                    key={t}
                    pill
                    bg={time === t ? "primary" : "secondary"}
                    style={{ cursor: "pointer", padding: "10px 14px" }}
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-3">
          <strong>Duração:</strong> {totalDuration} min
          <br />
          <strong>Total:</strong> R$ {totalPrice.toFixed(2).replace(".", ",")}
        </div>

        <GlobalButton
          type="submit"
          loading={isSubmitting}
          full
          className="mt-4"
          disabled={isSubmitting || !attendant || !selectedArray.length}
        >
          Salvar Pedido
        </GlobalButton>
      </Form>

      <OrderEmployerModal
        show={showEmployerModal}
        onHide={() => setShowEmployerModal(false)}
        employers={employers}
        onSelect={setAttendant}
      />
    </>
  );
}

OrderCreateForm.propTypes = {
  establishment: PropTypes.object,
  items: PropTypes.array,
  employers: PropTypes.array,
  clients: PropTypes.array,
  searchingClients: PropTypes.bool,
  searchClients: PropTypes.func.isRequired,
  selectedClient: PropTypes.object,
  setSelectedClient: PropTypes.func.isRequired,
  fetchAvailableTimes: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};
