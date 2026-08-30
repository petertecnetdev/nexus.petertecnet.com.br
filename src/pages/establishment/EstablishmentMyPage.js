// src/pages/establishment/EstablishmentMyPage.jsx
import React, { useMemo, useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GlobalNav from "../../components/GlobalNav";
import EstablishmentDashboard from "../../components/establishment/EstablishmentDashboard";
import useEstablishmentMy from "../../hooks/useEstablishmentMy";
import { appId } from "../../config";
import "../../components/establishment/EstablishmentDashboard.css";
import "./NexusCompanyCatalog.css";

export default function EstablishmentMyPage() {
  const navigate = useNavigate();
  const { establishments, isLoading, apiError, activateCatalog, removeEstablishment } = useEstablishmentMy(appId);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appFilter, setAppFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);

  const apps = useMemo(() => {
    const map = new Map();
    establishments.forEach((establishment) => {
      const source = establishment?.source_app;
      if (!source?.id) return;
      map.set(String(source.id), source);
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.name || a.slug || "").localeCompare(String(b.name || b.slug || ""), "pt-BR")
    );
  }, [establishments]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return establishments.filter((est) => {
      const matchesQuery = !normalized || [
        est.name,
        est.fantasy,
        est.city,
        est.uf,
        est?.source_app?.name,
        est?.source_app?.slug,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));

      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" && est.catalog_active)
        || (statusFilter === "available" && !est.catalog_active);

      const matchesApp = appFilter === "all" || String(est?.source_app?.id || est.app_id) === appFilter;
      return matchesQuery && matchesStatus && matchesApp;
    });
  }, [establishments, query, statusFilter, appFilter]);

  const activeCount = establishments.filter((est) => est.catalog_active).length;
  const availableCount = establishments.length - activeCount;

  const handleActivate = async (establishment) => {
    const name = establishment.fantasy || establishment.name;
    const result = await Swal.fire({
      title: "Criar catálogo na Nexus?",
      html: `<strong>${name}</strong> já existe no ecossistema Peter Tecnet. A Nexus criará o catálogo desta empresa usando os dados já cadastrados.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Criar catálogo",
      cancelButtonText: "Cancelar",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setActivatingId(establishment.id);
      const catalog = await activateCatalog(establishment.id);
      await Swal.fire("Catálogo criado", "A empresa agora está disponível para receber itens e gerar QR Code na Nexus.", "success");
      if (catalog?.slug) navigate(`/establishment/item/${catalog.slug}`);
    } catch (error) {
      await Swal.fire(
        "Não foi possível criar o catálogo",
        error?.response?.data?.message || error?.response?.data?.error || "Tente novamente em instantes.",
        "error"
      );
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (establishment) => {
    const name = establishment.fantasy || establishment.name;
    const catalogId = establishment.catalog_establishment_id || establishment.id;
    const isImported = !establishment.is_nexus_native;
    const result = await Swal.fire({
      title: isImported ? "Remover catálogo da Nexus?" : "Excluir empresa?",
      html: isImported
        ? `O catálogo Nexus de <strong>${name}</strong> será removido. A empresa original continuará cadastrada no aplicativo de origem.`
        : `Você está prestes a excluir <strong>${name}</strong> e os itens vinculados a ela. Esta ação não pode ser desfeita.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isImported ? "Remover catálogo" : "Sim, excluir empresa",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(catalogId);
      await removeEstablishment(catalogId);
      await Swal.fire(
        isImported ? "Catálogo removido" : "Empresa excluída",
        isImported
          ? "A empresa continua disponível no ecossistema e pode ter um catálogo Nexus criado novamente."
          : "O estabelecimento e seus itens foram removidos.",
        "success"
      );
    } catch (error) {
      await Swal.fire(
        "Não foi possível concluir",
        error?.response?.data?.message || error?.response?.data?.error || "Tente novamente em instantes.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <GlobalNav />
      <main className="company-hub">
        <Container fluid className="company-hub__container">
          <header className="company-hub__header">
            <div>
              <span className="company-hub__eyebrow">Ecossistema Peter Tecnet</span>
              <h1>Empresas e catálogos</h1>
              <p>Todas as empresas vinculadas à sua conta aparecem aqui, mesmo quando foram cadastradas em outro aplicativo.</p>
            </div>
            <Button className="company-hub__new" onClick={() => navigate("/establishment/create")}>
              <i className="fas fa-plus" aria-hidden="true" /> Nova empresa na Nexus
            </Button>
          </header>

          <section className="company-hub__summary" aria-label="Resumo dos catálogos">
            <div><strong>{establishments.length}</strong><span>empresas no ecossistema</span></div>
            <div><strong>{activeCount}</strong><span>catálogos Nexus ativos</span></div>
            <div><strong>{availableCount}</strong><span>podem criar catálogo</span></div>
          </section>

          <section className="company-hub__toolbar company-hub__toolbar--ecosystem" aria-label="Ferramentas das empresas">
            <div className="company-hub__search">
              <i className="fas fa-search" aria-hidden="true" />
              <Form.Control
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar empresa, cidade, UF ou aplicativo"
                aria-label="Buscar empresas"
              />
            </div>

            <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por catálogo">
              <option value="all">Todos os catálogos</option>
              <option value="active">Catálogo ativo</option>
              <option value="available">Sem catálogo Nexus</option>
            </Form.Select>

            <Form.Select value={appFilter} onChange={(event) => setAppFilter(event.target.value)} aria-label="Filtrar por aplicativo de origem">
              <option value="all">Todos os aplicativos</option>
              {apps.map((app) => (
                <option key={app.id} value={String(app.id)}>{app.name || app.slug || `Aplicativo ${app.id}`}</option>
              ))}
            </Form.Select>
          </section>

          {isLoading && <div className="company-hub__loading"><Spinner animation="border" /></div>}
          {!isLoading && apiError && <Alert variant="danger">{apiError}</Alert>}

          {!isLoading && !apiError && establishments.length === 0 && (
            <section className="company-hub__empty">
              <div className="company-hub__empty-icon"><i className="fas fa-building" /></div>
              <h2>Nenhuma empresa vinculada à sua conta</h2>
              <p>Cadastre uma empresa aqui ou em outro aplicativo Peter Tecnet. Ela aparecerá automaticamente nesta área.</p>
              <Button onClick={() => navigate("/establishment/create")}>Cadastrar empresa</Button>
            </section>
          )}

          {!isLoading && !apiError && establishments.length > 0 && filtered.length === 0 && (
            <Alert variant="secondary">Nenhuma empresa corresponde aos filtros selecionados.</Alert>
          )}

          {!isLoading && !apiError && filtered.length > 0 && (
            <section className="company-grid" aria-label="Empresas do ecossistema">
              {filtered.map((establishment) => {
                const catalogId = establishment.catalog_establishment_id || establishment.id;
                return (
                  <EstablishmentDashboard
                    key={establishment.id}
                    establishment={establishment}
                    navigate={navigate}
                    deleting={Number(deletingId) === Number(catalogId)}
                    activating={Number(activatingId) === Number(establishment.id)}
                    onActivate={handleActivate}
                    onDelete={() => handleDelete(establishment)}
                  />
                );
              })}
            </section>
          )}
        </Container>
      </main>
    </>
  );
}
