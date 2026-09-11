// src/components/item/ItemUpdateForm.jsx
import React from "react";
import { Alert, Button, Form } from "react-bootstrap";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaExternalLinkAlt,
  FaImage,
  FaLayerGroup,
  FaLink,
  FaPlus,
  FaSave,
  FaSearch,
  FaShoppingCart,
  FaSlidersH,
  FaTag,
  FaTrash,
} from "react-icons/fa";
import "./ItemUpdateForm.css";

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const NAV_ITEMS = [
  ["basic", "Informações", FaBoxOpen],
  ["images", "Imagens", FaImage],
  ["pricing", "Preço e venda", FaTag],
  ["availability", "Disponibilidade", FaClock],
  ["variants", "Variações", FaLayerGroup],
  ["addons", "Adicionais", FaPlus],
  ["catalog", "Catálogo", FaShoppingCart],
  ["seo", "SEO e compartilhamento", FaSearch],
  ["advanced", "Avançado", FaSlidersH],
];

function parsePrice(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value) {
  const amount = parsePrice(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function initials(name) {
  return String(name || "Item")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "IT";
}

function newKey(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function FieldError({ name, errors, apiErrors }) {
  const local = errors?.[name]?.message;
  const remote = Array.isArray(apiErrors?.[name]) ? apiErrors[name][0] : apiErrors?.[name];
  const message = local || remote;
  if (!message) return null;
  return <small className="item-field-error">{message}</small>;
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="item-section-heading">
      <span className="item-section-icon"><Icon /></span>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={"item-toggle-row" + (disabled ? " is-disabled" : "")}>
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <span className="item-switch">
        <input
          type="checkbox"
          checked={Boolean(checked)}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}

export default function ItemUpdateForm({
  register,
  handleSubmit,
  watch,
  errors,
  apiErrors,
  item,
  imagePreview,
  imageUrl,
  imageUrlStatus,
  editorConfig,
  onEditorConfigChange,
  gallery,
  onGalleryAdd,
  onGalleryRemove,
  draftSavedAt,
  draftRestored,
  hasPendingChanges,
  isSubmitting,
  onImageChange,
  onImageUrlChange,
  onImageUrlLoad,
  onImageUrlError,
  onRemoveImage,
  onSubmit,
  onPreview,
  onDuplicate,
  onCancel,
  onDelete,
}) {
  if (!item) return null;

  const type = watch("type") || "product";
  const name = watch("name") || item.name || "Item";
  const price = watch("price");
  const status = Number(watch("status") ?? 1) === 1;
  const shortDescription = editorConfig?.short_description || "";
  const sale = editorConfig?.sale || {};
  const availability = editorConfig?.availability || {};
  const catalog = editorConfig?.catalog || {};
  const seo = editorConfig?.seo || {};
  const media = editorConfig?.media || {};
  const variants = Array.isArray(editorConfig?.variants) ? editorConfig.variants : [];
  const addOnGroups = Array.isArray(editorConfig?.add_on_groups) ? editorConfig.add_on_groups : [];
  const hasLinkedImage = Boolean(imageUrl?.trim());
  const hasSalePrice = String(sale.price ?? "").trim() !== "";
  const effectivePrice = sale.enabled && hasSalePrice ? sale.price : price;
  const basePrice = parsePrice(price);
  const salePrice = parsePrice(sale.price);
  const saleDiscount = sale.enabled && basePrice > 0 && salePrice >= 0 && salePrice < basePrice
    ? Math.round((1 - salePrice / basePrice) * 100)
    : 0;
  const focusY = Number(media.primary_focus_y ?? 50);

  const currentSlug = watch("slug") || item.slug;
  const publicPath = currentSlug ? "/item/" + currentSlug : "";

  const changeConfig = (producer) => {
    onEditorConfigChange((current) => {
      const next = JSON.parse(JSON.stringify(current || {}));
      producer(next);
      return next;
    });
  };

  const setConfigValue = (section, key, value) => {
    changeConfig((next) => {
      next[section] = next[section] || {};
      next[section][key] = value;
    });
  };

  const toggleWeekday = (day) => {
    changeConfig((next) => {
      next.availability = next.availability || {};
      const days = Array.isArray(next.availability.weekdays)
        ? next.availability.weekdays.map(Number)
        : [];
      next.availability.weekdays = days.includes(day)
        ? days.filter((value) => value !== day)
        : [...days, day];
    });
  };

  const addVariantGroup = () => {
    changeConfig((next) => {
      next.variants = Array.isArray(next.variants) ? next.variants : [];
      next.variants.push({
        id: newKey("variant"),
        name: "",
        values: [],
      });
    });
  };

  const updateVariantGroup = (groupIndex, key, value) => {
    changeConfig((next) => {
      next.variants[groupIndex][key] = value;
    });
  };

  const removeVariantGroup = (groupIndex) => {
    changeConfig((next) => {
      next.variants.splice(groupIndex, 1);
    });
  };

  const addVariantValue = (groupIndex) => {
    changeConfig((next) => {
      next.variants[groupIndex].values = Array.isArray(next.variants[groupIndex].values)
        ? next.variants[groupIndex].values
        : [];
      next.variants[groupIndex].values.push({
        id: newKey("value"),
        label: "",
        price_delta: "",
        stock: "",
        sku: "",
      });
    });
  };

  const updateVariantValue = (groupIndex, valueIndex, key, value) => {
    changeConfig((next) => {
      next.variants[groupIndex].values[valueIndex][key] = value;
    });
  };

  const removeVariantValue = (groupIndex, valueIndex) => {
    changeConfig((next) => {
      next.variants[groupIndex].values.splice(valueIndex, 1);
    });
  };

  const addAddOnGroup = () => {
    changeConfig((next) => {
      next.add_on_groups = Array.isArray(next.add_on_groups) ? next.add_on_groups : [];
      next.add_on_groups.push({
        id: newKey("addon"),
        name: "",
        required: false,
        min: 0,
        max: 1,
        options: [],
      });
    });
  };

  const updateAddOnGroup = (groupIndex, key, value) => {
    changeConfig((next) => {
      next.add_on_groups[groupIndex][key] = value;
    });
  };

  const removeAddOnGroup = (groupIndex) => {
    changeConfig((next) => {
      next.add_on_groups.splice(groupIndex, 1);
    });
  };

  const addAddOnOption = (groupIndex) => {
    changeConfig((next) => {
      next.add_on_groups[groupIndex].options = Array.isArray(next.add_on_groups[groupIndex].options)
        ? next.add_on_groups[groupIndex].options
        : [];
      next.add_on_groups[groupIndex].options.push({
        id: newKey("option"),
        label: "",
        price: "",
      });
    });
  };

  const updateAddOnOption = (groupIndex, optionIndex, key, value) => {
    changeConfig((next) => {
      next.add_on_groups[groupIndex].options[optionIndex][key] = value;
    });
  };

  const removeAddOnOption = (groupIndex, optionIndex) => {
    changeConfig((next) => {
      next.add_on_groups[groupIndex].options.splice(optionIndex, 1);
    });
  };

  const scrollTo = (id) => {
    document.getElementById("item-editor-" + id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="item-update-root">
      <Form onSubmit={handleSubmit(onSubmit)} noValidate className="item-editor-form">
        <header className="item-editor-hero">
          <div className="item-editor-hero-content">
            <button type="button" className="item-icon-button item-back-button" onClick={onCancel} aria-label="Voltar">
              <FaArrowLeft />
            </button>

            <div className="item-hero-avatar">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={name}
                  style={{ objectPosition: "center " + focusY + "%" }}
                />
              ) : (
                <span>{initials(name)}</span>
              )}
            </div>

            <div className="item-hero-copy">
              <div className="item-hero-badges">
                <span className={"item-status-badge " + (status ? "is-active" : "is-inactive")}>
                  <span className="status-dot" />
                  {status ? "Ativo" : "Inativo"}
                </span>
                <span className="item-type-badge">
                  {type === "service" ? "Serviço" : type === "ticket" ? "Ingresso" : type === "product" ? "Produto" : "Item"}
                </span>
                {watch("is_featured") && <span className="item-featured-badge">Destaque</span>}
              </div>
              <h1>{name}</h1>
              <p>
                {item.updated_at
                  ? "Atualizado em " + new Date(item.updated_at).toLocaleString("pt-BR")
                  : "Edite as informações comerciais do item."}
              </p>
            </div>

            <div className="item-hero-actions">
              <Button type="button" variant="outline-light" onClick={onPreview} disabled={!item.slug}>
                <FaExternalLinkAlt /> Visualizar
              </Button>
              <Button type="button" variant="outline-light" onClick={onDuplicate} disabled={isSubmitting}>
                <FaCopy /> Duplicar
              </Button>
              <Button type="submit" className="item-primary-action" disabled={isSubmitting}>
                <FaSave /> {isSubmitting ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>

          <div className="item-save-state" aria-live="polite">
            {hasPendingChanges ? (
              <span className="is-pending">Alterações ainda não publicadas</span>
            ) : (
              <span className="is-saved"><FaCheckCircle /> Tudo salvo</span>
            )}
            {draftSavedAt && (
              <small>Rascunho protegido neste dispositivo às {draftSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
            )}
          </div>
        </header>

        {draftRestored && (
          <Alert variant="info" className="item-editor-alert">
            Recuperamos um rascunho mais recente salvo neste dispositivo. Revise e clique em <strong>Salvar alterações</strong> para publicar.
          </Alert>
        )}

        <div className="item-editor-layout">
          <nav className="item-editor-nav" aria-label="Seções da edição">
            <div className="item-editor-nav-title">Editar item</div>
            {NAV_ITEMS.map(([id, label, Icon]) => (
              <button type="button" key={id} onClick={() => scrollTo(id)}>
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <main className="item-editor-main">
            <section id="item-editor-basic" className="item-editor-card">
              <SectionTitle
                icon={FaBoxOpen}
                title="Informações do item"
                description="Os dados que o cliente entende primeiro. Mantivemos os campos técnicos fora do caminho."
              />

              <div className="item-fields-grid">
                <div className="item-field item-field-span-2">
                  <label htmlFor="item-update-name">Nome do item *</label>
                  <input
                    id="item-update-name"
                    type="text"
                    autoComplete="off"
                    placeholder="Ex.: Corte masculino, Camiseta premium, Ingresso VIP"
                    {...register("name", {
                      required: "Informe o nome do item.",
                      minLength: { value: 2, message: "Use pelo menos 2 caracteres." },
                    })}
                  />
                  <FieldError name="name" errors={errors} apiErrors={apiErrors} />
                </div>

                <div className="item-field">
                  <label htmlFor="item-update-type">Tipo</label>
                  <select id="item-update-type" {...register("type")}>
                    <option value="product">Produto</option>
                    <option value="service">Serviço</option>
                    <option value="ticket">Ingresso</option>
                    <option value="generic">Outro item</option>
                  </select>
                  <small>A tela se adapta automaticamente ao tipo escolhido.</small>
                </div>

                <div className="item-field">
                  <label htmlFor="item-update-category">Categoria</label>
                  <input id="item-update-category" type="text" placeholder="Ex.: Barbearia, Bebidas, Camisetas" {...register("category")} />
                  <FieldError name="category" errors={errors} apiErrors={apiErrors} />
                </div>

                <div className="item-field">
                  <label htmlFor="item-update-subcategory">Subcategoria</label>
                  <input id="item-update-subcategory" type="text" placeholder="Opcional" {...register("subcategory")} />
                </div>

                <div className="item-field">
                  <label htmlFor="item-update-brand">Marca ou referência</label>
                  <input id="item-update-brand" type="text" placeholder="Marca, fabricante ou referência" {...register("brand")} />
                </div>

                <div className="item-field">
                  <label htmlFor="item-update-sku">SKU / código interno</label>
                  <input id="item-update-sku" type="text" placeholder="Ex.: CAM-PRETA-M" {...register("sku")} />
                  <small>Útil para estoque, conferência e integrações.</small>
                  <FieldError name="sku" errors={errors} apiErrors={apiErrors} />
                </div>

                <div className="item-field item-field-span-2">
                  <label htmlFor="item-short-description">Descrição curta</label>
                  <input
                    id="item-short-description"
                    type="text"
                    maxLength={180}
                    placeholder="Uma frase rápida para cards e catálogo."
                    value={shortDescription}
                    onChange={(event) => {
                      changeConfig((next) => {
                        next.short_description = event.target.value;
                      });
                    }}
                  />
                  <small>{shortDescription.length}/180 caracteres</small>
                </div>

                <div className="item-field item-field-span-2">
                  <label htmlFor="item-update-description">Descrição completa</label>
                  <textarea
                    id="item-update-description"
                    rows={6}
                    placeholder="Explique benefícios, características e tudo que ajuda o cliente a decidir."
                    {...register("description")}
                  />
                  <FieldError name="description" errors={errors} apiErrors={apiErrors} />
                </div>

                <div className="item-field item-field-span-2">
                  <label htmlFor="item-update-tags">Tags</label>
                  <input id="item-update-tags" type="text" placeholder="premium, masculino, promoção" {...register("tags_input")} />
                  <small>Separe por vírgulas. As tags ajudam organização e descoberta.</small>
                </div>
              </div>
            </section>

            <section id="item-editor-images" className="item-editor-card">
              <SectionTitle
                icon={FaImage}
                title="Imagens"
                description="Defina a imagem principal, ajuste o enquadramento e monte uma galeria do item."
              />

              <div className="item-media-editor">
                <div className="item-primary-media">
                  <div className="item-primary-media-preview">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={"Prévia de " + name}
                        style={{ objectPosition: "center " + focusY + "%" }}
                      />
                    ) : (
                      <span className="item-initials-fallback">{initials(name)}</span>
                    )}
                  </div>
                  <div className="item-media-actions">
                    <Button type="button" className="item-secondary-action" onClick={() => document.getElementById("itemImageInput")?.click()} disabled={isSubmitting}>
                      <FaImage /> Trocar imagem
                    </Button>
                    {imagePreview && (
                      <Button type="button" variant="outline-danger" onClick={onRemoveImage} disabled={isSubmitting}>
                        <FaTrash /> Remover
                      </Button>
                    )}
                  </div>
                  <input
                    id="itemImageInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onImageChange}
                    disabled={isSubmitting}
                    className="visually-hidden"
                  />
                </div>

                <div className="item-media-settings">
                  <div className="item-field">
                    <label htmlFor="item-update-image-url"><FaLink /> Usar imagem por link</label>
                    <input
                      id="item-update-image-url"
                      type="url"
                      inputMode="url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={imageUrl || ""}
                      onChange={onImageUrlChange}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    <small>Links HTTP/HTTPS públicos são aceitos.</small>
                  </div>

                  {hasLinkedImage && (
                    <div className="item-link-preview" aria-live="polite">
                      <img
                        src={imageUrl.trim()}
                        alt="Prévia do link informado"
                        onLoad={onImageUrlLoad}
                        onError={onImageUrlError}
                        style={{ display: imageUrlStatus === "error" ? "none" : "block" }}
                      />
                      {imageUrlStatus === "loading" && <small>Carregando prévia…</small>}
                      {imageUrlStatus === "loaded" && <small className="is-success">Imagem carregada.</small>}
                      {imageUrlStatus === "error" && <small className="item-field-error">Não foi possível abrir essa imagem.</small>}
                    </div>
                  )}

                  <div className="item-field">
                    <label htmlFor="item-focus-y">Enquadramento vertical</label>
                    <input
                      id="item-focus-y"
                      className="item-range"
                      type="range"
                      min="0"
                      max="100"
                      value={focusY}
                      onChange={(event) => {
                        changeConfig((next) => {
                          next.media = next.media || {};
                          next.media.primary_focus_y = Number(event.target.value);
                        });
                      }}
                    />
                    <small>Ajuste qual região da imagem fica em destaque nos cards.</small>
                  </div>
                </div>
              </div>

              <div className="item-gallery-block">
                <div className="item-gallery-heading">
                  <div>
                    <strong>Galeria</strong>
                    <small>Até 8 imagens adicionais.</small>
                  </div>
                  <Button type="button" className="item-secondary-action" onClick={() => document.getElementById("itemGalleryInput")?.click()} disabled={isSubmitting || gallery.length >= 8}>
                    <FaPlus /> Adicionar imagens
                  </Button>
                  <input
                    id="itemGalleryInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={onGalleryAdd}
                    className="visually-hidden"
                  />
                </div>

                {gallery.length ? (
                  <div className="item-gallery-grid">
                    {gallery.map((entry) => (
                      <div className="item-gallery-card" key={entry.id}>
                        <img src={entry.preview || entry.public_url} alt="Imagem da galeria" />
                        {entry.pending && <span className="item-pending-badge">Será enviada</span>}
                        <button type="button" onClick={() => onGalleryRemove(entry)} aria-label="Remover imagem da galeria">
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="item-empty-inline">Nenhuma imagem adicional. A imagem principal já é suficiente para publicar.</div>
                )}
              </div>
            </section>

            <section id="item-editor-pricing" className="item-editor-card">
              <SectionTitle
                icon={FaTag}
                title="Preço e venda"
                description="Configure preço normal, promoção e regras comerciais sem misturar com campos técnicos."
              />

              <div className="item-fields-grid">
                <div className="item-field">
                  <label htmlFor="item-update-price">Preço normal *</label>
                  <div className="item-money-input">
                    <span>R$</span>
                    <input
                      id="item-update-price"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      {...register("price", {
                        required: "Informe o preço.",
                        validate: (value) => parsePrice(value) >= 0 || "O preço não pode ser negativo.",
                      })}
                    />
                  </div>
                  <FieldError name="price" errors={errors} apiErrors={apiErrors} />
                </div>

                {type === "product" && (
                  <div className="item-field">
                    <label htmlFor="item-update-stock">Estoque</label>
                    <input id="item-update-stock" type="number" min="0" step="1" {...register("stock", { min: { value: 0, message: "O estoque não pode ser negativo." } })} />
                    <FieldError name="stock" errors={errors} apiErrors={apiErrors} />
                  </div>
                )}

                {type === "service" && (
                  <div className="item-field">
                    <label htmlFor="item-update-duration">Duração</label>
                    <div className="item-unit-input">
                      <input id="item-update-duration" type="number" min="1" max="1440" {...register("duration")} />
                      <span>min</span>
                    </div>
                    <FieldError name="duration" errors={errors} apiErrors={apiErrors} />
                  </div>
                )}

                <div className="item-field">
                  <label htmlFor="item-update-discount">Desconto percentual</label>
                  <div className="item-unit-input">
                    <input id="item-update-discount" type="number" min="0" max="100" step="0.01" {...register("discount")} />
                    <span>%</span>
                  </div>
                  <small>Compatível com integrações que já usam o campo de desconto.</small>
                </div>
              </div>

              <div className="item-subpanel">
                <Toggle
                  checked={sale.enabled}
                  onChange={(checked) => setConfigValue("sale", "enabled", checked)}
                  label="Preço promocional"
                  hint="Exiba uma oferta por período sem perder o preço normal."
                />

                {sale.enabled && (
                  <div className="item-fields-grid item-subpanel-fields">
                    <div className="item-field">
                      <label htmlFor="item-sale-price">Preço promocional</label>
                      <div className="item-money-input">
                        <span>R$</span>
                        <input
                          id="item-sale-price"
                          type="text"
                          inputMode="decimal"
                          value={sale.price ?? ""}
                          onChange={(event) => setConfigValue("sale", "price", event.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      {saleDiscount > 0 && <small className="is-success">{saleDiscount}% abaixo do preço normal.</small>}
                    </div>

                    <div className="item-field">
                      <label htmlFor="item-sale-start">Começa em</label>
                      <input
                        id="item-sale-start"
                        type="datetime-local"
                        value={sale.start_at || ""}
                        onChange={(event) => setConfigValue("sale", "start_at", event.target.value)}
                      />
                    </div>

                    <div className="item-field">
                      <label htmlFor="item-sale-end">Termina em</label>
                      <input
                        id="item-sale-end"
                        type="datetime-local"
                        value={sale.end_at || ""}
                        onChange={(event) => setConfigValue("sale", "end_at", event.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section id="item-editor-availability" className="item-editor-card">
              <SectionTitle
                icon={FaClock}
                title="Disponibilidade"
                description="Defina quando o item pode ser oferecido. Produto, serviço e ingresso usam o mesmo modelo genérico."
              />

              <div className="item-choice-grid">
                {[
                  ["always", "Sempre disponível", "Sem restrição adicional de agenda."],
                  ["period", "Período específico", "Use uma data de início e fim."],
                  ["schedule", "Dias e horários", "Controle os dias da semana e a faixa de horário."],
                  ["consult", "Sob consulta", "O cliente consulta disponibilidade antes da conclusão."],
                ].map(([value, label, hint]) => (
                  <label key={value} className={"item-choice-card " + (availability.mode === value ? "is-selected" : "")}>
                    <input
                      type="radio"
                      name="availability-mode"
                      value={value}
                      checked={availability.mode === value}
                      onChange={() => setConfigValue("availability", "mode", value)}
                    />
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </label>
                ))}
              </div>

              {(availability.mode === "period" || availability.mode === "schedule") && (
                <div className="item-fields-grid item-subpanel-fields">
                  <div className="item-field">
                    <label htmlFor="item-availability-start">Disponível a partir de</label>
                    <input id="item-availability-start" type="datetime-local" {...register("availability_start")} />
                    <FieldError name="availability_start" errors={errors} apiErrors={apiErrors} />
                  </div>
                  <div className="item-field">
                    <label htmlFor="item-availability-end">Disponível até</label>
                    <input id="item-availability-end" type="datetime-local" {...register("availability_end")} />
                    <FieldError name="availability_end" errors={errors} apiErrors={apiErrors} />
                  </div>
                </div>
              )}

              {availability.mode === "schedule" && (
                <div className="item-schedule-panel">
                  <strong>Dias da semana</strong>
                  <div className="item-weekdays">
                    {WEEKDAYS.map((day) => {
                      const selected = (availability.weekdays || []).map(Number).includes(day.value);
                      return (
                        <button
                          type="button"
                          key={day.value}
                          className={selected ? "is-selected" : ""}
                          onClick={() => toggleWeekday(day.value)}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="item-fields-grid">
                    <div className="item-field">
                      <label htmlFor="item-schedule-start">Horário inicial</label>
                      <input
                        id="item-schedule-start"
                        type="time"
                        value={availability.start_time || ""}
                        onChange={(event) => setConfigValue("availability", "start_time", event.target.value)}
                      />
                    </div>
                    <div className="item-field">
                      <label htmlFor="item-schedule-end">Horário final</label>
                      <input
                        id="item-schedule-end"
                        type="time"
                        value={availability.end_time || ""}
                        onChange={(event) => setConfigValue("availability", "end_time", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section id="item-editor-variants" className="item-editor-card">
              <div className="item-section-heading-with-action">
                <SectionTitle
                  icon={FaLayerGroup}
                  title="Variações"
                  description="Crie tamanhos, sabores, cores ou qualquer atributo do item sem criar uma tela específica por segmento."
                />
                <Button type="button" className="item-secondary-action" onClick={addVariantGroup}>
                  <FaPlus /> Nova variação
                </Button>
              </div>

              {variants.length ? (
                <div className="item-config-list">
                  {variants.map((group, groupIndex) => (
                    <div className="item-config-group" key={group.id || groupIndex}>
                      <div className="item-config-group-header">
                        <div className="item-field">
                          <label>Nome da variação</label>
                          <input
                            type="text"
                            placeholder="Ex.: Tamanho, Cor, Sabor"
                            value={group.name || ""}
                            onChange={(event) => updateVariantGroup(groupIndex, "name", event.target.value)}
                          />
                        </div>
                        <button type="button" className="item-icon-danger" onClick={() => removeVariantGroup(groupIndex)} aria-label="Remover variação">
                          <FaTrash />
                        </button>
                      </div>

                      <div className="item-option-table">
                        {(group.values || []).map((value, valueIndex) => (
                          <div className="item-option-row item-option-row-variant" key={value.id || valueIndex}>
                            <input
                              type="text"
                              placeholder="Valor (ex.: Grande)"
                              value={value.label || ""}
                              onChange={(event) => updateVariantValue(groupIndex, valueIndex, "label", event.target.value)}
                            />
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="+ R$"
                              value={value.price_delta ?? ""}
                              onChange={(event) => updateVariantValue(groupIndex, valueIndex, "price_delta", event.target.value)}
                            />
                            <input
                              type="number"
                              min="0"
                              placeholder="Estoque"
                              value={value.stock ?? ""}
                              onChange={(event) => updateVariantValue(groupIndex, valueIndex, "stock", event.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="SKU"
                              value={value.sku || ""}
                              onChange={(event) => updateVariantValue(groupIndex, valueIndex, "sku", event.target.value)}
                            />
                            <button type="button" onClick={() => removeVariantValue(groupIndex, valueIndex)} aria-label="Remover opção">
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>

                      <Button type="button" variant="outline-info" className="item-inline-add" onClick={() => addVariantValue(groupIndex)}>
                        <FaPlus /> Adicionar valor
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="item-empty-state">
                  <FaLayerGroup />
                  <strong>Este item ainda não possui variações</strong>
                  <p>Adicione apenas quando o cliente precisar escolher algo como tamanho, cor, sabor ou modelo.</p>
                  <Button type="button" className="item-secondary-action" onClick={addVariantGroup}><FaPlus /> Criar primeira variação</Button>
                </div>
              )}
            </section>

            <section id="item-editor-addons" className="item-editor-card">
              <div className="item-section-heading-with-action">
                <SectionTitle
                  icon={FaPlus}
                  title="Adicionais e complementos"
                  description="Monte grupos opcionais ou obrigatórios com limites mínimos e máximos de escolha."
                />
                <Button type="button" className="item-secondary-action" onClick={addAddOnGroup}>
                  <FaPlus /> Novo grupo
                </Button>
              </div>

              {addOnGroups.length ? (
                <div className="item-config-list">
                  {addOnGroups.map((group, groupIndex) => (
                    <div className="item-config-group" key={group.id || groupIndex}>
                      <div className="item-config-group-header item-addon-header">
                        <div className="item-field">
                          <label>Nome do grupo</label>
                          <input
                            type="text"
                            placeholder="Ex.: Escolha um adicional"
                            value={group.name || ""}
                            onChange={(event) => updateAddOnGroup(groupIndex, "name", event.target.value)}
                          />
                        </div>
                        <div className="item-mini-fields">
                          <label>
                            Mín.
                            <input
                              type="number"
                              min="0"
                              value={group.min ?? 0}
                              onChange={(event) => updateAddOnGroup(groupIndex, "min", Number(event.target.value))}
                            />
                          </label>
                          <label>
                            Máx.
                            <input
                              type="number"
                              min="1"
                              value={group.max ?? 1}
                              onChange={(event) => updateAddOnGroup(groupIndex, "max", Number(event.target.value))}
                            />
                          </label>
                        </div>
                        <button type="button" className="item-icon-danger" onClick={() => removeAddOnGroup(groupIndex)} aria-label="Remover grupo de adicionais">
                          <FaTrash />
                        </button>
                      </div>

                      <Toggle
                        checked={group.required}
                        onChange={(checked) => updateAddOnGroup(groupIndex, "required", checked)}
                        label="Escolha obrigatória"
                        hint="O cliente precisará escolher conforme os limites definidos."
                      />

                      <div className="item-option-table">
                        {(group.options || []).map((option, optionIndex) => (
                          <div className="item-option-row item-option-row-addon" key={option.id || optionIndex}>
                            <input
                              type="text"
                              placeholder="Ex.: Bacon, Queijo, Molho"
                              value={option.label || ""}
                              onChange={(event) => updateAddOnOption(groupIndex, optionIndex, "label", event.target.value)}
                            />
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="Preço adicional"
                              value={option.price ?? ""}
                              onChange={(event) => updateAddOnOption(groupIndex, optionIndex, "price", event.target.value)}
                            />
                            <button type="button" onClick={() => removeAddOnOption(groupIndex, optionIndex)} aria-label="Remover adicional">
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>

                      <Button type="button" variant="outline-info" className="item-inline-add" onClick={() => addAddOnOption(groupIndex)}>
                        <FaPlus /> Adicionar opção
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="item-empty-state">
                  <FaPlus />
                  <strong>Sem adicionais configurados</strong>
                  <p>Use esta área para complementos, extras, acompanhamentos ou personalizações cobradas à parte.</p>
                  <Button type="button" className="item-secondary-action" onClick={addAddOnGroup}><FaPlus /> Criar grupo de adicionais</Button>
                </div>
              )}
            </section>

            <section id="item-editor-catalog" className="item-editor-card">
              <SectionTitle
                icon={FaShoppingCart}
                title="Catálogo"
                description="Controle como o item aparece e o que o cliente pode fazer com ele."
              />

              <div className="item-fields-grid">
                <div className="item-field">
                  <label htmlFor="item-update-status">Visibilidade</label>
                  <select id="item-update-status" {...register("status")}>
                    <option value="1">Ativo — aparece no catálogo</option>
                    <option value="0">Inativo — oculto do catálogo</option>
                  </select>
                  <small>Desative para ocultar temporariamente sem excluir.</small>
                </div>

                <div className="item-field">
                  <label htmlFor="item-sort-order">Ordem de exibição</label>
                  <input
                    id="item-sort-order"
                    type="number"
                    min="0"
                    value={catalog.sort_order ?? 0}
                    onChange={(event) => setConfigValue("catalog", "sort_order", Number(event.target.value))}
                  />
                  <small>Menores números podem ser priorizados por catálogos compatíveis.</small>
                </div>
              </div>

              <div className="item-toggle-grid">
                <label className="item-toggle-row">
                  <span>
                    <strong>Item em destaque</strong>
                    <small>Prioriza o item em áreas de destaque do Nexus.</small>
                  </span>
                  <span className="item-switch">
                    <input type="checkbox" {...register("is_featured")} />
                    <span aria-hidden="true" />
                  </span>
                </label>

                <Toggle
                  checked={catalog.online_purchase}
                  onChange={(checked) => setConfigValue("catalog", "online_purchase", checked)}
                  label="Permitir compra online"
                  hint="Habilita o item para fluxos de compra compatíveis."
                />

                <Toggle
                  checked={catalog.qr_enabled}
                  onChange={(checked) => setConfigValue("catalog", "qr_enabled", checked)}
                  label="Disponível no QR Code"
                  hint="Permite divulgar o item em experiências de catálogo por QR."
                />

                <Toggle
                  checked={catalog.share_enabled}
                  onChange={(checked) => setConfigValue("catalog", "share_enabled", checked)}
                  label="Permitir compartilhamento"
                  hint="Mantém ações de compartilhar disponíveis na página pública."
                />
              </div>
            </section>

            <section id="item-editor-seo" className="item-editor-card">
              <SectionTitle
                icon={FaSearch}
                title="SEO e compartilhamento"
                description="O Nexus preenche o essencial automaticamente. Personalize apenas quando precisar."
              />

              <div className="item-fields-grid">
                <div className="item-field item-field-span-2">
                  <label htmlFor="item-update-slug">Endereço público</label>
                  <div className="item-slug-input">
                    <span>/item/</span>
                    <input
                      id="item-update-slug"
                      type="text"
                      placeholder="nome-do-item"
                      {...register("slug", {
                        pattern: {
                          value: /^[a-zA-Z0-9_-]*$/,
                          message: "Use somente letras, números, hífen e sublinhado.",
                        },
                      })}
                    />
                  </div>
                  {publicPath && <small>Prévia: {publicPath}</small>}
                  <FieldError name="slug" errors={errors} apiErrors={apiErrors} />
                </div>

                <div className="item-field item-field-span-2">
                  <label htmlFor="item-seo-title">Título para busca</label>
                  <input
                    id="item-seo-title"
                    type="text"
                    maxLength={70}
                    value={seo.title || ""}
                    placeholder={name}
                    onChange={(event) => setConfigValue("seo", "title", event.target.value)}
                  />
                  <small>{(seo.title || "").length}/70 — vazio usa o nome do item automaticamente.</small>
                </div>

                <div className="item-field item-field-span-2">
                  <label htmlFor="item-seo-description">Descrição para busca</label>
                  <textarea
                    id="item-seo-description"
                    rows={3}
                    maxLength={180}
                    value={seo.description || ""}
                    placeholder={shortDescription || "Resumo do item para mecanismos de busca e compartilhamento."}
                    onChange={(event) => setConfigValue("seo", "description", event.target.value)}
                  />
                  <small>{(seo.description || "").length}/180</small>
                </div>

                <div className="item-field item-field-span-2">
                  <label htmlFor="item-og-image">Imagem social personalizada</label>
                  <input
                    id="item-og-image"
                    type="url"
                    value={seo.og_image || ""}
                    placeholder="Se vazio, a imagem principal será usada."
                    onChange={(event) => setConfigValue("seo", "og_image", event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section id="item-editor-advanced" className="item-editor-card">
              <SectionTitle
                icon={FaSlidersH}
                title="Configurações avançadas"
                description="Regras menos frequentes ficam separadas para manter a edição principal limpa."
              />

              <div className="item-toggle-grid">
                <label className="item-toggle-row">
                  <span>
                    <strong>Limitar por usuário</strong>
                    <small>Indica que este item possui regra de quantidade por cliente.</small>
                  </span>
                  <span className="item-switch">
                    <input type="checkbox" {...register("limited_by_user")} />
                    <span aria-hidden="true" />
                  </span>
                </label>
              </div>

              <div className="item-fields-grid item-subpanel-fields">
                <div className="item-field">
                  <label htmlFor="item-expiration-date">Data de expiração</label>
                  <input id="item-expiration-date" type="datetime-local" {...register("expiration_date")} />
                  <FieldError name="expiration_date" errors={errors} apiErrors={apiErrors} />
                </div>

                <div className="item-field item-field-span-2">
                  <label htmlFor="item-notes">Observações internas</label>
                  <textarea
                    id="item-notes"
                    rows={4}
                    placeholder="Informações administrativas que não precisam aparecer para o cliente."
                    {...register("notes")}
                  />
                  <FieldError name="notes" errors={errors} apiErrors={apiErrors} />
                </div>
              </div>
            </section>

            <section className="item-editor-card item-danger-zone">
              <div>
                <strong>Zona de risco</strong>
                <p>Para ocultar temporariamente, use o status Inativo. Exclua somente quando realmente não precisar mais deste item.</p>
              </div>
              <Button type="button" variant="outline-danger" onClick={onDelete} disabled={isSubmitting}>
                <FaTrash /> Excluir item
              </Button>
            </section>
          </main>

          <aside className="item-preview-column">
            <div className="item-live-preview">
              <div className="item-live-preview-label">Prévia no catálogo</div>
              <div className="item-live-preview-media">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={name}
                    style={{ objectPosition: "center " + focusY + "%" }}
                  />
                ) : (
                  <div className="item-live-initials">{initials(name)}</div>
                )}
                {watch("is_featured") && <span className="item-live-featured">Destaque</span>}
                {!status && <span className="item-live-hidden">Inativo</span>}
              </div>
              <div className="item-live-preview-body">
                <span className="item-live-category">{watch("category") || "Categoria"}</span>
                <h3>{name}</h3>
                <p>{shortDescription || watch("description") || "Adicione uma descrição para valorizar este item no catálogo."}</p>
                <div className="item-live-price-row">
                  {sale.enabled && saleDiscount > 0 && (
                    <span className="item-live-old-price">{formatPrice(price)}</span>
                  )}
                  <strong>{formatPrice(effectivePrice)}</strong>
                  {saleDiscount > 0 && <span className="item-live-discount">-{saleDiscount}%</span>}
                </div>
                <button type="button" className="item-live-cta" tabIndex="-1">
                  {type === "service" ? "Agendar" : type === "ticket" ? "Obter ingresso" : "Comprar"}
                </button>
              </div>
            </div>

            <div className="item-preview-tip">
              <strong>Qualidade do cadastro</strong>
              <ul>
                <li className={name.length >= 3 ? "is-complete" : ""}>Nome claro</li>
                <li className={Boolean(imagePreview) ? "is-complete" : ""}>Imagem principal</li>
                <li className={Boolean(shortDescription || watch("description")) ? "is-complete" : ""}>Descrição</li>
                <li className={parsePrice(price) >= 0 ? "is-complete" : ""}>Preço válido</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="item-sticky-savebar">
          <div>
            <strong>{hasPendingChanges ? "Há alterações para publicar" : "Item atualizado"}</strong>
            <small>
              {draftSavedAt
                ? "Rascunho automático protegido no navegador."
                : "Alterações publicadas ficam disponíveis no Nexus."}
            </small>
          </div>
          <div className="item-sticky-actions">
            <Button type="button" variant="outline-light" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="item-primary-action"
              disabled={isSubmitting || (hasLinkedImage && imageUrlStatus === "error")}
            >
              <FaSave /> {isSubmitting ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
