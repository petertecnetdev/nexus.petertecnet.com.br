import React from "react";
import PropTypes from "prop-types";
import "./GlobalMap.css";

export default function GlobalMap({ location, address, city, uf }) {
  const getFallback = () => {
    if (address && city && uf) return `${address}, ${city} - ${uf}`;
    if (address && city) return `${address}, ${city}`;
    if (address && uf) return `${address}, ${uf}`;
    if (city && uf) return `${city} - ${uf}`;
    return null;
  };

  const fallback = location || getFallback();
  if (!fallback) return null;

  const isIframe = fallback.includes("<iframe");

  const extractFromDirections = (url) => {
    try {
      if (!url.includes("/dir/")) return url;
      const parts = url.split("/dir/")[1]?.split("/");
      if (!parts || parts.length < 2) return url;

      return decodeURIComponent(parts[1].split("?")[0].replace(/\+/g, " ")).trim();
    } catch {
      return url;
    }
  };

  const buildEmbed = (value) => {
    const cleaned = extractFromDirections(value);
    return `https://www.google.com/maps?q=${encodeURIComponent(cleaned)}&z=15&output=embed`;
  };

  const embed = isIframe
    ? fallback
    : `<iframe src="${buildEmbed(fallback)}"
         width="100%"
         height="100%"
         style="border:0;"
         allowfullscreen
         loading="lazy">
       </iframe>`;

  return (
    <div className="globalmap__card">
      <div className="globalmap__header">
        <span className="globalmap__title">Localização</span>
        {fallback && (
          <span className="globalmap__address">
            {address || `${city} - ${uf}`}
          </span>
        )}
      </div>

      <div
        className="globalmap__wrapper"
        dangerouslySetInnerHTML={{ __html: embed }}
      />
    </div>
  );
}

GlobalMap.propTypes = {
  location: PropTypes.string,
  address: PropTypes.string,
  city: PropTypes.string,
  uf: PropTypes.string,
};
