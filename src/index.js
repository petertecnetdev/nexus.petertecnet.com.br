import { startTelemetry } from "./telemetry";
import { apiBaseUrl, appId, appSlug } from "./config";
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import PeterAccountGateway from "./components/PeterAccountGateway";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./styles/nexus-brand-refresh.css";

startTelemetry({ apiBaseUrl, appSlug, appId });

axios.defaults.headers.common["X-Peter-App"] = appSlug;
axios.defaults.headers.common["X-App-ID"] = String(appId);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PeterAccountGateway apiBaseUrl={apiBaseUrl} appSlug={appSlug}>
      <App />
      <PeterTecnetSignature />
    </PeterAccountGateway>
  </React.StrictMode>
);
