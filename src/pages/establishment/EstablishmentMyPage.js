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

export default function EstablishmentMyPage() {
  const navigate = useNavigate();
  const { establishments, isLoading, apiError, removeEstablishment } = useEstablishmentMy(appId);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return establishments;
    return establishments.filter((est) =>
      [est.name, est.fantasy, est.city, est.uf]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [establishments, query]);

  const handleDelete = async (establishment) => {
    const name = establishment.fantasy || establishment.name;
    const result = await Swal.fire({
      title: "Excluir empresa?",
      html: `Você está prestes a excluir <strong>${name}</strong> e os itens vinculados a ela. Esta ação não pode ser desfeita.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir empresa",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(establishment.id);
      await removeEstablishment(establishment.id);
      await Swal.fire("Empresa excluída", "O estabelecimento e seus itens foram removidos.", "success");
    } catch (error) {
      await Swal.fire(
        "Não foi possível excluir",
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
              <span className="company-hub__eyebrow">Painel Nexus</span>
              <h1>Suas empresas</h1>
              <p>Gerencie catálogos, itens, publicação e compartilhamento em uma visão mais rápida.</p>
            </div>
            <Button className="company-hub__new" onClick={() => navigate("/establishment/create")}>
              <i className="fas fa-plus" aria-hidden="true" /> Nova empresa
            </Button>
          </header>

          <section className="company-hub__toolbar" aria-label="Ferramentas das empresas">
            <div className="company-hub__stat">
              <strong>{establishments.length}</strong>
              <span>{establishments.length === 1 ? "empresa" : "empresas"}</span>
            </div>
            <div className="company-hub__search">
              <i className="fas fa-search" aria-hidden="true" />
              <Form.Control
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar empresa, cidade ou UF"
                aria-label="Buscar empresas"
              />
            </div>
          </section>

          {isLoading && (
            <div className="company-hub__loading"><Spinner animation="border" /></div>
          )}

          {!isLoading && apiError && <Alert variant="danger">{apiError}</Alert>}

          {!isLoading && !apiError && establishments.length === 0 && (
            <section className="company-hub__empty">
              <div className="company-hub__empty-icon"><i className="fas fa-building" /></div>
              <h2>Crie sua primeira empresa</h2>
              <p>Depois você poderá cadastrar itens, publicar o catálogo e gerar o QR Code.</p>
              <Button onClick={() => navigate("/establishment/create")}>Cadastrar empresa</Button>
            </section>
          )}

          {!isLoading && !apiError && establishments.length > 0 && filtered.length === 0 && (
            <Alert variant="secondary">Nenhuma empresa encontrada para “{query}”.</Alert>
          )}

          {!isLoading && !apiError && filtered.length > 0 && (
            <section className="company-grid" aria-label="Empresas cadastradas">
              {filtered.map((establishment) => (
                <EstablishmentDashboard
                  key={establishment.id}
                  establishment={establishment}
                  navigate={navigate}
                  deleting={Number(deletingId) === Number(establishment.id)}
                  onDelete={() => handleDelete(establishment)}
                />
              ))}
            </section>
          )}
        </Container>
      </main>
    </>
  );
}
