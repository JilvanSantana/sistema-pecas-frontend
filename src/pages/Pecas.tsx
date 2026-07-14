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
import { Add, QrCode, Factory, AssignmentReturn, Download } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import QrCodeModal from '../components/QrCodeModal';
import { exportarPecas } from '../services/exportar';

interface Peca {
  id: string;
  codigo_qr: string;
  descricao: string;
  categoria: string;
  status_atual: string;
  base: { nome: string; estado: string } | null;
  tecnico: { usuario: { nome: string } } | null;
}

const statusCores: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  em_estoque_base: 'success',
  em_transito: 'warning',
  em_posse_tecnico: 'info',
  instalada_equipamento: 'default',
  nao_localizada: 'error',
  em_reparo_fabricante: 'warning',
  defeituosa_aguardando_analise: 'error',
  descartada: 'default',
};

const statusLabels: Record<string, string> = {
  em_estoque_base: 'Em Estoque',
  em_transito: 'Em Trânsito',
  em_posse_tecnico: 'Com Técnico',
  instalada_equipamento: 'Instalada',
  nao_localizada: 'Não Localizada',
  em_reparo_fabricante: 'Em Reparo',
  defeituosa_aguardando_analise: 'Defeituosa',
  descartada: 'Descartada',
};

const Pecas: React.FC = () => {
  const { usuario } = useAuth();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [abrirFabricante, setAbrirFabricante] = useState(false);
  const [abrirRetorno, setAbrirRetorno] = useState(false);
  const [pecaSelecionada, setPecaSelecionada] = useState<Peca | null>(null);
  const [bases, setBases] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [qrSelecionado, setQrSelecionado] = useState<Peca | null>(null);
  const [formFabricante, setFormFabricante] = useState({
    fornecedor_id: '',
    observacao: '',
    previsao_retorno: '',
  });
  const [formRetorno, setFormRetorno] = useState({
    base_destino_id: '',
    condicao: 'reparada',
  });
  const [form, setForm] = useState({
    descricao: '',
    categoria: '',
    base_atual_id: '',
  });

  const carregarDados = async () => {
    try {
      const [resPecas, resBases, resFornecedores] = await Promise.all([
        api.get('/peca'),
        api.get(`/empresa/${usuario?.empresa_id}/bases`),
        api.get('/fornecedor'),
      ]);
      setPecas(resPecas.data);
      setBases(resBases.data);
      setFornecedores(resFornecedores.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      await api.post('/peca', form);
      setAbrirDialog(false);
      setForm({ descricao: '', categoria: '', base_atual_id: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEnviarFabricante = async () => {
    try {
      await api.post(`/peca/${pecaSelecionada?.id}/enviar-fabricante`, formFabricante);
      setAbrirFabricante(false);
      setPecaSelecionada(null);
      setFormFabricante({ fornecedor_id: '', observacao: '', previsao_retorno: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRetornoFabricante = async () => {
    try {
      await api.post(`/peca/${pecaSelecionada?.id}/retorno-fabricante`, formRetorno);
      setAbrirRetorno(false);
      setPecaSelecionada(null);
      setFormRetorno({ base_destino_id: '', condicao: 'reparada' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Peças
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={() => exportarPecas(pecas)}>
            Exportar Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
            Nova Peça
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
                <TableCell sx={{ color: 'white' }}>QR Code</TableCell>
                <TableCell sx={{ color: 'white' }}>Descrição</TableCell>
                <TableCell sx={{ color: 'white' }}>Categoria</TableCell>
                <TableCell sx={{ color: 'white' }}>Localização</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pecas.map((peca) => (
                <TableRow key={peca.id} hover>
                  <TableCell>
                    <Typography variant="caption">{peca.codigo_qr}</Typography>
                  </TableCell>
                  <TableCell>{peca.descricao}</TableCell>
                  <TableCell>{peca.categoria}</TableCell>
                  <TableCell>
                    {peca.base ? `${peca.base.nome} - ${peca.base.estado}` :
                     peca.tecnico ? 'Com Técnico' :
                     peca.status_atual === 'em_reparo_fabricante' ? 'No Fabricante' : 'Instalada'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[peca.status_atual] || peca.status_atual}
                      color={statusCores[peca.status_atual] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver QR Code">
                      <IconButton color="primary" onClick={() => setQrSelecionado(peca)}>
                        <QrCode />
                      </IconButton>
                    </Tooltip>
                    {peca.status_atual === 'defeituosa_aguardando_analise' && (
                      <Tooltip title="Enviar ao Fabricante">
                        <IconButton color="warning" onClick={() => { setPecaSelecionada(peca); setAbrirFabricante(true); }}>
                          <Factory />
                        </IconButton>
                      </Tooltip>
                    )}
                    {peca.status_atual === 'em_reparo_fabricante' && (
                      <Tooltip title="Registrar Retorno do Fabricante">
                        <IconButton color="success" onClick={() => { setPecaSelecionada(peca); setAbrirRetorno(true); }}>
                          <AssignmentReturn />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {qrSelecionado && (
        <QrCodeModal
          aberto={!!qrSelecionado}
          onFechar={() => setQrSelecionado(null)}
          codigo={qrSelecionado.codigo_qr}
          descricao={qrSelecionado.descricao}
          categoria={qrSelecionado.categoria}
        />
      )}

      <Dialog open={abrirFabricante} onClose={() => setAbrirFabricante(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar ao Fabricante</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Peça: <strong>{pecaSelecionada?.descricao}</strong>
          </Typography>
          <TextField select fullWidth label="Fabricante / Fornecedor" value={formFabricante.fornecedor_id} onChange={(e) => setFormFabricante({ ...formFabricante, fornecedor_id: e.target.value })} sx={{ mb: 2 }}>
            {fornecedores.length === 0 ? (
              <MenuItem disabled>Nenhum fornecedor cadastrado</MenuItem>
            ) : (
              fornecedores.map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.nome} ({f.tipo})</MenuItem>
              ))
            )}
          </TextField>
          <TextField fullWidth label="Observação" value={formFabricante.observacao} onChange={(e) => setFormFabricante({ ...formFabricante, observacao: e.target.value })} multiline rows={3} sx={{ mb: 2 }} />
          <TextField fullWidth label="Previsão de Retorno (opcional)" type="date" value={formFabricante.previsao_retorno} onChange={(e) => setFormFabricante({ ...formFabricante, previsao_retorno: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirFabricante(false)}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleEnviarFabricante}>Confirmar Envio</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirRetorno} onClose={() => setAbrirRetorno(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Retorno do Fabricante</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Peça: <strong>{pecaSelecionada?.descricao}</strong>
          </Typography>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Condição da peça retornada</FormLabel>
            <RadioGroup value={formRetorno.condicao} onChange={(e) => setFormRetorno({ ...formRetorno, condicao: e.target.value })}>
              <FormControlLabel value="reparada" control={<Radio />} label="Reparada — volta ao estoque" />
              <FormControlLabel value="nova" control={<Radio />} label="Substituída por nova — volta ao estoque" />
              <FormControlLabel value="irreparavel" control={<Radio />} label="Irreparável — será descartada" />
            </RadioGroup>
          </FormControl>
          {formRetorno.condicao !== 'irreparavel' && (
            <TextField select fullWidth label="Base de Destino" value={formRetorno.base_destino_id} onChange={(e) => setFormRetorno({ ...formRetorno, base_destino_id: e.target.value })}>
              {bases.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.nome} - {b.estado}</MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirRetorno(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleRetornoFabricante}>Confirmar Retorno</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Peça</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="ex: placa_processamento, sensor_velocidade" sx={{ mb: 2 }} />
          <TextField select fullWidth label="Base Atual" value={form.base_atual_id} onChange={(e) => setForm({ ...form, base_atual_id: e.target.value })}>
            {bases.map((base) => (
              <MenuItem key={base.id} value={base.id}>{base.nome} - {base.estado}</MenuItem>
            ))}
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

export default Pecas;