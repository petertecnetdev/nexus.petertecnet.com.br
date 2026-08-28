// src/components/item/ItemUpdateForm.jsx
import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import "./ItemUpdateForm.css";

export default function ItemUpdateForm({
  register,
  handleSubmit,
  watch,
  isSubmitting,
  item,
  imagePreview,
  onImageChange,
  onRemoveImage,
  onSubmit,
}) {
  if (!item) return null;

  const type = watch("type");

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
          Alterar imagem
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
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Salvando…" : "Salvar alterações"}
            </button>
          </Col>
        </Row>
      </Form>
    </>
  );
}
