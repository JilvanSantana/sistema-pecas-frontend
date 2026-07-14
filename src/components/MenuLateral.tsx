import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard,
  Build,
  Inventory,
  LocalShipping,
  Business,
  People,
  Factory,
  Assignment,
  Warning,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const LARGURA_MENU = 240;

const itensMenu = [
  { texto: 'Dashboard', icone: <Dashboard />, rota: '/dashboard' },
  { texto: 'Ordens de Serviço', icone: <Assignment />, rota: '/ordens-servico' },
  { texto: 'Equipamentos', icone: <Build />, rota: '/equipamentos' },
  { texto: 'Peças', icone: <Inventory />, rota: '/pecas' },
  { texto: 'Movimentações', icone: <LocalShipping />, rota: '/movimentacoes' },
  { texto: 'Aguardando Remessa', icone: <Warning sx={{ color: '#ff9800' }} />, rota: '/aguardando-remessa' },
  { texto: 'Bases', icone: <Business />, rota: '/bases' },
  { texto: 'Fornecedores', icone: <Factory />, rota: '/fornecedores' },
  { texto: 'Usuários', icone: <People />, rota: '/usuarios' },
];

const MenuLateral: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: LARGURA_MENU,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: LARGURA_MENU,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e',
          color: 'white',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ py: 1 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            ControlePeças
          </Typography>
          <Typography variant="caption" sx={{ color: '#90caf9' }}>
            Sistema de Fiscalização
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: '#3949ab' }} />
      <List>
        {itensMenu.map((item) => (
          <ListItem key={item.texto} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.rota)}
              selected={location.pathname === item.rota}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#3949ab',
                },
                '&:hover': {
                  backgroundColor: '#283593',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#90caf9' }}>
                {item.icone}
              </ListItemIcon>
              <ListItemText primary={item.texto} sx={{ color: 'white' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default MenuLateral;