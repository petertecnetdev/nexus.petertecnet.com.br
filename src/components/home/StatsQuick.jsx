// src/components/home/StatsQuick.jsx
import React from "react";
import PropTypes from "prop-types";
import StatCard from "./StatCard";
import "./StatsQuick.css";

export default function StatsQuick({ stats }) {
  return (
    <div className="hp-stats-row">
      <StatCard value={stats.total_users} label="Usuários" />
      <StatCard value={stats.total_establishments} label="Estabelecimentos" />
      <StatCard value={stats.total_employers} label="Profissionais" />
      <StatCard value={stats.total_items} label="Serviços" />
      <StatCard value={stats.total_orders} label="Pedidos" />
      <StatCard value={stats.new_users_30d} label="Novos usuários (30d)" />
    </div>
  );
}

StatsQuick.propTypes = {
  stats: PropTypes.shape({
    total_users: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    total_establishments: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
    total_employers: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
    total_items: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    total_orders: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    new_users_30d: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};
