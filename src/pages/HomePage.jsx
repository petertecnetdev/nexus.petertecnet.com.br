// src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

import { apiBaseUrl, appId } from "../config";
import useHome from "../hooks/useHome";

import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";
import GlobalCarousel from "../components/GlobalCarousel";

import "./HomePage.css";

export default function HomePage() {
  const { establishments, serviceItems, productItems, isLoading, error } =
    useHome(apiBaseUrl, appId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper hp-centered">
          <div className="hp-loading">Carregando…</div>
        </div>
        <GlobalFooter />
      </>
    );
  }

  if (error) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper hp-centered">
          <div className="hp-loading">{error}</div>
        </div>
        <GlobalFooter />
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <main className="hp-wrapper">
        <GlobalCarousel
          title="Catálogos"
          items={establishments}
          navigate={navigate}
          showSchedule={false}
        />

        <GlobalCarousel
          title="Serviços"
          items={serviceItems}
          navigate={navigate}
          showSchedule={false}
        />

        <GlobalCarousel
          title="Produtos"
          items={productItems}
          navigate={navigate}
          showSchedule={false}
        />
      </main>

      <GlobalFooter />
    </>
  );
}
