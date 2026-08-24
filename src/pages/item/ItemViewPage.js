// src/pages/item/ItemViewPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaUsers, FaBox, FaChartLine } from "react-icons/fa";

import GlobalNav from "../../components/GlobalNav";
import GlobalHero from "../../components/GlobalHero";
import GlobalCarousel from "../../components/GlobalCarousel";
import GlobalMap from "../../components/GlobalMap";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import GlobalCard from "../../components/GlobalCard";
import WhatsappButton from "../../components/GlobalWhatsappButton.jsx";
import ShareButton from "../../components/ShareButton";
import useAppointment from "../../hooks/useAppointment";

import useItemView from "../../hooks/useItemView";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import useImageUtils from "../../hooks/useImageUtils";
import useAuthPrompt from "../../hooks/useAuthPrompt";

import { apiBaseUrl } from "../../config";

const PLACEHOLDER = "/images/logo.png";
const APP_ID = 3;

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const { item, employers, otherItems, establishment, loading } = useItemView(
    apiBaseUrl,
    slug,
    token,
    navigate
  );
  const { loadAvailableTimes } = useAppointment(apiBaseUrl, APP_ID, token, establishment);
  const whatsappLink = useWhatsappLink(establishment);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  useAuthPrompt();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardOptions, setWizardOptions] = useState({
    services: [],
    preselectedService: null,
    preselectedEmployer: null,
    lockEmployer: false,
  });

  const normalizeItem = (i) => ({
    ...i,
    type: i.type || "service",
    image:
      i.image ||
      i.image_url ||
      i.images?.cover ||
      i.images?.main ||
      i.images?.logo ||
      PLACEHOLDER,
  });

  const allServices = useMemo(() => {
    const list = [];
    if (item) list.push(normalizeItem(item));
    if (otherItems?.length) {
      otherItems.forEach((i) => {
        if (!item || i.id !== item.id) list.push(normalizeItem(i));
      });
    }
    return list;
  }, [item, otherItems]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (!item && !loading) return null;
  if (!item) return null;

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const openFromHero = () => {
    setWizardOptions({
      services: allServices,
      preselectedService: normalizeItem(item),
      preselectedEmployer: null,
      lockEmployer: false,
    });
    setTimeout(() => setShowWizard(true), 50);
  };

  const mappedEmployers =
    employers?.map((e) => ({
      ...e,
      type: "employer",
      image:
        e.image ||
        e.avatar ||
        e.user?.avatar ||
        e.images?.avatar ||
        PLACEHOLDER,
      user: e.user || {
        first_name: e.name || "",
        avatar:
          e.image ||
          e.avatar ||
          e.user?.avatar ||
          e.images?.avatar ||
          PLACEHOLDER,
      },
      onScheduleClick: () => {
        setWizardOptions({
          services: allServices,
          preselectedService: normalizeItem(item),
          preselectedEmployer: e,
          lockEmployer: true,
        });
        setTimeout(() => setShowWizard(true), 50);
      },
    })) || [];

  const mappedOtherItems =
    otherItems?.map((i) => {
      const normalized = normalizeItem(i);
      return {
        ...normalized,
        onScheduleClick: () => {
          setWizardOptions({
            services: allServices,
            preselectedService: normalized,
            preselectedEmployer: null,
            lockEmployer: false,
          });
          setTimeout(() => setShowWizard(true), 50);
        },
      };
    }) || [];

  const establishmentCardItem = establishment
    ? {
        ...establishment,
        type: "establishment",
        image:
          establishment.image ||
          establishment.logo ||
          establishment.images?.logo ||
          establishment.images?.background ||
          PLACEHOLDER,
        total_views: establishment.metrics?.total_views ?? 0,
      }
    : null;

  const establishmentActions = establishment?.metrics ? (
    <div className="d-flex flex-column gap-2">
      <div className="d-flex flex-wrap gap-2">
        <Badge bg="dark" className="d-flex align-items-center gap-1">
          <FaUsers /> {establishment.metrics.total_employers} Profissionais
        </Badge>
        <Badge bg="dark" className="d-flex align-items-center gap-1">
          <FaBox /> {establishment.metrics.total_items} Itens
        </Badge>
        <Badge bg="dark" className="d-flex align-items-center gap-1">
          <FaChartLine /> {establishment.metrics.completed_orders} Pedidos
        </Badge>
        {establishment.description && (
          <div className="w-100 text-light-50 small">
            {establishment.description}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="itemv-root">
      <GlobalNav />

      <GlobalHero
  title={item.name}
  description={item.description}
  logo={normalizeItem(item).image}
  imageUrl={imageUrl}
  handleImgError={handleImgError}
  metrics={{
    views: item.metrics.total_views,
    unique_users: item.metrics.unique_users,
  }}
  ordersSummary={{
    total_orders: item.metrics.total_orders,
  }}
  establishment={establishment}
  onScheduleClick={openFromHero}
/>


      <Container fluid className="itemv-main">
        <Row className="gx-3 gy-4 m-2">
          <Col md={8}>
            {mappedOtherItems.length > 0 && (
  <GlobalCarousel
    title="Outros itens deste estabelecimento"
    items={mappedOtherItems}
    carouselActive
    fmtBRL={fmtBRL}
    apiBaseUrl={apiBaseUrl}
    navigate={navigate}
    showSchedule
    openSchedulePopup={(i) => i.onScheduleClick()}
  />
)}

            {mappedEmployers.length > 0 && (
              <GlobalCarousel
                title="Profissionais que atendem este item"
                items={mappedEmployers}
                carouselActive
                fmtBRL={fmtBRL}
                apiBaseUrl={apiBaseUrl}
                navigate={navigate}
                showSchedule
                openSchedulePopup={(e) => e.onScheduleClick()}
              />
            )}

            {establishment?.location && (
              <GlobalMap
                location={establishment.location}
                address={establishment.address}
                city={establishment.city}
                uf={establishment.uf}
              />
            )}
          </Col>

          <Col md={4}>
            {establishmentCardItem && (
              <GlobalCard
                item={establishmentCardItem}
                navigate={navigate}
                showSchedule={false}
                actions={establishmentActions}
              />
            )}
          </Col>
        </Row>
      </Container>

       <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={mappedEmployers}
        services={wizardOptions.services}
        loadAvailableTimes={loadAvailableTimes} // <-- Corrigido aqui
        imageUrl={imageUrl}
        preselectedService={wizardOptions.preselectedService}
        preselectedEmployer={wizardOptions.preselectedEmployer}
        lockEmployer={wizardOptions.lockEmployer}
        establishment={establishment}
        appId={APP_ID}
      />

    <WhatsappButton
  link={whatsappLink}
  message={`Olá! Gostaria de mais informações sobre o item "${item.name}", anunciado pelo estabelecimento "${establishment?.name ?? "—"}" no app Rasoio.`}
/>


      <ShareButton />
    </div>
  );
}
