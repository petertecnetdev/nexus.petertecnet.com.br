import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./GlobalModal.css";

const GlobalModalContext = createContext(null);

export function GlobalModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const open = useCallback((content, options = {}) => {
    setModal({
      content,
      options: {
        width: options.width || 720,
        closeOnBackdrop: options.closeOnBackdrop ?? false,
      },
    });
  }, []);

  const close = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <GlobalModalContext.Provider value={{ open, close }}>
      {children}

      {modal &&
        createPortal(
          <div
            className="global-modal-overlay"
            onClick={() =>
              modal.options.closeOnBackdrop && close()
            }
          >
            <div
              className="global-modal-container"
              style={{ width: modal.options.width }}
              onClick={(e) => e.stopPropagation()}
            >
              {modal.content}
            </div>
          </div>,
          document.body
        )}
    </GlobalModalContext.Provider>
  );
}

let modalApi = null;

export function GlobalModalBridge() {
  modalApi = useContext(GlobalModalContext);
  return null;
}

const GlobalModal = {
  open: (content, options) => {
    modalApi?.open(content, options);
  },
  close: () => {
    modalApi?.close();
  },
};

export default GlobalModal;
