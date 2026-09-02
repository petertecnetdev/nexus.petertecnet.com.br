// src/components/item/ItemUpdateForm.jsx
import React from "react";
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import "./ItemUpdateForm.css";

export default function ItemUpdateForm({
  register,
  handleSubmit,
  watch,
  isSubmitting,
  item,
  imagePreview,
  imageUrl,
  imageUrlStatus,
  onImageChange,
  onImageUrlChange,
  onImageUrlLoad,
  onImageUrlError,
  onRemoveImage,
  onSubmit,
}) {
  if (!item) return null;

  const type = watch("type");
  const hasLinkedImage = Boolean(imageUrl?.trim());

  return (
    <>
      <GlobalHeroEditorPreview
        entity="item"
        title={watch("name") || item.name || "Item"}
        subtitle="Prévia da edição"
        logoPreview={imagePreview || null}
        data={{ ...item, name: watch("name") || item.name }}
      />

      <div className="d-flex justify-content-center gap-3 my-3 flex-wrap">
        <Button
          variant="secondary"
          className="action-button"
          type="button"
          disabled={isSubmitting}
          onClick={() => document.getElementById("itemImageInput")?.click()}
        >
          Enviar imagem
        </Button>

        {imagePreview && (
          <Button
            variant="secondary"
            className="action-button"
            type="button"
            disabled={isSubmitting}
            onClick={onRemoveImage}
          >
            Remover imagem
          </Button>
        )}
      </div>

      <Form.Control
        id="itemImageInput"
        type="file"
        accept="image/*"
        onChange={onImageChange}
        disabled={isSubmitting}
        className="visually-hidden"
      />

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Row className="gy-3 mt-3">
          <Col xs={12}>
            <div className="form-group">
              <label htmlFor="item-update-image-url">Ou use o endereço de uma imagem</label>
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
              <small className="d-block mt-2 text-body-secondary">
                Cole um link público HTTPS/HTTP. A prévia aparece antes de você salvar.
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
                  onLoad={onImageUrlLoad}
                  onError={onImageUrlError}
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
              <label htmlFor="item-update-name">Nome*</label>
              <input
                id="item-update-name"
                type="text"
                {...register("name", { required: true })}
                required
              />
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-update-type">Tipo</label>
              <select id="item-update-type" {...register("type")}>
                <option value="">Item genérico</option>
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-update-price">Preço</label>
              <input
                id="item-update-price"
                type="text"
                inputMode="decimal"
                {...register("price")}
              />
            </div>
          </Col>

          {type === "service" && (
            <Col xs={12} md={4}>
              <div className="form-group">
                <label htmlFor="item-update-duration">Duração em minutos</label>
                <input id="item-update-duration" type="number" min="1" {...register("duration")} />
              </div>
            </Col>
          )}

          {type === "product" && (
            <Col xs={12} md={4}>
              <div className="form-group">
                <label htmlFor="item-update-stock">Estoque</label>
                <input id="item-update-stock" type="number" min="0" {...register("stock")} />
              </div>
            </Col>
          )}

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-update-status">Status</label>
              <select id="item-update-status" {...register("status")}>
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-update-category">Categoria</label>
              <input id="item-update-category" type="text" {...register("category")} />
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-update-subcategory">Subcategoria</label>
              <input id="item-update-subcategory" type="text" {...register("subcategory")} />
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-update-brand">Marca ou referência</label>
              <input id="item-update-brand" type="text" {...register("brand")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label htmlFor="item-update-description">Descrição</label>
              <textarea id="item-update-description" rows={5} {...register("description")} />
            </div>
          </Col>

          <Col xs={12} className="text-end">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || (hasLinkedImage && imageUrlStatus === "error")}
            >
              {isSubmitting ? "Salvando…" : "Salvar alterações"}
            </button>
          </Col>
        </Row>
      </Form>
    </>
  );
}
