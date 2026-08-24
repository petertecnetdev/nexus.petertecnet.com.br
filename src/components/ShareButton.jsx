import React from "react";
import { FaShareAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import "./ShareButton.css";

export default function ShareButton() {
  const handleShare = async () => {
    const currentUrl = window.location.href;
    const text = "Confira este perfil no Rasoio! 💈";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rasoio",
          text,
          url: currentUrl,
        });
      } catch (err) {
        console.warn("Compartilhamento cancelado:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(currentUrl);
        Swal.fire({
          icon: "success",
          title: "Link copiado!",
          text: "O link foi copiado para sua área de transferência.",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível copiar o link.",
        });
      }
    }
  };

  return (
    <button
      className="share-fab"
      onClick={handleShare}
      title="Compartilhar este perfil"
    >
      <FaShareAlt className="share-icon" />
    </button>
  );
}
