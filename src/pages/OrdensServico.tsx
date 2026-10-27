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

interface OrdemServico {
  id: string;
  numero: string;
  tipo: string;
  status: string;
  prioridade: string;
  descricao: string;
  criado_em: string;
  equipamento: { tipo: string; numero_serie: string; localizacao_instalacao: string } | null;
}

interface Equipamento {
  id: string;
  tipo: string;
  numero_serie: string;
  localizacao_instalacao: string;
}

const statusCores: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  aberta: 'warning',
  em_andamento: 'info',
  concluida: 'success',
  cancelada: 'default',
};

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const prioridadeCores: Record<string, 'error' | 'warning' | 'info'> = {
  alta: 'error',
  media: 'warning',
  baixa: 'info',
};

const OrdensServico: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    equipamento_id: '',
    tipo: 'corretiva',
    prioridade: 'media',
    descricao: '',
  });

  const carregarDados = async (signal?: AbortSignal) => {
    try {
      const [resOrdens, resEquipamentos] = await Promise.all([
        api.get('/ordem-servico', { signal }),
        api.get('/equipamento', { signal }),
      ]);
      setOrdens(resOrdens.data);
      setEquipamentos(resEquipamentos.data);
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
      await api.post('/ordem-servico', form);
      setAbrirDialog(false);
      setForm({ equipamento_id: '', tipo: 'corretiva', prioridade: 'media', descricao: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Ordens de Serviço</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Nova OS
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
                <TableCell sx={celulaCabecalhoFixo}>Equipamento</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Tipo</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Prioridade</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Descrição</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Data</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhuma ordem de serviço registrada
                  </TableCell>
                </TableRow>
              ) : (
                ordens.map((os) => (
                  <TableRow key={os.id} hover>
                    <TableCell>{os.numero}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{os.equipamento?.tipo}</Typography>
                      <Typography variant="caption" color="text.secondary">{os.equipamento?.numero_serie} — {os.equipamento?.localizacao_instalacao}</Typography>
                    </TableCell>
                    <TableCell>{os.tipo}</TableCell>
                    <TableCell>
                      <Chip label={os.prioridade} color={prioridadeCores[os.prioridade] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>{os.descricao}</TableCell>
                    <TableCell>{new Date(os.criado_em).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Chip label={statusLabels[os.status] || os.status} color={statusCores[os.status] || 'default'} size="small" />
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
          <TextField select fullWidth label="Equipamento" value={form.equipamento_id} onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })} sx={{ mt: 2, mb: 2 }}>
            {equipamentos.map((e) => <MenuItem key={e.id} value={e.id}>{e.tipo} — {e.numero_serie} ({e.localizacao_instalacao})</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="corretiva">Corretiva</MenuItem>
            <MenuItem value="preventiva">Preventiva</MenuItem>
            <MenuItem value="preditiva">Preditiva</MenuItem>
          </TextField>
          <TextField select fullWidth label="Prioridade" value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="alta">Alta</MenuItem>
            <MenuItem value="media">Média</MenuItem>
            <MenuItem value="baixa">Baixa</MenuItem>
          </TextField>
          <TextField fullWidth label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} multiline rows={3} />
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