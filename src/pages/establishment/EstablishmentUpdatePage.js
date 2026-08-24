import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import EstablishmentUpdateForm from "../../components/establishment/EstablishmentUpdateForm";
import useEstablishmentUpdate from "../../hooks/useEstablishmentUpdate";

export default function EstablishmentUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const {
    loading,
    segments,
    logoPreview,
    backgroundPreview,
    handleLogoChange,
    handleBackgroundChange,
    handleSegmentsChange,
    submitUpdate,
  } = useEstablishmentUpdate(id, navigate, reset, setValue);

  if (loading) return <NavlogComponent />;

  return (
    <div className="establishment-root">
      <NavlogComponent />

      <div className="establishment-create-page">
        <h2 className="title mb-3">Editar Estabelecimento</h2>

        <EstablishmentUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          segments={segments}
          logoPreview={logoPreview}
          backgroundPreview={backgroundPreview}
          handleLogoChange={handleLogoChange}
          handleBackgroundChange={handleBackgroundChange}
          handleSegmentsChange={handleSegmentsChange}
          onSubmit={submitUpdate}
        />
      </div>
    </div>
  );
}
