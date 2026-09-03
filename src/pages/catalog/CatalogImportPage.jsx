import React, { useMemo, useState } from "react";
import { Alert, Badge, Card, Container, Form, Table } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import GlobalNav from "../../components/GlobalNav";
import GlobalButton from "../../components/GlobalButton";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentItemsBySlug from "../../hooks/useEstablishmentItemsBySlug";
import catalogIntelligence from "../../services/catalogIntelligence";

function detectDelimiter(line) {
  const candidates = [";", ",", "\t"];
  return candidates
    .map((delimiter) => [delimiter, (line.match(new RegExp(delimiter === "\t" ? "\\t" : `\\${delimiter}`, "g")) || []).length])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || ";";
}

function parseLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseLine(lines[0], delimiter).map((header, index) => header || `coluna_${index + 1}`);
  return lines.slice(1).map((line) => {
    const values = parseLine(line, delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export default function CatalogImportPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, loading: establishmentLoading, apiError } = useEstablishmentItemsBySlug(slug);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [importBatch, setImportBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reviewRows = useMemo(
    () => (importBatch?.rows || []).filter((row) => row.status === "review").slice(0, 100),
    [importBatch]
  );

  const handleFile = async (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setImportBatch(null);
    setError("");
    if (!selected) {
      setRows([]);
      return;
    }

    try {
      const text = await selected.text();
      const parsed = parseCsv(text);
      if (!parsed.length) throw new Error("O arquivo precisa ter cabeçalho e pelo menos uma linha de produto.");
      if (parsed.length > 10000) throw new Error("Cada importação aceita até 10.000 produtos. Divida o arquivo em lotes.");
      setRows(parsed);
    } catch (err) {
      setRows([]);
      setError(err?.message || "Não foi possível ler o arquivo.");
    }
  };

  const analyze = async () => {
    if (!establishment?.id || rows.length === 0) return;
    try {
      setLoading(true);
      setError("");
      const { data } = await catalogIntelligence.stageImport({
        establishment_id: establishment.id,
        source_type: "csv",
        filename: file?.name || "catalogo.csv",
        rows,
      });
      setImportBatch(data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível analisar o catálogo.");
    } finally {
      setLoading(false);
    }
  };

  const publishReady = async () => {
    if (!importBatch?.public_id) return;
    const confirmation = await Swal.fire({
      icon: "question",
      title: "Publicar itens aprovados?",
      text: "Apenas as linhas classificadas como prontas serão publicadas. As linhas em revisão continuarão separadas.",
      showCancelButton: true,
      confirmButtonText: "Publicar prontos",
      cancelButtonText: "Cancelar",
    });
    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      const { data } = await catalogIntelligence.publishImport(importBatch.public_id, false);
      setImportBatch(data?.data || importBatch);
      await Swal.fire("Importação concluída", "Os produtos prontos foram publicados no catálogo.", "success");
    } catch (err) {
      await Swal.fire("Erro na importação", err?.response?.data?.message || "Não foi possível publicar os produtos.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (establishmentLoading || loading) {
    return <ProcessingIndicatorComponent messages={["Analisando produtos…", "Detectando duplicidades e campos ausentes…"]} />;
  }

  return (
    <>
      <GlobalNav />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
          <div>
            <div className="text-body-secondary small text-uppercase fw-semibold">Importação inteligente</div>
            <h1 className="h3 mb-1">Importar catálogo</h1>
            <p className="text-body-secondary mb-0">
              Envie CSV com até 10.000 linhas. A Nexus separa automaticamente o que está pronto do que precisa de revisão.
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <GlobalButton variant="outline" onClick={() => navigate(`/establishment/item/${slug}`)}>Voltar aos itens</GlobalButton>
            <GlobalButton variant="outline" onClick={() => navigate(`/catalog/health/${slug}`)}>Saúde do catálogo</GlobalButton>
          </div>
        </div>

        {(apiError || error) && <Alert variant="danger">{apiError || error}</Alert>}

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Form.Group>
              <Form.Label>Arquivo CSV</Form.Label>
              <Form.Control type="file" accept=".csv,text/csv" onChange={handleFile} />
              <Form.Text>
                A primeira linha deve conter os nomes das colunas. Exemplos reconhecidos: Nome, Preço, Marca, Categoria, EAN/GTIN, SKU, Comprimento, Largura, Volume e Unidade.
              </Form.Text>
            </Form.Group>

            {rows.length > 0 && (
              <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mt-3">
                <div><strong>{rows.length.toLocaleString("pt-BR")}</strong> linhas lidas de {file?.name}</div>
                <GlobalButton variant="success" onClick={analyze}>Analisar antes de publicar</GlobalButton>
              </div>
            )}
          </Card.Body>
        </Card>

        {rows.length > 0 && !importBatch && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h2 className="h5">Prévia do arquivo</h2>
              <div className="table-responsive">
                <Table size="sm" hover>
                  <thead><tr>{Object.keys(rows[0] || {}).slice(0, 8).map((key) => <th key={key}>{key}</th>)}</tr></thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, index) => (
                      <tr key={index}>{Object.keys(rows[0] || {}).slice(0, 8).map((key) => <td key={key}>{String(row[key] ?? "")}</td>)}</tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}

        {importBatch && (
          <>
            <div className="row g-3 mb-4">
              {[
                ["Analisados", importBatch.total_rows],
                ["Prontos", importBatch.ready_rows],
                ["Precisam revisão", importBatch.review_rows],
                ["Publicados", importBatch.imported_rows],
              ].map(([label, value]) => (
                <div className="col-6 col-lg-3" key={label}>
                  <Card className="h-100 border-0 shadow-sm"><Card.Body><div className="small text-body-secondary">{label}</div><div className="fs-3 fw-bold">{Number(value || 0).toLocaleString("pt-BR")}</div></Card.Body></Card>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-end mb-4">
              <GlobalButton variant="success" onClick={publishReady} disabled={!Number(importBatch.ready_rows || 0)}>
                Publicar somente os prontos
              </GlobalButton>
            </div>

            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
                  <div>
                    <h2 className="h5 mb-1">Exceções para revisar</h2>
                    <p className="text-body-secondary mb-0">Você não precisa revisar o catálogo inteiro.</p>
                  </div>
                  <Badge bg={reviewRows.length ? "warning" : "success"} text={reviewRows.length ? "dark" : undefined}>
                    {reviewRows.length ? `${reviewRows.length} exibidas` : "Sem pendências"}
                  </Badge>
                </div>

                {reviewRows.length === 0 ? (
                  <Alert variant="success" className="mb-0">Todas as linhas analisadas estão prontas.</Alert>
                ) : (
                  <div className="d-grid gap-2">
                    {reviewRows.map((row) => (
                      <div key={row.id} className="border rounded p-3">
                        <div className="d-flex justify-content-between gap-2 flex-wrap">
                          <strong>Linha {row.row_number}: {row.normalized_data?.name || "Produto sem nome"}</strong>
                          <span className="small text-body-secondary">Confiança {Number(row.confidence || 0).toFixed(0)}%</span>
                        </div>
                        {Array.isArray(row.issues) && row.issues.length > 0 && (
                          <ul className="small mt-2 mb-0 ps-3">{row.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
                        )}
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
