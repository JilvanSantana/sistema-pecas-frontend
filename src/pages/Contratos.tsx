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
} from '@mui/material';
import { Add, Download } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { exportarContratos } from '../services/exportar';

interface Contrato {
  id: string;
  numero_contrato: string;
  orgao_contratante: string;
  sla_horas_atendimento: number;
  data_inicio: string;
  data_fim: string | null;
  status: string;
}

const Contratos: React.FC = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    numero_contrato: '',
    orgao_contratante: '',
    sla_horas_atendimento: '',
    data_inicio: '',
    data_fim: '',
  });

  const carregarDados = async () => {
    try {
      const res = await api.get('/contrato');
      setContratos(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      await api.post('/contrato', {
        ...form,
        sla_horas_atendimento: form.sla_horas_atendimento ? parseInt(form.sla_horas_atendimento, 10) : 0,
        data_fim: form.data_fim || undefined,
      });
      setAbrirDialog(false);
      setForm({ numero_contrato: '', orgao_contratante: '', sla_horas_atendimento: '', data_inicio: '', data_fim: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Contratos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={() => exportarContratos(contratos)}>
            Exportar Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
            Novo Contrato
          </Button>
        </Box>
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
                <TableCell sx={{ color: 'white' }}>Número</TableCell>
                <TableCell sx={{ color: 'white' }}>Órgão Contratante</TableCell>
                <TableCell sx={{ color: 'white' }}>SLA (horas)</TableCell>
                <TableCell sx={{ color: 'white' }}>Início</TableCell>
                <TableCell sx={{ color: 'white' }}>Fim</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contratos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhum contrato cadastrado ainda
                  </TableCell>
                </TableRow>
              ) : (
                contratos.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.numero_contrato}</TableCell>
                    <TableCell>{c.orgao_contratante}</TableCell>
                    <TableCell>{c.sla_horas_atendimento}h</TableCell>
                    <TableCell>{new Date(c.data_inicio).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{c.data_fim ? new Date(c.data_fim).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                        color={c.status === 'ativo' ? 'success' : 'default'}
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
        <DialogTitle>Novo Contrato</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Número do Contrato"
            value={form.numero_contrato}
            onChange={(e) => setForm({ ...form, numero_contrato: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Órgão Contratante"
            value={form.orgao_contratante}
            onChange={(e) => setForm({ ...form, orgao_contratante: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="SLA de Atendimento (horas)"
            value={form.sla_horas_atendimento}
            onChange={(e) => setForm({ ...form, sla_horas_atendimento: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Data de Início"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.data_inicio}
            onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Data de Fim (opcional)"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.data_fim}
            onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
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

export default Contratos;