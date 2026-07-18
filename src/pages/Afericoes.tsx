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
import { Add, Download } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { exportarAfericoes } from '../services/exportar';

interface Equipamento {
  id: string;
  tipo: string;
  numero_serie?: string;
  localizacao_instalacao: string;
  contrato?: { numero_contrato: string; orgao_contratante: string } | null;
}

interface Afericao {
  id: string;
  equipamento_id: string;
  data_afericao: string;
  data_validade: string;
  orgao_responsavel: string;
  numero_certificado?: string;
  observacoes?: string;
  equipamento: Equipamento;
}

const calcularStatus = (dataValidade: string) => {
  const hoje = new Date();
  const validade = new Date(dataValidade);
  const diasRestantes = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) return { label: 'Vencida', color: 'error' as const };
  if (diasRestantes <= 45) return { label: `Vence em ${diasRestantes}d`, color: 'warning' as const };
  return { label: 'Válida', color: 'success' as const };
};

const Afericoes: React.FC = () => {
  const [afericoes, setAfericoes] = useState<Afericao[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [form, setForm] = useState({
    equipamento_id: '',
    data_afericao: '',
    data_validade: '',
    orgao_responsavel: 'Inmetro',
    numero_certificado: '',
    observacoes: '',
  });

  const carregarDados = async () => {
    try {
      const [resAfericoes, resEquipamentos] = await Promise.all([
        api.get('/afericao'),
        api.get('/equipamento'),
      ]);
      setAfericoes(resAfericoes.data);
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
      await api.post('/afericao', form);
      setAbrirDialog(false);
      setForm({
        equipamento_id: '',
        data_afericao: '',
        data_validade: '',
        orgao_responsavel: 'Inmetro',
        numero_certificado: '',
        observacoes: '',
      });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const nomeEquipamento = (eq: Equipamento) =>
    `${eq.tipo} - ${eq.numero_serie || 's/ série'} (${eq.localizacao_instalacao})`;

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Aferições / Calibrações
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={() => exportarAfericoes(afericoes)}>
            Exportar Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
            Nova Aferição
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
                <TableCell sx={{ color: 'white' }}>Equipamento</TableCell>
                <TableCell sx={{ color: 'white' }}>Data Aferição</TableCell>
                <TableCell sx={{ color: 'white' }}>Validade</TableCell>
                <TableCell sx={{ color: 'white' }}>Órgão Responsável</TableCell>
                <TableCell sx={{ color: 'white' }}>Certificado</TableCell>
                <TableCell sx={{ color: 'white' }}>Contrato</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {afericoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhuma aferição cadastrada ainda
                  </TableCell>
                </TableRow>
              ) : (
                afericoes.map((a) => {
                  const status = calcularStatus(a.data_validade);
                  return (
                    <TableRow key={a.id} hover>
                      <TableCell>{a.equipamento ? nomeEquipamento(a.equipamento) : '-'}</TableCell>
                      <TableCell>{new Date(a.data_afericao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{new Date(a.data_validade).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{a.orgao_responsavel}</TableCell>
                      <TableCell>{a.numero_certificado || '-'}</TableCell>
                      <TableCell>{a.equipamento?.contrato?.numero_contrato || '-'}</TableCell>
                      <TableCell>
                        <Chip label={status.label} color={status.color} size="small" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Aferição</DialogTitle>
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
                {nomeEquipamento(eq)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="date"
            label="Data da Aferição"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.data_afericao}
            onChange={(e) => setForm({ ...form, data_afericao: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Data de Validade (opcional — calcula 12 meses automaticamente se vazio)"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.data_validade}
            onChange={(e) => setForm({ ...form, data_validade: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Órgão Responsável"
            value={form.orgao_responsavel}
            onChange={(e) => setForm({ ...form, orgao_responsavel: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Número do Certificado"
            value={form.numero_certificado}
            onChange={(e) => setForm({ ...form, numero_certificado: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Observações"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            multiline
            rows={3}
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

export default Afericoes;