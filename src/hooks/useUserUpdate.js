import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../config";

export default function useUserUpdate(reset) {
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [isBarber, setIsBarber] = useState(false);
  const [email, setEmail] = useState("");

  // ============================================================
  // 🔥 CARREGAR USER
  // ============================================================
  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;

        const user = res.data.user || {};

        reset({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          cpf: user.cpf || "",
          phone: user.phone || "",
          address: user.address || "",
          city: user.city || "",
          uf: user.uf || "",
          postal_code: user.postal_code || "",
          birthdate: user.birthdate || "",
          gender: user.gender || "",
          occupation: user.occupation || "",
          about: user.about || "",
        });

        // Agora avatar já vem URL completa da API
        setAvatarPreview(user.avatar || null);
        setUserId(user.id);
        setUserName(user.user_name || "");
        setEmail(user.email || "");

        setIsBarber(
          user.is_barber === true ||
          user.is_barber === 1 ||
          user.is_barber === "1"
        );
      } catch {
        Swal.fire("Erro", "Não foi possível carregar seus dados.", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUser();
    return () => (mounted = false);
  }, [reset]);

  // ============================================================
  // 🔥 RESIZE DE AVATAR (250x250)
  // ============================================================
  const handleResizeAvatar = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        reject("invalid");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 250;
          canvas.height = 250;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 250, 250);

          const preview = canvas.toDataURL("image/png");
          setAvatarPreview(preview);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject("blob-fail");
                return;
              }
              const name = (file.name || "avatar").replace(/\.[^/.]+$/, "") + ".png";
              const resized = new File([blob], name, { type: "image/png" });
              setAvatarFile(resized);
              resolve(resized);
            },
            "image/png",
            0.95
          );
        };
      };

      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await handleResizeAvatar(file);
  };

  // ============================================================
  // 🔥 SUBMIT
  // ============================================================
  const submitUpdate = async (data) => {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => formData.append(key, val || ""));

    if (avatarFile) formData.append("avatar", avatarFile);

    formData.append("user_name", userName);
    formData.append("is_barber", isBarber ? "1" : "0");

    try {
      const res = await axios.post(`${apiBaseUrl}/user/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Sucesso", res.data.message || "Perfil atualizado!", "success").then(
        () => window.location.reload()
      );

    } catch (err) {
      let msg = "Erro ao atualizar.";

      if (err.response?.data) {
        const d = err.response.data;
        if (d.errors) msg = Object.values(d.errors).flat().join("\n");
        else if (d.message) msg = d.message;
      }

      Swal.fire("Erro", msg, "error");
    }
  };

  return {
    loading,
    avatarPreview,
    handleAvatarChange,
    userName,
    setUserName,
    isBarber,
    setIsBarber,
    email,
    submitUpdate,
  };
}
