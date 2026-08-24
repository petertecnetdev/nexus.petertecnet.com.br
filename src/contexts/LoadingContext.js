import React, { createContext, useState, useCallback, useEffect } from "react";
import api from "../services/api";

export const LoadingContext = createContext({
  isLoading: false,
});

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);
  const isLoading = count > 0;

  const push = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const pop = useCallback(() => {
    setCount((c) => Math.max(c - 1, 0));
  }, []);

  useEffect(() => {
    const reqId = api.interceptors.request.use(
      (config) => {
        push();
        return config;
      },
      (error) => {
        pop();
        return Promise.reject(error);
      }
    );

    const resId = api.interceptors.response.use(
      (response) => {
        pop();
        return response;
      },
      (error) => {
        pop();
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [push, pop]);

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
