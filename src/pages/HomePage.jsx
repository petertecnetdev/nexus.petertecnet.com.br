// src/pages/HomePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../config";

import useHome from "../hooks/useHome";
import useAppointment from "../hooks/useAppointment";
import useImageUtils from "../hooks/useImageUtils";
import useSchedulePopup from "../hooks/useSchedulePopup";

import "./HomePage.css";

import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";
import GlobalCarousel from "../components/GlobalCarousel";
import CitySelectorModal from "../components/CitySelectorModal";
import AppointmentWizardModal from "../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function HomePage() {
  const {
    establishments,
    employers,
    serviceItems,
    productItems,
    isLoading,
    error,
  } = useHome(apiBaseUrl, appId);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [showCityModal, setShowCityModal] = useState(false);
  const [currentCity, setCurrentCity] = useState(
    localStorage.getItem("selectedCity")
  );
  const [currentUF, setCurrentUF] = useState(
    localStorage.getItem("selectedUF")
  );

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

  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    appId,
    token,
    wizardEstablishment
  );

  const handleSelectCity = ({ city, uf }) => {
    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedUF", uf);
    setCurrentCity(city);
    setCurrentUF(uf);
    setShowCityModal(false);
  };

  /* =================== STATES =================== */
  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper hp-centered">
        
          <div className="hp-loading">Carregando…</div>
        </div>
        <GlobalFooter />
      </>
    );
  }

  if (error) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper hp-centered">
          <div className="hp-loading">{error}</div>
        </div>
        <GlobalFooter />
      </>
    );
  }

  /* =================== RENDER =================== */
  return (
    <>
      <GlobalNav />

      <main className="hp-wrapper">
       
        <GlobalCarousel
          title="Estabelecimentos"
          items={establishments}
          navigate={(path) => navigate(path)}
          openSchedulePopup={async (item) => {
            const filteredEmployers = employers.filter(
              (emp) =>
                Number(emp.establishment_id) === Number(item.id)
            );

            await openSchedulePopup({
              establishment: item,
              filteredEmployers,
            });
          }}
          showSchedule
        />

        <GlobalCarousel
          title="Profissionais"
          items={employers}
          navigate={navigate}
          openSchedulePopup={(item) =>
            openSchedulePopup({ employer: item })
          }
          showSchedule
        />

        <GlobalCarousel
          title="Serviços"
          items={serviceItems}
          navigate={(path) => navigate(path)}
          openSchedulePopup={(item) => {
            const entityId =
              item.establishment_id ||
              item.entity_id ||
              item.entityId;

            const filteredEmployers = employers.filter(
              (emp) =>
                Number(emp.establishment_id) ===
                Number(entityId)
            );

            openSchedulePopup({
              service: item,
              filteredEmployers,
            });
          }}
          showSchedule
        />

        <GlobalCarousel
          title="Produtos"
          items={productItems}
          navigate={(path) => navigate(path)}
          showSchedule={false}
        />
      </main>

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={wizardEmployers}
        services={wizardServices}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
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

      {/* FOOTER FIXO MOBILE */}
      <GlobalFooter />
    </>
  );
}
