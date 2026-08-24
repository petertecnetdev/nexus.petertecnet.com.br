import React from "react";
import PropTypes from "prop-types";
import GlobalButton from "../GlobalButton";
import "./HomeHeader.css";

export default function HomeHeader({ city, uf, onChangeCity }) {
  return (
    <div className="hp-header">
      <div className="hp-header-left">
        <h1>Bem-vindo(a)!</h1>
        <div className="hp-location">
          {city && uf ? `${city} / ${uf}` : "Localização não definida"}
        </div>
      </div>

      <div className="hp-header-right">
        <GlobalButton
          variant="outline"
          size="sm"
          rounded
          onClick={onChangeCity}
          className="hp-change-city-btn"
        >
          Trocar cidade
        </GlobalButton>
      </div>
    </div>
  );
}

HomeHeader.propTypes = {
  city: PropTypes.string,
  uf: PropTypes.string,
  onChangeCity: PropTypes.func.isRequired,
};
