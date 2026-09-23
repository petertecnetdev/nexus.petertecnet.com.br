import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import ItemCreateForm from "../../components/item/ItemCreateForm";
import useItemCreate from "../../hooks/useItemCreate";
import { takeCatalogProfileFromForm } from "../../utils/catalogForm";

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
      type: "service",
      pricing_model: "fixed",
      sort_order: 100,
      is_quote_enabled: true,
      is_checkout_enabled: true,
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
  const handleCreate = (values) => submitCreate(takeCatalogProfileFromForm(values));

  return (
    <div className="item-root">
      <GlobalNav />

      {est && (
        <EstablishmentHero
          logo={est.logo}
          background={est.background}
          title={est.fantasy || est.name}
          subtitle="Adicionar item ao catálogo"
          description="Cadastre o item digitando ou falando. Antes de salvar, revise os campos reconhecidos para garantir nome, preço e demais informações."
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
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
