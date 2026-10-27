import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Movimentacao {
  id: string;
  tipo: string;
  origem: string;
  destino: string;
  motivo_envio: string;
  status: string;
  data_envio: string;
  codigo_rastreio: string;
  causou_parada: boolean;
}

interface HistoricoPecaData {
  peca: {
    id: string;
    descricao: string;
    codigo_qr: string;
    categoria: string;
    status_atual: string;
    criado_em: string;
  };
  movimentacoes: Movimentacao[];
  totalMovimentacoes: number;
  tempoTotalDias: number;
}

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

const statusCores: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
  enviada: 'warning',
  em_transito: 'info',
  recebida: 'success',
  divergente: 'error',
};

const HistoricoPeca: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dados, setDados] = useState<HistoricoPecaData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const carregar = async () => {
      try {
        const res = await api.get(`/peca/${id}/historico`, { signal: ac.signal });
        setDados(res.data);
      } catch (error: any) {
        if (error?.code !== 'ERR_CANCELED') console.error(error);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
    return () => ac.abort();
  }, [id]);

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/pecas')} sx={{ mb: 1 }}>
            Voltar
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Histórico da Peça{dados ? ` — ${dados.peca.descricao}` : ''}
          </Typography>
        </Box>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : !dados ? (
        <Typography>Peça não encontrada.</Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 180 }}>
              <Typography variant="caption" color="text.secondary">QR Code</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{dados.peca.codigo_qr}</Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 180 }}>
              <Typography variant="caption" color="text.secondary">Categoria</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{dados.peca.categoria}</Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 180 }}>
              <Typography variant="caption" color="text.secondary">Cadastrada em</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{new Date(dados.peca.criado_em).toLocaleDateString('pt-BR')}</Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 180 }}>
              <Typography variant="caption" color="text.secondary">Total de Movimentações</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{dados.totalMovimentacoes}</Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 180 }}>
              <Typography variant="caption" color="text.secondary">Tempo em Circulação</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#388e3c' }}>{dados.tempoTotalDias}d</Typography>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={containerTabelaFixa}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={celulaCabecalhoFixo}>Data</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Motivo</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Origem → Destino</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Rastreio</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Causou Parada</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(dados.movimentacoes ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#666' }}>
                      Nenhuma movimentação registrada ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  (dados.movimentacoes ?? []).map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell>{new Date(m.data_envio).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{motivoLabels[m.motivo_envio] || m.motivo_envio}</TableCell>
                      <TableCell>{m.origem} → {m.destino}</TableCell>
                      <TableCell>{m.codigo_rastreio || '—'}</TableCell>
                      <TableCell>
                        <Chip label={m.causou_parada ? 'Sim' : 'Não'} color={m.causou_parada ? 'error' : 'success'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={m.status} color={statusCores[m.status] || 'default'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Layout>
  );
};

export default HistoricoPeca;