import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  base?: { nome: string; estado: string };
}

const papelLabels: Record<string, string> = {
  admin_global: 'Administrador',
  admin_base: 'Admin da Base',
  operador: 'Operador',
  tecnico: 'Técnico',
};

const Usuarios: React.FC = () => {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [bases, setBases] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    papel: 'operador',
    base_id: '',
  });

  const carregarDados = async () => {
    try {
      const [resUsuarios, resBases] = await Promise.all([
        api.get('/empresa/usuarios'),
        api.get(`/empresa/${usuario?.empresa_id}/bases`),
      ]);
      setUsuarios(resUsuarios.data);
      setBases(resBases.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      await api.post('/empresa/usuarios', {
        ...form,
        base_id: form.base_id || undefined,
      });
      setAbrirDialog(false);
      setForm({ nome: '', email: '', senha: '', papel: 'operador', base_id: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Usuários
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Novo Usuário
        </Button>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={celulaCabecalhoFixo}>Nome</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Email</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Papel</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Base</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={papelLabels[u.papel] || u.papel} color="primary" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{u.base ? `${u.base.nome} - ${u.base.estado}` : 'Todas'}</TableCell>
                  <TableCell>
                    <Chip label={u.ativo ? 'Ativo' : 'Inativo'} color={u.ativo ? 'success' : 'error'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Senha" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Papel" value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="admin_global">Administrador</MenuItem>
            <MenuItem value="admin_base">Admin da Base</MenuItem>
            <MenuItem value="operador">Operador</MenuItem>
            <MenuItem value="tecnico">Técnico</MenuItem>
          </TextField>
          <TextField select fullWidth label="Base (opcional para admin global)" value={form.base_id} onChange={(e) => setForm({ ...form, base_id: e.target.value })}>
            <MenuItem value="">Nenhuma (acesso geral)</MenuItem>
            {bases.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.nome} - {b.estado}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Usuarios;