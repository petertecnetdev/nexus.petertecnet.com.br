import React, { useMemo, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import GlobalHero from "../../components/GlobalHero";
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import EmployerMetrics from "../../components/employer/EmployerMetrics";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import GlobalRotativity from "../../components/GlobalRotativity";
import { apiBaseUrl } from "../../config";
import useAppointment from "../../hooks/useAppointment";
import useEmployerView from "../../hooks/useEmployerView";
import useItemsFilter from "../../hooks/useItemsFilter";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import useImageUtils from "../../hooks/useImageUtils";
import useScrollControl from "../../hooks/useScrollControl";
import useAuthPrompt from "../../hooks/useAuthPrompt";
import "./EmployerView.css";
import ShareButton from "../../components/ShareButton";

const PLACEHOLDER = "/images/logo.png";
const APP_ID = 3;

export default function EmployerViewPage() {
  const { user_name } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const {
    employer,
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    otherEstablishments,
    otherEmployers,
    otherItems,
    items,
    ordersSummary,
    isLoading,
  } = useEmployerView(apiBaseUrl, user_name, token, navigate);

  const { services, products } = useItemsFilter(items);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);
  const { ref: serviceRef, handleScroll: handleServiceScroll } = useScrollControl();
  const { ref: productRef, handleScroll: handleProductScroll } = useScrollControl();
  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    APP_ID,
    token,
    establishment
  );

  useAuthPrompt();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardOptions, setWizardOptions] = useState({});

  const openSchedulePopup = (target = {}) => {
    const opts = {};
    if (target?.type === "service" || target?.price || target?.duration)
      opts.preselectedService = target;
    if (target?.user || (target?.id && target?.establishment_id))
      opts.preselectedEmployer = target;
    setWizardOptions(opts);
    setTimeout(() => setShowWizard(true), 50);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user_name]);

  if (!employer) return null;

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0)
      .toFixed(2)
      .replace(".", ",")}`;

  const u = employer.user || {};
  const whatsappLink = u.phone
  ? `https://wa.me/${u.phone.replace(/\D/g, "")}?text=Olá! Encontrei seu perfil no Rasoio e gostaria de agendar um horário com você. Podemos conversar?`
  : null;

  return (
    <div className="empv-root">
      <NavlogComponent />

      <GlobalHero
        entity="employer"
        title={`${u.first_name || ""} ${u.last_name || ""}`.trim() || "Colaborador"}
        description={u.about || establishment?.description || ""}
        background={establishment?.background}
        logo={u.avatar || establishment?.logo}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        user={u}
        establishment={establishment}
        interactionSummary={interactionSummary}
      />

      <Container fluid className="empv-main">
        <Row className="gx-3 gy-4">
          <Col md={8}>
            {services.length > 0 && (
              <GlobalCarousel
                title="Serviços"
                items={services}
                carouselActive
                trackRef={serviceRef}
                handleScroll={handleServiceScroll}
                fmtBRL={fmtBRL}
                apiBaseUrl={apiBaseUrl}
                openSchedulePopup={openSchedulePopup}
                navigate={navigate}
                showSchedule
              />
            )}

            {products.length > 0 && (
              <GlobalCarousel
                title="Produtos"
                items={products}
                carouselActive
                trackRef={productRef}
                handleScroll={handleProductScroll}
                fmtBRL={fmtBRL}
                apiBaseUrl={apiBaseUrl}
                openSchedulePopup={() => {}}
                navigate={navigate}
                showSchedule={false}
              />
            )}
          </Col>

          <Col md={4}>
            <EmployerSidebar
              employer={employer}
              metrics={metrics}
              ordersSummary={ordersSummary}
              userInteractions={userInteractions}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              navigate={navigate}
              openSchedulePopup={openSchedulePopup}
            />
            {metrics && <EmployerMetrics metrics={metrics} />}
          </Col>

          
          <Col md={12}> <GlobalRotativity
              otherEstablishments={otherEstablishments}
              otherEmployers={otherEmployers}
              otherItems={otherItems}
              navigate={navigate}
              openSchedulePopup={openSchedulePopup}
              fmtBRL={fmtBRL}
            /></Col>

           
        </Row>
      </Container>

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={[employer]}
        services={services}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
        imageUrl={imageUrl}
        preselectedService={wizardOptions.preselectedService || null}
        preselectedEmployer={wizardOptions.preselectedEmployer || null}
      />

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="empv-whatsapp-fab"
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="empv-whatsapp-icon" />
        </a>
      )}
      <ShareButton />
    </div>
  );
}
