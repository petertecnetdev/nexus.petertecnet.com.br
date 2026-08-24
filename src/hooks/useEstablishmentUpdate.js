// src/hooks/useEstablishmentUpdate.js
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, storageUrl } from "../config";

export default function useEstablishmentUpdate(id, navigate, reset, setValue) {
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [slug, setSlug] = useState("");

  const resolveImage = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${storageUrl || apiBaseUrl.replace("/api", "")}/${img.replace(/^\//, "")}`;
  };

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/establishment/show/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;

        const est = res.data.establishment || {};

        reset({
          name: est.name || "",
          fantasy: est.fantasy || "",
          cnpj: est.cnpj || "",
          phone: est.phone || "",
          email: est.email || "",
          description: est.description || "",
          address: est.address || "",
          city: est.city || "",
          cep: est.cep || "",
          location: est.location || "",
          instagram_url: est.instagram_url || "",
          facebook_url: est.facebook_url || "",
          twitter_url: est.twitter_url || "",
          youtube_url: est.youtube_url || "",
          website_url: est.website_url || "",
        });

        setSegments(
          Array.isArray(est.segments)
            ? est.segments
            : est.segments
            ? JSON.parse(est.segments)
            : []
        );

        setLogoPreview(resolveImage(est.logo));
        setBackgroundPreview(resolveImage(est.background));
        setSlug(est.slug || "");
      } catch {
        Swal.fire("Erro", "Não foi possível carregar o estabelecimento.", "error");
        navigate("/dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id, navigate, reset]);

  const processAndResizeImage = (file, maxWidth, maxHeight, setPreview, key) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        return reject();
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const aspect = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(width / aspect);
          }
          if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * aspect);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataURL = canvas.toDataURL("image/png");
          setPreview(dataURL);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject();
              const resizedFile = new File([blob], "upload.png", { type: "image/png" });
              setFiles((prev) => ({ ...prev, [key]: resizedFile }));
              resolve();
            },
            "image/png",
            0.9
          );
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) await processAndResizeImage(file, 150, 150, setLogoPreview, "logo");
  };

  const handleBackgroundChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) await processAndResizeImage(file, 1920, 600, setBackgroundPreview, "background");
  };

  const handleSegmentsChange = (e) => {
    const { value, checked } = e.target;
    const updated = checked ? [...segments, value] : segments.filter((s) => s !== value);
    setSegments(updated);
    setValue("segments", updated);
  };

  const submitUpdate = async (dataInput) => {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("_method", "POST");

    Object.keys(dataInput).forEach((key) => {
      if (key === "segments") {
        segments.forEach((seg) => formData.append("segments[]", seg));
      } else {
        formData.append(key, dataInput[key] ?? "");
      }
    });

    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    try {
      const res = await axios.post(`${apiBaseUrl}/establishment/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Sucesso", res.data.message || "Atualizado com sucesso", "success").then(() => {
        const slugResp = res.data?.establishment?.slug || slug;
        navigate(`/establishment/view/${slugResp}`);
      });
    } catch (err) {
      let msg = "Ocorreu um erro ao atualizar o estabelecimento.";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.errors) msg = Object.values(data.errors).flat().join("\n");
        else if (data.error) msg = data.error;
        else if (data.message) msg = data.message;
      }
      Swal.fire("Erro", msg, "error");
    }
  };

  return {
    loading,
    segments,
    logoPreview,
    backgroundPreview,
    handleLogoChange,
    handleBackgroundChange,
    handleSegmentsChange,
    submitUpdate,
  };
}
