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

interface Base {
  id: string;
  nome: string;
  tipo: string;
  estado: string;
  cidade: string;
  endereco: string;
  ativa: boolean;
}

const estados = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

const Bases: React.FC = () => {
  const { usuario } = useAuth();
  const [bases, setBases] = useState<Base[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    tipo: 'filial',
    estado: '',
    cidade: '',
    endereco: '',
  });

  const carregarDados = async () => {
    try {
      const res = await api.get(`/empresa/${usuario?.empresa_id}/bases`);
      setBases(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      await api.post(`/empresa/${usuario?.empresa_id}/bases`, form);
      setAbrirDialog(false);
      setForm({ nome: '', tipo: 'filial', estado: '', cidade: '', endereco: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Bases / Filiais
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Nova Base
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
                <TableCell sx={celulaCabecalhoFixo}>Estado</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Cidade</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Endereço</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bases.map((base) => (
                <TableRow key={base.id} hover>
                  <TableCell>{base.nome}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{base.tipo}</TableCell>
                  <TableCell>{base.estado}</TableCell>
                  <TableCell>{base.cidade || '-'}</TableCell>
                  <TableCell>{base.endereco || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={base.ativa ? 'Ativa' : 'Inativa'}
                      color={base.ativa ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Base</DialogTitle>
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
            <MenuItem value="sede">Sede</MenuItem>
            <MenuItem value="filial">Filial</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label="Estado"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
            sx={{ mb: 2 }}
          >
            {estados.map((uf) => (
              <MenuItem key={uf} value={uf}>{uf}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Cidade"
            value={form.cidade}
            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Endereço"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
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

export default Bases;