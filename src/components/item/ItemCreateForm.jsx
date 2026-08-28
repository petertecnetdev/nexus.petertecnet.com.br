// src/components/item/ItemCreateForm.jsx
import React, { useState } from "react";
import { Row, Col, Form } from "react-bootstrap";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import GlobalImageUploader from "../GlobalImageUploader";
import { appId } from "../../config";
import "./ItemCreateForm.css";

export default function ItemCreateForm({
  register,
  handleSubmit,
  watch,
  isSubmitting,
  onSubmit,
}) {
  const type = watch("type");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      image: imageFile || undefined,
    });
  };

  return (
    <>
      <GlobalHeroEditorPreview
        entity="item"
        title={watch("name") || "Novo item"}
        subtitle="Prévia do item"
        logoPreview={imagePreview}
        data={{ name: watch("name") }}
      />

      <GlobalImageUploader
        onChange={setImageFile}
        onPreview={setImagePreview}
        maxResolution={1200}
        addLabel="Adicionar imagem"
        removeLabel="Remover imagem"
        disabled={isSubmitting}
      />

      <Form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <input type="hidden" value={appId} {...register("app_id")} />

        <Row className="gy-3 mt-3">
          <Col xs={12} md={8}>
            <div className="form-group">
              <label htmlFor="item-name">Nome*</label>
              <input
                id="item-name"
                type="text"
                autoComplete="off"
                {...register("name", { required: true })}
                required
              />
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-type">Tipo</label>
              <select id="item-type" {...register("type")}>
                <option value="">Item genérico</option>
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="form-group">
              <label htmlFor="item-price">Preço</label>
              <input
                id="item-price"
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 49,90"
                {...register("price")}
              />
            </div>
          </Col>

          {type === "service" && (
            <Col xs={12} md={4}>
              <div className="form-group">
                <label htmlFor="item-duration">Duração em minutos</label>
                <input
                  id="item-duration"
                  type="number"
                  min="1"
                  {...register("duration")}
                />
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
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-category">Categoria</label>
              <input id="item-category" type="text" {...register("category")} />
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-subcategory">Subcategoria</label>
              <input id="item-subcategory" type="text" {...register("subcategory")} />
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="form-group">
              <label htmlFor="item-brand">Marca ou referência</label>
              <input id="item-brand" type="text" {...register("brand")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label htmlFor="item-description">Descrição</label>
              <textarea
                id="item-description"
                rows={5}
                placeholder="Descreva o item com as informações relevantes para o cliente."
                {...register("description")}
              />
            </div>
          </Col>

          <Col xs={12} className="text-end">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando…" : "Criar item"}
            </button>
          </Col>
        </Row>
      </Form>
    </>
  );
}
