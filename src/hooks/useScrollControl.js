// src/hooks/useScrollControl.js
import { useRef } from "react";

export default function useScrollControl(scrollStep = 0.5) {
  const ref = useRef(null);

  const handleScroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * scrollStep), behavior: "smooth" });
  };

  return { ref, handleScroll };
}
