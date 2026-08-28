// src/components/establishment/EstablishmentCreateFields.jsx
import React from "react";
import EstablishmentSegmentsSelector from "./EstablishmentSegmentsSelector";
import "./EstablishmentCreateFields.css";

export default function EstablishmentCreateFields({
  register,
  segments,
  segmentOptions,
  handleSegmentsChange,
  handleCnpjChange,
  handleCepChange,
  cnpjLoading = false,
  cepLoading = false,
  cnpjStatus = "",
  isSubmitting,
  errors = {},
}) {
  const fieldError = (name) => errors?.[name]?.[0] || errors?.[name]?.message || null;

  return (
    <>
      <section className="estab-form-section">
        <h4 className="estab-form-title">Dados da Empresa</h4>

        <div className="estab-form-grid">
          <div className="form-group span-2">
            <label>Nome*</label>
            <input {...register("name", { required: true })} disabled={isSubmitting} />
            {fieldError("name") && <small className="text-danger">{fieldError("name")}</small>}
          </div>

          <div className="form-group span-2">
            <label>Nome Fantasia</label>
            <input {...register("fantasy")} disabled={isSubmitting} />
            {fieldError("fantasy") && <small className="text-danger">{fieldError("fantasy")}</small>}
          </div>

          <div className="form-group span-2">
            <label>CNPJ</label>
            <input
              {...register("cnpj")}
              inputMode="numeric"
              maxLength={18}
              placeholder="00.000.000/0000-00"
              onChange={handleCnpjChange}
              disabled={isSubmitting || cnpjLoading}
            />
            {cnpjLoading && <small className="text-info">Consultando CNPJ e preenchendo os dados...</small>}
            {!cnpjLoading && cnpjStatus && <small className="text-success">{cnpjStatus}</small>}
            {fieldError("cnpj") && <small className="text-danger">{fieldError("cnpj")}</small>}
          </div>

          <div className="form-group span-2">
            <label>Telefone</label>
            <input {...register("phone")} disabled={isSubmitting} />
            {fieldError("phone") && <small className="text-danger">{fieldError("phone")}</small>}
          </div>

          <div className="form-group span-2">
            <label>Email</label>
            <input type="email" {...register("email")} disabled={isSubmitting} />
            {fieldError("email") && <small className="text-danger">{fieldError("email")}</small>}
          </div>

          <div className="form-group span-4">
            <label>Descrição</label>
            <textarea {...register("description")} disabled={isSubmitting} />
            {fieldError("description") && <small className="text-danger">{fieldError("description")}</small>}
          </div>

          <div className="form-group span-4">
            <label>Informações adicionais</label>
            <textarea {...register("additional_info")} disabled={isSubmitting} />
            {fieldError("additional_info") && <small className="text-danger">{fieldError("additional_info")}</small>}
          </div>
        </div>
      </section>

      <section className="estab-form-section">
        <h4 className="estab-form-title">Endereço</h4>

        <div className="estab-form-grid">
          <div className="form-group span-3">
            <label>Endereço</label>
            <input {...register("address")} disabled={isSubmitting} />
            {fieldError("address") && <small className="text-danger">{fieldError("address")}</small>}
          </div>

          <div className="form-group">
            <label>Cidade</label>
            <input {...register("city")} disabled={isSubmitting} />
            {fieldError("city") && <small className="text-danger">{fieldError("city")}</small>}
          </div>

          <div className="form-group">
            <label>UF</label>
            <input {...register("uf")} maxLength={2} placeholder="Ex: GO" disabled={isSubmitting} />
            {fieldError("uf") && <small className="text-danger">{fieldError("uf")}</small>}
          </div>

          <div className="form-group span-2">
            <label>CEP</label>
            <input
              {...register("cep")}
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              onChange={handleCepChange}
              disabled={isSubmitting || cepLoading}
            />
            {cepLoading && <small className="text-info">Consultando CEP...</small>}
            {fieldError("cep") && <small className="text-danger">{fieldError("cep")}</small>}
          </div>
        </div>
      </section>

      <section className="estab-form-section">
        <h4 className="estab-form-title">Redes Sociais</h4>

        <div className="estab-form-grid">
          <div className="form-group">
            <label>Website</label>
            <input {...register("website_url")} disabled={isSubmitting} />
            {fieldError("website_url") && <small className="text-danger">{fieldError("website_url")}</small>}
          </div>

          <div className="form-group">
            <label>Instagram</label>
            <input {...register("instagram_url")} disabled={isSubmitting} />
            {fieldError("instagram_url") && <small className="text-danger">{fieldError("instagram_url")}</small>}
          </div>

          <div className="form-group">
            <label>Facebook</label>
            <input {...register("facebook_url")} disabled={isSubmitting} />
            {fieldError("facebook_url") && <small className="text-danger">{fieldError("facebook_url")}</small>}
          </div>

          <div className="form-group">
            <label>Twitter</label>
            <input {...register("twitter_url")} disabled={isSubmitting} />
            {fieldError("twitter_url") && <small className="text-danger">{fieldError("twitter_url")}</small>}
          </div>

          <div className="form-group">
            <label>YouTube</label>
            <input {...register("youtube_url")} disabled={isSubmitting} />
            {fieldError("youtube_url") && <small className="text-danger">{fieldError("youtube_url")}</small>}
          </div>
        </div>
      </section>

      <section className="estab-form-section">
        <h4 className="estab-form-title">Segmentos Atendidos</h4>

        <EstablishmentSegmentsSelector
          segments={segments}
          segmentOptions={segmentOptions}
          onChange={handleSegmentsChange}
        />

        {fieldError("segments") && (
          <small className="text-danger d-block mt-2">{fieldError("segments")}</small>
        )}
      </section>
    </>
  );
}
