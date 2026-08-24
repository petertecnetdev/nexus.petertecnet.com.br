// ======================= src/components/home/HighlightsSection.jsx =======================
import React from "react";
import PropTypes from "prop-types";
import HighlightCard from "./HighlightCard";
import "./HighlightsSection.css";

export default function HighlightsSection({ highlights }) {
  return (
    <div className="hp-section">
      <div className="hp-section-title">Destaques da cidade</div>

      <div className="hp-highlights-grid">
        {highlights?.best_establishment && (
          <HighlightCard
            title={highlights.best_establishment.name}
            subtitle="Estabelecimento destaque"
          />
        )}

        {highlights?.best_employer && (
          <HighlightCard
            title={highlights.best_employer.name}
            subtitle="Profissional destaque"
          />
        )}

        {highlights?.best_item && (
          <HighlightCard
            icon
            title={highlights.best_item.name}
            subtitle="Serviço destaque"
          />
        )}

        {highlights?.top_item_week && (
          <HighlightCard
            icon
            title={highlights.top_item_week.name}
            subtitle="Mais visto da semana"
          />
        )}

        {highlights?.most_sold_item_month?.item && (
          <HighlightCard
            icon
            title={highlights.most_sold_item_month.item.name}
            subtitle="Mais vendido do mês"
          />
        )}
      </div>
    </div>
  );
}

HighlightsSection.propTypes = {
  highlights: PropTypes.object.isRequired,
};
