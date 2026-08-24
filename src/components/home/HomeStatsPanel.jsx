import React from "react";
import "./HomeStatsPanel.css";

export default function HomeStatsPanel({ stats, city, uf }) {
  if (!stats) return null;

  return (
    <div className="stats-panel">
      <h3 className="stats-title">
        Estatísticas {city && uf ? `— ${city} / ${uf}` : "gerais"}
      </h3>

      <div className="stats-section">
        <h4 className="stats-section-title">Visão geral</h4>

        <div className="stats-grid">
          <div className="stat-item"><span>Usuários</span><strong>{stats.total_users || 0}</strong></div>
          <div className="stat-item"><span>Estabelecimentos</span><strong>{stats.total_establishments || 0}</strong></div>
          <div className="stat-item"><span>Profissionais</span><strong>{stats.total_employers || 0}</strong></div>
          <div className="stat-item"><span>Itens cadastrados</span><strong>{stats.total_items || 0}</strong></div>
          <div className="stat-item"><span>Pedidos concluídos</span><strong>{stats.total_orders || 0}</strong></div>
          <div className="stat-item"><span>Interações</span><strong>{stats.total_interactions || 0}</strong></div>
          <div className="stat-item"><span>Cidades</span><strong>{stats.total_cities || 0}</strong></div>
        </div>
      </div>

      <div className="stats-section">
        <h4 className="stats-section-title">Crescimento (30 dias)</h4>

        <div className="stats-grid">
          <div className="stat-item"><span>Novos usuários</span><strong>{stats.users_growth_30d || 0}</strong></div>
          <div className="stat-item"><span>Novos pedidos</span><strong>{stats.orders_growth_30d || 0}</strong></div>
          <div className="stat-item"><span>Novos estabelecimentos</span><strong>{stats.new_establishments_month || 0}</strong></div>
        </div>
      </div>

      <div className="stats-section">
        <h4 className="stats-section-title">Atividade</h4>

        <div className="stats-grid">
          <div className="stat-item"><span>DAU</span><strong>{stats.dau || 0}</strong></div>
          <div className="stat-item"><span>MAU</span><strong>{stats.mau || 0}</strong></div>
          <div className="stat-item"><span>DAU / MAU</span><strong>{stats.dau_mau_ratio || 0}</strong></div>
        </div>
      </div>

      <div className="stats-section">
        <h4 className="stats-section-title">Top da semana</h4>

        <div className="rank-list">
          {stats.top_item_week ? (
            <div className="rank-item">
              <span>{stats.top_item_week.name}</span>
              <div className="rank-bar">
                <div
                  className="rank-bar-fill"
                  style={{ width: `${stats.top_item_week.total_views || 10}px` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="empty-rank">Sem dados</p>
          )}
        </div>
      </div>

      <div className="stats-section">
        <h4 className="stats-section-title">Mais vendidos (30d)</h4>

        <div className="rank-list">
          {stats.most_sold_item_month ? (
            <div className="rank-item">
              <span>{stats.most_sold_item_month.item?.name}</span>
              <div className="rank-bar">
                <div
                  className="rank-bar-fill"
                  style={{ width: `${stats.most_sold_item_month.total || 10}px` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="empty-rank">Sem dados</p>
          )}
        </div>
      </div>

      <div className="stats-section">
        <h4 className="stats-section-title">Mais vistos</h4>

        <div className="rank-subtitle">Estabelecimentos</div>
        <div className="rank-list">
          {(stats.top_viewed_establishments || []).slice(0, 5).map((e) => (
            <div key={e.id} className="rank-item">
              <span>{e.name}</span>
              <div className="rank-bar">
                <div className="rank-bar-fill" style={{ width: `${e.total_views || 10}px` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="rank-subtitle">Profissionais</div>
        <div className="rank-list">
          {(stats.top_viewed_employers || []).slice(0, 5).map((p) => (
            <div key={p.id} className="rank-item">
              <span>{p.user?.first_name} {p.user?.last_name}</span>
              <div className="rank-bar">
                <div className="rank-bar-fill" style={{ width: `${p.total_views || 10}px` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="rank-subtitle">Itens</div>
        <div className="rank-list">
          {(stats.top_viewed_items || []).slice(0, 5).map((i) => (
            <div key={i.id} className="rank-item">
              <span>{i.name}</span>
              <div className="rank-bar">
                <div className="rank-bar-fill" style={{ width: `${i.total_views || 10}px` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
