// src/components/home/HomeFullInfo.jsx
import React from "react";
import "./HomeFullInfo.css";

export default function HomeFullInfo({ home }) {
  const fmtBRL = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const renderFiles = (files) =>
    files?.length
      ? files.map((f) => (
          <div key={f.id} className="hp-file">
            <img src={f.public_url} alt={f.original_name || f.type} />
            <small>{f.type}</small>
            <small>Views: {f.metrics?.total_views ?? 0}</small>
            <small>Downloads: {f.metrics?.total_downloads ?? 0}</small>
          </div>
        ))
      : null;

  const renderInteractions = (interactions) =>
    interactions?.length
      ? interactions.map((i) => (
          <li key={i.id}>
            <strong>{i.entity_type}</strong> #{i.entity_id} - {i.interaction_type}{" "}
            {i.user && `por ${i.user.first_name} ${i.user.last_name}`}{" "}
            <span>({new Date(i.created_at).toLocaleString()})</span>
          </li>
        ))
      : null;

  return (
    <div className="hp-full-info">

      {/* ESTABELECIMENTOS */}
      {home.establishments?.length > 0 && (
        <section className="hp-section hp-establishments">
          <h2>Estabelecimentos</h2>
          {home.establishments.map((e) => (
            <div key={e.id} className="hp-card">
              <h3>{e.name} ({e.city}/{e.uf})</h3>
              <div className="hp-images">{renderFiles(e.files)}</div>
              <p>Total Views: {e.total_views}</p>
            </div>
          ))}
        </section>
      )}

      {/* EMPREGADOS */}
      {home.employers?.length > 0 && (
        <section className="hp-section hp-employers">
          <h2>Empregados</h2>
          {home.employers.map((emp) => (
            <div key={emp.id} className="hp-card">
              <h3>{emp.name} ({emp.user_name})</h3>
              <div className="hp-images">
                <img src={emp.avatar} alt={emp.name} />
                {renderFiles(emp.files)}
              </div>
              <p>Estabelecimento: {emp.establishment?.name}</p>
              <p>Total Views: {emp.total_views}</p>
            </div>
          ))}
        </section>
      )}

      {/* ITENS */}
      {home.items?.length > 0 && (
        <section className="hp-section hp-items">
          <h2>Itens</h2>
          {home.items.map((i) => (
            <div key={i.id} className="hp-card">
              <h3>{i.name} - {i.type}</h3>
              <p>Preço: {fmtBRL(i.price)}</p>
              <p>Estabelecimento: {i.establishment?.name}</p>
              <div className="hp-images">
                {i.images?.avatar && <img src={i.images.avatar} alt={i.name} />}
                {i.images?.gallery?.map((g, idx) => <img key={idx} src={g} alt={i.name + idx} />)}
              </div>
              <p>Total Views: {i.total_views}</p>
            </div>
          ))}
        </section>
      )}

      {/* ORDENS RECENTES */}
      {home.recent_orders?.length > 0 && (
        <section className="hp-section hp-recent-orders">
          <h2>Últimos Pedidos</h2>
          <ul>{renderInteractions(home.recent_orders)}</ul>
        </section>
      )}

      {/* INTERAÇÕES RECENTES */}
      {home.recent_interactions?.length > 0 && (
        <section className="hp-section hp-recent-interactions">
          <h2>Interações Recentes</h2>
          <ul>{renderInteractions(home.recent_interactions)}</ul>
        </section>
      )}

      {/* HIGHLIGHTS */}
      {home.highlights && (
        <section className="hp-section hp-highlights">
          <h2>Destaques</h2>
          {["best_establishment", "best_employer", "best_item", "top_item_week", "most_sold_item_month"].map(
            (key) =>
              home.highlights[key] && (
                <div key={key} className="hp-card">
                  <h3>{key.replace(/_/g, " ").toUpperCase()}</h3>
                  <p>{home.highlights[key].name}</p>
                  {home.highlights[key].images?.avatar && (
                    <img src={home.highlights[key].images.avatar} alt={home.highlights[key].name} />
                  )}
                  <p>Score: {home.highlights[key].score}</p>
                  {home.highlights[key].price && <p>Preço: {fmtBRL(home.highlights[key].price)}</p>}
                </div>
              )
          )}
        </section>
      )}
    </div>
  );
}
