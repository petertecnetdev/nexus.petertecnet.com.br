// src/components/GoogleLoginButton.js
import React from "react";
import PropTypes from "prop-types";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../config";

const GoogleLoginButton = ({ onSuccess }) => (
  <GoogleLogin
    onSuccess={async credentialResponse => {
      try {
        const res = await axios.post(`${apiBaseUrl}/auth/google`, {
          token_id: credentialResponse.credential,
        });
        localStorage.setItem("token", res.data.access_token);
        onSuccess(res.data.user);
      } catch (err) {
        Swal.fire({
          title: "Erro!",
          text: err.response?.data?.error || "Falha no login com Google",
          icon: "error",
          confirmButtonText: "Ok",
        });
      }
    }}
    onError={() => {
      Swal.fire({
        title: "Erro!",
        text: "Falha no login com Google",
        icon: "error",
        confirmButtonText: "Ok",
      });
    }}
  />
);

GoogleLoginButton.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default GoogleLoginButton;
