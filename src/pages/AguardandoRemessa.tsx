import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, TextField, MenuItem,
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AlertaChip from '../components/AlertaChip';
import { calcularTempoAberto } from '../utils/prazos';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Peca {
  id: string;
  descricao: string;
  codigo_qr: string;
  status_atual: string;
  criado_em: string;
  base: { nome: string; estado: string } | null;
}

interface Base { id: string; nome: string; estado: string; }

const statusLabels: Record<string, string> = {
  em_transito: 'Em Trânsito',
  defeituosa_aguardando_analise: 'Defeituosa',
  em_reparo_fabricante: 'Em Reparo',
};

const statusCores: Record<string, 'warning' | 'error'> = {
  em_transito: 'warning',
  defeituosa_aguardando_analise: 'error',
  em_reparo_fabricante: 'warning',
};

const LIMITE_ATENCAO_DIAS = 7;
const LIMITE_CRITICO_DIAS = 15;

const AguardandoRemessa: React.FC = () => {
  const { usuario } = useAuth();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [baseFiltro, setBaseFiltro] = useState('');

  const carregarDados = async (signal?: AbortSignal) => {
    try {
      const [resPecas, resBases] = await Promise.all([
        api.get('/movimentacao/aguardando-remessa', { signal }),
        api.get(`/empresa/${usuario?.empresa_id}/bases`, { signal }),
      ]);
      setPecas(resPecas.data);
      setBases(resBases.data);
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

  const pecasFiltradas = baseFiltro ? pecas.filter((p) => p.base?.nome === baseFiltro) : pecas;

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Aguardando Remessa</Typography>
        <TextField select size="small" label="Filtrar por Base" value={baseFiltro} onChange={(e) => setBaseFiltro(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">Todas as Bases</MenuItem>
          {bases.map((b) => <MenuItem key={b.id} value={b.nome}>{b.nome} - {b.estado}</MenuItem>)}
        </TextField>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={celulaCabecalhoFixo}>QR Code</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Descrição</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Base</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Tempo Aguardando</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pecasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhuma peça aguardando remessa
                  </TableCell>
                </TableRow>
              ) : (
                pecasFiltradas.map((peca) => {
                  const prazo = calcularTempoAberto(peca.criado_em, LIMITE_ATENCAO_DIAS, LIMITE_CRITICO_DIAS);
                  return (
                    <TableRow key={peca.id} hover>
                      <TableCell><Typography variant="caption">{peca.codigo_qr}</Typography></TableCell>
                      <TableCell>{peca.descricao}</TableCell>
                      <TableCell>{peca.base ? `${peca.base.nome} - ${peca.base.estado}` : '—'}</TableCell>
                      <TableCell>
                        <Chip label={statusLabels[peca.status_atual] || peca.status_atual} color={statusCores[peca.status_atual] || 'default'} size="small" />
                      </TableCell>
                      <TableCell><AlertaChip label={prazo.label} nivel={prazo.nivel} /></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Layout>
  );
};

export default AguardandoRemessa;