import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import { Add, Download } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { exportarAfericoes } from '../services/exportar';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Afericao {
  id: string;
  tipo: string;
  data_realizacao: string;
  data_validade: string;
  responsavel: string;
  observacao: string;
  equipamento: {
    tipo: string;
    numero_serie: string;
    localizacao_instalacao: string;
    base: { nome: string; estado: string } | null;
  } | null;
}

interface Equipamento {
  id: string;
  tipo: string;
  numero_serie: string;
  localizacao_instalacao: string;
}

const Afericoes: React.FC = () => {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || '';

  const [afericoes, setAfericoes] = useState<Afericao[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [bases, setBases] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [baseFiltro, setBaseFiltro] = useState(searchParams.get('base') || '');
  const [form, setForm] = useState({
    equipamento_id: '',
    tipo: '',
    data_realizacao: '',
    data_validade: '',
    responsavel: '',
    observacao: '',
  });

  const carregarDados = async (signal?: AbortSignal) => {
    try {
      const [resAfericoes, resEquipamentos] = await Promise.all([
        api.get('/afericao', { signal }),
        api.get('/equipamento', { signal }),
      ]);
      setAfericoes(resAfericoes.data);
      setEquipamentos(resEquipamentos.data);
      const basesUnicas = Array.from(
        new Set(
          (resAfericoes.data as Afericao[])
            .map((a) => a.equipamento?.base?.nome)
            .filter(Boolean) as string[]
        )
      ).sort();
      setBases(basesUnicas);
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

  useEffect(() => {
    setBaseFiltro(searchParams.get('base') || '');
  }, [searchParams]);

  const handleSalvar = async () => {
    try {
      await api.post('/afericao', form);
      setAbrirDialog(false);
      setForm({ equipamento_id: '', tipo: '', data_realizacao: '', data_validade: '', responsavel: '', observacao: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const calcularStatus = (dataValidade: string) => {
    const dias = Math.ceil((new Date(dataValidade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { label: 'Vencida', color: 'error' as const };
    if (dias <= 45) return { label: `Vence em ${dias}d`, color: 'warning' as const };
    return { label: 'Válida', color: 'success' as const };
  };

  const afericoesFiltradas = afericoes.filter((a) => {
    if (baseFiltro && a.equipamento?.base?.nome !== baseFiltro) return false;
    if (statusParam === 'vencida') {
      const dias = Math.ceil((new Date(a.data_validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return dias < 0;
    }
    if (statusParam === 'vencendo') {
      const dias = Math.ceil((new Date(a.data_validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return dias >= 0 && dias <= 45;
    }
    return true;
  });

  const titulo = statusParam === 'vencida' ? 'Aferições Vencidas' : statusParam === 'vencendo' ? 'Aferições Vencendo' : 'Aferições';

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {titulo}{baseFiltro ? ` — ${baseFiltro}` : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField select size="small" label="Filtrar por Base" value={baseFiltro} onChange={(e) => setBaseFiltro(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">Todas as Bases</MenuItem>
            {bases.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </TextField>
          <Button variant="outlined" startIcon={<Download />} onClick={() => exportarAfericoes(afericoesFiltradas)}>
            Exportar Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
            Nova Aferição
          </Button>
        </Box>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={celulaCabecalhoFixo}>Equipamento</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Base</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Tipo</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Realização</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Validade</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Responsável</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {afericoesFiltradas.map((a) => {
                const status = calcularStatus(a.data_validade);
                return (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography variant="body2">{a.equipamento?.tipo}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.equipamento?.numero_serie} — {a.equipamento?.localizacao_instalacao}</Typography>
                    </TableCell>
                    <TableCell>{a.equipamento?.base ? `${a.equipamento.base.nome} - ${a.equipamento.base.estado}` : '—'}</TableCell>
                    <TableCell>{a.tipo}</TableCell>
                    <TableCell>{new Date(a.data_realizacao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{new Date(a.data_validade).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{a.responsavel}</TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Aferição</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Equipamento" value={form.equipamento_id} onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })} sx={{ mt: 2, mb: 2 }}>
            {equipamentos.map((e) => <MenuItem key={e.id} value={e.id}>{e.tipo} — {e.numero_serie} ({e.localizacao_instalacao})</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Tipo de Aferição" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Data de Realização" type="date" value={form.data_realizacao} onChange={(e) => setForm({ ...form, data_realizacao: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />
          <TextField fullWidth label="Data de Validade" type="date" value={form.data_validade} onChange={(e) => setForm({ ...form, data_validade: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />
          <TextField fullWidth label="Responsável" value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Observação" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Afericoes;