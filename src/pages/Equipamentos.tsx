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
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Typography as Typo,
} from '@mui/material';
import { Add, Download, QrCode, Archive, Unarchive } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { exportarEquipamentos } from '../services/exportar';
import QrCodeModal from '../components/QrCodeModal';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Equipamento {
  id: string;
  tipo: string;
  modelo: string;
  fabricante: string;
  numero_serie: string;
  localizacao_instalacao: string;
  quantidade_faixas: number | null;
  status_operacional: string;
  qr_code: string;
  arquivado: boolean;
  base: { nome: string; estado: string };
  contrato: { numero_contrato: string; orgao_contratante: string } | null;
}

interface Contrato {
  id: string;
  numero_contrato: string;
  orgao_contratante: string;
}

interface Afericao {
  id: string;
  equipamento_id: string;
  data_validade: string;
}

const statusCores: Record<string, 'success' | 'error' | 'warning'> = {
  ativo: 'success',
  inativo_aguardando_peca: 'error',
  em_manutencao: 'warning',
};

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  inativo_aguardando_peca: 'Parado',
  em_manutencao: 'Manutenção',
};

const TIPOS_DISPONIVEIS = [
  { valor: 'radar', label: 'Radar' },
  { valor: 'balanca', label: 'Balança' },
  { valor: 'semaforo', label: 'Semáforo' },
];

const STATUS_DISPONIVEIS = [
  { valor: 'ativo', label: 'Ativo' },
  { valor: 'inativo_aguardando_peca', label: 'Parado' },
  { valor: 'em_manutencao', label: 'Manutenção' },
];

const calcularStatusAfericao = (dataValidade?: string) => {
  if (!dataValidade) return { label: 'Sem aferição', color: 'default' as const };
  const hoje = new Date();
  const validade = new Date(dataValidade);
  const diasRestantes = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) return { label: 'Aferição vencida', color: 'error' as const };
  if (diasRestantes <= 45) return { label: `Aferição vence em ${diasRestantes}d`, color: 'warning' as const };
  return { label: 'Aferição válida', color: 'success' as const };
};

const Equipamentos: React.FC = () => {
  const { usuario } = useAuth();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [afericoesPorEquipamento, setAfericoesPorEquipamento] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [bases, setBases] = useState<any[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [qrSelecionado, setQrSelecionado] = useState<Equipamento | null>(null);
  const [equipamentoParaArquivar, setEquipamentoParaArquivar] = useState<Equipamento | null>(null);
  const [arquivando, setArquivando] = useState(false);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [form, setForm] = useState({
    tipo: '',
    modelo: '',
    fabricante: '',
    numero_serie: '',
    localizacao_instalacao: '',
    quantidade_faixas: '',
    base_responsavel_id: '',
    contrato_id: '',
  });

  const [abrirFiltroExport, setAbrirFiltroExport] = useState(false);
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>(TIPOS_DISPONIVEIS.map((t) => t.valor));
  const [statusSelecionados, setStatusSelecionados] = useState<string[]>(STATUS_DISPONIVEIS.map((s) => s.valor));

  const carregarDados = async (incluirArquivados = mostrarArquivados) => {
    try {
      const res = await api.get(`/equipamento?incluir_arquivados=${incluirArquivados}`);
      setEquipamentos(res.data);
      const resBases = await api.get(`/empresa/${usuario?.empresa_id}/bases`);
      setBases(resBases.data);
      const resContratos = await api.get('/contrato');
      setContratos(resContratos.data);

      const resAfericoes = await api.get('/afericao');
      const afericoes: Afericao[] = resAfericoes.data;
      const maisRecentePorEquipamento: Record<string, string> = {};
      afericoes.forEach((a) => {
        const atual = maisRecentePorEquipamento[a.equipamento_id];
        if (!atual || new Date(a.data_validade) > new Date(atual)) {
          maisRecentePorEquipamento[a.equipamento_id] = a.data_validade;
        }
      });
      setAfericoesPorEquipamento(maisRecentePorEquipamento);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleToggleArquivados = async (checked: boolean) => {
    setMostrarArquivados(checked);
    setCarregando(true);
    await carregarDados(checked);
  };

  const handleSalvar = async () => {
    try {
      await api.post('/equipamento', {
        ...form,
        quantidade_faixas: form.quantidade_faixas ? parseInt(form.quantidade_faixas, 10) : undefined,
        contrato_id: form.contrato_id || undefined,
      });
      setAbrirDialog(false);
      setForm({ tipo: '', modelo: '', fabricante: '', numero_serie: '', localizacao_instalacao: '', quantidade_faixas: '', base_responsavel_id: '', contrato_id: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleArquivar = async () => {
    if (!equipamentoParaArquivar) return;
    try {
      setArquivando(true);
      await api.patch(`/equipamento/${equipamentoParaArquivar.id}/arquivar`);
      setEquipamentoParaArquivar(null);
      carregarDados();
    } catch (error) {
      console.error(error);
    } finally {
      setArquivando(false);
    }
  };

  const handleDesarquivar = async (id: string) => {
    try {
      await api.patch(`/equipamento/${id}/desarquivar`);
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTipo = (valor: string) => {
    setTiposSelecionados((prev) =>
      prev.includes(valor) ? prev.filter((t) => t !== valor) : [...prev, valor]
    );
  };

  const toggleStatus = (valor: string) => {
    setStatusSelecionados((prev) =>
      prev.includes(valor) ? prev.filter((s) => s !== valor) : [...prev, valor]
    );
  };

  const handleExportar = () => {
    const filtrados = equipamentos.filter(
      (e) => tiposSelecionados.includes(e.tipo) && statusSelecionados.includes(e.status_operacional)
    );
    exportarEquipamentos(filtrados);
    setAbrirFiltroExport(false);
  };

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Equipamentos
          </Typography>
          <FormControlLabel
            control={<Switch checked={mostrarArquivados} onChange={(e) => handleToggleArquivados(e.target.checked)} size="small" />}
            label={<Typography variant="body2" color="text.secondary">Ver arquivados</Typography>}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={() => setAbrirFiltroExport(true)}>
            Exportar Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
            Novo Equipamento
          </Button>
        </Box>
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
                <TableCell sx={celulaCabecalhoFixo}>Tipo</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Modelo</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Fabricante</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Nº Série</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Localização</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Faixas</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Base</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Contrato</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Aferição</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipamentos.map((eq) => {
                const statusAfericao = calcularStatusAfericao(afericoesPorEquipamento[eq.id]);
                return (
                  <TableRow key={eq.id} hover sx={eq.arquivado ? { opacity: 0.55, backgroundColor: '#fafafa' } : {}}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {eq.tipo}
                      {eq.arquivado && <Chip label="Arquivado" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{eq.modelo}</TableCell>
                    <TableCell>{eq.fabricante || '-'}</TableCell>
                    <TableCell>{eq.numero_serie}</TableCell>
                    <TableCell>{eq.localizacao_instalacao}</TableCell>
                    <TableCell>{eq.quantidade_faixas ?? '-'}</TableCell>
                    <TableCell>{eq.base?.nome} - {eq.base?.estado}</TableCell>
                    <TableCell>{eq.contrato ? `${eq.contrato.numero_contrato} - ${eq.contrato.orgao_contratante}` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[eq.status_operacional] || eq.status_operacional}
                        color={statusCores[eq.status_operacional] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={statusAfericao.label} color={statusAfericao.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Ver QR Code">
                          <IconButton color="primary" size="small" onClick={() => setQrSelecionado(eq)}>
                            <QrCode />
                          </IconButton>
                        </Tooltip>
                        {eq.arquivado ? (
                          <Tooltip title="Restaurar equipamento">
                            <IconButton color="success" size="small" onClick={() => handleDesarquivar(eq.id)}>
                              <Unarchive />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Arquivar equipamento">
                            <IconButton color="error" size="small" onClick={() => setEquipamentoParaArquivar(eq)}>
                              <Archive />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {qrSelecionado && (
        <QrCodeModal
          aberto={!!qrSelecionado}
          onFechar={() => setQrSelecionado(null)}
          codigo={qrSelecionado.qr_code}
          descricao={qrSelecionado.modelo}
          categoria={qrSelecionado.tipo}
        />
      )}

      <Dialog open={!!equipamentoParaArquivar} onClose={() => setEquipamentoParaArquivar(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Arquivar equipamento?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            O equipamento <strong>{equipamentoParaArquivar?.tipo} — {equipamentoParaArquivar?.modelo} (Nº {equipamentoParaArquivar?.numero_serie})</strong> será removido da lista.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontSize: 14, color: '#666' }}>
            O histórico de aferições, ordens de serviço e movimentações de peças será preservado. Você pode restaurá-lo depois ativando "Mostrar arquivados".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEquipamentoParaArquivar(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleArquivar} disabled={arquivando}>
            {arquivando ? <CircularProgress size={22} color="inherit" /> : 'Arquivar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Equipamento</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} sx={{ mt: 2, mb: 2 }}>
            <MenuItem value="radar">Radar</MenuItem>
            <MenuItem value="balanca">Balança</MenuItem>
            <MenuItem value="semaforo">Semáforo</MenuItem>
          </TextField>
          <TextField fullWidth label="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Fabricante" value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Número de Série" value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Localização (rodovia/km/endereço)" value={form.localizacao_instalacao} onChange={(e) => setForm({ ...form, localizacao_instalacao: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth type="number" label="Quantidade de Faixas" value={form.quantidade_faixas} onChange={(e) => setForm({ ...form, quantidade_faixas: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Base Responsável" value={form.base_responsavel_id} onChange={(e) => setForm({ ...form, base_responsavel_id: e.target.value })} sx={{ mb: 2 }}>
            {bases.map((base) => (
              <MenuItem key={base.id} value={base.id}>{base.nome} - {base.estado}</MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Contrato (opcional)" value={form.contrato_id} onChange={(e) => setForm({ ...form, contrato_id: e.target.value })}>
            <MenuItem value="">Nenhum</MenuItem>
            {contratos.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.numero_contrato} - {c.orgao_contratante}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirFiltroExport} onClose={() => setAbrirFiltroExport(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Exportar Equipamentos</DialogTitle>
        <DialogContent>
          <Typo variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>Tipo</Typo>
          <FormGroup>
            {TIPOS_DISPONIVEIS.map((t) => (
              <FormControlLabel
                key={t.valor}
                control={<Checkbox checked={tiposSelecionados.includes(t.valor)} onChange={() => toggleTipo(t.valor)} />}
                label={t.label}
              />
            ))}
          </FormGroup>
          <Typo variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Status</Typo>
          <FormGroup>
            {STATUS_DISPONIVEIS.map((s) => (
              <FormControlLabel
                key={s.valor}
                control={<Checkbox checked={statusSelecionados.includes(s.valor)} onChange={() => toggleStatus(s.valor)} />}
                label={s.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirFiltroExport(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<Download />} onClick={handleExportar}>Exportar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Equipamentos;