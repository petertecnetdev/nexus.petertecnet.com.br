// src/components/GlobalOrderCard.jsx
import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import useImageUtils from "../hooks/useImageUtils";
import GlobalButton from "./GlobalButton";
import "./GlobalOrderCard.css";

const STATUS_PT = {
  scheduled: "Agendado",
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Finalizado",
  cancelled: "Cancelado",
  attended: "Atendido",
  not_attended: "Não compareceu",
};

const addMinutes = (date, minutes) =>
  new Date(new Date(date).getTime() + Number(minutes || 0) * 60000);

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtSmartDate = (d) => {
  if (!d) return "-";

  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - today) / 86400000);

  const fullDate = date.toLocaleDateString("pt-BR");
  const time = fmtTime(date);

  if (diffDays === 0)
    return `Hoje às ${time} (${fullDate})`;

  if (diffDays === 1)
    return `Amanhã às ${time} (${fullDate})`;

  if (diffDays <= 7) {
    const weekday = date.toLocaleDateString("pt-BR", {
      weekday: "long",
    });
    return `${weekday} às ${time} (${fullDate})`;
  }

  return `${fullDate} às ${time}`;
};

const fmtSmartRange = (start, end) => {
  if (!start || !end) return "-";

  const s = new Date(start);
  const e = new Date(end);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(s);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - today) / 86400000);

  const fullDate = s.toLocaleDateString("pt-BR");

  if (diffDays === 0)
    return `Hoje das ${fmtTime(s)} até ${fmtTime(e)} (${fullDate})`;

  if (diffDays === 1)
    return `Amanhã das ${fmtTime(s)} até ${fmtTime(e)} (${fullDate})`;

  if (diffDays <= 7) {
    const weekday = s.toLocaleDateString("pt-BR", {
      weekday: "long",
    });
    return `${weekday} das ${fmtTime(s)} até ${fmtTime(e)} (${fullDate})`;
  }

  return `${fullDate} das ${fmtTime(s)} até ${fmtTime(e)}`;
};

const fmtBRL = (v) =>
  `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

const getInitials = (user) => {
  if (!user?.first_name) return "?";
  const f = user.first_name[0] || "";
  const l = user.last_name?.[0] || "";
  return `${f}${l}`.toUpperCase();
};

function Avatar({ user }) {
  const { imageUrl } = useImageUtils();
  const [broken, setBroken] = useState(false);

  if (user?.avatar && !broken) {
    return (
      <img
        src={imageUrl(user.avatar)}
        alt={user.first_name}
        className="gorder-avatar"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className="gorder-avatar-fallback">
      {getInitials(user)}
    </div>
  );
}

Avatar.propTypes = {
  user: PropTypes.object,
};

export default function GlobalOrderCard({ order }) {
  const navigate = useNavigate();

  const client = order.client_user;
  const attendant = order.attendant_user;

  const start = order.order_datetime;
  const end = addMinutes(order.order_datetime, order.total_duration);
  const createdAt = order.created_at;

  const statusKey = order.appointment_status || order.status;
  const statusLabel = STATUS_PT[statusKey] || statusKey;

  const { total, items } = useMemo(() => {
    let sum = 0;

    const rows =
      order.items?.map((oi) => {
        const price =
          Number(oi.subtotal) ||
          Number(oi.unit_price) * Number(oi.quantity || 1) ||
          Number(oi.item?.price || 0);

        sum += price;

        return {
          id: oi.id,
          name: oi.item?.name,
          slug: oi.item?.slug,
          duration: oi.item?.duration || 0,
          price,
        };
      }) || [];

    return { total: sum, items: rows };
  }, [order.items]);

  return (
    <div className={`gorder-card gorder-status-${statusKey}`}>
      <div className="gorder-header">
        <div className="gorder-users">
          {client && (
            <div className="gorder-user gorder-user-client">
              <Avatar user={client} />
              <div className="gorder-user-info">
                <span className="gorder-user-role">Cliente</span>
                <Link to={`/user/${client.user_name}`}>
                  {client.first_name} {client.last_name || ""}
                </Link>
              </div>
            </div>
          )}

          {attendant && (
            <div className="gorder-user gorder-user-attendant">
              <Avatar user={attendant} />
              <div className="gorder-user-info">
                <span className="gorder-user-role">Barbeiro</span>
                <Link to={`/employer/${attendant.user_name}`}>
                  {attendant.first_name} {attendant.last_name || ""}
                </Link>
              </div>
            </div>
          )}
        </div>

        <Badge bg="secondary">{statusLabel}</Badge>
      </div>

      <div className="gorder-body">
        <div className="gorder-requested">
          <strong>Solicitado:</strong> {fmtSmartDate(createdAt)}
        </div>

        <div className="gorder-time-range">
          <strong>Agendamento:</strong> {fmtSmartRange(start, end)}
        </div>

        <div className="gorder-items">
          {items.map((it) => (
            <div key={it.id} className="gorder-item-row">
              <Link
                to={`/item/view/${it.slug}`}
                className="gorder-item-name"
              >
                {it.name}
              </Link>
              <span className="gorder-item-meta">
                {it.duration} min · {fmtBRL(it.price)}
              </span>
            </div>
          ))}
        </div>

        <div className="gorder-summary">
          <div>
            <strong>Duração:</strong> {order.total_duration} min
          </div>
          <div className="gorder-price">
            <strong>Total:</strong> {fmtBRL(total)}
          </div>
        </div>
      </div>

      <div className="gorder-footer">
        <GlobalButton
          size="sm"
          variant="outline"
          onClick={() => navigate(`/order/${order.id}`)}
        >
          Ver pedido
        </GlobalButton>
      </div>
    </div>
  );
}

GlobalOrderCard.propTypes = {
  order: PropTypes.object.isRequired,
};
