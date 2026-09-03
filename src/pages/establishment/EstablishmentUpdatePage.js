import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentUpdateForm from "../../components/establishment/EstablishmentUpdateForm";
import useEstablishmentUpdate from "../../hooks/useEstablishmentUpdate";
import "./EstablishmentUpdate.css";

const EMPTY_HOURS = {
  monday: { enabled: true, open: "09:00", close: "18:00" },
  tuesday: { enabled: true, open: "09:00", close: "18:00" },
  wednesday: { enabled: true, open: "09:00", close: "18:00" },
  thursday: { enabled: true, open: "09:00", close: "18:00" },
  friday: { enabled: true, open: "09:00", close: "18:00" },
  saturday: { enabled: false, open: "09:00", close: "13:00" },
  sunday: { enabled: false, open: "09:00", close: "13:00" },
};

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
      profile_settings: {
        cover_position_y: 50,
        primary_cta: "catalog",
        capabilities: ["catalog", "contact"],
        payment_methods: [],
        business_hours: EMPTY_HOURS,
      },
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
          <p>Atualize os dados e controle como sua empresa aparece publicamente na Nexus.</p>
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
