import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  tipo_servico: string;
}

const Fornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({ nome: '', cnpj: '', email: '', telefone: '', tipo_servico: '' });

  const carregarDados = async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/fornecedor', { signal });
      setFornecedores(res.data);
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
      await api.post('/fornecedor', form);
      setAbrirDialog(false);
      setForm({ nome: '', cnpj: '', email: '', telefone: '', tipo_servico: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Fornecedores</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Novo Fornecedor
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
                <TableCell sx={celulaCabecalhoFixo}>Tipo de Serviço</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fornecedores.map((f) => (
                <TableRow key={f.id} hover>
                  <TableCell>{f.nome}</TableCell>
                  <TableCell>{f.cnpj}</TableCell>
                  <TableCell>{f.email}</TableCell>
                  <TableCell>{f.telefone}</TableCell>
                  <TableCell>{f.tipo_servico}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Fornecedor</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Tipo de Serviço" value={form.tipo_servico} onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Fornecedores;