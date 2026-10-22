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
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
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
  const [abrirConfirmDelete, setAbrirConfirmDelete] = useState(false);
  const [usuarioParaDeletar, setUsuarioParaDeletar] = useState<Usuario | null>(null);
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

  const handleDeletar = async () => {
    if (!usuarioParaDeletar) return;
    try {
      await api.delete(`/empresa/usuarios/${usuarioParaDeletar.id}`);
      setAbrirConfirmDelete(false);
      setUsuarioParaDeletar(null);
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const confirmarDelete = (u: Usuario) => {
    setUsuarioParaDeletar(u);
    setAbrirConfirmDelete(true);
  };

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Usuários</Typography>
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
                <TableCell sx={celulaCabecalhoFixo}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{papelLabels[u.papel] || u.papel}</TableCell>
                  <TableCell>{u.base ? `${u.base.nome} - ${u.base.estado}` : '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.ativo ? 'Ativo' : 'Inativo'}
                      color={u.ativo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Excluir usuário">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => confirmarDelete(u)}
                        disabled={u.id === usuario?.id}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog novo usuário */}
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
          <TextField select fullWidth label="Base" value={form.base_id} onChange={(e) => setForm({ ...form, base_id: e.target.value })}>
            <MenuItem value="">Nenhuma</MenuItem>
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

      {/* Dialog confirmar exclusão */}
      <Dialog open={abrirConfirmDelete} onClose={() => setAbrirConfirmDelete(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o usuário <strong>{usuarioParaDeletar?.nome}</strong>?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirConfirmDelete(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeletar}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Usuarios;