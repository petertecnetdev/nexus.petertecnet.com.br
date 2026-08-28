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
      if (created?.slug) navigate(`/establishment/item/${created.slug}`);
      else navigate("/establishment/my");
    },
  });

  return (
    <div className="establishment-root nexus-establishment-create">
      <GlobalNav />
      <main className="establishment-create-page">
        <div className="establishment-page-heading">
          <span>Primeiro passo</span>
          <h1>Cadastrar empresa</h1>
          <p>
            Informe apenas o essencial agora. Depois você poderá completar os dados,
            adicionar itens e compartilhar o catálogo.
          </p>
        </div>

        <EstablishmentCreateForm
          loading={loading}
          errors={errors}
          onSubmit={createEstablishment}
        />
      </main>
    </div>
  );
}
