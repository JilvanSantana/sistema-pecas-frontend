import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MenuLateral from './MenuLateral';

const LARGURA_MENU = 240;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, logout } = useAuth();

  const labelPapel = () => {
    if (usuario?.papel === 'super_admin') return 'Super Admin';
    if (usuario?.papel === 'admin_global') return 'Sede';
    if (usuario?.papel === 'admin_base') return 'Base';
    if (usuario?.papel === 'tecnico') return 'Técnico';
    return 'Operador';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Nexo — {labelPapel()}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {usuario?.nome}
          </Typography>
          <Button color="inherit" onClick={logout} startIcon={<Logout />}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <MenuLateral />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${LARGURA_MENU}px`,
          mt: '64px',
          backgroundColor: '#f0f2f5',
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;