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

interface OrdemServico {
  id: string;
  tipo: string;
  status: string;
  data_abertura: string;
  data_conclusao: string | null;
  equipamento: { tipo: string; modelo: string; numero_serie: string; localizacao_instalacao: string };
  tecnico?: { usuario: { nome: string } };
}

const statusCores: Record<string, 'warning' | 'success' | 'info'> = {
  aberta: 'warning',
  em_andamento: 'info',
  concluida: 'success',
};

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
};

const tipoLabels: Record<string, string> = {
  corretiva: 'Corretiva',
  preventiva: 'Preventiva',
  afericao: 'Aferição',
};

const OrdensServico: React.FC = () => {
  const { usuario } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    equipamento_id: '',
    tipo: 'corretiva',
  });

  const carregarDados = async () => {
    try {
      const [resOrdens, resEquipamentos] = await Promise.all([
        api.get('/ordem-servico'),
        api.get('/equipamento'),
      ]);
      setOrdens(resOrdens.data);
      setEquipamentos(resEquipamentos.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      await api.post('/ordem-servico', form);
      setAbrirDialog(false);
      setForm({ equipamento_id: '', tipo: 'corretiva' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Ordens de Serviço
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Nova O.S.
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
                <TableCell sx={celulaCabecalhoFixo}>Equipamento</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Tipo</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Técnico</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Abertura</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Conclusão</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhuma ordem de serviço registrada ainda
                  </TableCell>
                </TableRow>
              ) : (
                ordens.map((os) => (
                  <TableRow key={os.id} hover>
                    <TableCell>
                      {os.equipamento?.tipo} — {os.equipamento?.modelo} ({os.equipamento?.localizacao_instalacao})
                    </TableCell>
                    <TableCell>
                      <Chip label={tipoLabels[os.tipo] || os.tipo} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{os.tecnico?.usuario?.nome || 'Não atribuído'}</TableCell>
                    <TableCell>{new Date(os.data_abertura).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[os.status] || os.status}
                        color={statusCores[os.status] || 'default'}
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
        <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Equipamento"
            value={form.equipamento_id}
            onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          >
            {equipamentos.map((eq) => (
              <MenuItem key={eq.id} value={eq.id}>
                {eq.tipo} — {eq.modelo} ({eq.localizacao_instalacao})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <MenuItem value="corretiva">Corretiva</MenuItem>
            <MenuItem value="preventiva">Preventiva</MenuItem>
            <MenuItem value="afericao">Aferição</MenuItem>
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

export default OrdensServico;