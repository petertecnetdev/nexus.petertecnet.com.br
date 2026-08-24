// src/components/GlobalButton.jsx
import React from "react";
import PropTypes from "prop-types";
import "./GlobalButton.css";

export default function GlobalButton({
  children,
  variant,
  onClick,
  full,
  rounded,
  disabled,
  loading,
  size,
  className,
  type = "submit", // ✅ submit por padrão
  stopPropagation,
}) {
  const handleClick = (e) => {
    // ❗ NUNCA cancelar submit
    if (stopPropagation) {
      e.stopPropagation();
    }

    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`
        gbtn
        gbtn-${variant}
        gbtn-${size}
        ${full ? "gbtn-full" : ""}
        ${rounded ? "gbtn-rounded" : ""}
        ${loading ? "gbtn-loading" : ""}
        ${disabled ? "gbtn-disabled" : ""}
        ${className || ""}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? <span className="gbtn-loader" /> : children}
    </button>
  );
}

GlobalButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "danger",
    "success",
    "outline",
    "ghost",
    "warning",
  ]),
  onClick: PropTypes.func,
  full: PropTypes.bool,
  rounded: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  stopPropagation: PropTypes.bool,
};

GlobalButton.defaultProps = {
  variant: "primary",
  full: false,
  rounded: false,
  disabled: false,
  loading: false,
  size: "md",
  stopPropagation: false,
};
