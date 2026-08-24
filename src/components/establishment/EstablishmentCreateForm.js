// src/components/establishment/EstablishmentCreateForm.jsx
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Form, Badge } from "react-bootstrap";

import EstablishmentCreateFields from "./EstablishmentCreateFields";
import establishmentSegments from "../../constants/establishmentSegments";
import GlobalButton from "../GlobalButton";

import "../../pages/establishment/Establishment.css";

export default function EstablishmentCreateForm({
  category,
  type,
  segmentOptions = establishmentSegments,
  onSubmit,
  loading,
  errors,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
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
      website_url: "",
      instagram_url: "",
      facebook_url: "",
      twitter_url: "",
      youtube_url: "",
      segments: [],
    },
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});

  const watchedName = watch("name");
  const watchedDescription = watch("description");

  const safeSegments = useMemo(() => segments || [], [segments]);

  const handleImage = (file, setter, key) => {
    setter(URL.createObjectURL(file));
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSegmentsChange = (e) => {
    const { value, checked } = e.target;
    const updated = checked
      ? [...segments, value]
      : segments.filter((s) => s !== value);

    setSegments(updated);
    setValue("segments", updated);
  };

  const submit = async (data) => {
    const formData = new FormData();

    formData.append("category", category);
    formData.append("type", type);

    Object.entries(data).forEach(([key, value]) => {
      if (key === "segments") {
        safeSegments.forEach((s) => formData.append("segments[]", s));
      } else {
        formData.append(key, value ?? "");
      }
    });

    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    await onSubmit(formData);
  };

  return (
    <>
      {/* HERO */}
      <div className="estab-hero">
        <div className="estab-hero-inner">
          <div className="estab-logo-bubble">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="estab-logo" />
            ) : (
              <span className="estab-logo-placeholder">LOGO</span>
            )}
          </div>

          <div className="estab-info-block">
            <h1>{watchedName || "Nome do Estabelecimento"}</h1>
            <p>{watchedDescription || "Descrição aparecerá aqui..."}</p>

            {safeSegments.map((seg) => (
              <Badge key={seg} bg="warning" text="dark" className="me-1">
                {seg.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* UPLOADS */}
      <div className="d-flex justify-content-center gap-3 my-4">
        <GlobalButton onClick={() => document.getElementById("logoInput").click()}>
          Upload Logo
        </GlobalButton>

        <GlobalButton onClick={() => document.getElementById("bgInput").click()}>
          Upload Background
        </GlobalButton>
      </div>

      <input
        id="logoInput"
        type="file"
        hidden
        accept="image/*"
        onChange={(e) =>
          e.target.files?.[0] &&
          handleImage(e.target.files[0], setLogoPreview, "logo")
        }
      />

      <input
        id="bgInput"
        type="file"
        hidden
        accept="image/*"
        onChange={(e) =>
          e.target.files?.[0] &&
          handleImage(e.target.files[0], setBackgroundPreview, "background")
        }
      />

      {/* FORM ÚNICO */}
      <Form onSubmit={handleSubmit(submit)}>
        <EstablishmentCreateFields
          register={register}
          segments={segments}
          segmentOptions={segmentOptions}
          handleSegmentsChange={handleSegmentsChange}
          isSubmitting={isSubmitting || loading}
          errors={errors}
        />

        <div className="estab-form-actions">
          <GlobalButton
            type="submit"
            size="lg"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
            rounded
          >
            Criar Estabelecimento
          </GlobalButton>
        </div>
      </Form>
    </>
  );
}
