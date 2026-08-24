// src/pages/Item/ItemServiceHomePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useItemServiceHome from "../../hooks/useItemServiceHome";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";

import { Row, Col } from "react-bootstrap";

import GlobalNav from "../../components/GlobalNav";
import CitySelectorModal from "../../components/CitySelectorModal";
import HomeHeader from "../../components/home/HomeHeader";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import GlobalCard from "../../components/GlobalCard";

const PLACEHOLDER = "/images/logo.png";

export default function ItemServiceHomePage() {
  const { serviceItems, isLoading, error } = useItemServiceHome(apiBaseUrl, appId);
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
          {serviceItems.map((item) => (
            <Col key={item.id} xs={12} sm={6} md={6} lg={3}>
              <GlobalCard
                item={item}
                navigate={navigate}
                showSchedule
                openSchedulePopup={async () => {
                  await openSchedulePopup({ service: item });
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
