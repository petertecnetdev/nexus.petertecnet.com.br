import React from "react";
import establishmentSegments from "../../constants/establishmentSegments";
import "./EstablishmentUpdateForm.css";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function EstablishmentUpdateForm({
  register,
  handleSubmit,
  errors,
  isSubmitting,
  segments,
  logoPreview,
  backgroundPreview,
  handleLogoChange,
  handleBackgroundChange,
  handleSegmentsChange,
  onSubmit,
  watch,
}) {
  const name = watch?.("fantasy") || watch?.("name") || "Nome da empresa";
  const description = watch?.("description") || "A descrição do catálogo aparecerá aqui.";
  const isPublished = String(watch?.("is_published") ?? "1") === "1";

  return (
    <form className="eup-form" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
      <div
        className="eup-preview"
        style={backgroundPreview ? {
          backgroundImage: `linear-gradient(90deg, rgba(8,20,40,.92), rgba(8,20,40,.55)), url("${backgroundPreview}")`,
        } : undefined}
      >
        <div className="eup-preview__logo">
          {logoPreview ? <img src={logoPreview} alt="Logo da empresa" /> : <span>N</span>}
        </div>
        <div className="eup-preview__copy">
          <span>{isPublished ? "Prévia do catálogo" : "Catálogo desativado"}</span>
          <h2>{name}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="eup-uploadbar">
        <label htmlFor="backgroundInput">Alterar capa</label>
        <label htmlFor="logoInput">Alterar logo</label>
        <input id="backgroundInput" type="file" accept="image/*" onChange={handleBackgroundChange} />
        <input id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} />
      </div>

      <Section title="Disponibilidade do catálogo" subtitle="Desative temporariamente a empresa sem apagar dados, itens, QR Code ou histórico.">
        <div className="eup-grid">
          <Field label="Catálogo da empresa" className="span-6">
            <select {...register("is_published")}>
              <option value="1">Ativo — catálogo público</option>
              <option value="0">Inativo — catálogo oculto</option>
            </select>
          </Field>
          <div className="span-6">
            <p className="mb-0">
              {isPublished
                ? "O estabelecimento está visível e pode receber acessos pelo catálogo/QR Code, respeitando as configurações de compra abaixo."
                : "O estabelecimento fica indisponível publicamente. Clientes não conseguem abrir o catálogo nem iniciar compras."}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Informações da empresa" subtitle="Estes são os dados atuais. Edite apenas o que desejar mudar.">
        <div className="eup-grid">
          <Field label="Nome da empresa *" className="span-4" error={errors?.name?.message}>
            <input {...register("name", { required: "Informe o nome da empresa." })} />
          </Field>
          <Field label="Nome fantasia" className="span-4"><input {...register("fantasy")} /></Field>
          <Field label="CNPJ" className="span-4"><input {...register("cnpj")} /></Field>
          <Field label="Telefone" className="span-4"><input {...register("phone")} /></Field>
          <Field label="E-mail" className="span-4"><input type="email" {...register("email")} /></Field>
          <Field label="CEP" className="span-4"><input {...register("cep")} /></Field>
          <Field label="Descrição do catálogo" className="span-12"><textarea rows={4} {...register("description")} /></Field>
          <Field label="Informações adicionais" className="span-12"><textarea rows={3} {...register("additional_info")} /></Field>
        </div>
      </Section>

      <Section title="Localização" subtitle="Endereço e localização exibidos para quem acessar o catálogo.">
        <div className="eup-grid">
          <Field label="Endereço" className="span-8"><input {...register("address")} /></Field>
          <Field label="Cidade" className="span-2"><input {...register("city")} /></Field>
          <Field label="UF" className="span-2">
            <select {...register("uf")}>
              <option value="">Selecione</option>
              {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </Field>
          <Field label="Localização / Google Maps" className="span-12"><input {...register("location")} /></Field>
        </div>
      </Section>

      <Section title="Presença digital" subtitle="Links opcionais da empresa.">
        <div className="eup-grid">
          <Field label="Instagram" className="span-4"><input type="url" {...register("instagram_url")} /></Field>
          <Field label="Facebook" className="span-4"><input type="url" {...register("facebook_url")} /></Field>
          <Field label="Site" className="span-4"><input type="url" {...register("website_url")} /></Field>
          <Field label="X / Twitter" className="span-6"><input type="url" {...register("twitter_url")} /></Field>
          <Field label="YouTube" className="span-6"><input type="url" {...register("youtube_url")} /></Field>
        </div>
      </Section>

      <Section title="Tipo de catálogo" subtitle="Selecione os segmentos que ajudam a identificar o conteúdo desta empresa.">
        <div className="eup-segments">
          {establishmentSegments.map((option) => {
            const selected = segments.includes(option.value);
            return (
              <label key={option.value} className={`eup-segment ${selected ? "is-selected" : ""}`}>
                <input type="checkbox" value={option.value} checked={selected} onChange={handleSegmentsChange} />
                <span className="eup-segment__check" aria-hidden="true" />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        <input type="hidden" {...register("segments")} value={segments.join(",")} readOnly />
      </Section>

      <div className="eup-actions">
        <button type="submit" className="eup-submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando alterações..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, subtitle, children }) {
  return <section className="eup-section"><div className="eup-section__heading"><h3>{title}</h3><p>{subtitle}</p></div>{children}</section>;
}

function Field({ label, className = "", error, children }) {
  return <label className={`eup-field ${className}`}><span>{label}</span>{children}{error ? <small>{error}</small> : null}</label>;
}
