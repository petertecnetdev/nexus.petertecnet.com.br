// src/pages/establishment/EstablishmentViewPage.jsx
import React, { useMemo, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

import GlobalNav from "../../components/GlobalNav";
import GlobalHero from "../../components/GlobalHero";
import EstablishmentSidebar from "../../components/establishment/EstablishmentSidebar";
import EstablishmentMetrics from "../../components/establishment/EstablishmentMetrics";
import GlobalCarousel from "../../components/GlobalCarousel";
import GlobalMap from "../../components/GlobalMap";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import GlobalRotativity from "../../components/GlobalRotativity";
import GlobalGallery from "../../components/GlobalGallery";

import { apiBaseUrl } from "../../config";
import useAppointment from "../../hooks/useAppointment";
import useEstablishmentView from "../../hooks/useEstablishmentView";
import useItemsFilter from "../../hooks/useItemsFilter";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import useImageUtils from "../../hooks/useImageUtils";
import useScrollControl from "../../hooks/useScrollControl";
import useAuthPrompt from "../../hooks/useAuthPrompt";

import ShareButton from "../../components/ShareButton";
import "./EstablishmentView.css";

const PLACEHOLDER = "/images/logo.png";
const APP_ID = 3;

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);

  const {
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
  } = useEstablishmentView(apiBaseUrl, slug, token, navigate);

  const { services, products } = useItemsFilter(items);
  const whatsappLink = useWhatsappLink(establishment);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  useScrollControl();
  useAuthPrompt();

  const { loadAvailableTimes } = useAppointment(
    apiBaseUrl,
    APP_ID,
    token,
    establishment
  );

  const [showWizard, setShowWizard] = useState(false);
  const [wizardOptions, setWizardOptions] = useState({});

  const openSchedulePopup = (target = {}) => {
    const opts = {};

    if (target?.type === "service" || target?.price || target?.duration) {
      opts.preselectedService = target;
    }

    if (target?.type === "employer" || target?.user || target?.establishment_id) {
      opts.preselectedEmployer = target;
    }

    setWizardOptions(opts);
    setTimeout(() => setShowWizard(true), 50);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (!establishment && !isLoading) return null;
  if (!establishment) return null;

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const mappedServices = services.map((i) => ({
    ...i,
    type: "service",
    image: i.image || null,
  }));

  const mappedProducts = products.map((i) => ({
    ...i,
    type: "product",
    image: i.image || null,
  }));

  const hasServices = mappedServices.length > 0;
  const hasProducts = mappedProducts.length > 0;

  const mappedGenericItems =
    !hasServices && !hasProducts && items.length
      ? items.map((i) => ({
          ...i,
          type: i.type === "product" ? "product" : "service",
          image: i.image || null,
        }))
      : [];

  const mappedEmployers =
    employers?.map((e) => {
      const avatar =
        e.user?.files?.find((f) => f.type === "avatar")?.public_url ||
        PLACEHOLDER;

      const name = `${e.user?.first_name || ""} ${e.user?.last_name || ""}`.trim();

      return {
        id: e.id,
        type: "employer",
        name,
        image: avatar,
        images: {
          avatar,
          gallery:
            e.files
              ?.filter((f) => f.type !== "avatar")
              .map((f) => f.public_url) || [],
        },
        user: e.user,
      };
    }) || [];

  const mappedOtherEstablishments = otherEstablishments.map((e) => {
    const logo = e.images?.logo || e.logo || null;
    const background = e.images?.background || e.background || null;

    return {
      ...e,
      type: "establishment",
      image: logo || background || null,
      images: {
        logo,
        background,
        gallery: e.images?.gallery || [],
      },
    };
  });

  const mappedOtherEmployers = otherEmployers.map((e) => {
    const avatar =
      e.images?.avatar ||
      e.avatar ||
      e.image ||
      e.user?.avatar ||
      PLACEHOLDER;

    return {
      ...e,
      type: "employer",
      image: avatar,
      images: {
        avatar,
        gallery: e.images?.gallery || [],
      },
      user: e.user || { first_name: e.name || "", avatar },
    };
  });

  const mappedOtherItems = otherItems.map((i) => ({
    ...i,
    type: i.type === "product" ? "product" : "service",
    image: i.image || null,
  }));

  return (
    <div className="estv-root">
      <GlobalNav />

      <GlobalHero
        entity="establishment"
        title={establishment.name}
        description={establishment.description}
        background={
          establishment.images?.background || establishment.background || null
        }
        logo={establishment.images?.logo || establishment.logo || null}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        establishment={establishment}
        interactionSummary={interactionSummary}
        metrics={metrics}
        ordersSummary={ordersSummary}
        whatsappLink={whatsappLink}
        onScheduleClick={() =>
          openSchedulePopup({ type: "establishment", establishment })
        }
        images={establishment.images?.gallery || []}
      />

      <Container fluid className="estv-main">
        <Row className="gx-3 gy-4">
          <Col md={8}>
            <GlobalGallery images={establishment.images?.gallery || []} />

            {!hasServices && !hasProducts && mappedGenericItems.length > 0 && (
              <GlobalCarousel
                title="Serviços e Produtos"
                items={mappedGenericItems}
                carouselActive
                fmtBRL={fmtBRL}
                apiBaseUrl={apiBaseUrl}
                openSchedulePopup={openSchedulePopup}
                navigate={navigate}
                showSchedule
              />
            )}

            {mappedEmployers.length > 0 && (
              <GlobalCarousel
                title="Profissionais"
                items={mappedEmployers}
                carouselActive
                fmtBRL={fmtBRL}
                apiBaseUrl={apiBaseUrl}
                openSchedulePopup={openSchedulePopup}
                navigate={navigate}
                showSchedule
              />
            )}

            <GlobalMap
              location={establishment?.location}
              address={establishment?.address}
              city={establishment?.city}
              uf={establishment?.uf}
            />
          </Col>

          <Col md={4}>
            <EstablishmentSidebar
              establishment={establishment}
              metrics={metrics}
              ordersSummary={ordersSummary}
              userInteractions={userInteractions}
              otherEstablishments={mappedOtherEstablishments}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              navigate={navigate}
              openSchedulePopup={openSchedulePopup}
            />

            {metrics && <EstablishmentMetrics metrics={metrics} />}
          </Col>

          <Col md={12}>
            <GlobalRotativity
              otherEstablishments={mappedOtherEstablishments}
              otherEmployers={mappedOtherEmployers}
              otherItems={mappedOtherItems}
              navigate={navigate}
              openSchedulePopup={openSchedulePopup}
              fmtBRL={fmtBRL}
            />
          </Col>
        </Row>
      </Container>

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={mappedEmployers}
        services={mappedServices.length ? mappedServices : mappedGenericItems}
        loadAvailableTimes={loadAvailableTimes}
        imageUrl={imageUrl}
        preselectedService={wizardOptions.preselectedService || null}
        preselectedEmployer={wizardOptions.preselectedEmployer || null}
        establishment={establishment}
      />

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="estv-whatsapp-fab"
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="estv-whatsapp-icon" />
        </a>
      )}

      <ShareButton />
    </div>
  );
}
