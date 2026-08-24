import React from "react";
import { ButtonGroup, Button } from "react-bootstrap";

export default function HomeFilters({ active, setActive }) {
  return (
    <div className="d-flex justify-content-center my-4">
      <ButtonGroup>
        <Button
          variant={active === "all" ? "light" : "secondary"}
          onClick={() => setActive("all")}
        >
          Todos
        </Button>
        <Button
          variant={active === "corte" ? "light" : "secondary"}
          onClick={() => setActive("corte")}
        >
          Cortes
        </Button>
        <Button
          variant={active === "barba" ? "light" : "secondary"}
          onClick={() => setActive("barba")}
        >
          Barba
        </Button>
        <Button
          variant={active === "promo" ? "light" : "secondary"}
          onClick={() => setActive("promo")}
        >
          Promoções
        </Button>
      </ButtonGroup>
    </div>
  );
}
