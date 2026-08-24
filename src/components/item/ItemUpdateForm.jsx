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
  backgroundPreview,
  onImageChange,
  onBackgroundChange,
  onRemoveImage,
  onSubmit,
}) {
  if (!item) return null;

  const type = watch("type");

  return (
    <>
      <GlobalHeroEditorPreview
        entity="item"
        title={item.name ?? ""}
        subtitle="Visualização da edição"
        logoPreview={imagePreview ?? null}
        backgroundPreview={backgroundPreview ?? null}
        data={item}
      />

      <div className="d-flex justify-content-center gap-3 my-3">
        <Button
          variant="secondary"
          className="action-button"
          type="button"
          onClick={() => document.getElementById("itemImageInput")?.click()}
        >
          Alterar Imagem
        </Button>

        {imagePreview && (
          <Button
            variant="secondary"
            className="action-button"
            type="button"
            onClick={onRemoveImage}
          >
            Remover Imagem
          </Button>
        )}
      </div>

      <Form.Control
        id="itemImageInput"
        type="file"
        accept="image/*"
        onChange={onImageChange}
        style={{ display: "none" }}
      />

      <div className="d-flex justify-content-center gap-3 mt-2">
        <Button
          variant="secondary"
          className="action-button"
          type="button"
          onClick={() => document.getElementById("itemBgInput")?.click()}
        >
          Alterar Background
        </Button>
      </div>

      <Form.Control
        id="itemBgInput"
        type="file"
        accept="image/*"
        onChange={onBackgroundChange}
        style={{ display: "none" }}
      />

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="gy-3 mt-3">
          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Nome*</label>
              <input type="text" {...register("name", { required: true })} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Tipo*</label>
              <select {...register("type", { required: true })}>
                <option value="service">Serviço</option>
                <option value="product">Produto</option>
              </select>
            </div>
          </Col>

          {type === "service" && (
            <Col xs={12} md={4} lg={2}>
              <div className="form-group">
                <label>Duração (min)*</label>
                <input type="number" min="1" {...register("duration", { required: true })} />
              </div>
            </Col>
          )}

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Preço*</label>
              <input type="text" inputMode="decimal" {...register("price", { required: true })} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={2}>
            <div className="form-group">
              <label>Estoque</label>
              <input type="number" min="0" {...register("stock")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Status</label>
              <select {...register("status")}>
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Limitar por usuário</label>
              <select {...register("limited_by_user")}>
                <option value="0">Não</option>
                <option value="1">Sim</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Categoria</label>
              <input type="text" {...register("category")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Subcategoria</label>
              <input type="text" {...register("subcategory")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Marca</label>
              <input type="text" {...register("brand")} />
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
