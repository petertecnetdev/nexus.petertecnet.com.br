// LoadingIndicator.js
import React from 'react';
import loadingImage from '../images/logo.gif';

const LoadingComponent = () => {
  return (

 
    <div style={{ 
      background: `url('/images/background-2.png') no-repeat center center`,
      backgroundSize: 'cover',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      padding: '0 20px', // Adiciona padding para evitar que a imagem toque as bordas
      boxSizing: 'border-box' // Inclui padding nas dimensões totais do container
    }}>
      <img 
        src={loadingImage} 
        alt="Loading Rosaio" 
        style={{ 
          borderRadius: '50%', // Para um efeito de círculo
          width: '50%', // Tamanho responsivo
          maxWidth: '200px', // Limita o tamanho máximo
          height: 'auto' // Mantém a proporção da imagem
        }} 
      />
    </div>
  );
}

export default LoadingComponent;
