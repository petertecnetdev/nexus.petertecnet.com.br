// src/pages/Establishment/EstablishmentHome.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useEstablishmentHome from "../../hooks/useEstablishmentHome";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";

import { Row, Col } from "react-bootstrap";

import GlobalNav from "../../components/GlobalNav";
import CitySelectorModal from "../../components/CitySelectorModal";
import HomeHeader from "../../components/home/HomeHeader";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import GlobalCard from "../../components/GlobalCard";

const PLACEHOLDER = "/images/logo.png";

export default function EstablishmentHome() {
  const { establishments, isLoading, error } = useEstablishmentHome(apiBaseUrl, appId);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [showCityModal, setShowCityModal] = useState(false);
  const [currentCity, setCurrentCity] = useState(localStorage.getItem("selectedCity"));
  const [currentUF, setCurrentUF] = useState(localStorage.getItem("selectedUF"));

  const { imageUrl } = useImageUtils(PLACEHOLDER);

  const {
    showWizard,
    setShowWizard,
    wizardEstablishment,
    wizardEmployers,
    wizardServices,
    preselectedEmployer,
    preselectedServiceId,
    openSchedulePopup,
  } = useSchedulePopup(apiBaseUrl, token);

  const handleChangeCity = () => setShowCityModal(true);
  const handleSelectCity = ({ city, uf }) => {
    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedUF", uf);
    setCurrentCity(city);
    setCurrentUF(uf);
    setShowCityModal(false);
  };

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper">
          <HomeHeader city={currentCity} uf={currentUF} onChangeCity={handleChangeCity} />
          <div className="hp-loading">Carregando…</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper">
          <div className="hp-loading">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <div className="hp-wrapper">
        <HomeHeader city={currentCity} uf={currentUF} onChangeCity={handleChangeCity} />

        <Row className="g-3">
          {establishments.map((est) => (
            <Col key={est.id} xs={12} sm={6} md={3}>
              <GlobalCard
                item={{
                  ...est,
                  type: "establishment",
                  city: est.city || "",
                  uf: est.uf || "",
                  phone: est.phone || "",
                  email: est.email || "",
                  description: est.description,
                  address: est.address,
                  cep: est.cep,
                  location: est.location,
                  website_url: est.website_url,
                  instagram_url: est.instagram_url,
                  facebook_url: est.facebook_url,
                  twitter_url: est.twitter_url,
                  youtube_url: est.youtube_url,
                  logo: est.logo,
                  background: est.background,
                  metrics: est.metrics || { total_views: 0, completed_orders: 0 },
                  total_views: est.total_views,
                  completed_appointments: est.completed_appointments,
                  segments: est.segments ? JSON.parse(est.segments) : [],
                  files: est.files || [],
                }}
                navigate={navigate}
                showSchedule
                openSchedulePopup={async () => {
                  await openSchedulePopup({ establishment: est });
                }}
              />
            </Col>
          ))}
        </Row>
      </div>

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={wizardEmployers}
        services={wizardServices}
        loadAvailableTimes={() => {}}
        handleCreateAppointment={() => {}}
        imageUrl={imageUrl}
        preselectedServiceId={preselectedServiceId}
        preselectedEmployer={preselectedEmployer}
        establishment={wizardEstablishment}
      />

      <CitySelectorModal
        user={JSON.parse(localStorage.getItem("user") || "{}")}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleSelectCity}
      />
    </>
  );
}
