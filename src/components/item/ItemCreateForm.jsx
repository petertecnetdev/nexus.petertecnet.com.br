// src/components/item/ItemCreateForm.jsx
import React, { useRef, useState } from "react";
import { Row, Col, Form, Alert, Button } from "react-bootstrap";
import { FaMicrophone, FaStop } from "react-icons/fa";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import GlobalImageUploader from "../GlobalImageUploader";
import CatalogSpecificationFields from "./CatalogSpecificationFields";
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

  const handleUploadPreview = (preview) => setImagePreview(preview);

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

  const stopVoiceRegistration = () => recognitionRef.current?.stop?.();

  const handleFormSubmit = (data) => {
    if (imageUrl.trim() && imageUrlStatus === "error") return;
    onSubmit({ ...data, image: imageFile || undefined, image_url: imageUrl.trim() || undefined });
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
          <p className="mb-2">Fale naturalmente. A Nexus preenche os campos reconhecidos e você complementa EAN, medidas, volume e outras especificações antes de salvar.</p>
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

      {listening && <Alert variant="info">Ouvindo… diga nome, preço, estoque/duração, categoria, marca, descrição e status.</Alert>}
      {voiceTranscript && (
        <Alert variant="success">
          <strong>Fala reconhecida:</strong> {voiceTranscript}<br />
          Revise os dados e complete as especificações técnicas antes de criar o item. O cadastro não é salvo automaticamente.
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
              <small className="d-block mt-2 text-body-secondary">Cole um link público HTTP/HTTPS. A prévia aparece antes do cadastro.</small>
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
                {imageUrlStatus === "loading" && <div className="mt-2 text-body-secondary">Carregando prévia…</div>}
                {imageUrlStatus === "loaded" && <div className="mt-2 text-success">Imagem carregada com sucesso.</div>}
                {imageUrlStatus === "error" && <Alert variant="danger" className="mt-2 mb-0">Não foi possível carregar essa imagem. Verifique o link.</Alert>}
              </div>
            </Col>
          )}

          <Col xs={12} md={8}>
            <div className="form-group">
              <label htmlFor="item-name">Nome*</label>
              <input id="item-name" type="text" autoComplete="off" {...register("name", { required: true })} required />
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-type">Tipo</label>
              <select id="item-type" {...register("type")} defaultValue="product">
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
                <option value="">Item genérico</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-price">Preço*</label>
              <input id="item-price" type="text" inputMode="decimal" placeholder="Ex.: 23,90" {...register("price", { required: true })} required />
            </div>
          </Col>

          {type === "service" && (
            <Col xs={12} md={4}>
              <div className="form-group">
                <label htmlFor="item-duration">Duração em minutos</label>
                <input id="item-duration" type="number" min="1" {...register("duration")} />
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

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-sku">SKU / referência</label>
              <input id="item-sku" type="text" autoComplete="off" {...register("sku")} />
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-category">Categoria</label>
              <input id="item-category" type="text" {...register("category")} />
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-subcategory">Subcategoria</label>
              <input id="item-subcategory" type="text" {...register("subcategory")} />
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-brand">Marca</label>
              <input id="item-brand" type="text" {...register("brand")} />
            </div>
          </Col>

          {type === "product" && <CatalogSpecificationFields register={register} watch={watch} />}

          <Col xs={12}>
            <div className="form-group">
              <label htmlFor="item-description">Descrição</label>
              <textarea
                id="item-description"
                rows={5}
                placeholder="Descreva benefícios e uso. Medidas, peso e volume devem ficar também nos campos estruturados acima."
                {...register("description")}
              />
            </div>
          </Col>

          <Col xs={12} className="text-end">
            <button type="submit" className="submit-btn" disabled={isSubmitting || (hasLinkedImage && imageUrlStatus === "error")}>
              {isSubmitting ? "Salvando…" : "Criar item"}
            </button>
          </Col>
        </Row>
      </Form>
    </>
  );
}
