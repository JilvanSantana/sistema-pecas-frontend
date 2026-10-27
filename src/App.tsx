import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Equipamentos = lazy(() => import('./pages/Equipamentos'));
const Pecas = lazy(() => import('./pages/Pecas'));
const HistoricoPeca = lazy(() => import('./pages/HistoricoPeca'));
const Movimentacoes = lazy(() => import('./pages/Movimentacoes'));
const Bases = lazy(() => import('./pages/Bases'));
const Fornecedores = lazy(() => import('./pages/Fornecedores'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const OrdensServico = lazy(() => import('./pages/OrdensServico'));
const AguardandoRemessa = lazy(() => import('./pages/AguardandoRemessa'));
const Afericoes = lazy(() => import('./pages/Afericoes'));
const Contratos = lazy(() => import('./pages/Contratos'));
const Empresas = lazy(() => import('./pages/Empresas'));
const Logs = lazy(() => import('./pages/Logs'));
const EstoquePorBase = lazy(() => import('./pages/EstoquePorBase'));
const PecasManutencao = lazy(() => import('./pages/PecasManutencao'));

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

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
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
            <Route path="/equipamentos" element={<RotaProtegida><Equipamentos /></RotaProtegida>} />
            <Route path="/pecas" element={<RotaProtegida><Pecas /></RotaProtegida>} />
            <Route path="/pecas/:id/historico" element={<RotaProtegida><HistoricoPeca /></RotaProtegida>} />
            <Route path="/movimentacoes" element={<RotaProtegida><Movimentacoes /></RotaProtegida>} />
            <Route path="/bases" element={<RotaProtegida><Bases /></RotaProtegida>} />
            <Route path="/fornecedores" element={<RotaProtegida><Fornecedores /></RotaProtegida>} />
            <Route path="/usuarios" element={<RotaProtegida><Usuarios /></RotaProtegida>} />
            <Route path="/ordens-servico" element={<RotaProtegida><OrdensServico /></RotaProtegida>} />
            <Route path="/aguardando-remessa" element={<RotaProtegida><AguardandoRemessa /></RotaProtegida>} />
            <Route path="/afericoes" element={<RotaProtegida><Afericoes /></RotaProtegida>} />
            <Route path="/contratos" element={<RotaProtegida><Contratos /></RotaProtegida>} />
            <Route path="/empresas" element={<RotaProtegida><Empresas /></RotaProtegida>} />
            <Route path="/estoque-base" element={<RotaProtegida><EstoquePorBase /></RotaProtegida>} />
            <Route path="/manutencao" element={<RotaProtegida><PecasManutencao /></RotaProtegida>} />
            <Route path="/logs" element={<RotaProtegida><Logs /></RotaProtegida>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;