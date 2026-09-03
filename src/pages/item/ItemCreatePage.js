import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import ItemCreateForm from "../../components/item/ItemCreateForm";
import useItemCreate from "../../hooks/useItemCreate";

export default function ItemCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const establishmentFromState = location.state?.establishment || null;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      status: 1,
      availability: "available",
      type: "product",
      sale_unit: "un",
    },
  });

  const {
    loading,
    establishment,
    submitCreate,
  } = useItemCreate(navigate, reset, setValue, establishmentFromState);

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Preparando o cadastro…", "Carregando sua empresa…"]}
      />
    );
  }

  const est = establishmentFromState || establishment;

  return (
    <div className="item-root">
      <GlobalNav />

      {est && (
        <EstablishmentHero
          logo={est.logo}
          background={est.background}
          title={est.fantasy || est.name}
          subtitle="Adicionar item ao catálogo"
          description="Cadastre digitando ou falando. A Nexus também organiza medidas, volume, EAN e demais especificações para reduzir erros e retrabalho."
          city={est.city}
          uf={est.uf}
          showBack
        />
      )}

      <div className="item-create-page container mt-4">
        <ItemCreateForm
          register={register}
          handleSubmit={handleSubmit}
          setValue={setValue}
          watch={watch}
          isSubmitting={isSubmitting || loading}
          onSubmit={submitCreate}
        />
      </div>
    </div>
  );
}
