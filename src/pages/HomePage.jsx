import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../App";
import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";

import "./HomePage.css";

export default function HomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const primaryPath = user ? "/establishment/my" : "/register";
  const primaryLabel = user ? "Gerenciar meus catálogos" : "Criar meu catálogo";

  return (
    <>
      <GlobalNav />

      <main className="hp-wrapper">
        <section className="hp-hero">
          <div className="hp-hero__copy">
            <span className="hp-eyebrow">Seu catálogo. Um link. Um QR Code.</span>
            <h1>Crie e compartilhe o catálogo online da sua empresa.</h1>
            <p>
              Cadastre sua empresa, adicione os itens, organize o catálogo e compartilhe
              um link público feito para abrir rápido em qualquer celular.
            </p>

            <div className="hp-hero__actions">
              <button type="button" className="hp-primary-action" onClick={() => navigate(primaryPath)}>
                {primaryLabel}
              </button>
              {!user && (
                <button type="button" className="hp-secondary-action" onClick={() => navigate("/login")}>
                  Já tenho conta
                </button>
              )}
            </div>

            <div className="hp-benefits" aria-label="Benefícios da Nexus">
              <span><i className="fas fa-building" /> Sua empresa</span>
              <span><i className="fas fa-box-open" /> Seus itens</span>
              <span><i className="fas fa-qrcode" /> QR Code e link público</span>
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

        <section className="hp-content" aria-labelledby="hp-how-title">
          <div className="hp-section-intro">
            <span className="hp-eyebrow">Como funciona</span>
            <h2 id="hp-how-title">Do cadastro ao compartilhamento em poucos passos.</h2>
            <p>
              A Nexus foi desenhada para manter a operação simples: a empresa administra
              seu próprio conteúdo e o visitante apenas abre o catálogo e consulta os itens.
            </p>
          </div>

          <div className="hp-flow-grid">
            <article className="hp-flow-card">
              <span>01</span>
              <h3>Cadastre a empresa</h3>
              <p>Crie o espaço que terá identidade, informações e catálogo próprios.</p>
            </article>
            <article className="hp-flow-card">
              <span>02</span>
              <h3>Adicione os itens</h3>
              <p>Informe nome, descrição, preço, imagem, categoria e disponibilidade quando aplicável.</p>
            </article>
            <article className="hp-flow-card">
              <span>03</span>
              <h3>Publique o catálogo</h3>
              <p>Organize a apresentação e disponibilize uma página pública fácil de consultar.</p>
            </article>
            <article className="hp-flow-card">
              <span>04</span>
              <h3>Compartilhe</h3>
              <p>Use o link público e o QR Code em redes sociais, balcões, embalagens ou materiais impressos.</p>
            </article>
          </div>

          <div className="hp-section-intro hp-section-intro--closing">
            <span className="hp-eyebrow">Simples por fora</span>
            <h2>Um catálogo da sua empresa, não um marketplace.</h2>
            <p>
              Cada empresa controla o próprio catálogo. Clientes acessam diretamente pelo link
              ou QR Code, sem precisar criar conta para visualizar os itens.
            </p>
            <button type="button" className="hp-primary-action" onClick={() => navigate(primaryPath)}>
              {primaryLabel}
            </button>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </>
  );
}
