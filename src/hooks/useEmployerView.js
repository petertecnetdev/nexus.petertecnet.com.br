import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useEmployerView(apiBaseUrl, userName, token, navigate) {
  const [employer, setEmployer] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [items, setItems] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [averageEngagement, setAverageEngagement] = useState(0);
  const [topItemAndClient, setTopItemAndClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/employer/view/${userName}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!active) return;
        const d = res.data || {};

        setEmployer(d.employer || null);
        setEstablishment(d.establishment || null);
        setMetrics(d.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(d.user_interactions || []);
        setItems(d.items || []);
        setOrdersSummary(d.orders_summary || null);
        setOtherEstablishments(d.other_establishments || []);
        setOtherEmployers(d.other_employers || []);
        setOtherItems(d.other_items || []);

        setColleagues(d.colleagues || []);
        setAverageEngagement(d.average_engagement_score || 0);
        setTopItemAndClient(d.top_item_and_client || null);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao carregar o colaborador.";

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
  }, [userName, token, navigate]);

  return {
    employer,
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    items,
    ordersSummary,
    otherEstablishments,
    otherEmployers,
    otherItems,
    colleagues,
    averageEngagement,
    topItemAndClient,
    isLoading,
  };
}
