import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_ENTITY_VISUAL_THEME,
  entityThemeStyle,
  extractEntityVisualTheme,
} from "../../utils/entityVisualTheme";
import EstablishmentExperiencePage from "./EstablishmentExperiencePage";
import "./EstablishmentAmbientTheme.css";

const readBackgroundImageUrl = (element) => {
  if (!element?.style?.backgroundImage) return null;
  const matches = [
    ...element.style.backgroundImage.matchAll(/url\((['"]?)(.*?)\1\)/gi),
  ];
  return matches.length ? matches[matches.length - 1][2] : null;
};

export default function EstablishmentViewPage() {
  const shellRef = useRef(null);
  const lastCoverRef = useRef(null);
  const [visualTheme, setVisualTheme] = useState({
    palette: DEFAULT_ENTITY_VISUAL_THEME,
    imageUrl: null,
  });

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    let cancelled = false;
    let heroObserver = null;
    let treeObserver = null;

    const syncThemeFromHero = async (hero) => {
      const hasCover = hero?.classList?.contains("has-cover");
      const coverUrl = hasCover ? readBackgroundImageUrl(hero) : null;
      const nextCoverKey = coverUrl || "__default__";

      if (lastCoverRef.current === nextCoverKey) return;
      lastCoverRef.current = nextCoverKey;

      if (!coverUrl) {
        setVisualTheme({
          palette: DEFAULT_ENTITY_VISUAL_THEME,
          imageUrl: null,
        });
        return;
      }

      // Apply the blurred image immediately. Palette extraction runs on a tiny
      // canvas sample and gracefully falls back when the image host blocks CORS.
      setVisualTheme({
        palette: DEFAULT_ENTITY_VISUAL_THEME,
        imageUrl: coverUrl,
      });

      const palette = await extractEntityVisualTheme(coverUrl);
      if (cancelled || lastCoverRef.current !== coverUrl) return;

      setVisualTheme({
        palette,
        imageUrl: coverUrl,
      });
    };

    const bindHero = () => {
      const hero = shell.querySelector(".estv-presentation-hero");
      if (!hero) return false;

      syncThemeFromHero(hero);
      heroObserver?.disconnect();
      heroObserver = new MutationObserver(() => syncThemeFromHero(hero));
      heroObserver.observe(hero, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      return true;
    };

    if (typeof MutationObserver === "undefined") {
      bindHero();
      return () => {
        cancelled = true;
      };
    }

    if (!bindHero()) {
      treeObserver = new MutationObserver(() => {
        if (bindHero()) treeObserver?.disconnect();
      });
      treeObserver.observe(shell, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      heroObserver?.disconnect();
      treeObserver?.disconnect();
    };
  }, []);

  const themeStyle = useMemo(
    () => entityThemeStyle(visualTheme.palette, visualTheme.imageUrl),
    [visualTheme]
  );

  const themeClass = visualTheme.imageUrl
    ? "has-establishment-image"
    : "is-default-theme";

  return (
    <div
      ref={shellRef}
      className={`establishment-theme-shell ${themeClass}`}
      style={themeStyle}
    >
      <EstablishmentExperiencePage />
    </div>
  );
}
