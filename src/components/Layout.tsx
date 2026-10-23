import React, { useEffect, useState } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button,
  IconButton, Badge, Popover, List, ListItem,
  ListItemText, Divider, Chip,
} from '@mui/material';
import { Logout, Notifications } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MenuLateral from './MenuLateral';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const LARGURA_MENU = 240;

interface Alerta {
  id: string;
  descricao: string;
  status_atual: string;
  dias: number;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [ancora, setAncora] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    const buscarAlertas = async () => {
      try {
        const res = await api.get('/peca/manutencao');
        const hoje = new Date();
        const lista: Alerta[] = res.data
          .map((p: any) => {
            const mov = p.movimentacao?.[0];
            if (!mov) return null;
            const dias = Math.floor(
              (hoje.getTime() - new Date(mov.data_envio).getTime()) / (1000 * 60 * 60 * 24)
            );
            const limite = p.status_atual === 'defeituosa_aguardando_analise' ? 7 : 30;
            if (dias < limite) return null;
            return { id: p.id, descricao: p.descricao, status_atual: p.status_atual, dias };
          })
          .filter(Boolean);
        setAlertas(lista);
      } catch (e) { console.error(e); }
    };
    buscarAlertas();
  }, [usuario]);

  const labelPapel = () => {
    if (usuario?.papel === 'super_admin') return 'Super Admin';
    if (usuario?.papel === 'admin_global') return 'Sede';
    if (usuario?.papel === 'admin_base') return 'Base';
    if (usuario?.papel === 'tecnico') return 'Tecnico';
    return 'Operador';
  };

  const labelStatus = (status: string) =>
    status === 'defeituosa_aguardando_analise' ? 'Aguardando Analise' : 'Em Reparo';

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Nexo - {labelPapel()}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {usuario?.nome}
          </Typography>

          <IconButton
            color="inherit"
            sx={{ mr: 1 }}
            onClick={(e) => setAncora(e.currentTarget)}
          >
            <Badge badgeContent={alertas.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Popover
            open={Boolean(ancora)}
            anchorEl={ancora}
            onClose={() => setAncora(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ width: 340 }}>
              <Box sx={{ p: 2, backgroundColor: '#1a237e' }}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Alertas de Manutencao
                </Typography>
              </Box>
              {alertas.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
                  <Typography>Nenhum alerta no momento</Typography>
                </Box>
              ) : (
                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {alertas.map((a, i) => (
                    <React.Fragment key={a.id}>
                      <ListItem
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                        onClick={() => { navigate('/manutencao'); setAncora(null); }}
                      >
                        <ListItemText
                          primary={a.descricao}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={labelStatus(a.status_atual)}
                                size="small"
                                color={a.status_atual === 'defeituosa_aguardando_analise' ? 'error' : 'warning'}
                              />
                              <Chip
                                label={`${a.dias} dias`}
                                size="small"
                                variant="outlined"
                                color="error"
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {i < alertas.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Popover>

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
