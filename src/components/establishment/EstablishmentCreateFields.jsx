// src/components/establishment/EstablishmentCreateFields.jsx
import React from "react";
import EstablishmentSegmentsSelector from "./EstablishmentSegmentsSelector";
import "./EstablishmentCreateFields.css";

export default function EstablishmentCreateFields({
  register,
  segments,
  segmentOptions,
  handleSegmentsChange,
  isSubmitting,
  errors = {},
}) {
  const fieldError = (name) =>
    errors?.[name] ? errors[name][0] : null;

  return (
    <>
      {/* ================= DADOS DO ESTABELECIMENTO ================= */}
      <section className="estab-form-section">
        <h4 className="estab-form-title">Dados do Estabelecimento</h4>

        <div className="estab-form-grid">
          <div className="form-group span-2">
            <label>Nome*</label>
            <input {...register("name", { required: true })} />
            {fieldError("name") && (
              <small className="text-danger">{fieldError("name")}</small>
            )}
          </div>

          <div className="form-group span-2">
            <label>Nome Fantasia</label>
            <input {...register("fantasy")} />
            {fieldError("fantasy") && (
              <small className="text-danger">{fieldError("fantasy")}</small>
            )}
          </div>

          <div className="form-group">
            <label>CNPJ</label>
            <input {...register("cnpj")} />
            {fieldError("cnpj") && (
              <small className="text-danger">{fieldError("cnpj")}</small>
            )}
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input {...register("phone")} />
            {fieldError("phone") && (
              <small className="text-danger">{fieldError("phone")}</small>
            )}
          </div>

          <div className="form-group span-2">
            <label>Email</label>
            <input type="email" {...register("email")} />
            {fieldError("email") && (
              <small className="text-danger">{fieldError("email")}</small>
            )}
          </div>

          <div className="form-group span-4">
            <label>Descrição</label>
            <textarea {...register("description")} />
            {fieldError("description") && (
              <small className="text-danger">
                {fieldError("description")}
              </small>
            )}
          </div>

          <div className="form-group span-4">
            <label>Informações adicionais</label>
            <textarea {...register("additional_info")} />
            {fieldError("additional_info") && (
              <small className="text-danger">
                {fieldError("additional_info")}
              </small>
            )}
          </div>
        </div>
      </section>

      {/* ================= ENDEREÇO ================= */}
      <section className="estab-form-section">
        <h4 className="estab-form-title">Endereço</h4>

        <div className="estab-form-grid">
          <div className="form-group span-3">
            <label>Endereço</label>
            <input {...register("address")} />
            {fieldError("address") && (
              <small className="text-danger">{fieldError("address")}</small>
            )}
          </div>

          <div className="form-group">
            <label>Cidade</label>
            <input {...register("city")} />
            {fieldError("city") && (
              <small className="text-danger">{fieldError("city")}</small>
            )}
          </div>

          <div className="form-group">
            <label>UF</label>
            <input
              {...register("uf")}
              maxLength={2}
              placeholder="Ex: GO"
            />
            {fieldError("uf") && (
              <small className="text-danger">{fieldError("uf")}</small>
            )}
          </div>

          <div className="form-group">
            <label>CEP</label>
            <input {...register("cep")} />
            {fieldError("cep") && (
              <small className="text-danger">{fieldError("cep")}</small>
            )}
          </div>
        </div>
      </section>

      {/* ================= REDES SOCIAIS ================= */}
      <section className="estab-form-section">
        <h4 className="estab-form-title">Redes Sociais</h4>

        <div className="estab-form-grid">
          <div className="form-group">
            <label>Website</label>
            <input {...register("website_url")} />
            {fieldError("website_url") && (
              <small className="text-danger">
                {fieldError("website_url")}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Instagram</label>
            <input {...register("instagram_url")} />
            {fieldError("instagram_url") && (
              <small className="text-danger">
                {fieldError("instagram_url")}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Facebook</label>
            <input {...register("facebook_url")} />
            {fieldError("facebook_url") && (
              <small className="text-danger">
                {fieldError("facebook_url")}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Twitter</label>
            <input {...register("twitter_url")} />
            {fieldError("twitter_url") && (
              <small className="text-danger">
                {fieldError("twitter_url")}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>YouTube</label>
            <input {...register("youtube_url")} />
            {fieldError("youtube_url") && (
              <small className="text-danger">
                {fieldError("youtube_url")}
              </small>
            )}
          </div>
        </div>
      </section>

      {/* ================= SEGMENTOS ================= */}
      <section className="estab-form-section">
        <h4 className="estab-form-title">Segmentos Atendidos</h4>

        <EstablishmentSegmentsSelector
          segments={segments}
          segmentOptions={segmentOptions}
          onChange={handleSegmentsChange}
        />

        {fieldError("segments") && (
          <small className="text-danger d-block mt-2">
            {fieldError("segments")}
          </small>
        )}
      </section>
    </>
  );
}
