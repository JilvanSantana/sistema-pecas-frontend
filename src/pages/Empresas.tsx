import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

const Empresas: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({ nome: '', cnpj: '', email: '', telefone: '' });

  const carregarDados = async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/empresa', { signal });
      setEmpresas(res.data);
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
      await api.post('/empresa', form);
      setAbrirDialog(false);
      setForm({ nome: '', cnpj: '', email: '', telefone: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Empresas</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Nova Empresa
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
                <TableCell sx={celulaCabecalhoFixo}>CNPJ</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Email</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Telefone</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>{e.nome}</TableCell>
                  <TableCell>{e.cnpj}</TableCell>
                  <TableCell>{e.email}</TableCell>
                  <TableCell>{e.telefone}</TableCell>
                  <TableCell>
                    <Chip label={e.ativo ? 'Ativa' : 'Inativa'} color={e.ativo ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Empresa</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Empresas;