import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentUpdateForm from "../../components/establishment/EstablishmentUpdateForm";
import useEstablishmentUpdate from "../../hooks/useEstablishmentUpdate";
import "./EstablishmentUpdate.css";

export default function EstablishmentUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      fantasy: "",
      cnpj: "",
      phone: "",
      email: "",
      description: "",
      additional_info: "",
      address: "",
      city: "",
      uf: "",
      cep: "",
      location: "",
      instagram_url: "",
      facebook_url: "",
      twitter_url: "",
      youtube_url: "",
      website_url: "",
      segments: [],
    },
  });

  const {
    loading,
    saving,
    segments,
    logoPreview,
    backgroundPreview,
    handleLogoChange,
    handleBackgroundChange,
    handleSegmentsChange,
    submitUpdate,
  } = useEstablishmentUpdate(id, navigate, reset, setValue);

  return (
    <div className="establishment-root nexus-establishment-editor">
      <GlobalNav />
      <main className="establishment-create-page">
        <div className="establishment-page-heading">
          <span>Empresa e catálogo</span>
          <h1>Editar empresa</h1>
          <p>Confira os dados atuais e altere somente o que precisar.</p>
        </div>

        {loading ? (
          <div className="establishment-editor-loading">Carregando dados da empresa…</div>
        ) : (
          <EstablishmentUpdateForm
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            isSubmitting={isSubmitting || saving}
            segments={segments}
            logoPreview={logoPreview}
            backgroundPreview={backgroundPreview}
            handleLogoChange={handleLogoChange}
            handleBackgroundChange={handleBackgroundChange}
            handleSegmentsChange={handleSegmentsChange}
            onSubmit={submitUpdate}
            watch={watch}
          />
        )}
      </main>
    </div>
  );
}
