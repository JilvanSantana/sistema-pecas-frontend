import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface HistoricoEntry {
  id: string;
  data: string;
  motivo: string;
  descricao: string | null;
  equipamento: string | null;
  status: string;
  causou_parada: boolean;
}

interface Estatisticas {
  total_movimentacoes: number;
  total_manutencoes: number;
  total_retornos_fabricante: number;
  dias_em_uso: number;
  vida_util: 'saudavel' | 'atencao' | 'critica';
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
  historico: HistoricoEntry[];
  estatisticas: Estatisticas;
}

const motivoLabels: Record<string, string> = {
  manutencao_corretiva: 'Manutenção Corretiva',
  manutencao_preventiva: 'Manutenção Preventiva',
  reposicao_estoque: 'Reposição de Estoque',
  garantia_troca: 'Garantia/Troca',
  devolucao: 'Devolução',
  transferencia_bases: 'Transferência entre Bases',
  retorno_fabricante: 'Retorno ao Fabricante',
  remessa: 'Remessa',
  envio_sede_para_base: 'Envio Sede → Base',
  saida_para_campo: 'Saída para Campo',
  outro: 'Outro',
};

const statusCores: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  enviada: 'warning',
  em_transito: 'info',
  recebida: 'success',
  divergente: 'error',
};

const vidaUtilCores: Record<string, 'success' | 'warning' | 'error'> = {
  saudavel: 'success',
  atencao: 'warning',
  critica: 'error',
};

const vidaUtilLabels: Record<string, string> = {
  saudavel: '✅ Saudável',
  atencao: '⚠️ Atenção',
  critica: '🔴 Crítica',
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
        {dados && (
          <Chip
            label={vidaUtilLabels[dados.estatisticas.vida_util]}
            color={vidaUtilCores[dados.estatisticas.vida_util]}
            size="medium"
          />
        )}
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : !dados ? (
        <Typography>Peça não encontrada.</Typography>
      ) : (
        <>
          {/* Cards de informação */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">QR Code</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{dados.peca.codigo_qr}</Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">Categoria</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{dados.peca.categoria}</Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">Cadastrada em</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{new Date(dados.peca.criado_em).toLocaleDateString('pt-BR')}</Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">Total de Movimentações</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {dados.estatisticas.total_movimentacoes}
              </Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">Manutenções</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                {dados.estatisticas.total_manutencoes}
              </Typography>
            </Box>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">Dias em Uso</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                {dados.estatisticas.dias_em_uso}d
              </Typography>
            </Box>
          </Box>

          {/* Alertas */}
          {dados.estatisticas.vida_util === 'critica' && (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffebee', borderLeft: '4px solid #d32f2f' }}>
              <Typography color="error" sx={{ fontWeight: 'bold' }}>
                🔴 Peça em estado crítico — considerar substituição permanente
              </Typography>
              <Typography variant="body2" color="error">
                Passou por {dados.estatisticas.total_manutencoes} manutenções. Avaliar custo-benefício.
              </Typography>
            </Paper>
          )}
          {dados.estatisticas.vida_util === 'atencao' && (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fff3e0', borderLeft: '4px solid #f57c00' }}>
              <Typography color="warning.dark" sx={{ fontWeight: 'bold' }}>
                ⚠️ Peça em estado de atenção — monitorar de perto
              </Typography>
            </Paper>
          )}

          {/* Tabela de histórico */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Linha do Tempo</Typography>

          {(dados.historico ?? []).length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', color: '#666' }}>
              <Typography>Nenhuma movimentação registrada ainda.</Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 2 }}>
              {(dados.historico ?? []).map((mov, index) => (
                <Box key={mov.id}>
                  <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(mov.data).toLocaleDateString('pt-BR')}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(mov.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {motivoLabels[mov.motivo] || mov.motivo}
                      </Typography>
                      {mov.equipamento && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          📡 {mov.equipamento}
                        </Typography>
                      )}
                      {mov.descricao && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {mov.descricao}
                        </Typography>
                      )}
                      {mov.causou_parada && (
                        <Chip label="⚠️ Causou parada" color="error" size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                    <Chip
                      label={mov.status}
                      size="small"
                      variant="outlined"
                      color={statusCores[mov.status] || 'default'}
                    />
                  </Box>
                  {index < (dados.historico ?? []).length - 1 && <Divider />}
                </Box>
              ))}
            </Paper>
          )}
        </>
      )}
    </Layout>
  );
};

export default HistoricoPeca;