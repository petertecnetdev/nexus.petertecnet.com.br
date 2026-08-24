// src/pages/establishment/EstablishmentCreatePage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import EstablishmentCreateForm from "../../components/establishment/EstablishmentCreateForm";
import useEstablishmentCreate from "../../hooks/useEstablishmentCreate";
import { appId } from "../../config";
import "./EstablishmentCreate.css";

export default function EstablishmentCreatePage() {
  const navigate = useNavigate();

  const { loading, errors, createEstablishment } = useEstablishmentCreate({
    appId,
    onSuccess: (created) => {
      if (created?.slug) {
        navigate(`/establishment/view/${created.slug}`);
      } else {
        navigate("/establishment");
      }
    },
  });

  return (
    <div className="establishment-root">
      <GlobalNav />

      <div className="establishment-create-page">
        <h2 className="title mb-3">Criar Estabelecimento</h2>

        <EstablishmentCreateForm
          category="tattoo_studio"
          type=""
          loading={loading}
          errors={errors}
          onSubmit={createEstablishment}
        />
      </div>
    </div>
  );
}
