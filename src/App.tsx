import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipamentos from './pages/Equipamentos';
import Pecas from './pages/Pecas';
import Movimentacoes from './pages/Movimentacoes';
import Bases from './pages/Bases';
import Fornecedores from './pages/Fornecedores';
import Usuarios from './pages/Usuarios';
import OrdensServico from './pages/OrdensServico';

const RotaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
          <Route path="/equipamentos" element={<RotaProtegida><Equipamentos /></RotaProtegida>} />
          <Route path="/pecas" element={<RotaProtegida><Pecas /></RotaProtegida>} />
          <Route path="/movimentacoes" element={<RotaProtegida><Movimentacoes /></RotaProtegida>} />
          <Route path="/bases" element={<RotaProtegida><Bases /></RotaProtegida>} />
          <Route path="/fornecedores" element={<RotaProtegida><Fornecedores /></RotaProtegida>} />
          <Route path="/usuarios" element={<RotaProtegida><Usuarios /></RotaProtegida>} />
          <Route path="/ordens-servico" element={<RotaProtegida><OrdensServico /></RotaProtegida>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;