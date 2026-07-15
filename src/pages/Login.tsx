import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      setErro('Preencha o email e a senha');
      return;
    }
    try {
      setCarregando(true);
      setErro('');
      await login(email, senha);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.message === 'ACESSO_NEGADO_TECNICO') {
        setErro('Acesso negado. Técnicos devem usar o app móvel ControlePeças.');
      } else {
        setErro('Email ou senha inválidos');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            ControlePeças
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sistema de Controle de Peças
          </Typography>
        </Box>

        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />

        <TextField fullWidth label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} sx={{ mb: 3 }} />

        <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={carregando}>
          {carregando ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;