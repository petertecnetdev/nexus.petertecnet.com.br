import React, { useMemo, useContext } from "react";
import Swal from "sweetalert2";
import { AuthContext } from "../../App";
import "./steps.css";

export default function StepEmployer({
  employers,
  selected,
  onChange,
  imageUrl,
}) {
  const { employer: authEmployer } = useContext(AuthContext);

  const authEmployerId = useMemo(() => {
    return authEmployer?.id ? Number(authEmployer.id) : null;
  }, [authEmployer]);

  const handleSelect = (employer) => {
    if (
      authEmployerId &&
      Number(employer.id) === Number(authEmployerId)
    ) {
      Swal.fire({
        background: "#0a0a0c",
        color: "#fff",
        icon: "warning",
        title: "Agendamento inválido",
        text: "Você não pode agendar um serviço consigo mesmo.",
        confirmButtonColor: "#ff5555",
      });
      return;
    }

    onChange(employer);
  };

  return (
    <div className="step-container">
      <h4>Escolha o Profissional</h4>

      <div className="step-grid">
        {employers.map((e) => {
          const isSelf =
            authEmployerId &&
            Number(e.id) === Number(authEmployerId);

          return (
            <div
              key={e.id}
              className={`step-card ${
                selected?.id === e.id ? "active" : ""
              } ${isSelf ? "disabled" : ""}`}
              onClick={() => handleSelect(e)}
            >
              <img
                src={e.image || "/images/logo.png"}
                onError={(ev) =>
                  (ev.target.src = "/images/logo.png")
                }
                alt={e.user?.first_name}
                className="step-avatar"
              />

              <div>{e.user?.first_name}</div>

              {isSelf && (
                <small className="step-warning">
                  Você não pode agendar consigo mesmo
                </small>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
