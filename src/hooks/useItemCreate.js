// src/hooks/useItemCreate.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../config";

export default function useItemCreate(
  navigate,
  reset,
  setValue,
  establishmentFromState = null
) {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null);
  const [establishment, setEstablishment] = useState(null);

  useEffect(() => {
    let active = true;

    const setupFromEstablishment = (est) => {
      setEstablishment(est);
      setValue("app_id", appId);
      setValue("entity_id", est.id);
      setValue("entity_name", "establishment");
      setValue("status", true);
    };

    (async () => {
      if (establishmentFromState?.id) {
        setupFromEstablishment(establishmentFromState);
        setLoading(false);
        return;
      }

      if (!slug) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Estabelecimento não identificado.",
        }).then(() => navigate(-1));
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!active) return;

        const est = res.data?.establishment;

        if (!est?.id) {
          throw new Error("Estabelecimento inválido");
        }

        setupFromEstablishment(est);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Erro ao identificar o estabelecimento.",
        }).then(() => navigate(-1));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug, navigate, setValue, establishmentFromState]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImage(null);
    setImagePreview(null);
    setValue("image", null);
  }

  async function submitCreate(data) {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      if (image) {
        formData.append("image", image);
      }

      const { data: response } = await axios.post(
        `${apiBaseUrl}/item`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: response.message,
      }).then(() => {
        reset();
        if (establishment?.slug) {
          navigate(`/establishment/item/${establishment.slug}`);
        } else {
          navigate(-1);
        }
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstKey = Object.keys(errors)[0];
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: errors[firstKey][0],
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: err.response?.data?.error || "Erro ao criar item.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    establishment,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitCreate,
  };
}
