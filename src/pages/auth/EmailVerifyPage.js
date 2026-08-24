import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import authService from "../../services/AuthService";
import NavlogComponent from "../../components/NavlogComponent";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import LoadingComponent from "../../components/LoadingComponent";

import "./EmailVerifyPage.css";


const EmailVerifyPage = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [redirect, setRedirect] = useState(false);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoadingVerify(true);
    try {
      const emailVerified = await authService.emailVerify(verificationCode);
      if (emailVerified) {
        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: "Email verificado com sucesso. Redirecionando...",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        setTimeout(() => {
          setRedirect(true);
        }, 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro na verificação de email. Certifique-se de inserir o código corretamente.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.errors) {
        let errorMessages = "";
        Object.keys(error.response.data.errors).forEach((field) => {
          errorMessages += `${field}: ${error.response.data.errors[field].join(", ")}\n`;
        });
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: errorMessages,
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro na verificação de email. Por favor, tente novamente mais tarde.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResendVerificationCode = async () => {
    setLoadingResend(true);
    try {
      const codeResent = await authService.resendCodeEmailVerification();
      if (codeResent) {
        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: "Código de verificação reenviado com sucesso.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao reenviar o código de verificação.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.errors) {
        let errorMessages = "";
        Object.keys(error.response.data.errors).forEach((field) => {
          errorMessages += `${field}: ${error.response.data.errors[field].join(", ")}\n`;
        });
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: errorMessages,
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao reenviar o código de verificação. Por favor, tente novamente mais tarde.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } finally {
      setLoadingResend(false);
    }
  };

  if (redirect) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} md={6} className="m-2">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Verificar Email</p>
              <Card.Body className="card-body">
                <div className="logo-container text-center">
                  <img src="/images/logo.png" alt="Logo" className="logo-image" />
                </div>
                <Card.Title className="card-title text-center">Verificar Email</Card.Title>
                <p className="footer-text text-center">
                  Bem-vindo ao Inkap! Para garantir a segurança da sua conta, insira o código que enviamos para seu e-mail.
                </p>
                <Form onSubmit={handleVerifyEmail} className="form-container">
                  <Form.Group className="form-group">
                    <Form.Label>Código de Verificação</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Insira o código"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className="input-email"
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" disabled={loadingVerify} className="submit-btn">
                    {loadingVerify ? "Verificando..." : "Verificar Email"}
                  </Button>
                </Form>
                <Button
                  variant="secondary"
                  onClick={handleResendVerificationCode}
                  disabled={loadingResend}
                  className="submit-btn"
                  style={{ marginTop: "15px" }}
                >
                  {loadingResend ? "Enviando..." : "Reenviar Código de Verificação"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      {(loadingVerify || loadingResend) && <LoadingComponent />}
    </>
  );
};

export default EmailVerifyPage;
