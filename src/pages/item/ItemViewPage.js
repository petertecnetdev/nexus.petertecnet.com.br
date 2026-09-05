// src/pages/item/ItemViewPage.jsx
import React, { useContext, useEffect } from "react";
import { Badge, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCartPlus, FaEye, FaPen, FaTag, FaWhatsapp } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import EntityImage from "../../components/EntityImage";
import GlobalWhatsappButton from "../../components/GlobalWhatsappButton";
import ShareButton from "../../components/ShareButton";
import useItemView from "../../hooks/useItemView";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { addToCart } from "../../services/cart";
import "./ItemViewPage.css";

const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
const hasPrice = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { item, otherItems, establishment, loading, error } = useItemView(slug);
  const whatsappLink = useWhatsappLink(establishment);
  const whatsappMessage = `Olá, gostaria de saber mais informações sobre o item "${item?.name || item?.title || "selecionado"}". Você poderia me ajudar?`;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug]);

  if (loading) return <><GlobalNav /><div className="item-detail-loading"><Spinner animation="border" /></div></>;
  if (error || !item) return <><GlobalNav /><Container className="py-5"><div className="alert alert-danger">Não foi possível carregar este item.</div></Container></>;

  const itemFiles = Array.isArray(item.files) ? item.files : [];
  const itemImages = [item.imageUrl, item.image_url, item.image, item.images?.cover, item.images?.main, item.images?.avatar, item.images?.gallery?.[0], itemFiles.find((file) => file?.is_primary)?.public_url, itemFiles.find((file) => file?.type === "image")?.public_url, itemFiles[0]?.public_url];
  const title = establishment?.fantasy || establishment?.name;
  const catalogPath = establishment?.slug ? `/catalog/${establishment.slug}` : "/";
  const canEdit = Boolean(user && (Number(item.user_id) === Number(user.id) || Number(establishment?.user_id) === Number(user.id) || Number(establishment?.created_by) === Number(user.id)));
  const canBuy = Boolean(hasPrice(item.price) && Number(item.price) > 0 && establishment?.id);

  const buy = (checkout) => {
    addToCart(item, establishment, 1);
    if (!checkout) return;
    if (user) navigate("/checkout");
    else navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };

  return <div className="item-detail-page">
    <GlobalNav />
    <Container className="py-4 py-lg-5">
      <div className="item-detail-toolbar"><Link to={catalogPath} className="item-detail-back"><FaArrowLeft /> Voltar ao catálogo</Link>{canEdit && <button type="button" className="item-detail-edit" onClick={() => navigate(`/item/update/${item.id}`)}><FaPen /> Editar item</button>}</div>
      <Row className="g-4 align-items-start mt-1">
        <Col lg={6}><div className="item-detail-image-wrap"><EntityImage src={itemImages} name={item.name} alt={item.name} className="item-detail-image" loading="eager" /></div></Col>
        <Col lg={6}><div className="item-detail-panel">
          <div className="d-flex flex-wrap gap-2 mb-3">{item.type && <Badge bg="info" text="dark">{item.type}</Badge>}{item.category && <Badge bg="secondary">{item.category}</Badge>}{item.subcategory && <Badge bg="secondary">{item.subcategory}</Badge>}{item.total_views != null && <span className="item-detail-views"><FaEye /> {Number(item.total_views || 0).toLocaleString("pt-BR")} visualizações</span>}</div>
          <h1>{item.name}</h1>{title && <Link to={catalogPath} className="item-detail-company">{title}</Link>}{hasPrice(item.price) && <div className="item-detail-price">{fmtBRL(item.price)}</div>}
          <div className="item-detail-facts">{item.brand && <span><FaTag /> Marca: {item.brand}</span>}{item.availability && <span>Disponibilidade: {item.availability}</span>}{item.status_label && <span>Status: {item.status_label}</span>}</div>
          {item.short_description && <p className="item-detail-summary">{item.short_description}</p>}{item.description && <div className="item-detail-description"><h2>Descrição</h2><p>{item.description}</p></div>}
          {canBuy && <div className="d-grid gap-2 mb-3"><Button variant="outline-info" onClick={() => buy(false)}><FaCartPlus /> Adicionar ao carrinho</Button><Button onClick={() => buy(true)}>Comprar agora</Button></div>}
          <div className="item-detail-actions">{whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer" className="item-detail-whatsapp"><FaWhatsapp /> Pedir informações</a>}<button type="button" onClick={() => navigate(catalogPath)}>Ver catálogo completo</button>{canEdit && <button type="button" className="item-detail-edit-secondary" onClick={() => navigate(`/item/update/${item.id}`)}><FaPen /> Alterar este item</button>}</div>
        </div></Col>
      </Row>
      {otherItems?.length > 0 && <section className="item-detail-related"><h2>Outros itens deste catálogo</h2><Row className="g-3">{otherItems.slice(0, 8).map((related) => <Col key={related.id} xs={12} sm={6} lg={3}><GlobalCard item={related} fmtBRL={fmtBRL} navigate={navigate} /></Col>)}</Row></section>}
    </Container>
    <GlobalWhatsappButton link={whatsappLink} message={whatsappMessage} />
    <ShareButton />
  </div>;
}
