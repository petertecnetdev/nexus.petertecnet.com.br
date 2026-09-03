import React from "react";
import { Col, Alert } from "react-bootstrap";

const UNITS = ["un", "mm", "cm", "m", "ml", "l", "g", "kg", "pct", "cx", "rolo", "par"];

export default function CatalogSpecificationFields({ register, watch }) {
  const name = String(watch("name") || "").toLowerCase();
  const category = String(watch("category") || "").toLowerCase();
  const context = `${name} ${category}`;

  const needsDimensions = /(telha|manta|lona|cobre tudo|cobretudo)/.test(context);
  const needsPackage = /(tinta|verniz|esmalte|primer|selador|silicone|selante|adesivo|cola)/.test(context);
  const needsFastener = /(parafuso|porca|arruela|bucha|prego)/.test(context);

  return (
    <>
      <Col xs={12}>
        <div className="catalog-specs-heading">
          <div>
            <strong>Identificação e especificações</strong>
            <div className="text-body-secondary small">
              Essas informações alimentam filtros, busca, qualidade do catálogo e identificação de produtos repetidos.
            </div>
          </div>
        </div>
      </Col>

      {(needsDimensions || needsPackage || needsFastener) && (
        <Col xs={12}>
          <Alert variant="info" className="mb-0">
            {needsDimensions && "Para este tipo de produto, informe as dimensões."}
            {needsPackage && "Para este tipo de produto, informe a quantidade e a unidade da embalagem."}
            {needsFastener && "Para este tipo de produto, informe diâmetro e comprimento."}
          </Alert>
        </Col>
      )}

      <Col xs={12} md={4}>
        <div className="form-group">
          <label htmlFor="item-gtin">EAN / GTIN</label>
          <input id="item-gtin" inputMode="numeric" autoComplete="off" placeholder="Código de barras" {...register("gtin")} />
        </div>
      </Col>

      <Col xs={12} md={4}>
        <div className="form-group">
          <label htmlFor="item-sale-unit">Unidade de venda</label>
          <select id="item-sale-unit" {...register("sale_unit")} defaultValue="un">
            {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>
      </Col>

      <Col xs={6} md={2}>
        <div className="form-group">
          <label htmlFor="item-package-quantity">Conteúdo</label>
          <input id="item-package-quantity" type="number" step="0.001" min="0" placeholder="Ex.: 280" {...register("package_quantity")} />
        </div>
      </Col>

      <Col xs={6} md={2}>
        <div className="form-group">
          <label htmlFor="item-package-unit">Unidade</label>
          <select id="item-package-unit" {...register("package_unit")} defaultValue="">
            <option value="">Selecione</option>
            {UNITS.filter((unit) => unit !== "un").map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>
      </Col>

      {[
        ["spec_length", "Comprimento", "Ex.: 55 cm"],
        ["spec_width", "Largura", "Ex.: 20 cm"],
        ["spec_height", "Altura", "Ex.: 10 cm"],
        ["spec_diameter", "Diâmetro", "Ex.: 8 mm"],
        ["spec_thickness", "Espessura", "Ex.: 4 mm"],
        ["spec_color", "Cor", "Ex.: Branco"],
        ["spec_finish", "Acabamento", "Ex.: Fosco"],
        ["spec_material", "Material", "Ex.: Fibrocimento"],
        ["spec_application", "Aplicação", "Ex.: Uso externo"],
      ].map(([field, label, placeholder]) => (
        <Col key={field} xs={12} sm={6} md={4}>
          <div className="form-group">
            <label htmlFor={`item-${field}`}>{label}</label>
            <input id={`item-${field}`} type="text" autoComplete="off" placeholder={placeholder} {...register(field)} />
          </div>
        </Col>
      ))}
    </>
  );
}
