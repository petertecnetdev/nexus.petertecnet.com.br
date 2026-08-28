import React from "react";
import { useNavigate } from "react-router-dom";

import { apiBaseUrl, appId } from "../config";
import useHome from "../hooks/useHome";

import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";
import GlobalCarousel from "../components/GlobalCarousel";
import NexusFeedback from "../components/NexusFeedback";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";

import "./HomePage.css";

export default function HomePage() {
  const { establishments, serviceItems, productItems, isLoading, error } =
    useHome(apiBaseUrl, appId);
  const navigate = useNavigate();

  if (isLoading) {
    return <ProcessingIndicatorComponent messages={["Carregando catálogos…", "Organizando produtos e serviços…"]} />;
  }

  return (
    <>
      <GlobalNav />

      <main className="hp-wrapper">
        <section className="hp-hero">
          <div className="hp-hero__copy">
            <span className="hp-eyebrow">Seu catálogo. Um link. Um QR Code.</span>
            <h1>Apresente sua empresa e seus itens de um jeito simples.</h1>
            <p>
              Cadastre sua empresa, organize produtos e serviços e compartilhe um catálogo
              profissional que funciona em qualquer celular.
            </p>

            <div className="hp-hero__actions">
              <button type="button" className="hp-primary-action" onClick={() => navigate("/register")}>
                Criar meu catálogo
              </button>
              <button type="button" className="hp-secondary-action" onClick={() => navigate("/establishments")}>
                Explorar catálogos
              </button>
            </div>

            <div className="hp-benefits" aria-label="Benefícios da Nexus">
              <span><i className="fas fa-qrcode" /> QR Code automático</span>
              <span><i className="fas fa-link" /> Link público</span>
              <span><i className="fas fa-mobile-alt" /> Feito para celular</span>
            </div>
          </div>

          <div className="hp-hero__visual" aria-hidden="true">
            <div className="hp-orbit hp-orbit--one" />
            <div className="hp-orbit hp-orbit--two" />
            <div className="hp-logo-card">
              <img src="/images/logo.png" alt="" />
              <strong>Nexus</strong>
              <span>catálogo online</span>
            </div>
          </div>
        </section>

        {error && (
          <NexusFeedback type="error" title="Não foi possível carregar o conteúdo" className="mb-4">
            {error}
          </NexusFeedback>
        )}

        <section className="hp-content">
          <div className="hp-section-intro">
            <span className="hp-eyebrow">Descubra</span>
            <h2>Catálogos publicados na Nexus</h2>
            <p>Empresas, produtos e serviços organizados em uma experiência direta e fácil de compartilhar.</p>
          </div>

          <GlobalCarousel title="Catálogos" items={establishments} navigate={navigate} showSchedule={false} />
          <GlobalCarousel title="Produtos" items={productItems} navigate={navigate} showSchedule={false} />
          <GlobalCarousel title="Serviços" items={serviceItems} navigate={navigate} showSchedule={false} />
        </section>
      </main>

      <GlobalFooter />
    </>
  );
}
