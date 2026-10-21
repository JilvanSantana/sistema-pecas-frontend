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
  Checkbox,
} from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface PecaAguardando {
  id: string;
  codigo_qr: string;
  descricao: string;
  categoria: string;
  movimentacao: {
    data_envio: string;
    equipamento?: { tipo: string; modelo: string; localizacao_instalacao: string };
  }[];
}

const AguardandoRemessa: React.FC = () => {
  const { usuario } = useAuth();
  const [pecas, setPecas] = useState<PecaAguardando[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [bases, setBases] = useState<any[]>([]);
  const [form, setForm] = useState({
    base_destino_id: '',
    codigo_rastreio: '',
    transportadora: '',
  });

  const podeEnviar = usuario?.papel === 'admin_global' || usuario?.papel === 'admin_base' || usuario?.papel === 'operador';

  const carregarDados = async () => {
    try {
      const [resPecas, resBases] = await Promise.all([
        api.get('/movimentacao/aguardando-remessa'),
        api.get(`/empresa/${usuario?.empresa_id}/bases`),
      ]);
      setPecas(resPecas.data);
      setBases(resBases.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSelecionar = (id: string) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSelecionarTodas = () => {
    if (selecionadas.length === pecas.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(pecas.map(p => p.id));
    }
  };

  const handleRegistrarRemessa = async () => {
    if (selecionadas.length === 0 || !form.base_destino_id) return;
    try {
      await api.post('/movimentacao/remessa-sede', {
        peca_ids: selecionadas,
        base_destino_id: form.base_destino_id,
        codigo_rastreio: form.codigo_rastreio || null,
        transportadora: form.transportadora || null,
      });
      setAbrirDialog(false);
      setSelecionadas([]);
      setForm({ base_destino_id: '', codigo_rastreio: '', transportadora: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Aguardando Remessa
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Peças defeituosas retiradas em campo pelos técnicos
          </Typography>
        </Box>
        {podeEnviar && (
          <Button
            variant="contained"
            color="warning"
            startIcon={<LocalShipping />}
            disabled={selecionadas.length === 0}
            onClick={() => setAbrirDialog(true)}
          >
            Registrar Remessa ({selecionadas.length})
          </Button>
        )}
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : pecas.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: '#666' }}>
          <Typography variant="h6">✅ Nenhuma peça aguardando remessa</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Todas as peças defeituosas já foram enviadas para a sede.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {podeEnviar && (
                  <TableCell padding="checkbox" sx={celulaCabecalhoFixo}>
                    <Checkbox
                      checked={selecionadas.length === pecas.length && pecas.length > 0}
                      onChange={handleSelecionarTodas}
                      sx={{ color: 'white' }}
                    />
                  </TableCell>
                )}
                <TableCell sx={celulaCabecalhoFixo}>QR Code</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Descrição</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Categoria</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Equipamento de Origem</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Data da Substituição</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pecas.map((peca) => {
                const ultimaMov = peca.movimentacao?.[0];
                return (
                  <TableRow
                    key={peca.id}
                    hover
                    selected={selecionadas.includes(peca.id)}
                    onClick={() => podeEnviar && handleSelecionar(peca.id)}
                    sx={{ cursor: podeEnviar ? 'pointer' : 'default' }}
                  >
                    {podeEnviar && (
                      <TableCell padding="checkbox">
                        <Checkbox checked={selecionadas.includes(peca.id)} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="caption">{peca.codigo_qr}</Typography>
                    </TableCell>
                    <TableCell>{peca.descricao}</TableCell>
                    <TableCell>{peca.categoria}</TableCell>
                    <TableCell>
                      {ultimaMov?.equipamento
                        ? `${ultimaMov.equipamento.tipo} — ${ultimaMov.equipamento.modelo} (${ultimaMov.equipamento.localizacao_instalacao})`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {ultimaMov ? new Date(ultimaMov.data_envio).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label="Aguardando Remessa" color="warning" size="small" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Remessa para Sede</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            {selecionadas.length} peça(s) selecionada(s) serão registradas como enviadas.
          </Typography>
          <TextField
            select
            fullWidth
            label="Base de Destino *"
            value={form.base_destino_id}
            onChange={(e) => setForm({ ...form, base_destino_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {bases.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.nome} - {b.estado}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Código de Rastreio (opcional)"
            value={form.codigo_rastreio}
            onChange={(e) => setForm({ ...form, codigo_rastreio: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Transportadora (opcional)"
            value={form.transportadora}
            onChange={(e) => setForm({ ...form, transportadora: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRegistrarRemessa}
            disabled={!form.base_destino_id}
          >
            Confirmar Remessa
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AguardandoRemessa;