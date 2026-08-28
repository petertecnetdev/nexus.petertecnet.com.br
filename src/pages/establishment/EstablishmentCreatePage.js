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
      if (created?.slug) navigate(`/catalog/${created.slug}`);
      else navigate("/establishment/my");
    },
  });

  return (
    <div className="establishment-root nexus-establishment-create">
      <GlobalNav />
      <main className="establishment-create-page">
        <div className="establishment-page-heading">
          <span>Empresa e catálogo</span>
          <h1>Cadastrar empresa</h1>
          <p>Cadastre os dados da empresa, escolha a logo e a capa que serão exibidas no catálogo.</p>
        </div>

        <EstablishmentCreateForm
          category=""
          type=""
          loading={loading}
          errors={errors}
          onSubmit={createEstablishment}
        />
      </main>
    </div>
  );
}
