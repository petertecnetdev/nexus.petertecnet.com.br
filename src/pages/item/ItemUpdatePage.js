// src/pages/item/ItemUpdatePage.jsx
import { useEffect, useState } from "react";
import { Spinner, Alert, Container } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";

import GlobalNav from "../../components/GlobalNav";
import ItemUpdateForm from "../../components/item/ItemUpdateForm";
import useItemUpdate from "../../hooks/useItemUpdate";
import { apiBaseUrl } from "../../config";

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
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/item/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data?.item ?? res.data;
        setItem(data);

        reset({
          name: data.name ?? "",
          type: data.type ?? "",
          price: data.price ?? "",
          stock: data.stock ?? "",
          status: !!data.status,
          duration: data.duration ?? "",
          description: data.description ?? "",
          is_featured: !!data.is_featured,
          limited_by_user: !!data.limited_by_user,
        });

        const img = data.files?.find(
          (f) => f.entity_name === "item" && f.type === "image"
        );
        if (img?.public_url) setImagePreview(img.public_url);
      } catch {
        setApiError("Erro ao carregar item.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
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
    const res = await updateItem(values, imageFile, removeImage);
    if (res) navigate(-1);
  };

  return (
    <>
      <GlobalNav />

      {loading && (
        <div className="d-flex justify-content-center my-5">
          <Spinner />
        </div>
      )}

      {!loading && apiError && (
        <Container className="my-4">
          <Alert variant="danger">{apiError}</Alert>
        </Container>
      )}

      {!loading && item && (
        <ItemUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          watch={watch}
          item={item}
          imagePreview={imagePreview}
          apiErrors={apiErrors}
          saving={saving}
          onSubmit={onSubmit}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
        />
      )}
    </>
  );
}
