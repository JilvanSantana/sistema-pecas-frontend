import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

const motivoLabels: Record<string, string> = {
  manutencao_corretiva: '🔧 Manutenção Corretiva',
  devolucao: '📦 Devolução para Sede',
  saida_para_campo: '🚀 Saída para Campo',
  retorno_fabricante: '🏭 Retorno do Fabricante',
  envio_sede_para_base: '🏢 Envio Sede → Base',
  remessa: '🚚 Remessa',
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
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get(`/peca/${id}/historico`);
        setDados(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [id]);

  if (carregando) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!dados) {
    return (
      <Layout>
        <Typography>Peça não encontrada.</Typography>
      </Layout>
    );
  }

  const { peca, historico, estatisticas } = dados;

  return (
    <Layout>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/pecas')}>
          Voltar
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Histórico da Peça
        </Typography>
      </Box>

      {/* Info da peça */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{peca.descricao}</Typography>
            <Typography variant="body2" color="text.secondary">{peca.codigo_qr}</Typography>
            <Typography variant="body2" color="text.secondary">{peca.categoria}</Typography>
          </Box>
          <Chip
            label={vidaUtilLabels[estatisticas.vida_util]}
            color={vidaUtilCores[estatisticas.vida_util]}
            size="medium"
          />
        </Box>
      </Paper>

      {/* Estatísticas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            {estatisticas.total_movimentacoes}
          </Typography>
          <Typography variant="body2" color="text.secondary">Movimentações</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
            {estatisticas.total_manutencoes}
          </Typography>
          <Typography variant="body2" color="text.secondary">Manutenções</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
            {estatisticas.total_retornos_fabricante}
          </Typography>
          <Typography variant="body2" color="text.secondary">Retornos Fabricante</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {estatisticas.dias_em_uso}
          </Typography>
          <Typography variant="body2" color="text.secondary">Dias em uso</Typography>
        </Paper>
      </Box>

      {/* Alerta vida útil crítica */}
      {estatisticas.vida_util === 'critica' && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffebee', borderLeft: '4px solid #d32f2f' }}>
          <Typography color="error" sx={{ fontWeight: 'bold' }}>
            🔴 Peça em estado crítico — considerar descarte ou substituição permanente
          </Typography>
          <Typography variant="body2" color="error">
            Esta peça passou por {estatisticas.total_manutencoes} manutenções. Avaliar custo-benefício de continuar utilizando.
          </Typography>
        </Paper>
      )}

      {estatisticas.vida_util === 'atencao' && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fff3e0', borderLeft: '4px solid #f57c00' }}>
          <Typography color="warning.dark" sx={{ fontWeight: 'bold' }}>
            ⚠️ Peça em estado de atenção — monitorar de perto
          </Typography>
          <Typography variant="body2" color="warning.dark">
            Esta peça passou por {estatisticas.total_manutencoes} manutenções. Acompanhe o próximo ciclo com atenção.
          </Typography>
        </Paper>
      )}

      {/* Linha do tempo */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Linha do Tempo
      </Typography>

      {historico.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', color: '#666' }}>
          <Typography>Nenhuma movimentação registrada ainda.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          {historico.map((mov: any, index: number) => (
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
                    <Typography variant="caption" color="text.secondary" display="block">
                      📡 {mov.equipamento}
                    </Typography>
                  )}
                  {mov.descricao && (
                    <Typography variant="caption" color="text.secondary" display="block">
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
                  color={mov.status === 'recebida' ? 'success' : 'default'}
                />
              </Box>
              {index < historico.length - 1 && <Divider />}
            </Box>
          ))}
        </Paper>
      )}
    </Layout>
  );
};

export default HistoricoPeca;