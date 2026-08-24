import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useEstablishmentView(apiBaseUrl, slug, token, navigate) {
  const [establishment, setEstablishment] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          { headers }
        );

        if (!active) return;

        const d = res.data || {};
        const est = d.establishment || null;

        setEstablishment(
          est
            ? {
                ...est,
                images: {
                  logo:
                    est.files?.find((f) => f.type === "logo")?.public_url ??
                    est.logo ??
                    null,
                  background:
                    est.files?.find((f) => f.type === "background")
                      ?.public_url ??
                    est.background ??
                    null,
                  gallery: est.files
                    ?.filter(
                      (f) => !["logo", "background"].includes(f.type)
                    )
                    .map((f) => f.public_url),
                },
              }
            : null
        );

        setMetrics(est?.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(d.user_interactions || []);
        setOrdersSummary(d.orders_summary || null);
        setCompletedAppointments(d.completed_appointments || []);

        const [
          itemsRes,
          employersRes,
          otherEstRes,
          otherItemsRes,
          otherEmpRes,
        ] = await Promise.all([
          axios.get(
            `${apiBaseUrl}/item/list-by-entity/${slug}`,
            { headers }
          ),
          axios.get(
            `${apiBaseUrl}/employer/list-by-entity/${slug}`,
            { headers }
          ),
          axios.get(
            `${apiBaseUrl}/establishment/list-others/${slug}`,
            { headers }
          ),
          axios.get(
            `${apiBaseUrl}/item/list-others/${slug}`,
            { headers }
          ),
          axios.get(
            `${apiBaseUrl}/employer/list-others/${slug}`,
            { headers }
          ),
        ]);

        setItems(
          (itemsRes.data.items || []).map((it) => ({
            ...it,
            type: "item",
            image:
              it.files?.find((f) => f.type === "image")?.public_url ??
              it.image ??
              null,
          }))
        );

        setEmployers(
          (employersRes.data.employers || []).map((emp) => ({
            ...emp,
            type: "employer",
            avatar:
              emp.user?.files?.find((f) => f.type === "avatar")?.public_url ??
              null,
          }))
        );

        setOtherEstablishments(
          (otherEstRes.data.establishments || []).map((e) => ({
            ...e,
            type: "establishment",
            images: {
              logo:
                e.files?.find((f) => f.type === "logo")?.public_url ??
                e.logo ??
                null,
              background:
                e.files?.find((f) => f.type === "background")?.public_url ??
                e.background ??
                null,
            },
          }))
        );

        setOtherItems(
          (otherItemsRes.data.items || []).map((it) => ({
            ...it,
            type: "item",
            image:
              it.files?.find((f) => f.type === "image")?.public_url ??
              it.image ??
              null,
          }))
        );

        setOtherEmployers(
          (otherEmpRes.data.employers || []).map((emp) => ({
            ...emp,
            type: "employer",
            avatar:
              emp.user?.files?.find((f) => f.type === "avatar")?.public_url ??
              null,
          }))
        );
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao carregar o estabelecimento.";

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        }).then(() => navigate("/"));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug, token, navigate, apiBaseUrl]);

  return {
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    otherEstablishments,
    otherEmployers,
    otherItems,
    items,
    employers,
    ordersSummary,
    completedAppointments,
    isLoading,
  };
}
