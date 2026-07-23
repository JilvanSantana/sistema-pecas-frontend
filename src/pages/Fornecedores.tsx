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
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  tipo: string;
  contato: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

const Fornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    tipo: 'fabricante',
    contato: '',
    email: '',
    telefone: '',
    observacoes: '',
  });

  const carregarDados = async () => {
    try {
      const res = await api.get('/fornecedor');
      setFornecedores(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      await api.post('/fornecedor', form);
      setAbrirDialog(false);
      setForm({ nome: '', cnpj: '', tipo: 'fabricante', contato: '', email: '', telefone: '', observacoes: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Fornecedores / Fabricantes
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Novo Fornecedor
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
                <TableCell sx={celulaCabecalhoFixo}>Tipo</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>CNPJ</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Contato</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Email</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Telefone</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhum fornecedor cadastrado ainda
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell>{f.nome}</TableCell>
                    <TableCell>
                      <Chip
                        label={f.tipo === 'fabricante' ? 'Fabricante' : 'Fornecedor'}
                        color={f.tipo === 'fabricante' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{f.cnpj || '-'}</TableCell>
                    <TableCell>{f.contato || '-'}</TableCell>
                    <TableCell>{f.email || '-'}</TableCell>
                    <TableCell>{f.telefone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={f.ativo ? 'Ativo' : 'Inativo'}
                        color={f.ativo ? 'success' : 'error'}
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
        <DialogTitle>Novo Fornecedor</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="fabricante">Fabricante</MenuItem>
            <MenuItem value="fornecedor">Fornecedor</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="CNPJ"
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Contato (nome da pessoa)"
            value={form.contato}
            onChange={(e) => setForm({ ...form, contato: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Observações"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            multiline
            rows={3}
          />
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