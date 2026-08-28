// src/components/establishment/EstablishmentCreateForm.js
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-bootstrap";

import EstablishmentCreateFields from "./EstablishmentCreateFields";
import GlobalButton from "../GlobalButton";

import "../../pages/establishment/Establishment.css";

export default function EstablishmentCreateForm({ onSubmit, loading, errors }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      fantasy: "",
      phone: "",
      email: "",
      description: "",
      city: "",
      uf: "",
    },
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [files, setFiles] = useState({});

  const watchedName = watch("name");
  const watchedDescription = watch("description");

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith?.("blob:")) URL.revokeObjectURL(logoPreview);
      if (backgroundPreview?.startsWith?.("blob:")) URL.revokeObjectURL(backgroundPreview);
    };
  }, [logoPreview, backgroundPreview]);

  const handleImage = (file, setter, key) => {
    if (!file) return;
    setter((previous) => {
      if (previous?.startsWith?.("blob:")) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
    setFiles((previous) => ({ ...previous, [key]: file }));
  };

  const submit = async (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      const normalized = typeof value === "string" ? value.trim() : value;
      if (normalized !== undefined && normalized !== null && normalized !== "") {
        formData.append(key, normalized);
      }
    });

    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    await onSubmit(formData);
  };

  const heroStyle = backgroundPreview
    ? {
        backgroundImage: `linear-gradient(rgba(5, 14, 11, 0.7), rgba(5, 14, 11, 0.9)), url("${backgroundPreview}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const disabled = isSubmitting || loading;

  return (
    <>
      <div className="estab-hero" style={heroStyle}>
        <div className="estab-hero-inner">
          <div className="estab-logo-bubble">
            {logoPreview ? (
              <img src={logoPreview} alt="Prévia da logo" className="estab-logo" />
            ) : (
              <span className="estab-logo-placeholder">LOGO</span>
            )}
          </div>

          <div className="estab-info-block">
            <h1>{watchedName || "Nome da empresa"}</h1>
            <p>{watchedDescription || "A descrição do catálogo aparecerá aqui."}</p>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-center gap-3 my-4 flex-wrap">
        <GlobalButton
          type="button"
          disabled={disabled}
          onClick={() => document.getElementById("logoInput")?.click()}
        >
          Adicionar logo
        </GlobalButton>

        <GlobalButton
          type="button"
          disabled={disabled}
          onClick={() => document.getElementById("bgInput")?.click()}
        >
          Adicionar capa
        </GlobalButton>
      </div>

      <input
        id="logoInput"
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => handleImage(event.target.files?.[0], setLogoPreview, "logo")}
      />

      <input
        id="bgInput"
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => handleImage(event.target.files?.[0], setBackgroundPreview, "background")}
      />

      <Form className="estab-form" onSubmit={handleSubmit(submit)} noValidate>
        <EstablishmentCreateFields
          register={register}
          isSubmitting={disabled}
          errors={errors}
        />

        <div className="estab-form-actions">
          <GlobalButton
            type="submit"
            size="lg"
            loading={disabled}
            disabled={disabled}
            rounded
          >
            Criar empresa
          </GlobalButton>
        </div>
      </Form>
    </>
  );
}
