// src/components/item/ItemCreateForm.jsx
import React, { useRef, useState } from "react";
import { Row, Col, Form, Alert, Button } from "react-bootstrap";
import { FaMicrophone, FaStop } from "react-icons/fa";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import GlobalImageUploader from "../GlobalImageUploader";
import { appId } from "../../config";
import { parseVoiceItemTranscript } from "../../utils/voiceItemParser";
import "./ItemCreateForm.css";

export default function ItemCreateForm({
  register,
  handleSubmit,
  setValue,
  watch,
  isSubmitting,
  onSubmit,
}) {
  const type = watch("type");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrlStatus, setImageUrlStatus] = useState("idle");
  const [listening, setListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);

  const handleUploadChange = (file) => {
    setImageFile(file);
    if (file) {
      setImageUrl("");
      setImageUrlStatus("idle");
    }
  };

  const handleUploadPreview = (preview) => {
    setImagePreview(preview);
  };

  const handleImageUrlChange = (event) => {
    const value = event.target.value;
    const trimmed = value.trim();

    setImageUrl(value);
    setImageFile(null);

    if (!trimmed) {
      setImageUrlStatus("idle");
      setImagePreview(null);
      return;
    }

    setImageUrlStatus("loading");
    setImagePreview(trimmed);
  };

  const applyVoiceData = (transcript) => {
    const parsed = parseVoiceItemTranscript(transcript);
    Object.entries(parsed).forEach(([field, value]) => {
      setValue(field, value, { shouldDirty: true, shouldValidate: true });
    });
    return parsed;
  };

  const startVoiceRegistration = () => {
    setVoiceError("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("O reconhecimento de voz não está disponível neste navegador. No celular, tente usar Chrome ou o aplicativo Nexus atualizado.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      setListening(false);
      recognitionRef.current = null;
      if (event?.error === "not-allowed") setVoiceError("Permita o acesso ao microfone para usar o cadastro por voz.");
      else if (event?.error === "no-speech") setVoiceError("Não consegui ouvir uma fala completa. Tente novamente falando mais perto do microfone.");
      else setVoiceError("Não foi possível reconhecer a fala. Tente novamente.");
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) return;
      setVoiceTranscript(transcript);
      const parsed = applyVoiceData(transcript);
      if (!parsed.name) setVoiceError("A fala foi reconhecida, mas não identifiquei o nome do item. Revise os campos antes de salvar.");
    };

    try {
      recognition.start();
    } catch {
      setVoiceError("O microfone já está sendo usado. Tente novamente em alguns segundos.");
    }
  };

  const stopVoiceRegistration = () => {
    recognitionRef.current?.stop?.();
  };

  const handleFormSubmit = (data) => {
    if (imageUrl.trim() && imageUrlStatus === "error") return;

    onSubmit({
      ...data,
      image: imageFile || undefined,
      image_url: imageUrl.trim() || undefined,
    });
  };

  const hasLinkedImage = Boolean(imageUrl.trim());

  return (
    <>
      <GlobalHeroEditorPreview
        entity="item"
        title={watch("name") || "Novo item"}
        subtitle="Prévia do item"
        logoPreview={imagePreview}
        data={{ name: watch("name") }}
      />

      <section className="item-voice-assistant" aria-labelledby="item-voice-title">
        <div>
          <strong id="item-voice-title">Cadastro por voz</strong>
          <p className="mb-2">Fale naturalmente, por exemplo: “produto Telha de fibra, preço 79,90, estoque 20, categoria Construção, marca Eternit, status ativo”. A Nexus preenche os campos e você revisa antes de salvar.</p>
        </div>
        <Button
          type="button"
          variant={listening ? "danger" : "outline-info"}
          onClick={listening ? stopVoiceRegistration : startVoiceRegistration}
          disabled={isSubmitting}
        >
          {listening ? <><FaStop /> Parar</> : <><FaMicrophone /> Preencher por voz</>}
        </Button>
      </section>

      {listening && <Alert variant="info">Ouvindo… diga o nome do item e, se quiser, preço, estoque ou duração, categoria, marca, descrição e status.</Alert>}
      {voiceTranscript && (
        <Alert variant="success">
          <strong>Fala reconhecida:</strong> {voiceTranscript}<br />
          Revise principalmente nome, preço, estoque/duração e status antes de criar o item. O cadastro não é salvo automaticamente.
        </Alert>
      )}
      {voiceError && <Alert variant="warning">{voiceError}</Alert>}

      <GlobalImageUploader
        onChange={handleUploadChange}
        onPreview={handleUploadPreview}
        maxResolution={1200}
        addLabel="Adicionar imagem"
        removeLabel="Remover imagem"
        disabled={isSubmitting}
      />

      <Form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <input type="hidden" value={appId} {...register("app_id")} />

        <Row className="gy-3 mt-3">
          <Col xs={12}>
            <div className="form-group">
              <label htmlFor="item-image-url">Ou use o endereço de uma imagem</label>
              <input
                id="item-image-url"
                type="url"
                inputMode="url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={imageUrl}
                onChange={handleImageUrlChange}
                disabled={isSubmitting}
                autoComplete="off"
              />
              <small className="d-block mt-2 text-body-secondary">
                Cole um link público HTTP/HTTPS. A prévia aparece antes do cadastro.
              </small>
            </div>
          </Col>

          {hasLinkedImage && (
            <Col xs={12}>
              <div className="p-3 rounded border">
                <div className="fw-semibold mb-2">Prévia da imagem pelo link</div>
                <img
                  src={imageUrl.trim()}
                  alt="Prévia do link informado"
                  onLoad={() => setImageUrlStatus("loaded")}
                  onError={() => setImageUrlStatus("error")}
                  style={{
                    display: imageUrlStatus === "error" ? "none" : "block",
                    width: "100%",
                    maxWidth: 520,
                    maxHeight: 320,
                    objectFit: "contain",
                    borderRadius: 12,
                  }}
                />

                {imageUrlStatus === "loading" && (
                  <div className="mt-2 text-body-secondary">Carregando prévia…</div>
                )}

                {imageUrlStatus === "loaded" && (
                  <div className="mt-2 text-success">Imagem carregada com sucesso.</div>
                )}

                {imageUrlStatus === "error" && (
                  <Alert variant="danger" className="mt-2 mb-0">
                    Não foi possível carregar essa imagem. Verifique se o link é público e aponta diretamente para uma imagem.
                  </Alert>
                )}
              </div>
            </Col>
          )}

          <Col xs={12} md={8}>
            <div className="form-group">
              <label htmlFor="item-name">Nome*</label>
              <input
                id="item-name"
                type="text"
                autoComplete="off"
                {...register("name", { required: true })}
                required
              />
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-type">Tipo</label>
              <select id="item-type" {...register("type")}>
                <option value="">Item genérico</option>
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-price">Preço</label>
              <input
                id="item-price"
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 49,90"
                {...register("price")}
              />
            </div>
          </Col>

          {type === "service" && (
            <Col xs={12} md={4}>
              <div className="form-group">
                <label htmlFor="item-duration">Duração em minutos</label>
                <input
                  id="item-duration"
                  type="number"
                  min="1"
                  {...register("duration")}
                />
              </div>
            </Col>
          )}

          {type === "product" && (
            <Col xs={12} md={4}>
              <div className="form-group">
                <label htmlFor="item-stock">Estoque</label>
                <input id="item-stock" type="number" min="0" {...register("stock")} />
              </div>
            </Col>
          )}

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-status">Status</label>
              <select id="item-status" {...register("status")} defaultValue={1}>
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
              <small className="d-block mt-2 text-body-secondary">Item inativo não aparece no catálogo e não pode ser comprado.</small>
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-category">Categoria</label>
              <input id="item-category" type="text" {...register("category")} />
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-subcategory">Subcategoria</label>
              <input id="item-subcategory" type="text" {...register("subcategory")} />
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-brand">Marca ou referência</label>
              <input id="item-brand" type="text" {...register("brand")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label htmlFor="item-short-description">Resumo comercial</label>
              <input
                id="item-short-description"
                type="text"
                maxLength={1000}
                placeholder="Uma frase objetiva para o card, SEO e primeira leitura."
                {...register("short_description")}
              />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label htmlFor="item-description">Descrição</label>
              <textarea
                id="item-description"
                rows={5}
                placeholder="Descreva o item com as informações relevantes para o cliente."
                {...register("description")}
              />
            </div>
          </Col>

          <Col xs={12}><hr /><h2 className="h5 mb-1">Oferta comercial</h2><p className="text-body-secondary">Defina como o investimento deve aparecer no catálogo e qual ação o cliente pode realizar.</p></Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-pricing-model">Modelo de preço</label>
              <select id="item-pricing-model" {...register("pricing_model")}>
                <option value="fixed">Preço fixo</option>
                <option value="starting_at">A partir de</option>
                <option value="range">Faixa de preço</option>
                <option value="quote">Sob orçamento</option>
                <option value="recurring">Recorrente</option>
                <option value="setup_recurring">Implantação + recorrência</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={4}><div className="form-group"><label htmlFor="item-price-min">Valor inicial</label><input id="item-price-min" type="text" inputMode="decimal" {...register("price_min")} /></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="item-price-max">Valor máximo</label><input id="item-price-max" type="text" inputMode="decimal" {...register("price_max")} /></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="item-setup-price">Implantação</label><input id="item-setup-price" type="text" inputMode="decimal" {...register("setup_price")} /></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="item-recurring-price">Mensalidade/recorrência</label><input id="item-recurring-price" type="text" inputMode="decimal" {...register("recurring_price")} /></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="item-billing-interval">Periodicidade</label><select id="item-billing-interval" {...register("billing_interval")}><option value="">Não se aplica</option><option value="monthly">Mensal</option><option value="quarterly">Trimestral</option><option value="yearly">Anual</option><option value="once">Projeto</option></select></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="item-sort-order">Ordem no catálogo</label><input id="item-sort-order" type="number" min="0" {...register("sort_order")} /></div></Col>
          <Col xs={12} md={8} className="d-flex flex-wrap align-items-end gap-4">
            <Form.Check type="switch" id="item-quote-enabled" label="Permitir solicitar orçamento" {...register("is_quote_enabled")} />
            <Form.Check type="switch" id="item-checkout-enabled" label="Permitir checkout direto" {...register("is_checkout_enabled")} />
            <Form.Check type="switch" id="item-featured" label="Destacar no catálogo" {...register("is_featured")} />
          </Col>

          <Col xs={12}><hr /><h2 className="h5 mb-1">Super view</h2><p className="text-body-secondary">Uma informação por linha nos campos de lista. A página pública transforma isso em seções comerciais.</p></Col>
          <Col xs={12}><div className="form-group"><label htmlFor="catalog-headline">Headline</label><input id="catalog-headline" type="text" placeholder="Resultado principal que o cliente deve entender em poucos segundos." {...register("catalog_headline")} /></div></Col>
          <Col xs={12}><div className="form-group"><label htmlFor="catalog-problem">Problema que resolve</label><textarea id="catalog-problem" rows={3} {...register("catalog_problem")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-audience">Para quem é</label><textarea id="catalog-audience" rows={5} placeholder={"Empresas com processos manuais\nTimes que precisam integrar sistemas"} {...register("catalog_audience")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-benefits">Benefícios</label><textarea id="catalog-benefits" rows={5} placeholder={"Menos retrabalho\nMais rastreabilidade\nOperação escalável"} {...register("catalog_benefits")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-deliverables">Entregáveis</label><textarea id="catalog-deliverables" rows={5} {...register("catalog_deliverables")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-use-cases">Casos de uso</label><textarea id="catalog-use-cases" rows={5} {...register("catalog_use_cases")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-process">Como funciona</label><textarea id="catalog-process" rows={5} placeholder={"Diagnóstico\nArquitetura\nImplementação\nValidação e evolução"} {...register("catalog_process")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-technologies">Tecnologias relevantes</label><textarea id="catalog-technologies" rows={5} {...register("catalog_technologies")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-proof">Provas de capacidade</label><textarea id="catalog-proof" rows={5} {...register("catalog_proof_points")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="catalog-faq">FAQ</label><textarea id="catalog-faq" rows={5} placeholder={"Quanto tempo leva? | Depende do escopo e das integrações.\nO projeto pode evoluir? | Sim, a arquitetura é preparada para evolução."} {...register("catalog_faq")} /></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="catalog-duration">Prazo comercial</label><input id="catalog-duration" type="text" placeholder="Ex.: 3 a 8 semanas" {...register("catalog_duration_text")} /></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="catalog-price-note">Nota de preço</label><input id="catalog-price-note" type="text" placeholder="O valor final depende do escopo." {...register("catalog_price_note")} /></div></Col>
          <Col xs={12} md={4}><div className="form-group"><label htmlFor="catalog-cta-label">Texto do CTA</label><input id="catalog-cta-label" type="text" placeholder="Solicitar diagnóstico" {...register("catalog_cta_label")} /></div></Col>

          <Col xs={12}><hr /><h2 className="h5 mb-1">SEO</h2></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="item-seo-title">Título SEO</label><input id="item-seo-title" type="text" maxLength={255} {...register("seo_title")} /></div></Col>
          <Col xs={12} md={6}><div className="form-group"><label htmlFor="item-canonical">URL canônica</label><input id="item-canonical" type="url" {...register("canonical_url")} /></div></Col>
          <Col xs={12}><div className="form-group"><label htmlFor="item-seo-description">Meta description</label><textarea id="item-seo-description" rows={3} maxLength={320} {...register("seo_description")} /></div></Col>
          <Col xs={12}><div className="form-group"><label htmlFor="item-og-image">Imagem Open Graph</label><input id="item-og-image" type="url" {...register("og_image")} /></div></Col>

          <Col xs={12} className="text-end">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || (hasLinkedImage && imageUrlStatus === "error")}
            >
              {isSubmitting ? "Salvando…" : "Criar item"}
            </button>
          </Col>
        </Row>
      </Form>
    </>
  );
}
