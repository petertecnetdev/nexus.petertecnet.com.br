import React from "react";
import establishmentSegments from "../../constants/establishmentSegments";
import "./EstablishmentUpdateForm.css";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const CAPABILITIES = [
  ["catalog", "Exibir catálogo"],
  ["commerce", "Venda / compra online"],
  ["scheduling", "Agendamento"],
  ["quotes", "Orçamentos"],
  ["contact", "Contato direto"],
];

const PAYMENT_METHODS = [
  ["pix", "Pix"],
  ["credit_card", "Cartão de crédito"],
  ["debit_card", "Cartão de débito"],
  ["cash", "Dinheiro"],
  ["bank_transfer", "Transferência"],
  ["payment_link", "Link de pagamento"],
];

const WEEK_DAYS = [
  ["monday", "Segunda-feira"],
  ["tuesday", "Terça-feira"],
  ["wednesday", "Quarta-feira"],
  ["thursday", "Quinta-feira"],
  ["friday", "Sexta-feira"],
  ["saturday", "Sábado"],
  ["sunday", "Domingo"],
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
  const description = watch?.("description") || "A descrição da empresa aparecerá aqui.";
  const coverPositionY = Number(watch?.("profile_settings.cover_position_y") ?? 50);

  return (
    <form className="eup-form" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
      <div
        className="eup-preview"
        style={backgroundPreview ? {
          backgroundImage: `linear-gradient(90deg, rgba(8,20,40,.92), rgba(8,20,40,.55)), url("${backgroundPreview}")`,
          backgroundPosition: `center ${coverPositionY}%`,
        } : undefined}
      >
        <div className="eup-preview__logo">
          {logoPreview ? <img src={logoPreview} alt="Logo da empresa" /> : <span>N</span>}
        </div>
        <div className="eup-preview__copy">
          <span>Prévia da apresentação pública</span>
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

      <Section title="Enquadramento da capa" subtitle="Reposicione a imagem sem precisar recortar ou reenviar. A prévia acima usa exatamente esta posição.">
        <div className="eup-cover-position">
          <span>Topo</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            aria-label="Posição vertical da capa"
            {...register("profile_settings.cover_position_y", { valueAsNumber: true })}
          />
          <span>Base</span>
          <strong>{Math.round(coverPositionY)}%</strong>
        </div>
      </Section>

      <Section title="Informações da empresa" subtitle="Estes dados aparecem na apresentação pública e ajudam o visitante a decidir o próximo passo.">
        <div className="eup-grid">
          <Field label="Nome da empresa *" className="span-4" error={errors?.name?.message}>
            <input {...register("name", { required: "Informe o nome da empresa." })} />
          </Field>
          <Field label="Nome fantasia" className="span-4"><input {...register("fantasy")} /></Field>
          <Field label="CNPJ" className="span-4"><input {...register("cnpj")} /></Field>
          <Field label="Telefone" className="span-4"><input {...register("phone")} /></Field>
          <Field label="E-mail" className="span-4"><input type="email" {...register("email")} /></Field>
          <Field label="CEP" className="span-4"><input {...register("cep")} /></Field>
          <Field label="Descrição principal" className="span-12"><textarea rows={4} {...register("description")} /></Field>
          <Field label="Sobre / diferenciais" className="span-12"><textarea rows={3} {...register("additional_info")} /></Field>
        </div>
      </Section>

      <Section title="Localização" subtitle="Endereço e localização exibidos para quem acessar a empresa.">
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

      <Section title="Presença digital" subtitle="Links opcionais exibidos como canais oficiais da empresa.">
        <div className="eup-grid">
          <Field label="Instagram" className="span-4"><input type="url" {...register("instagram_url")} /></Field>
          <Field label="Facebook" className="span-4"><input type="url" {...register("facebook_url")} /></Field>
          <Field label="Site" className="span-4"><input type="url" {...register("website_url")} /></Field>
          <Field label="X / Twitter" className="span-6"><input type="url" {...register("twitter_url")} /></Field>
          <Field label="YouTube" className="span-6"><input type="url" {...register("youtube_url")} /></Field>
        </div>
      </Section>

      <Section title="Ação principal" subtitle="A Nexus adapta o botão de destaque da apresentação ao objetivo desta empresa.">
        <div className="eup-grid">
          <Field label="Botão principal" className="span-4">
            <select {...register("profile_settings.primary_cta")}>
              <option value="catalog">Ver catálogo</option>
              <option value="buy">Comprar agora</option>
              <option value="schedule">Agendar</option>
              <option value="quote">Pedir orçamento</option>
              <option value="contact">Entrar em contato</option>
            </select>
          </Field>
          <div className="span-8 eup-option-group">
            <span className="eup-option-group__title">Capacidades do estabelecimento</span>
            <div className="eup-choice-grid">
              {CAPABILITIES.map(([value, label]) => (
                <label key={value} className="eup-choice">
                  <input type="checkbox" value={value} {...register("profile_settings.capabilities")} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Formas de pagamento" subtitle="Marque somente as formas realmente aceitas pelo estabelecimento.">
        <div className="eup-choice-grid eup-choice-grid--payments">
          {PAYMENT_METHODS.map(([value, label]) => (
            <label key={value} className="eup-choice">
              <input type="checkbox" value={value} {...register("profile_settings.payment_methods")} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Horários de atendimento" subtitle="Esses horários aparecem na apresentação pública. Desmarque os dias em que a empresa não atende.">
        <div className="eup-hours-editor">
          {WEEK_DAYS.map(([day, label]) => {
            const enabled = Boolean(watch?.(`profile_settings.business_hours.${day}.enabled`));
            return (
              <div key={day} className={`eup-hours-row ${enabled ? "is-enabled" : ""}`}>
                <label className="eup-hours-day">
                  <input type="checkbox" {...register(`profile_settings.business_hours.${day}.enabled`)} />
                  <strong>{label}</strong>
                </label>
                <input
                  type="time"
                  aria-label={`Abertura de ${label}`}
                  disabled={!enabled}
                  {...register(`profile_settings.business_hours.${day}.open`)}
                />
                <span>até</span>
                <input
                  type="time"
                  aria-label={`Fechamento de ${label}`}
                  disabled={!enabled}
                  {...register(`profile_settings.business_hours.${day}.close`)}
                />
                {!enabled && <small>Fechado</small>}
              </div>
            );
          })}
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
          {isSubmitting ? "Salvando alterações..." : "Salvar e atualizar apresentação"}
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
