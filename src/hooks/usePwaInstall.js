import { useCallback, useEffect, useState } from "react";

const isStandaloneDisplayMode = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

export default function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplayMode);
  const [isMobile, setIsMobile] = useState(isMobileDevice);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    const updateDeviceState = () => {
      setIsMobile(isMobileDevice());
      setIsInstalled(isStandaloneDisplayMode());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("resize", updateDeviceState);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("resize", updateDeviceState);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice?.outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return {
    canInstall: Boolean(deferredPrompt) && isMobile && !isInstalled,
    isInstalled,
    install,
  };
}
