// src/pages/Employer/EmployerHome.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useEmployerHome from "../../hooks/useEmployerHome";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";

import { Row, Col } from "react-bootstrap";

import GlobalNav from "../../components/GlobalNav";
import CitySelectorModal from "../../components/CitySelectorModal";
import HomeHeader from "../../components/home/HomeHeader";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import GlobalCard from "../../components/GlobalCard";

const PLACEHOLDER = "/images/logo.png";

export default function EmployerHome() {
  const { employers, isLoading, error } = useEmployerHome(apiBaseUrl, appId);
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
          {employers.map((emp) => (
            <Col key={emp.id} xs={12} sm={6} md={3}>
              <GlobalCard
                item={{
                  ...emp,
                  type: "employer",
                  name: emp.name,
                  first_name: emp.first_name,
                  last_name: emp.last_name,
                  avatar: emp.avatar,
                  image: emp.avatar,
                  user: emp.user,
                  city: emp.city || "",
                  uf: emp.uf || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                  description: emp.description || "",
                  establishment_id: emp.establishment_id,
                  files: emp.files || [],
                }}
                navigate={navigate}
                showSchedule
                openSchedulePopup={async () => {
                  await openSchedulePopup({ employer: emp });
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
