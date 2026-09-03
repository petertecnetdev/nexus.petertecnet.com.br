import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaCompass,
  FaMapMarkerAlt,
  FaStore,
} from "react-icons/fa";

import { apiV1BaseUrl } from "../../config";
import api from "../../services/api";
import EntityImage from "../EntityImage";

const formatPrice = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return null;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
};

const fileUrl = (file) =>
  file?.public_url ||
  file?.full_url ||
  file?.media_url ||
  file?.image_url ||
  file?.url ||
  file?.src ||
  file?.path ||
  null;

const companyImages = (establishment) => {
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  return [
    establishment?.images?.logo,
    establishment?.logo,
    establishment?.logo_url,
    files.find((file) =>
      String(file?.type || file?.role || "")
        .toLowerCase()
        .includes("logo")
    ) &&
      fileUrl(
        files.find((file) =>
          String(file?.type || file?.role || "")
            .toLowerCase()
            .includes("logo")
        )
      ),
    establishment?.images?.background,
    establishment?.images?.cover,
    establishment?.background,
    files.find((file) => file?.is_primary) &&
      fileUrl(files.find((file) => file?.is_primary)),
    fileUrl(files[0]),
  ].filter(Boolean);
};

const itemImages = (item) => {
  const files = Array.isArray(item?.files) ? item.files : [];
  return [
    item?.images?.avatar,
    item?.images?.cover,
    item?.images?.main,
    Array.isArray(item?.images?.gallery) ? item.images.gallery[0] : null,
    item?.image_url,
    item?.image,
    item?.avatar,
    fileUrl(files.find((file) => file?.is_primary)),
    fileUrl(files[0]),
  ].filter(Boolean);
};

const activateOnKeyboard = (event, callback) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
};

export default function EstablishmentDiscoveryLinks({ establishment }) {
  const navigate = useNavigate();
  const [directory, setDirectory] = useState({ establishments: [], items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!establishment?.id) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`${apiV1BaseUrl}/directory`, {
          params: {
            city: establishment.city || undefined,
            uf: establishment.uf || undefined,
            limit: 48,
          },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        setDirectory({
          establishments: Array.isArray(data?.establishments)
            ? data.establishments
            : [],
          items: Array.isArray(data?.items) ? data.items : [],
        });
      } catch (error) {
        if (error?.code !== "ERR_CANCELED" && !controller.signal.aborted) {
          setDirectory({ establishments: [], items: [] });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [establishment?.city, establishment?.id, establishment?.uf]);

  const currentId = String(establishment?.id || "");

  const establishments = useMemo(
    () =>
      directory.establishments
        .filter(
          (candidate) =>
            candidate?.slug && String(candidate?.id || "") !== currentId
        )
        .slice(0, 6),
    [currentId, directory.establishments]
  );

  const items = useMemo(
    () =>
      directory.items
        .filter((item) => {
          if (!item?.slug) return false;
          const itemEstablishmentId =
            item?.establishment_id || item?.establishment?.id || null;
          return !itemEstablishmentId || String(itemEstablishmentId) !== currentId;
        })
        .slice(0, 8),
    [currentId, directory.items]
  );

  const hasSuggestions = establishments.length > 0 || items.length > 0;

  return (
    <section className="estv-discovery-section" aria-labelledby="estv-discovery-title">
      <div className="estv-discovery-heading">
        <div>
          <span>Continue explorando</span>
          <h2 id="estv-discovery-title">Descubra mais na Nexus</h2>
          <p>
            Navegue para outras empresas e itens sem precisar voltar ou fazer uma
            nova busca.
          </p>
        </div>
        <button
          type="button"
          className="estv-discovery-all"
          onClick={() => navigate("/")}
        >
          <FaCompass /> Explorar a Nexus <FaArrowRight />
        </button>
      </div>

      {loading && (
        <div className="estv-discovery-skeleton" aria-label="Carregando sugestões">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      )}

      {!loading && !hasSuggestions && (
        <div className="estv-discovery-empty">
          <FaCompass />
          <div>
            <strong>Há muito mais para explorar.</strong>
            <span>
              Acesse a página inicial para encontrar empresas e itens disponíveis
              na Nexus.
            </span>
          </div>
          <button type="button" onClick={() => navigate("/")}>
            Ver descoberta <FaArrowRight />
          </button>
        </div>
      )}

      {!loading && establishments.length > 0 && (
        <div className="estv-discovery-group">
          <div className="estv-discovery-group-title">
            <FaStore />
            <div>
              <strong>Outros estabelecimentos</strong>
              <span>Perfis e catálogos que você também pode conhecer</span>
            </div>
          </div>
          <div className="estv-company-links">
            {establishments.map((candidate) => {
              const name = candidate?.fantasy || candidate?.name || "Empresa";
              const location = [candidate?.city, candidate?.uf]
                .filter(Boolean)
                .join(" - ");
              const open = () =>
                navigate(`/establishment/view/${candidate.slug}`);

              return (
                <article
                  key={candidate.id || candidate.slug}
                  className="estv-company-link"
                  role="link"
                  tabIndex={0}
                  onClick={open}
                  onKeyDown={(event) => activateOnKeyboard(event, open)}
                >
                  <EntityImage
                    src={companyImages(candidate)}
                    name={name}
                    alt={name}
                    shape="establishment"
                    loading="lazy"
                  />
                  <div>
                    <strong>{name}</strong>
                    <span>
                      <FaMapMarkerAlt /> {location || "Localização não informada"}
                    </span>
                  </div>
                  <FaArrowRight className="estv-company-link-arrow" />
                </article>
              );
            })}
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="estv-discovery-group">
          <div className="estv-discovery-group-title">
            <FaCompass />
            <div>
              <strong>Outros itens para descobrir</strong>
              <span>Produtos e serviços de outros catálogos</span>
            </div>
          </div>
          <div className="estv-item-links">
            {items.map((item) => {
              const price = formatPrice(item?.price);
              const companyName =
                item?.establishment?.fantasy ||
                item?.establishment?.name ||
                "Catálogo Nexus";
              const open = () => navigate(`/item/view/${item.slug}`);

              return (
                <article
                  key={item.id || item.slug}
                  className="estv-item-link"
                  role="link"
                  tabIndex={0}
                  onClick={open}
                  onKeyDown={(event) => activateOnKeyboard(event, open)}
                >
                  <EntityImage
                    src={itemImages(item)}
                    name={item?.name || "Item"}
                    alt={item?.name || "Item"}
                    loading="lazy"
                  />
                  <div className="estv-item-link-copy">
                    <small>{companyName}</small>
                    <strong>{item?.name || "Item"}</strong>
                    {price && <span>{price}</span>}
                  </div>
                  <FaArrowRight className="estv-item-link-arrow" />
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

EstablishmentDiscoveryLinks.propTypes = {
  establishment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    city: PropTypes.string,
    uf: PropTypes.string,
  }).isRequired,
};
