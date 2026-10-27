import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Contrato {
  id: string;
  numero_contrato: string;
  orgao_contratante: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  valor_mensal: number | null;
  objeto: string;
}

const statusCores: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ativo: 'success',
  encerrado: 'default',
  suspenso: 'warning',
  em_renovacao: 'warning',
};

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  suspenso: 'Suspenso',
  em_renovacao: 'Em Renovação',
};

const Contratos: React.FC = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    numero_contrato: '',
    orgao_contratante: '',
    objeto: '',
    data_inicio: '',
    data_fim: '',
    valor_mensal: '',
    status: 'ativo',
  });

  const carregarDados = async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/contrato', { signal });
      setContratos(res.data);
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
      await api.post('/contrato', {
        ...form,
        valor_mensal: form.valor_mensal ? parseFloat(form.valor_mensal) : null,
        data_fim: form.data_fim || null,
      });
      setAbrirDialog(false);
      setForm({ numero_contrato: '', orgao_contratante: '', objeto: '', data_inicio: '', data_fim: '', valor_mensal: '', status: 'ativo' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const calcularDiasRestantes = (dataFim: string | null) => {
    if (!dataFim) return null;
    return Math.ceil((new Date(dataFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Contratos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Novo Contrato
        </Button>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={celulaCabecalhoFixo}>Número</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Órgão</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Objeto</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Início</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Fim</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Dias Restantes</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Valor Mensal</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contratos.map((c) => {
                const dias = calcularDiasRestantes(c.data_fim);
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.numero_contrato}</TableCell>
                    <TableCell>{c.orgao_contratante}</TableCell>
                    <TableCell>{c.objeto}</TableCell>
                    <TableCell>{new Date(c.data_inicio).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{c.data_fim ? new Date(c.data_fim).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell>
                      {dias === null ? '—' : (
                        <Chip
                          label={dias < 0 ? `Vencido há ${Math.abs(dias)}d` : `${dias}d`}
                          color={dias < 0 ? 'error' : dias <= 45 ? 'warning' : 'success'}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>{c.valor_mensal ? `R$ ${c.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</TableCell>
                    <TableCell><Chip label={statusLabels[c.status] || c.status} color={statusCores[c.status] || 'default'} size="small" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Contrato</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Número do Contrato" value={form.numero_contrato} onChange={(e) => setForm({ ...form, numero_contrato: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Órgão Contratante" value={form.orgao_contratante} onChange={(e) => setForm({ ...form, orgao_contratante: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Objeto" value={form.objeto} onChange={(e) => setForm({ ...form, objeto: e.target.value })} sx={{ mb: 2 }} multiline rows={2} />
          <TextField fullWidth label="Data de Início" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />
          <TextField fullWidth label="Data de Fim" type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />
          <TextField fullWidth label="Valor Mensal (R$)" type="number" value={form.valor_mensal} onChange={(e) => setForm({ ...form, valor_mensal: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <MenuItem value="ativo">Ativo</MenuItem>
            <MenuItem value="em_renovacao">Em Renovação</MenuItem>
            <MenuItem value="suspenso">Suspenso</MenuItem>
            <MenuItem value="encerrado">Encerrado</MenuItem>
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

export default Contratos;