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

interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  base: { nome: string; estado: string } | null;
}

const papelLabels: Record<string, string> = {
  admin_global: 'Admin Global',
  admin_base: 'Admin Base',
  operador: 'Operador',
  auditor: 'Auditor',
  tecnico: 'Técnico',
};

const papelCores: Record<string, 'error' | 'warning' | 'info' | 'default' | 'success'> = {
  admin_global: 'error',
  admin_base: 'warning',
  operador: 'info',
  auditor: 'default',
  tecnico: 'success',
};

const Usuarios: React.FC = () => {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [bases, setBases] = useState<any[]>([]);
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
        api.get(`/empresa/${usuario?.empresa_id}/usuarios`),
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
      await api.post('/auth/registrar', {
        ...form,
        empresa_id: usuario?.empresa_id,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1a237e' }}>
                <TableCell sx={{ color: 'white' }}>Nome</TableCell>
                <TableCell sx={{ color: 'white' }}>Email</TableCell>
                <TableCell sx={{ color: 'white' }}>Papel</TableCell>
                <TableCell sx={{ color: 'white' }}>Base</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={papelLabels[u.papel] || u.papel}
                        color={papelCores[u.papel] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{u.base ? `${u.base.nome} - ${u.base.estado}` : 'Todas as bases'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.ativo ? 'Ativo' : 'Inativo'}
                        color={u.ativo ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Senha" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Papel" value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })} sx={{ mb: 2 }}>
            {Object.entries(papelLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Base (opcional para admin global)" value={form.base_id} onChange={(e) => setForm({ ...form, base_id: e.target.value })}>
            <MenuItem value="">Todas as bases</MenuItem>
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