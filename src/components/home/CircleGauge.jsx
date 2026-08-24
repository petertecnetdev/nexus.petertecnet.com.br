import React, { useEffect, useState } from "react";

export default function CircleGauge({ value }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setProgress(value || 0);
    }, 80);
    return () => clearTimeout(t);
  }, [value]);

  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference - (progress / 100) * circumference > 0
      ? circumference - (progress / 100) * circumference
      : 0;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg width={size} height={size}>
        <circle
          stroke="#1f2a33"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="#00e0ff"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.9s ease",
          }}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          fontSize: "32px",
          fontWeight: "700",
          color: "#ffffff",
          textAlign: "center",
          lineHeight: "32px",
        }}
      >
        {value}
      </div>
    </div>
  );
}
