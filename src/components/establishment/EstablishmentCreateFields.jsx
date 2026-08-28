// src/components/establishment/EstablishmentCreateFields.jsx
import React from "react";
import "./EstablishmentCreateFields.css";

export default function EstablishmentCreateFields({
  register,
  isSubmitting,
  errors = {},
}) {
  const fieldError = (name) => errors?.[name]?.[0] || errors?.[name]?.message || null;

  return (
    <section className="estab-form-section">
      <h4 className="estab-form-title">Informações principais</h4>
      <p className="text-muted mb-3">
        Comece com o essencial. Endereço completo, redes sociais e outras configurações podem ser adicionados depois.
      </p>

      <div className="estab-form-grid">
        <div className="form-group span-2">
          <label htmlFor="establishment-name">Nome da empresa*</label>
          <input
            id="establishment-name"
            {...register("name", { required: true })}
            disabled={isSubmitting}
            required
          />
          {fieldError("name") && <small className="text-danger">{fieldError("name")}</small>}
        </div>

        <div className="form-group span-2">
          <label htmlFor="establishment-fantasy">Nome de exibição</label>
          <input
            id="establishment-fantasy"
            {...register("fantasy")}
            disabled={isSubmitting}
          />
          {fieldError("fantasy") && <small className="text-danger">{fieldError("fantasy")}</small>}
        </div>

        <div className="form-group span-2">
          <label htmlFor="establishment-phone">Telefone / WhatsApp</label>
          <input
            id="establishment-phone"
            inputMode="tel"
            {...register("phone")}
            disabled={isSubmitting}
          />
          {fieldError("phone") && <small className="text-danger">{fieldError("phone")}</small>}
        </div>

        <div className="form-group span-2">
          <label htmlFor="establishment-email">Email comercial</label>
          <input
            id="establishment-email"
            type="email"
            {...register("email")}
            disabled={isSubmitting}
          />
          {fieldError("email") && <small className="text-danger">{fieldError("email")}</small>}
        </div>

        <div className="form-group span-2">
          <label htmlFor="establishment-city">Cidade</label>
          <input
            id="establishment-city"
            {...register("city")}
            disabled={isSubmitting}
          />
          {fieldError("city") && <small className="text-danger">{fieldError("city")}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="establishment-uf">UF</label>
          <input
            id="establishment-uf"
            maxLength={2}
            placeholder="GO"
            {...register("uf")}
            disabled={isSubmitting}
          />
          {fieldError("uf") && <small className="text-danger">{fieldError("uf")}</small>}
        </div>

        <div className="form-group span-4">
          <label htmlFor="establishment-description">Descrição</label>
          <textarea
            id="establishment-description"
            rows={4}
            placeholder="Explique em poucas linhas o que a empresa oferece."
            {...register("description")}
            disabled={isSubmitting}
          />
          {fieldError("description") && <small className="text-danger">{fieldError("description")}</small>}
        </div>
      </div>
    </section>
  );
}
