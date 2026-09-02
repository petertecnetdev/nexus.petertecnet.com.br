// src/pages/item/ItemUpdatePage.jsx
import { useEffect, useState } from "react";
import { Alert, Container } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import GlobalNav from "../../components/GlobalNav";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import ItemUpdateForm from "../../components/item/ItemUpdateForm";
import useItemUpdate from "../../hooks/useItemUpdate";
import api from "../../services/api";
import { appId } from "../../config";

export default function ItemUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const form = useForm();
  const { register, handleSubmit, reset, watch } = form;

  const { updateItem, loading: saving, apiErrors } = useItemUpdate(id);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setApiError(null);

        const { data: response } = await api.get(`/item/${encodeURIComponent(id)}`, {
          params: { app_id: appId },
          signal: controller.signal,
        });

        const data = response?.item ?? response;
        if (!data?.id) throw new Error("Item não encontrado.");
        if (data.app_id != null && Number(data.app_id) !== Number(appId)) {
          throw new Error("Este item não pertence à Nexus.");
        }

        setItem(data);
        reset({
          name: data.name ?? "",
          type: data.type ?? "",
          price: data.price ?? "",
          stock: data.stock ?? "",
          status: Number(data.status ?? 1),
          duration: data.duration ?? "",
          description: data.description ?? "",
          category: data.category ?? "",
          subcategory: data.subcategory ?? "",
          brand: data.brand ?? "",
          is_featured: Number(data.is_featured ?? 0),
        });

        const img = data.files?.find(
          (file) => file.entity_name === "item" && file.type === "image"
        );
        setImagePreview(img?.public_url || data.image_url || data.image || null);
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        setApiError(
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Erro ao carregar item."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id, reset]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setRemoveImage(false);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const onSubmit = async (values) => {
    const response = await updateItem(values, imageFile, removeImage);
    if (!response) return;

    const updatedItem = response?.item ?? response?.data ?? null;
    const slug = updatedItem?.slug || item?.slug;

    if (slug) {
      navigate(`/item/${encodeURIComponent(slug)}`, { replace: true });
      return;
    }

    navigate("/establishment/my", { replace: true });
  };

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando item…", "Preparando a edição…"]}
      />
    );
  }

  return (
    <>
      <GlobalNav />

      {apiError && (
        <Container className="my-4">
          <Alert variant="danger">{apiError}</Alert>
        </Container>
      )}

      {!apiError && item && (
        <ItemUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          watch={watch}
          item={item}
          imagePreview={imagePreview}
          apiErrors={apiErrors}
          isSubmitting={saving}
          onSubmit={onSubmit}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
        />
      )}
    </>
  );
}
