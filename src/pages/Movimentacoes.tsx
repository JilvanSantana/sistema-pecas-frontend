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
  IconButton,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  FormControl,
} from '@mui/material';
import { Add, CheckCircle, Download } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { exportarMovimentacoes } from '../services/exportar';
import AlertaChip from '../components/AlertaChip';
import { calcularTempoAberto } from '../utils/prazos';

interface Movimentacao {
  id: string;
  peca: { descricao: string; codigo_qr: string };
  origem_tipo: string;
  destino_tipo: string;
  motivo_envio: string;
  status: string;
  data_envio: string;
  codigo_rastreio: string;
  causou_parada: boolean;
}

const statusCores: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
  enviada: 'warning',
  em_transito: 'info',
  recebida: 'success',
  divergente: 'error',
};

const statusLabels: Record<string, string> = {
  enviada: 'Enviada',
  em_transito: 'Em Trânsito',
  recebida: 'Recebida',
  divergente: 'Divergente',
};

const motivoLabels: Record<string, string> = {
  manutencao_corretiva: 'Manutenção Corretiva',
  manutencao_preventiva: 'Manutenção Preventiva',
  reposicao_estoque: 'Reposição de Estoque',
  garantia_troca: 'Garantia/Troca',
  devolucao: 'Devolução',
  transferencia_bases: 'Transferência entre Bases',
  reparo_fabricante: 'Reparo no Fabricante',
  outro: 'Outro',
};

// Prazos de referência (em dias) para peças aguardando envio/retorno
const LIMITE_ATENCAO_DIAS = 7;
const LIMITE_CRITICO_DIAS = 15;

const Movimentacoes: React.FC = () => {
  const { usuario } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [abrirConfirmar, setAbrirConfirmar] = useState(false);
  const [movSelecionada, setMovSelecionada] = useState<string | null>(null);
  const [condicao, setCondicao] = useState('boa');
  const [pecas, setPecas] = useState<any[]>([]);
  const [bases, setBases] = useState<any[]>([]);
  const [form, setForm] = useState({
    peca_id: '',
    origem_tipo: 'base',
    origem_id: '',
    destino_tipo: 'base',
    destino_id: '',
    motivo_envio: '',
    descricao_problema: '',
    codigo_rastreio: '',
    transportadora: '',
    causou_parada: false,
  });

  const carregarDados = async () => {
    try {
      const [resMov, resPecas, resBases] = await Promise.all([
        api.get('/movimentacao'),
        api.get('/peca'),
        api.get(`/empresa/${usuario?.empresa_id}/bases`),
      ]);
      setMovimentacoes(resMov.data);
      setPecas(resPecas.data);
      setBases(resBases.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      await api.post('/movimentacao', form);
      setAbrirDialog(false);
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAbrirConfirmar = (id: string) => {
    setMovSelecionada(id);
    setCondicao('boa');
    setAbrirConfirmar(true);
  };

  const handleConfirmarRecebimento = async () => {
    try {
      await api.post(`/movimentacao/${movSelecionada}/confirmar`, {
        confirmado: true,
        condicao,
      });
      setAbrirConfirmar(false);
      setMovSelecionada(null);
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const estaAguardando = (status: string) => status === 'enviada' || status === 'em_transito';

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Movimentações
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={() => exportarMovimentacoes(movimentacoes)}>
            Exportar Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
            Nova Movimentação
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
                <TableCell sx={{ color: 'white' }}>Peça</TableCell>
                <TableCell sx={{ color: 'white' }}>Motivo</TableCell>
                <TableCell sx={{ color: 'white' }}>Origem → Destino</TableCell>
                <TableCell sx={{ color: 'white' }}>Rastreio</TableCell>
                <TableCell sx={{ color: 'white' }}>Parada</TableCell>
                <TableCell sx={{ color: 'white' }}>Data</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Tempo Aguardando</TableCell>
                <TableCell sx={{ color: 'white' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimentacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhuma movimentação registrada ainda
                  </TableCell>
                </TableRow>
              ) : (
                movimentacoes.map((mov) => {
                  const prazo = estaAguardando(mov.status)
                    ? calcularTempoAberto(mov.data_envio, LIMITE_ATENCAO_DIAS, LIMITE_CRITICO_DIAS)
                    : null;
                  return (
                    <TableRow key={mov.id} hover>
                      <TableCell>
                        <Typography variant="body2">{mov.peca?.descricao}</Typography>
                        <Typography variant="caption" color="text.secondary">{mov.peca?.codigo_qr}</Typography>
                      </TableCell>
                      <TableCell>{motivoLabels[mov.motivo_envio] || mov.motivo_envio}</TableCell>
                      <TableCell>{mov.origem_tipo} → {mov.destino_tipo}</TableCell>
                      <TableCell>{mov.codigo_rastreio || '-'}</TableCell>
                      <TableCell>
                        <Chip label={mov.causou_parada ? 'Sim' : 'Não'} color={mov.causou_parada ? 'error' : 'success'} size="small" />
                      </TableCell>
                      <TableCell>{new Date(mov.data_envio).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Chip label={statusLabels[mov.status] || mov.status} color={statusCores[mov.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        {prazo ? <AlertaChip label={prazo.label} nivel={prazo.nivel} /> : '-'}
                      </TableCell>
                      <TableCell>
                        {(mov.status === 'enviada' || mov.status === 'em_transito') && (
                          <Tooltip title="Confirmar Recebimento">
                            <IconButton color="success" onClick={() => handleAbrirConfirmar(mov.id)}>
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirConfirmar} onClose={() => setAbrirConfirmar(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Recebimento</DialogTitle>
        <DialogContent>
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Em que condição a peça chegou?</FormLabel>
            <RadioGroup value={condicao} onChange={(e) => setCondicao(e.target.value)}>
              <FormControlLabel value="boa" control={<Radio />} label="Em bom estado — vai para estoque" />
              <FormControlLabel value="defeituosa" control={<Radio />} label="Defeituosa — aguardando análise" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirConfirmar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmarRecebimento}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Movimentação</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Peça" value={form.peca_id} onChange={(e) => setForm({ ...form, peca_id: e.target.value })} sx={{ mt: 2, mb: 2 }}>
            {pecas.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.descricao} — {p.codigo_qr}</MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Base de Origem" value={form.origem_id} onChange={(e) => setForm({ ...form, origem_id: e.target.value })} sx={{ mb: 2 }}>
            {bases.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.nome} - {b.estado}</MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Base de Destino" value={form.destino_id} onChange={(e) => setForm({ ...form, destino_id: e.target.value })} sx={{ mb: 2 }}>
            {bases.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.nome} - {b.estado}</MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Motivo" value={form.motivo_envio} onChange={(e) => setForm({ ...form, motivo_envio: e.target.value })} sx={{ mb: 2 }}>
            {Object.entries(motivoLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Descrição do Problema" value={form.descricao_problema} onChange={(e) => setForm({ ...form, descricao_problema: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Código de Rastreio" value={form.codigo_rastreio} onChange={(e) => setForm({ ...form, codigo_rastreio: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Transportadora" value={form.transportadora} onChange={(e) => setForm({ ...form, transportadora: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Causou Parada?" value={form.causou_parada ? 'sim' : 'nao'} onChange={(e) => setForm({ ...form, causou_parada: e.target.value === 'sim' })}>
            <MenuItem value="nao">Não</MenuItem>
            <MenuItem value="sim">Sim</MenuItem>
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

export default Movimentacoes;