// src/components/establishment/EstablishmentCreateForm.js
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Form, Badge } from "react-bootstrap";

import EstablishmentCreateFields from "./EstablishmentCreateFields";
import establishmentSegments from "../../constants/establishmentSegments";
import GlobalButton from "../GlobalButton";

import "../../pages/establishment/Establishment.css";

const onlyDigits = (value = "") => String(value).replace(/\D/g, "");

const formatCnpj = (value = "") => {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatCep = (value = "") => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const formatPhone = (value = "") => {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const buildAddress = ({ street, number, complement, neighborhood }) =>
  [street, number, complement, neighborhood]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

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
    getValues,
    watch,
    setError,
    clearErrors,
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
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState("");

  const watchedName = watch("name");
  const watchedDescription = watch("description");

  const safeSegments = useMemo(() => segments || [], [segments]);

  const handleImage = (file, setter, key) => {
    setter(URL.createObjectURL(file));
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const applyAddress = (
    { cep, street, number, complement, neighborhood, city, uf },
    { preserveExisting = false } = {}
  ) => {
    const current = getValues();
    const address = buildAddress({ street, number, complement, neighborhood });
    const formattedCep = formatCep(cep);

    if (formattedCep && (!preserveExisting || !current.cep)) {
      setValue("cep", formattedCep, { shouldDirty: true });
    }
    if (address && (!preserveExisting || !current.address)) {
      setValue("address", address, { shouldDirty: true });
    }
    if (city && (!preserveExisting || !current.city)) {
      setValue("city", city, { shouldDirty: true });
    }
    if (uf && (!preserveExisting || !current.uf)) {
      setValue("uf", String(uf).toUpperCase().slice(0, 2), { shouldDirty: true });
    }
  };

  const lookupCep = async (rawCep, { silent = false, preserveExisting = false } = {}) => {
    const cep = onlyDigits(rawCep);
    if (cep.length !== 8) {
      if (!silent) {
        setError("cep", { type: "manual", message: "Informe um CEP com 8 dígitos." });
      }
      return null;
    }

    clearErrors("cep");
    setCepLoading(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "CEP não encontrado.");

      applyAddress(
        {
          cep: data.cep || cep,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          uf: data.state,
        },
        { preserveExisting }
      );

      return data;
    } catch (error) {
      if (!silent) {
        setError("cep", { type: "manual", message: error.message || "CEP não encontrado." });
      }
      return null;
    } finally {
      setCepLoading(false);
    }
  };

  const lookupCnpj = async (rawCnpj, { silent = false } = {}) => {
    const cnpj = onlyDigits(rawCnpj);
    if (cnpj.length !== 14) {
      if (!silent) {
        setError("cnpj", { type: "manual", message: "Informe um CNPJ com 14 dígitos." });
      }
      return null;
    }

    clearErrors("cnpj");
    setCnpjStatus("");
    setCnpjLoading(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "CNPJ não encontrado.");

      const fantasy = String(data.nome_fantasia || "").trim();
      const corporateName = String(data.razao_social || "").trim();
      const displayName = fantasy || corporateName;
      const phone =
        data.ddd_telefone_1 ||
        data.telefone1 ||
        data.telefone ||
        data.ddd_telefone_2 ||
        "";
      const email = String(data.email || "").trim().toLowerCase();

      setValue("cnpj", formatCnpj(data.cnpj || cnpj), { shouldDirty: true });
      if (displayName) {
        setValue("name", displayName, { shouldDirty: true, shouldValidate: true });
        setValue("fantasy", fantasy || corporateName, { shouldDirty: true });
      }
      if (phone) setValue("phone", formatPhone(phone), { shouldDirty: true });
      if (email) setValue("email", email, { shouldDirty: true, shouldValidate: true });

      applyAddress({
        cep: data.cep,
        street: data.logradouro,
        number: data.numero,
        complement: data.complemento,
        neighborhood: data.bairro,
        city: data.municipio,
        uf: data.uf,
      });

      if (data.cep) {
        await lookupCep(data.cep, { silent: true, preserveExisting: true });
      }

      const situation = String(data.descricao_situacao_cadastral || "").trim();
      setCnpjStatus(
        situation && situation !== "ATIVA"
          ? `CNPJ localizado. Situação cadastral: ${situation}. Confira os dados antes de salvar.`
          : "CNPJ localizado. Os dados foram preenchidos automaticamente e continuam editáveis."
      );

      return data;
    } catch (error) {
      const message = error.message || "Não foi possível consultar este CNPJ.";
      setCnpjStatus("");
      setError("cnpj", { type: "manual", message });
      return null;
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleCnpjChange = (event) => {
    const formatted = formatCnpj(event.target.value);
    setValue("cnpj", formatted, { shouldDirty: true, shouldValidate: true });
    clearErrors("cnpj");
    setCnpjStatus("");
    if (onlyDigits(formatted).length === 14) {
      lookupCnpj(formatted, { silent: true });
    }
  };

  const handleCepChange = (event) => {
    const formatted = formatCep(event.target.value);
    setValue("cep", formatted, { shouldDirty: true, shouldValidate: true });
    clearErrors("cep");
    if (onlyDigits(formatted).length === 8) {
      lookupCep(formatted, { silent: true });
    }
  };

  const handleSegmentsChange = (e) => {
    const { value, checked } = e.target;
    const updated = checked
      ? Array.from(new Set([...segments, value]))
      : segments.filter((s) => s !== value);

    setSegments(updated);
    setValue("segments", updated, { shouldDirty: true });
  };

  const submit = async (data) => {
    const formData = new FormData();

    if (category) formData.append("category", category);
    if (type) formData.append("type", type);

    Object.entries(data).forEach(([key, value]) => {
      if (key === "segments") {
        safeSegments.forEach((s) => formData.append("segments[]", s));
      } else if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });

    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    await onSubmit(formData);
  };

  return (
    <>
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
            <h1>{watchedName || "Nome da Empresa"}</h1>
            <p>{watchedDescription || "Descrição aparecerá aqui..."}</p>

            {safeSegments.map((seg) => (
              <Badge key={seg} bg="warning" text="dark" className="me-1">
                {seg.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-center gap-3 my-4">
        <GlobalButton type="button" onClick={() => document.getElementById("logoInput")?.click()}>
          Upload Logo
        </GlobalButton>

        <GlobalButton type="button" onClick={() => document.getElementById("bgInput")?.click()}>
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

      <Form className="estab-form" onSubmit={handleSubmit(submit)}>
        <EstablishmentCreateFields
          register={register}
          segments={segments}
          segmentOptions={segmentOptions}
          handleSegmentsChange={handleSegmentsChange}
          handleCnpjChange={handleCnpjChange}
          handleCepChange={handleCepChange}
          cnpjLoading={cnpjLoading}
          cepLoading={cepLoading}
          cnpjStatus={cnpjStatus}
          isSubmitting={isSubmitting || loading}
          errors={errors}
        />

        <div className="estab-form-actions">
          <GlobalButton
            type="submit"
            size="lg"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading || cnpjLoading || cepLoading}
            rounded
          >
            Criar Empresa
          </GlobalButton>
        </div>
      </Form>
    </>
  );
}
