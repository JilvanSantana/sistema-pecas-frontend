import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Base {
  id: string;
  nome: string;
  estado: string;
  cidade: string;
  endereco: string;
}

const Bases: React.FC = () => {
  const { usuario } = useAuth();
  const [bases, setBases] = useState<Base[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({ nome: '', estado: '', cidade: '', endereco: '' });

  const carregarDados = async (signal?: AbortSignal) => {
    try {
      const res = await api.get(`/empresa/${usuario?.empresa_id}/bases`, { signal });
      setBases(res.data);
    } catch (error: any) {
      if (error?.code !== 'ERR_CANCELED') console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    carregarDados(ac.signal);
    return () => ac.abort();
  }, []);

  const handleSalvar = async () => {
    try {
      await api.post(`/empresa/${usuario?.empresa_id}/bases`, form);
      setAbrirDialog(false);
      setForm({ nome: '', estado: '', cidade: '', endereco: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Bases</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Nova Base
        </Button>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={celulaCabecalhoFixo}>Nome</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Estado</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Cidade</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Endereço</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bases.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell>{b.nome}</TableCell>
                  <TableCell>{b.estado}</TableCell>
                  <TableCell>{b.cidade}</TableCell>
                  <TableCell>{b.endereco}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Base</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Bases;