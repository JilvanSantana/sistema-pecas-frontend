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

interface OrdemServico {
  id: string;
  tipo: string;
  status: string;
  data_abertura: string;
  data_conclusao: string | null;
  equipamento: {
    tipo: string;
    modelo: string;
    numero_serie: string;
    localizacao_instalacao: string;
  };
  tecnico: {
    usuario: { nome: string };
  } | null;
}

const statusCores: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
  aberta: 'warning',
  em_andamento: 'info',
  concluida: 'success',
  cancelada: 'error',
};

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const tipoLabels: Record<string, string> = {
  corretiva: 'Manutenção Corretiva',
  preventiva: 'Manutenção Preventiva',
};

const OrdensServico: React.FC = () => {
  const { usuario } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [form, setForm] = useState({
    equipamento_id: '',
    tecnico_id: '',
    tipo: 'corretiva',
  });

  const carregarDados = async () => {
    try {
      const [resOrdens, resEq, resUsuarios] = await Promise.all([
        api.get('/ordem-servico'),
        api.get('/equipamento'),
        api.get(`/empresa/${usuario?.empresa_id}/usuarios`),
      ]);
      setOrdens(resOrdens.data);
      setEquipamentos(resEq.data);
      setTecnicos(resUsuarios.data.filter((u: any) => u.papel === 'tecnico'));
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
      setForm({ equipamento_id: '', tecnico_id: '', tipo: 'corretiva' });
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleConcluir = async (id: string) => {
    try {
      await api.post(`/ordem-servico/${id}/concluir`);
      carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1a237e' }}>
                <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
                <TableCell sx={{ color: 'white' }}>Equipamento</TableCell>
                <TableCell sx={{ color: 'white' }}>Localização</TableCell>
                <TableCell sx={{ color: 'white' }}>Técnico</TableCell>
                <TableCell sx={{ color: 'white' }}>Abertura</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhuma ordem de serviço cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                ordens.map((os) => (
                  <TableRow key={os.id} hover>
                    <TableCell>{tipoLabels[os.tipo] || os.tipo}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{os.equipamento?.modelo}</Typography>
                      <Typography variant="caption" color="text.secondary">{os.equipamento?.numero_serie}</Typography>
                    </TableCell>
                    <TableCell>{os.equipamento?.localizacao_instalacao}</TableCell>
                    <TableCell>{os.tecnico?.usuario?.nome || '— Não atribuído'}</TableCell>
                    <TableCell>{new Date(os.data_abertura).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[os.status] || os.status}
                        color={statusCores[os.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {os.status !== 'concluida' && os.status !== 'cancelada' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleConcluir(os.id)}
                        >
                          Concluir
                        </Button>
                      )}
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
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          >
            <MenuItem value="corretiva">Manutenção Corretiva</MenuItem>
            <MenuItem value="preventiva">Manutenção Preventiva</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label="Equipamento"
            value={form.equipamento_id}
            onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {equipamentos.map((eq) => (
              <MenuItem key={eq.id} value={eq.id}>
                {eq.tipo.toUpperCase()} — {eq.modelo} ({eq.numero_serie})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Técnico Responsável (opcional)"
            value={form.tecnico_id}
            onChange={(e) => setForm({ ...form, tecnico_id: e.target.value })}
          >
            <MenuItem value="">Não atribuído</MenuItem>
            {tecnicos.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Criar O.S.</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default OrdensServico;