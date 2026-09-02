import React from "react";
import ProcessingIndicatorComponent from "./ProcessingIndicatorComponent";

/**
 * Legacy compatibility wrapper.
 *
 * Older Nexus screens may still import LoadingComponent. Keeping this tiny
 * adapter avoids reintroducing obsolete/heavy GIF and background assets while
 * ensuring every loading state uses the production Nexus indicator.
 */
export default function LoadingComponent() {
  return (
    <ProcessingIndicatorComponent
      messages={["Carregando a Nexus…", "Preparando seu catálogo…"]}
    />
  );
}
