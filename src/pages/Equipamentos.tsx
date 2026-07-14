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
import { useAuth } from '../contexts/AuthContext';
import { exportarEquipamentos } from '../services/exportar';

interface Equipamento {
  id: string;
  tipo: string;
  modelo: string;
  numero_serie: string;
  localizacao_instalacao: string;
  status_operacional: string;
  qr_code: string;
  base: { nome: string; estado: string };
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

const Equipamentos: React.FC = () => {
  const { usuario } = useAuth();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [bases, setBases] = useState<any[]>([]);
  const [form, setForm] = useState({
    tipo: '',
    modelo: '',
    fabricante: '',
    numero_serie: '',
    localizacao_instalacao: '',
    base_responsavel_id: '',
  });

  const carregarDados = async () => {
    try {
      const res = await api.get('/equipamento');
      setEquipamentos(res.data);
      const resBases = await api.get(`/empresa/${usuario?.empresa_id}/bases`);
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
      await api.post('/equipamento', form);
      setAbrirDialog(false);
      setForm({ tipo: '', modelo: '', fabricante: '', numero_serie: '', localizacao_instalacao: '', base_responsavel_id: '' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Equipamentos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={() => exportarEquipamentos(equipamentos)}>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1a237e' }}>
                <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
                <TableCell sx={{ color: 'white' }}>Modelo</TableCell>
                <TableCell sx={{ color: 'white' }}>Nº Série</TableCell>
                <TableCell sx={{ color: 'white' }}>Localização</TableCell>
                <TableCell sx={{ color: 'white' }}>Base</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>QR Code</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipamentos.map((eq) => (
                <TableRow key={eq.id} hover>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{eq.tipo}</TableCell>
                  <TableCell>{eq.modelo}</TableCell>
                  <TableCell>{eq.numero_serie}</TableCell>
                  <TableCell>{eq.localizacao_instalacao}</TableCell>
                  <TableCell>{eq.base?.nome} - {eq.base?.estado}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[eq.status_operacional] || eq.status_operacional}
                      color={statusCores[eq.status_operacional] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#666' }}>{eq.qr_code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
          <TextField fullWidth label="Localização (rodovia/km)" value={form.localizacao_instalacao} onChange={(e) => setForm({ ...form, localizacao_instalacao: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Base Responsável" value={form.base_responsavel_id} onChange={(e) => setForm({ ...form, base_responsavel_id: e.target.value })}>
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

export default Equipamentos;