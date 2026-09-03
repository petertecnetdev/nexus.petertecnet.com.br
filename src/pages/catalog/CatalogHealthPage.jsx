import React, { useEffect, useState } from "react";
import { Alert, Badge, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import GlobalButton from "../../components/GlobalButton";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentItemsBySlug from "../../hooks/useEstablishmentItemsBySlug";
import catalogIntelligence from "../../services/catalogIntelligence";

const statusLabel = (status) => ({
  excellent: "Excelente",
  ready: "Pronto",
  review: "Revisar",
  legacy: "Revisar",
}[status] || status || "Revisar");

export default function CatalogHealthPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, loading: establishmentLoading, apiError } = useEstablishmentItemsBySlug(slug);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!establishment?.id) return undefined;
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await catalogIntelligence.health(establishment.id);
        if (!controller.signal.aborted) setHealth(data?.data || null);
      } catch (err) {
        if (!controller.signal.aborted) setError(err?.response?.data?.message || "Não foi possível calcular a saúde do catálogo.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [establishment?.id]);

  if (establishmentLoading || loading) {
    return <ProcessingIndicatorComponent messages={["Analisando o catálogo…", "Procurando cadastros incompletos…"]} />;
  }

  return (
    <>
      <GlobalNav />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
          <div>
            <div className="text-body-secondary small text-uppercase fw-semibold">Qualidade dos dados</div>
            <h1 className="h3 mb-1">Saúde do catálogo</h1>
            <p className="text-body-secondary mb-0">
              {establishment?.fantasy || establishment?.name || "Estabelecimento"} · revise apenas o que realmente precisa de atenção.
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <GlobalButton variant="outline" onClick={() => navigate(`/establishment/item/${slug}`)}>Voltar aos itens</GlobalButton>
            <GlobalButton variant="success" onClick={() => navigate(`/catalog/import/${slug}`)}>Importar catálogo</GlobalButton>
          </div>
        </div>

        {(apiError || error) && <Alert variant="danger">{apiError || error}</Alert>}

        {health && (
          <>
            <Row className="g-3 mb-4">
              {[
                ["Nota média", `${health.average_score || 0}/100`],
                ["Produtos", health.total_products || 0],
                ["Excelentes", health.excellent || 0],
                ["Prontos", health.ready || 0],
                ["Precisam revisão", health.review || 0],
              ].map(([label, value]) => (
                <Col key={label} xs={6} lg>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body>
                      <div className="text-body-secondary small">{label}</div>
                      <div className="fs-3 fw-bold">{value}</div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
                  <div>
                    <h2 className="h5 mb-1">Itens que precisam da sua atenção</h2>
                    <p className="text-body-secondary mb-0">A Nexus prioriza os piores cadastros primeiro.</p>
                  </div>
                </div>

                {(health.needs_review || []).length === 0 ? (
                  <Alert variant="success" className="mb-0">Nenhuma pendência crítica encontrada.</Alert>
                ) : (
                  <div className="d-grid gap-3">
                    {health.needs_review.map((item) => (
                      <div key={item.id} className="border rounded p-3 d-flex justify-content-between gap-3 flex-wrap">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <strong>{item.name}</strong>
                            <Badge bg={item.quality_score >= 70 ? "success" : "warning"} text={item.quality_score >= 70 ? undefined : "dark"}>
                              {statusLabel(item.quality_status)} · {item.quality_score}/100
                            </Badge>
                          </div>
                          <div className="small text-body-secondary mt-1">
                            {[item.brand, item.category].filter(Boolean).join(" · ") || "Sem marca/categoria"}
                          </div>
                          {Array.isArray(item.issues) && item.issues.length > 0 && (
                            <ul className="small mb-0 mt-2 ps-3">
                              {item.issues.slice(0, 4).map((issue) => <li key={issue}>{issue}</li>)}
                            </ul>
                          )}
                        </div>
                        <GlobalButton variant="warning" size="sm" onClick={() => navigate(`/item/update/${item.id}`)}>
                          Corrigir
                        </GlobalButton>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}
      </Container>
    </>
  );
}
