import axios from "axios";
import { apiBaseUrl } from "../config";

const apiServiceUrl = "auth";

const authService = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token),

  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/login`,
        {
          email,
          password,
        }
      );

      if (response.status === 200) {
        const { token, user, message } = response.data;

        // Armazenar o token no localStorage
        authService.setToken(token.original.access_token);

        // Mensagem de login bem-sucedido
        console.log(message);

        // Redirecionar para o dashboard
        window.location.href = "/dashboard";

        return { success: true, user }; // Retornar o status de sucesso e o usuário logado
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (error) {
      // Verifica se há uma resposta da API com uma mensagem de erro
      if (error.response && error.response.data.error) {
        throw new Error(error.response.data.error); // Lança o erro retornado pela API
      } else if (error.response && error.response.data.errors) {
        throw error.response.data.errors; // Para erros de validação
      } else {
        throw new Error("Erro durante o login. Por favor, tente novamente.");
      }
    }
  },

  register: async (userObject) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/register`,
        userObject
      );

      if (response.data.message === "Registro bem-sucedido") {
        await authService.login(userObject.email, userObject.password);
        return true; // Registro bem-sucedido
      }
    } catch (error) {
      if (error.response && error.response.data.errors) {
        throw error.response.data.errors;
      } else {
        throw new Error("Erro durante o registro. Por favor, tente novamente.");
      }
    }
  },

  logout: async () => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/logout`
      );

      if (response.status === 200) {
        // Remover o token do armazenamento local
        localStorage.removeItem("token");

        // Redirecionar o usuário para a página de login
        window.location.href = "/login";

        return true; // Logout realizado com sucesso
      } else if (response.status === 401) {
        throw new Error(response.data.error);
      } else {
        throw new Error("Erro ao fazer logout. Por favor, tente novamente.");
      }
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao fazer logout. Por favor, tente novamente.");
    }
  },

  emailVerify: async (verificationCode) => {
    try {
      const headers = {
        Authorization: `Bearer ${authService.getToken()}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/email-verify`,
        { verification_code: verificationCode },
        { headers }
      );

      if (response.status === 200) {
        window.location.href = "/dashboard";
        return true; // Verificação de e-mail bem-sucedida
      }
    } catch (error) {
      console.error(error);
      throw new Error("Erro durante a verificação do e-mail");
    }
  },
  changePassword: async (current_password, new_password, confirm_password) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Usuário não autenticado.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/change-password`,
        {
          current_password: current_password,
          new_password: new_password,
          confirm_password: confirm_password,
        },
        { headers }
      );

      if (response.status === 200) {
        return true; // Alteração de senha bem-sucedida
      } else {
        throw new Error("Erro ao alterar a senha. Por favor, tente novamente.");
      }
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao alterar a senha. Por favor, tente novamente.");
    }
  },
  me: async () => {
    const token = localStorage.getItem("token");
    
    // Simula um pequeno atraso (útil para UX durante testes)
    await new Promise((resolve) => setTimeout(resolve, 500));
  
    // Se não houver token, redireciona para a página de login
    if (!token) {
      throw new Error("Usuário não autenticado.");
    }
  
    try {
      // Configura o cabeçalho de autenticação
      const headers = {
        Authorization: `Bearer ${token}`,
      };
  
      // Faz a requisição para obter os dados do usuário
      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}/me`, { headers });
      
      // Simula um pequeno atraso após a resposta (útil para UX)
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Retorna os dados do usuário se a requisição foi bem-sucedida
      return response.data;
    } catch (error) {
      // Exibe o erro no console para depuração
      console.error("Erro ao obter os dados do usuário:", error);
      
      window.location.href = "/login";
      throw new Error("Erro ao obter os dados do usuário.");
    }
  },
  
  passwordEmail: async (email) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/password-email`,
        { email }
      );
      // Retorna o JSON completo da resposta, independentemente do status
      return response.data; 
    } catch (error) {
      // Verifica se houve um erro de comunicação
      if (!error.response) {
        // Se não houver resposta, é um problema de comunicação
        throw new Error("Houve uma falha na comunicação com o servidor. Por favor, tente novamente.");
      }

      // Se a API respondeu, mas com erro, retorna a resposta do erro
      return error.response.data; // Retorna o JSON de erro do backend
    }
  },
  
  passwordReset: async (email, resetCode, newPassword) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/password-reset`,
        {
          email: email,
          reset_password_code: resetCode,
          password: newPassword,
        }
      );
  
      return response; // Retorna a resposta diretamente para ser utilizada no submit
    } catch (error) {
      // Verifica se existe uma mensagem de erro na resposta
      if (error.response) {
        const message = error.response.data.message || "Erro durante a redefinição de senha.";
        const status = error.response.status;
  
        // Lança uma nova instância de erro com a mensagem e o status
        throw new Error(`${message} (Status: ${status})`);
      } else {
        throw new Error("Erro durante a redefinição de senha. Por favor, tente novamente.");
      }
    }
  },
  
  resendCodeEmailVerification: async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Usuário não autenticado.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/resend-code-email-verification`,
        {}, // Remova o segundo parâmetro se a rota não esperar dados adicionais
        { headers }
      );

      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        "Erro ao reenviar o código de verificação. Por favor, tente novamente."
      );
    }
  },
};

export default authService;
