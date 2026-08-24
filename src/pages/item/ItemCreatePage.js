import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
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
  } = useForm();

  const {
    loading,
    establishment,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitCreate,
  } = useItemCreate(
    navigate,
    reset,
    setValue,
    establishmentFromState
  );

  if (loading) return <GlobalNav />;

  const est = establishmentFromState || establishment;

  return (
    <div className="item-root">
      <GlobalNav />

      {est && (
        <EstablishmentHero
          logo={est.logo}
          background={est.background}
          title={est.fantasy || est.name}
          subtitle="Criar novo item"
          description="Cadastre produtos ou serviços do estabelecimento. Serviços exigem tempo de duração, utilizado no cálculo automático do tempo das ordens de serviço."
          city={est.city}
          uf={est.uf}
          showBack
        />
      )}

      <div className="item-create-page container mt-4">
        <ItemCreateForm
          register={register}
          handleSubmit={handleSubmit}
          watch={watch}
          isSubmitting={isSubmitting}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          handleRemoveImage={handleRemoveImage}
          onSubmit={submitCreate}
        />
      </div>
    </div>
  );
}
