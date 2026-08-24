// src/components/CitySelectorModal.jsx// 
import React, { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { apiBaseUrl } from "../config";
import "./CitySelectorModal.css";

export default function CitySelectorModal({
  user = {},
  show,
  onClose,
  onSelectCity,
}) {
  const appId = 2;

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const dropdownRef = useRef(null);

  const storedCity = localStorage.getItem("selectedCity") || user.city || "";
  const storedUF = localStorage.getItem("selectedUF") || user.uf || "";

  const [city, setCity] = useState(storedCity);
  const [uf, setUf] = useState(storedUF);

  useEffect(() => {
    if (!show) return;

    async function fetchCities() {
      setLoading(true);
      try {
        const res = await axios.get(
          `${apiBaseUrl}/establishment/cities/${appId}`
        );
        setCities(res.data.cities || []);
      } catch (e) {
        console.error("Erro ao buscar cidades:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  const filteredCities = useMemo(() => {
    if (!search.trim()) return cities;
    const term = search.toLowerCase();
    return cities.filter((c) =>
      `${c.city} ${c.uf}`.toLowerCase().includes(term)
    );
  }, [cities, search]);

  const handleSelect = (c) => {
    setCity(c.city);
    setUf(c.uf);
    setOpen(false);
  };

  const handleSelectAll = () => {
    setCity("Todas");
    setUf("ALL");
    setOpen(false);
  };

  const handleSave = () => {
    if (!city || !uf) return;

    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedUF", uf);
    localStorage.setItem("user", JSON.stringify({ ...user, city, uf }));

    if (typeof onSelectCity === "function") {
      onSelectCity({ city, uf });
    }
  };

  if (!show) return null;

  return (
    <div className="city-modal-overlay">
      <div className="city-modal">
        <div className="city-modal-header">
          <div>
            <h3>Escolha sua cidade</h3>
            <p>Personalizamos a experiência com base na sua localização</p>
          </div>
          <button className="city-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="city-modal-body">
          {loading ? (
            <div className="city-loading">Carregando cidades…</div>
          ) : (
            <div className="city-dropdown-container" ref={dropdownRef}>
              <label className="city-label">Buscar cidade</label>
              <input
                className="city-search-input"
                placeholder="Digite o nome ou UF"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setOpen(true)}
              />
              <div
                className={`city-dropdown ${open ? "open" : ""}`}
                onClick={() => setOpen((v) => !v)}
              >
                <span className="city-selected">
                  {city && uf
                    ? uf === "ALL"
                      ? "Todas as cidades"
                      : `${city} / ${uf}`
                    : "Selecionar"}
                </span>
                <span className="city-arrow">▾</span>
              </div>
              <div className={`city-options ${open ? "show" : ""}`}>
                <button
                  type="button"
                  className={`city-option ${uf === "ALL" ? "active" : ""}`}
                  onClick={handleSelectAll}
                >
                  <strong>Todas as cidades</strong>
                  <span>Brasil</span>
                </button>

                {filteredCities.length === 0 ? (
                  <div className="city-empty">Nenhuma cidade encontrada</div>
                ) : (
                  filteredCities.map((c) => (
                    <button
                      type="button"
                      key={`${c.city}-${c.uf}`}
                      className={`city-option ${
                        c.city === city && c.uf === uf ? "active" : ""
                      }`}
                      onClick={() => handleSelect(c)}
                    >
                      <strong>{c.city}</strong>
                      <span>{c.uf}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="city-modal-footer">
          <button className="city-btn secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="city-btn primary"
            onClick={handleSave}
            disabled={!city || !uf}
          >
            Confirmar cidade
          </button>
        </div>
      </div>
    </div>
  );
}

CitySelectorModal.propTypes = {
  user: PropTypes.object,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectCity: PropTypes.func.isRequired,
};
