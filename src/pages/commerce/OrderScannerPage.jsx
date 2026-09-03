import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Container, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaQrcode, FaStop } from "react-icons/fa";

import GlobalNav from "../../components/GlobalNav";
import { parseCommerceClaimQr } from "./qrPayload";
import "./Commerce.css";

export default function OrderScannerPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const detectorRef = useRef(null);
  const detectingRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [rawCode, setRawCode] = useState("");
  const [error, setError] = useState("");

  const stopCamera = () => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    detectingRef.current = false;
    setCameraActive(false);
  };

  const openClaim = (value) => {
    const parsed = parseCommerceClaimQr(value);
    if (!parsed) {
      setError("Este código não parece ser um QR de retirada/entrega válido da Nexus.");
      return false;
    }

    stopCamera();
    navigate(`/redeem/${encodeURIComponent(parsed.publicId)}?token=${encodeURIComponent(parsed.token)}`);
    return true;
  };

  const scanFrame = async () => {
    if (!detectorRef.current || !videoRef.current || detectingRef.current) {
      frameRef.current = window.requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      frameRef.current = window.requestAnimationFrame(scanFrame);
      return;
    }

    detectingRef.current = true;
    try {
      const codes = await detectorRef.current.detect(video);
      const rawValue = codes?.[0]?.rawValue;
      if (rawValue && openClaim(rawValue)) return;
    } catch {
      // Uma falha isolada de leitura não deve interromper a câmera.
    } finally {
      detectingRef.current = false;
    }

    frameRef.current = window.requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setError("");

    if (!window.isSecureContext) {
      setError("A câmera só pode ser usada em uma conexão HTTPS segura. Você ainda pode colar o link do QR abaixo.");
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setError("Este navegador não oferece leitura nativa de QR Code. Use Chrome/Edge atualizado ou cole o link do QR abaixo.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("A câmera não está disponível neste dispositivo. Cole o link do QR abaixo.");
      return;
    }

    try {
      stopCamera();
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      frameRef.current = window.requestAnimationFrame(scanFrame);
    } catch (cameraError) {
      stopCamera();
      if (cameraError?.name === "NotAllowedError") {
        setError("Permissão da câmera negada. Libere a câmera para a Nexus ou cole o link do QR abaixo.");
      } else {
        setError("Não foi possível iniciar a câmera. Você pode colar o link do QR abaixo.");
      }
    }
  };

  useEffect(() => () => stopCamera(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="commerce-page">
      <GlobalNav />
      <Container className="commerce-shell">
        <div className="commerce-card qr-scanner-card">
          <div className="commerce-heading">
            <span>Retirada e entrega</span>
            <h1>Ler QR Code da compra</h1>
            <p>Aponte a câmera para o QR do cliente. A Nexus mostrará a compra antes de registrar qualquer retirada.</p>
          </div>

          {error && <Alert variant="warning">{error}</Alert>}

          <div className={cameraActive ? "qr-scanner-stage active" : "qr-scanner-stage"}>
            <video ref={videoRef} muted playsInline aria-label="Câmera para leitura do QR Code" />
            <div className="qr-scanner-frame" aria-hidden="true" />
            {!cameraActive && (
              <div className="qr-scanner-placeholder">
                <FaQrcode size={54} />
                <strong>Pronto para conferir uma compra</strong>
                <span>Nada será marcado como retirado apenas por escanear.</span>
              </div>
            )}
          </div>

          <div className="commerce-actions qr-scanner-actions">
            {!cameraActive ? (
              <Button onClick={startCamera}><FaCamera /> Abrir câmera</Button>
            ) : (
              <Button variant="outline-light" onClick={stopCamera}><FaStop /> Fechar câmera</Button>
            )}
            <Button variant="outline-light" onClick={() => navigate("/orders/manage")}>Voltar aos pedidos</Button>
          </div>

          <div className="qr-scanner-manual">
            <h2>Sem câmera? Cole o código</h2>
            <p>Você também pode colar aqui o link completo contido no QR Code do cliente.</p>
            <Form onSubmit={(event) => { event.preventDefault(); openClaim(rawCode); }}>
              <Form.Group>
                <Form.Label>Link ou conteúdo do QR</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={rawCode}
                  onChange={(event) => setRawCode(event.target.value)}
                  placeholder="https://nexus.petertecnet.com.br/redeem/...?..."
                />
              </Form.Group>
              <Button className="mt-3" type="submit" disabled={!rawCode.trim()}><FaQrcode /> Conferir compra</Button>
            </Form>
          </div>
        </div>
      </Container>
    </div>
  );
}
