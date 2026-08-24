import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import "./EstablishmentUpdateForm.css";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const segmentOptions = [
  { value: "corte_masculino", label: "Corte Masculino" },
  { value: "barba", label: "Barba" },
  { value: "sobrancelha", label: "Sobrancelha" },
  { value: "pintura", label: "Pintura" },
  { value: "hidratacao", label: "Hidratação" },
  { value: "alisamento", label: "Alisamento" },
];

export default function EstablishmentUpdateForm({
  register,
  handleSubmit,
  isSubmitting,
  segments,
  logoPreview,
  backgroundPreview,
  handleLogoChange,
  handleBackgroundChange,
  handleSegmentsChange,
  onSubmit,
}) {
  return (
    <>
      {/* PREVIEW GLOBAL */}
      <GlobalHeroEditorPreview
        backgroundPreview={backgroundPreview}
        logoPreview={logoPreview}
        segments={segments}
        title="Visualização da Edição"
        subtitle="As alterações serão refletidas aqui..."
      />

      {/* BOTÕES DE TROCA DE IMAGEM */}
      <div className="d-flex justify-content-center gap-3 my-3">
        <Button
          variant="secondary"
          className="action-button"
          onClick={() => document.getElementById("backgroundInput").click()}
        >
          Alterar Background
        </Button>

        <Button
          variant="secondary"
          className="action-button"
          onClick={() => document.getElementById("logoInput").click()}
        >
          Alterar Logo
        </Button>
      </div>

      {/* INPUTS REAIS (ESCONDIDOS) */}
      <Form.Control
        id="backgroundInput"
        type="file"
        accept="image/*"
        onChange={handleBackgroundChange}
        style={{ display: "none" }}
      />
      <Form.Control
        id="logoInput"
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        style={{ display: "none" }}
      />

      {/* FORMULÁRIO */}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="gy-3 mt-2">

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Nome*</label>
              <input type="text" {...register("name", { required: true })} required />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Nome Fantasia</label>
              <input type="text" {...register("fantasy")} />
            </div>
          </Col>

          <Col xs={6} md={4} lg={2}>
            <div className="form-group">
              <label>CNPJ</label>
              <input type="text" {...register("cnpj")} />
            </div>
          </Col>

          <Col xs={6} md={4} lg={2}>
            <div className="form-group">
              <label>UF</label>
              <select {...register("uf")}>
                <option value="">Selecione</option>
                {UF_LIST.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Telefone</label>
              <input type="text" {...register("phone")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" {...register("email")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Endereço</label>
              <input type="text" {...register("address")} />
            </div>
          </Col>

          <Col xs={6} md={4} lg={3}>
            <div className="form-group">
              <label>Cidade</label>
              <input type="text" {...register("city")} />
            </div>
          </Col>

          <Col xs={6} md={3} lg={2}>
            <div className="form-group">
              <label>CEP</label>
              <input type="text" {...register("cep")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Localização (Maps)</label>
              <input type="text" {...register("location")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Instagram</label>
              <input type="url" {...register("instagram_url")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Facebook</label>
              <input type="url" {...register("facebook_url")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Twitter</label>
              <input type="url" {...register("twitter_url")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>YouTube</label>
              <input type="url" {...register("youtube_url")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Site</label>
              <input type="url" {...register("website_url")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Segmentos Atendidos</label>
              <div className="segments-grid">
                {segmentOptions.map((opt) => (
                  <label key={opt.value} className="seg-item">
                    <input
                      type="checkbox"
                      value={opt.value}
                      checked={segments.includes(opt.value)}
                      onChange={handleSegmentsChange}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <input type="hidden" {...register("segments")} value={segments} readOnly />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Descrição</label>
              <textarea rows={3} {...register("description")} />
            </div>
          </Col>

          <Col xs={12} className="text-end">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </Col>
        </Row>
      </Form>
    </>
  );
}
