// src/hooks/useGlobalLoadingSync.jsx
import { useContext, useEffect } from "react";
import axios from "axios";
import { LoadingContext } from "../contexts/LoadingContext";

export const useGlobalLoadingSync = () => {
  const { push, pop } = useContext(LoadingContext);

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((cfg) => {
      push();
      return cfg;
    });
    const resInterceptor = axios.interceptors.response.use(
      (r) => {
        pop();
        return r;
      },
      (e) => {
        pop();
        return Promise.reject(e);
      }
    );
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [push, pop]);
};
