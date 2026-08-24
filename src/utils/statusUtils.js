export const STATUS_KEYS = [
  "all",
  "pending",
  "confirmed",
  "attended",
  "not_attended",
  "cancelled",
];

export function translateStatus(status) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "confirmed":
      return "Confirmado";
    case "cancelled":
      return "Cancelado";
    case "attended":
      return "Atendido";
    case "not_attended":
      return "Não Atendido";
    default:
      return status;
  }
}
