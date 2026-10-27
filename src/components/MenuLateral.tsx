import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Divider,
  Typography, Box,
} from '@mui/material';
import {
  Dashboard, Build, Inventory, LocalShipping, Business,
  People, Factory, Assignment, Warning, VerifiedUser,
  Description, Apartment, Store, Engineering, ManageSearch,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LARGURA_MENU = 240;

const MenuLateral: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();

  const papel = usuario?.papel || JSON.parse(localStorage.getItem('usuario') || '{}')?.papel || '';
  const isSuperAdmin = papel === 'super_admin';
  const isAdmin = papel === 'admin_global';
  const isAdminBase = papel === 'admin_base';

  const subtitulo = isSuperAdmin
    ? 'Super Admin'
    : isAdmin
    ? 'Administrador'
    : isAdminBase
    ? 'Admin da Base'
    : 'Operador';

  const itensMenu = [
    { texto: 'Dashboard',          icone: <Dashboard />,                         rota: '/dashboard',          papeis: ['super_admin', 'admin_global', 'admin_base', 'operador'] },
    { texto: 'Empresas',           icone: <Apartment />,                         rota: '/empresas',           papeis: ['super_admin'] },
    { texto: 'Ordens de Servico',  icone: <Assignment />,                        rota: '/ordens-servico',     papeis: ['admin_global', 'admin_base'] },
    { texto: 'Equipamentos',       icone: <Build />,                             rota: '/equipamentos',       papeis: ['admin_global', 'admin_base', 'operador'] },
    { texto: 'Afericoes',          icone: <VerifiedUser />,                      rota: '/afericoes',          papeis: ['admin_global', 'admin_base'] },
    { texto: 'Contratos',          icone: <Description />,                       rota: '/contratos',          papeis: ['admin_global', 'admin_base', 'operador'] },
    { texto: 'Pecas',              icone: <Inventory />,                         rota: '/pecas',              papeis: ['admin_global', 'admin_base', 'operador'] },
    { texto: 'Movimentacoes',      icone: <LocalShipping />,                     rota: '/movimentacoes',      papeis: ['admin_global', 'admin_base', 'operador'] },
    { texto: 'Aguardando Remessa', icone: <Warning sx={{ color: '#ff9800' }} />, rota: '/aguardando-remessa', papeis: ['admin_global', 'admin_base', 'operador'] },
    { texto: 'Estoque por Base',   icone: <Store />,                             rota: '/estoque-base',       papeis: ['admin_global', 'admin_base', 'operador'] },
    { texto: 'Manutencao',         icone: <Engineering />,                       rota: '/manutencao',         papeis: ['admin_global', 'admin_base', 'operador'] },
    { texto: 'Bases',              icone: <Business />,                          rota: '/bases',              papeis: ['admin_global'] },
    { texto: 'Fornecedores',       icone: <Factory />,                           rota: '/fornecedores',       papeis: ['admin_global'] },
    { texto: 'Usuarios',           icone: <People />,                            rota: '/usuarios',           papeis: ['admin_global', 'admin_base'] },
    { texto: 'Logs de Acesso',     icone: <ManageSearch />,                      rota: '/logs',               papeis: ['super_admin', 'admin_global'] },
  ].filter(item => item.papeis.includes(papel));

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
            Nexo
          </Typography>
          <Typography variant="caption" sx={{ color: '#90caf9' }}>
            {subtitulo}
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
                '&.Mui-selected': { backgroundColor: '#3949ab' },
                '&:hover': { backgroundColor: '#283593' },
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