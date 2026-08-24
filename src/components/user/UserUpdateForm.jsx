// src/components/user/UserUpdateForm.jsx
import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import GlobalButton from "../GlobalButton";
import "./UserUpdateForm.css";

export default function UserUpdateForm({
  register,
  handleSubmit,
  isSubmitting,
  avatarPreview,
  handleAvatarChange,
  userName,
  setUserName,
  email,
  onSubmit,
}) {
  return (
    <>
      {/* HERO */}
      <div className="user-hero">
        <div className="user-hero-inner">
          <div className="user-avatar-bubble">
            <img
              src={avatarPreview || "/images/user.png"}
              className="user-avatar"
              alt="Avatar"
            />
          </div>

          <div className="user-info-block">
            <h1 className="user-title">@{userName}</h1>
            <div className="user-description">{email}</div>
          </div>
        </div>
      </div>

      {/* BOTÃO ALTERAR FOTO */}
      <div className="d-flex justify-content-center my-3">
        <GlobalButton
          variant="outline"
          rounded
          onClick={() => document.getElementById("avatarInput").click()}
        >
          Alterar Foto de Perfil
        </GlobalButton>
      </div>

      <Form.Control
        id="avatarInput"
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: "none" }}
      />

      {/* FORMULÁRIO */}
      <Form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        <Row className="gy-3 mt-2">
          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Primeiro Nome</label>
              <input type="text" {...register("first_name")} required />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Sobrenome</label>
              <input type="text" {...register("last_name")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Nome de Usuário</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={255}
              />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} disabled />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>CPF</label>
              <input type="text" {...register("cpf")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Data de Nascimento</label>
              <input type="date" {...register("birthdate")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Telefone</label>
              <input type="text" {...register("phone")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Gênero</label>
              <select {...register("gender")}>
                <option value="">Selecione</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Endereço</label>
              <input type="text" {...register("address")} />
            </div>
          </Col>

          <Col xs={6} md={4}>
            <div className="form-group">
              <label>Cidade</label>
              <input type="text" {...register("city")} />
            </div>
          </Col>

          <Col xs={6} md={3}>
            <div className="form-group">
              <label>UF</label>
              <select {...register("uf")}>
                <option value="">Selecione</option>
                {[
                  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
                  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
                ].map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </Col>

          <Col xs={6} md={3}>
            <div className="form-group">
              <label>CEP</label>
              <input type="text" {...register("postal_code")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Sobre você</label>
              <textarea rows={3} {...register("about")} />
            </div>
          </Col>

          <Col xs={12} className="text-end">
            <GlobalButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              rounded
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </GlobalButton>
          </Col>
        </Row>
      </Form>
    </>
  );
}
