import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Offcanvas } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowRight, FaMinus, FaPlus, FaShoppingCart, FaTrash } from "react-icons/fa";

import {
  CART_EVENT,
  CART_OPEN_EVENT,
  clearCart,
  readCart,
  setCartItemQuantity,
} from "../services/cart";
import "./CommerceCartDrawer.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function CommerceCartDrawer({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(() => readCart());

  useEffect(() => {
    const sync = () => setCart(readCart());
    const requestOpen = () => {
      sync();
      setOpen(true);
    };

    window.addEventListener(CART_EVENT, sync);
    window.addEventListener(CART_OPEN_EVENT, requestOpen);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener(CART_OPEN_EVENT, requestOpen);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const itemCount = useMemo(
    () => (cart?.items || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [cart],
  );

  const subtotal = useMemo(
    () => (cart?.items || []).reduce(
      (sum, row) => sum + (Number(row.item?.price || 0) * Number(row.quantity || 0)),
      0,
    ),
    [cart],
  );

  const updateQuantity = (itemId, quantity) => {
    setCart(setCartItemQuantity(itemId, quantity));
  };

  const emptyCart = () => {
    clearCart();
    setCart(null);
    setOpen(false);
  };

  const checkout = () => {
    setOpen(false);
    if (user) {
      navigate("/checkout");
      return;
    }
    navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };

  if (!itemCount) return null;

  return (
    <>
      <button
        type="button"
        className="nexus-cart-fab"
        onClick={() => setOpen(true)}
        aria-label={`Abrir carrinho com ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
      >
        <FaShoppingCart aria-hidden="true" />
        <span>{itemCount > 99 ? "99+" : itemCount}</span>
      </button>

      <Offcanvas
        show={open}
        onHide={() => setOpen(false)}
        placement="end"
        className="nexus-commerce-cart"
        aria-labelledby="nexus-commerce-cart-title"
      >
        <Offcanvas.Header closeButton>
          <div>
            <small className="nexus-commerce-cart__eyebrow">Compra única</small>
            <Offcanvas.Title id="nexus-commerce-cart-title">Seu carrinho</Offcanvas.Title>
            <p className="mb-0">
              {cart?.establishment?.fantasy || cart?.establishment?.name || "Nexus"}
            </p>
          </div>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <div className="nexus-commerce-cart__intro">
            <strong>{itemCount} {itemCount === 1 ? "item selecionado" : "itens selecionados"}</strong>
            <span>Altere quantidades sem sair do carrinho. Valores serão revalidados no checkout.</span>
          </div>

          <div className="nexus-commerce-cart__items">
            {(cart?.items || []).map((row) => {
              const quantity = Number(row.quantity || 0);
              const unitPrice = Number(row.item?.price || 0);
              return (
                <article className="nexus-commerce-cart__item" key={row.item.id}>
                  <div className="nexus-commerce-cart__itemCopy">
                    <small>{row.item?.category || row.item?.type || "Item"}</small>
                    <strong>{row.item?.name || "Item"}</strong>
                    <span>{quantity} × {money(unitPrice)} · <b>{money(unitPrice * quantity)}</b></span>
                  </div>

                  <div className="nexus-commerce-cart__stepper" role="group" aria-label={`Quantidade de ${row.item?.name || "item"}`}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(row.item.id, quantity - 1)}
                      aria-label="Diminuir quantidade"
                    >
                      <FaMinus aria-hidden="true" />
                    </button>
                    <output aria-live="polite">{quantity}</output>
                    <button
                      type="button"
                      onClick={() => updateQuantity(row.item.id, quantity + 1)}
                      disabled={quantity >= 99}
                      aria-label="Aumentar quantidade"
                    >
                      <FaPlus aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="nexus-commerce-cart__remove"
                      onClick={() => updateQuantity(row.item.id, 0)}
                      aria-label={`Remover ${row.item?.name || "item"}`}
                    >
                      <FaTrash aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="nexus-commerce-cart__summary">
            <div><span>Itens</span><strong>{itemCount}</strong></div>
            <div className="nexus-commerce-cart__total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <small>Entrega e demais valores, quando aplicáveis, aparecem antes da confirmação do pagamento.</small>
          </div>

          <div className="nexus-commerce-cart__actions">
            <Button size="lg" onClick={checkout}>
              Continuar para checkout <FaArrowRight aria-hidden="true" />
            </Button>
            <Button variant="outline-light" onClick={() => setOpen(false)}>Continuar comprando</Button>
            <button type="button" className="nexus-commerce-cart__clear" onClick={emptyCart}>Esvaziar carrinho</button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

CommerceCartDrawer.propTypes = {
  user: PropTypes.object,
};

CommerceCartDrawer.defaultProps = {
  user: null,
};
