import axios from "axios";
import { apiBaseUrl } from "../config";

const apiServiceUrl = "user";

const userService = {
  getToken: () => localStorage.getItem("token"),

  handleError: (error, defaultMessage) => {
    console.error(error);
    throw new Error(defaultMessage);
  },

  checkAuth: (token) => {
    if (!token) {
      throw new Error("Usuário não autenticado.");
    }
  },

  list: async () => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}`, { headers });

      if (response.status === 200) {
        return response.data;
      }
      userService.handleError(null, "Erro ao obter a lista de usuários. Por favor, tente novamente.");
    } catch (error) {
      userService.handleError(error, "Erro ao obter a lista de usuários. Por favor, tente novamente.");
    }
  },

  update: async (userId, userData) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/${userId}`,
        userData,
        { headers }
      );

      if (response.status === 200) {
        return response.data;
      }
      userService.handleError(null, "Erro ao atualizar o usuário. Por favor, tente novamente.");
    } catch (error) {
      userService.handleError(error, "Erro ao atualizar o usuário. Por favor, tente novamente.");
    }
  },

  store: async (userData) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/new`,
        userData,
        { headers }
      );

      if (response.status === 201) {
        return response.data;
      }
      userService.handleError(null, "Erro ao criar o usuário. Por favor, tente novamente.");
    } catch (error) {
      userService.handleError(error, "Erro ao criar o usuário. Por favor, tente novamente.");
    }
  },

  show: async (userId) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}/${userId}`, { headers });

      if (response.status === 200) {
        return response.data;
      }
      userService.handleError(null, "Erro ao obter o perfil do usuário. Por favor, tente novamente.");
    } catch (error) {
      userService.handleError(error, "Erro ao obter o perfil do usuário. Por favor, tente novamente.");
    }
  },

  view: async (userName) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}/${userName}`, { headers });
      return response.data; 

    } catch (error) {
      userService.handleError(error, "Erro ao obter as informações do usuário. Por favor, tente novamente.");
    }
  },

  destroy: async (userId) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.delete(`${apiBaseUrl}/${apiServiceUrl}/${userId}`, { headers });

      if (response.status === 200) {
        return response.data;
      }
      userService.handleError(null, "Erro ao deletar o usuário. Por favor, tente novamente.");
    } catch (error) {
      userService.handleError(error, "Erro ao deletar o usuário. Por favor, tente novamente.");
    }
  },
};

export default userService;
