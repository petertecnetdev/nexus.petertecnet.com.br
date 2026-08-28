import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";

const imageFrom = (establishment, type) => {
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  return (
    files.find((file) => file?.type === type)?.public_url ||
    establishment?.images?.[type] ||
    establishment?.[type] ||
    null
  );
};

const parseSegments = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
};

const apiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (payload?.errors && typeof payload.errors === "object") {
    const messages = Object.values(payload.errors).flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean);
    if (messages.length) return messages.join("\n");
  }
  return payload?.message || payload?.error || error?.message || fallback;
};

export default function useEstablishmentUpdate(id, navigate, reset, setValue) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        // A rota view carrega também os arquivos (logo/background), ao contrário da show antiga.
        const { data } = await api.get(`/establishment/view/${encodeURIComponent(id)}`);
        if (!active) return;

        const est = data?.establishment || data || {};
        const currentSegments = parseSegments(est.segments);

        reset({
          name: est.name || "",
          fantasy: est.fantasy || "",
          cnpj: est.cnpj || "",
          phone: est.phone || "",
          email: est.email || "",
          description: est.description || "",
          additional_info: est.additional_info || "",
          address: est.address || "",
          city: est.city || "",
          uf: est.uf || "",
          cep: est.cep || "",
          location: est.location || "",
          instagram_url: est.instagram_url || "",
          facebook_url: est.facebook_url || "",
          twitter_url: est.twitter_url || "",
          youtube_url: est.youtube_url || "",
          website_url: est.website_url || "",
          segments: currentSegments,
        });

        setSegments(currentSegments);
        setValue("segments", currentSegments, { shouldDirty: false });
        setLogoPreview(imageFrom(est, "logo"));
        setBackgroundPreview(imageFrom(est, "background"));
        setSlug(est.slug || "");
      } catch (error) {
        await Swal.fire("Não foi possível carregar a empresa", apiErrorMessage(error, "Verifique a conexão e tente novamente."), "error");
        navigate("/establishment/my");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [id, navigate, reset, setValue]);

  const processImage = (file, width, height, setPreview, key) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type?.startsWith("image/")) return reject(new Error("Selecione uma imagem válida."));
      if (file.size > 10 * 1024 * 1024) return reject(new Error("A imagem deve ter no máximo 10 MB."));

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("O navegador não conseguiu processar a imagem."));

          const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
          const drawWidth = img.naturalWidth * scale;
          const drawHeight = img.naturalHeight * scale;
          context.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

          setPreview(canvas.toDataURL("image/jpeg", 0.9));
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Não foi possível converter a imagem."));
            const converted = new File([blob], `${key}.jpg`, { type: "image/jpeg" });
            setFiles((previous) => ({ ...previous, [key]: converted }));
            resolve(converted);
          }, "image/jpeg", 0.9);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await processImage(file, 512, 512, setLogoPreview, "logo"); }
    catch (error) { await Swal.fire("Erro na logo", error.message, "error"); }
    finally { event.target.value = ""; }
  };

  const handleBackgroundChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await processImage(file, 1920, 600, setBackgroundPreview, "background"); }
    catch (error) { await Swal.fire("Erro na capa", error.message, "error"); }
    finally { event.target.value = ""; }
  };

  const handleSegmentsChange = (event) => {
    const { value, checked } = event.target;
    const updated = checked ? Array.from(new Set([...segments, value])) : segments.filter((segment) => segment !== value);
    setSegments(updated);
    setValue("segments", updated, { shouldDirty: true });
  };

  const submitUpdate = async (dataInput) => {
    if (saving) return;
    setSaving(true);

    const formData = new FormData();
    Object.entries(dataInput || {}).forEach(([key, value]) => {
      if (key === "segments") return;
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    segments.forEach((segment) => formData.append("segments[]", segment));
    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    try {
      const { data } = await api.post(`/establishment/${id}`, formData);
      await Swal.fire("Empresa atualizada", data?.message || "Alterações salvas com sucesso.", "success");
      navigate(`/catalog/${data?.establishment?.slug || slug}`);
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Não foi possível salvar", text: apiErrorMessage(error, "Ocorreu um erro ao atualizar a empresa."), confirmButtonText: "Corrigir dados" });
    } finally {
      setSaving(false);
    }
  };

  return { loading, saving, segments, logoPreview, backgroundPreview, handleLogoChange, handleBackgroundChange, handleSegmentsChange, submitUpdate };
}
