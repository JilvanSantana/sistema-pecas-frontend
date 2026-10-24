import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, CircularProgress,
  TextField, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, List, ListItem, ListItemIcon,
  ListItemText, Button, Badge,
} from '@mui/material';
import {
  Inventory, Build, LocalShipping, Warning, VerifiedUser, Description,
  AccessTime, Lightbulb, PriorityHigh, ExpandMore, ExpandLess,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calcularTempoAberto } from '../utils/prazos';

const LIMITE_ATENCAO_DIAS = 7;
const LIMITE_CRITICO_DIAS = 15;
const LIMITE_VENCIMENTO_DIAS = 45;
const STATUS_PECA_AGUARDANDO = ['em_transito', 'defeituosa_aguardando_analise', 'em_reparo_fabricante'];

interface Base { id: string; nome: string; estado: string; }
interface ContratoResumo { id: string; numero_contrato: string; orgao_contratante: string; status: string; data_fim: string | null; }
interface Equipamento { id: string; tipo: string; numero_serie: string; localizacao_instalacao: string; status_operacional: string; base: Base | null; contrato: ContratoResumo | null; }
interface Peca { id: string; descricao: string; status_atual: string; criado_em: string; base: Base | null; }
interface Afericao { id: string; equipamento_id: string; data_validade: string; equipamento: Equipamento | null; }
interface Movimentacao { peca_id: string; data_envio: string; }
interface Stats { equipAtivos: number; equipParados: number; equipTotal: number; pecasEstoque: number; pecasTransito: number; pecasTotal: number; afericoesVencidas: number; afericoesVencendo: number; contratosEncerrando: number; pecasAtrasoCritico: number; totalAlertas: number; }
interface Sugestao { prioridade: 'alta' | 'media'; texto: string; rota: string; }

const Dashboard: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.papel === 'admin_global' || usuario?.papel === 'admin_base';

  const [bases, setBases] = useState<Base[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [afericoes, setAfericoes] = useState<Afericao[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [baseSelecionadaId, setBaseSelecionadaId] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resBases, resEquipamentos, resPecas, resAfericoes, resMovimentacoes] = await Promise.all([
          api.get(`/empresa/${usuario?.empresa_id}/bases`),
          api.get('/equipamento'),
          api.get('/peca'),
          api.get('/afericao'),
          api.get('/movimentacao'),
        ]);
        setBases(resBases.data);
        setEquipamentos(resEquipamentos.data);
        setPecas(resPecas.data);
        setAfericoes(resAfericoes.data);
        setMovimentacoes(resMovimentacoes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [usuario]);

  const ultimaMovPorPeca = useMemo(() => {
    const mapa: Record<string, string> = {};
    movimentacoes.forEach((m) => {
      const atual = mapa[m.peca_id];
      if (!atual || new Date(m.data_envio) > new Date(atual)) mapa[m.peca_id] = m.data_envio;
    });
    return mapa;
  }, [movimentacoes]);

  const calcularStats = (baseId: string | null): Stats => {
    const equipFiltrados = baseId ? equipamentos.filter((e) => e.base?.id === baseId) : equipamentos;
    const pecasFiltradas = baseId ? pecas.filter((p) => p.base?.id === baseId) : pecas;
    const afericoesFiltradas = baseId ? afericoes.filter((a) => a.equipamento?.base?.id === baseId) : afericoes;

    const equipAtivos = equipFiltrados.filter((e) => e.status_operacional === 'ativo').length;
    const equipParados = equipFiltrados.filter((e) => e.status_operacional === 'inativo_aguardando_peca').length;
    const pecasEstoque = pecasFiltradas.filter((p) => p.status_atual === 'em_estoque_base').length;
    const pecasTransito = pecasFiltradas.filter((p) => p.status_atual === 'em_transito').length;

    let afericoesVencidas = 0; let afericoesVencendo = 0;
    afericoesFiltradas.forEach((a) => {
      const dias = Math.ceil((new Date(a.data_validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (dias < 0) afericoesVencidas++; else if (dias <= LIMITE_VENCIMENTO_DIAS) afericoesVencendo++;
    });

    const contratosUnicos = new Set<string>();
    equipFiltrados.forEach((e) => {
      if (!e.contrato || e.contrato.status !== 'ativo' || !e.contrato.data_fim) return;
      const dias = Math.ceil((new Date(e.contrato.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= LIMITE_VENCIMENTO_DIAS) contratosUnicos.add(e.contrato.id);
    });

    let pecasAtrasoCritico = 0;
    pecasFiltradas.forEach((p) => {
      if (!STATUS_PECA_AGUARDANDO.includes(p.status_atual)) return;
      const dataReferencia = ultimaMovPorPeca[p.id] || p.criado_em;
      if (!dataReferencia) return;
      const prazo = calcularTempoAberto(dataReferencia, LIMITE_ATENCAO_DIAS, LIMITE_CRITICO_DIAS);
      if (prazo.nivel === 'critico') pecasAtrasoCritico++;
    });

    const totalAlertas = afericoesVencidas + afericoesVencendo + contratosUnicos.size + pecasAtrasoCritico + equipParados;
    return { equipAtivos, equipParados, equipTotal: equipFiltrados.length, pecasEstoque, pecasTransito, pecasTotal: pecasFiltradas.length, afericoesVencidas, afericoesVencendo, contratosEncerrando: contratosUnicos.size, pecasAtrasoCritico, totalAlertas };
  };

  const statsAtual = calcularStats(baseSelecionadaId || null);

  const ranking = useMemo(() => {
    return bases.map((b) => ({ base: b, stats: calcularStats(b.id) })).sort((a, b) => b.stats.totalAlertas - a.stats.totalAlertas);
  }, [bases, equipamentos, pecas, afericoes, movimentacoes]);

  const sugestoes = useMemo(() => {
    const lista: Sugestao[] = [];
    const hoje = new Date();
    afericoes.forEach((a) => {
      const dias = Math.ceil((new Date(a.data_validade).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (dias < 0 && a.equipamento) lista.push({ prioridade: 'alta', texto: `Agendar afericao URGENTE do ${a.equipamento.tipo} (${a.equipamento.numero_serie || 's/ serie'}) em ${a.equipamento.localizacao_instalacao} - venceu ha ${Math.abs(dias)} dia(s)`, rota: '/afericoes' });
      else if (dias >= 0 && dias <= 15 && a.equipamento) lista.push({ prioridade: 'media', texto: `Programar afericao do ${a.equipamento.tipo} (${a.equipamento.numero_serie || 's/ serie'}) - vence em ${dias} dia(s)`, rota: '/afericoes' });
    });
    pecas.forEach((p) => {
      if (!STATUS_PECA_AGUARDANDO.includes(p.status_atual)) return;
      const dataReferencia = ultimaMovPorPeca[p.id] || p.criado_em;
      if (!dataReferencia) return;
      const prazo = calcularTempoAberto(dataReferencia, LIMITE_ATENCAO_DIAS, LIMITE_CRITICO_DIAS);
      if (prazo.nivel === 'critico') lista.push({ prioridade: 'alta', texto: `Verificar peca "${p.descricao}" parada ha ${prazo.label} - considerar peca reserva`, rota: '/pecas' });
    });
    const contratosJaSugeridos = new Set<string>();
    equipamentos.forEach((e) => {
      if (!e.contrato || e.contrato.status !== 'ativo' || !e.contrato.data_fim || contratosJaSugeridos.has(e.contrato.id)) return;
      const dias = Math.ceil((new Date(e.contrato.data_fim).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= LIMITE_VENCIMENTO_DIAS) { contratosJaSugeridos.add(e.contrato.id); lista.push({ prioridade: dias < 0 ? 'alta' : 'media', texto: dias < 0 ? `Contrato ${e.contrato.numero_contrato} VENCIDO - regularizar` : `Renovar contrato ${e.contrato.numero_contrato} - encerra em ${dias} dia(s)`, rota: '/contratos' }); }
    });
    ranking.forEach(({ base, stats }) => { if (stats.totalAlertas >= 2) lista.push({ prioridade: 'media', texto: `Base ${base.nome} - ${base.estado} tem ${stats.totalAlertas} pendencias - programar visita tecnica`, rota: '/equipamentos' }); });
    equipamentos.forEach((e) => { if (e.status_operacional === 'inativo_aguardando_peca') lista.push({ prioridade: 'alta', texto: `Equipamento ${e.tipo} (${e.numero_serie || 's/ serie'}) em ${e.localizacao_instalacao} esta PARADO - priorizar envio de peca`, rota: '/equipamentos' }); });
    return lista.sort((a, b) => (a.prioridade === 'alta' ? -1 : 1) - (b.prioridade === 'alta' ? -1 : 1));
  }, [afericoes, pecas, equipamentos, ranking, ultimaMovPorPeca]);

  const baseNome = baseSelecionadaId ? (bases.find((b) => b.id === baseSelecionadaId)?.nome || '') : '';
  const baseQuery = baseNome ? `&base=${encodeURIComponent(baseNome)}` : '';

  const cardsCompliance = [
    { titulo: 'Afericoes Vencidas', valor: statsAtual.afericoesVencidas, icone: <VerifiedUser sx={{ fontSize: 40, color: '#d32f2f' }} />, cor: statsAtual.afericoesVencidas > 0 ? '#ffebee' : '#e8f5e9', rota: `/afericoes?status=vencida${baseQuery}` },
    { titulo: 'Afericoes Vencendo (45d)', valor: statsAtual.afericoesVencendo, icone: <VerifiedUser sx={{ fontSize: 40, color: '#f57c00' }} />, cor: statsAtual.afericoesVencendo > 0 ? '#fff3e0' : '#e8f5e9', rota: `/afericoes?status=vencendo${baseQuery}` },
    { titulo: 'Contratos Encerrando (45d)', valor: statsAtual.contratosEncerrando, icone: <Description sx={{ fontSize: 40, color: '#f57c00' }} />, cor: statsAtual.contratosEncerrando > 0 ? '#fff3e0' : '#e8f5e9', rota: `/contratos?status=encerrando` },
    { titulo: 'Pecas em Atraso Critico', valor: statsAtual.pecasAtrasoCritico, icone: <AccessTime sx={{ fontSize: 40, color: '#d32f2f' }} />, cor: statsAtual.pecasAtrasoCritico > 0 ? '#ffebee' : '#e8f5e9', rota: `/pecas?status=em_transito${baseQuery}` },
  ];

  const cardsOperacionais = [
    { titulo: 'Equipamentos Ativos', valor: statsAtual.equipAtivos, total: statsAtual.equipTotal, icone: <Build sx={{ fontSize: 40, color: '#1976d2' }} />, cor: '#e3f2fd', rota: `/equipamentos?status=ativo${baseQuery}` },
    { titulo: 'Equipamentos Parados', valor: statsAtual.equipParados, total: statsAtual.equipTotal, icone: <Warning sx={{ fontSize: 40, color: '#d32f2f' }} />, cor: '#ffebee', rota: `/equipamentos?status=parado${baseQuery}` },
    { titulo: 'Pecas em Estoque', valor: statsAtual.pecasEstoque, total: statsAtual.pecasTotal, icone: <Inventory sx={{ fontSize: 40, color: '#388e3c' }} />, cor: '#e8f5e9', rota: `/pecas?status=em_estoque_base${baseQuery}` },
    { titulo: 'Pecas em Transito', valor: statsAtual.pecasTransito, total: statsAtual.pecasTotal, icone: <LocalShipping sx={{ fontSize: 40, color: '#f57c00' }} />, cor: '#fff3e0', rota: `/pecas?status=em_transito${baseQuery}` },
  ];

  const renderCards = (cards: any[]) => (
    <Grid container spacing={3} columns={12}>
      {cards.map((card, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Card sx={{ backgroundColor: card.cor, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate(card.rota)}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">{card.titulo}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{card.valor}</Typography>
                  {card.total !== undefined && <Typography variant="caption" color="text.secondary">de {card.total} total</Typography>}
                </Box>
                {card.icone}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Dashboard</Typography>
        <TextField select label="Base" value={baseSelecionadaId} onChange={(e) => setBaseSelecionadaId(e.target.value)} sx={{ minWidth: 220 }} size="small">
          <MenuItem value="">Todas as Bases (Geral)</MenuItem>
          {bases.map((b) => <MenuItem key={b.id} value={b.id}>{b.nome} - {b.estado}</MenuItem>)}
        </TextField>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : (
        <>
          {isAdmin && sugestoes.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Button variant="outlined" onClick={() => setMostrarSugestoes(!mostrarSugestoes)} startIcon={<Lightbulb sx={{ color: '#f9a825' }} />} endIcon={mostrarSugestoes ? <ExpandLess /> : <ExpandMore />} sx={{ mb: mostrarSugestoes ? 2 : 0 }}>
                <Badge badgeContent={sugestoes.length} color="error" sx={{ mr: 1.5 }} />Sugestoes de Acao
              </Button>
              {mostrarSugestoes && (
                <Paper><List dense>
                  {sugestoes.map((s, i) => (
                    <ListItem key={i} sx={{ cursor: 'pointer', borderLeft: s.prioridade === 'alta' ? '4px solid #d32f2f' : '4px solid #f57c00', mb: 0.5 }} onClick={() => navigate(s.rota)}>
                      <ListItemIcon><PriorityHigh sx={{ color: s.prioridade === 'alta' ? '#d32f2f' : '#f57c00' }} /></ListItemIcon>
                      <ListItemText primary={s.texto} />
                    </ListItem>
                  ))}
                </List></Paper>
              )}
            </Box>
          )}

          {isAdmin && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#555' }}>Compliance / Alertas {baseSelecionadaId ? `- ${bases.find((b) => b.id === baseSelecionadaId)?.nome}` : '(Geral)'}</Typography>
              {renderCards(cardsCompliance)}
            </>
          )}

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: isAdmin ? 4 : 0, color: '#555' }}>Operacional {baseSelecionadaId ? `- ${bases.find((b) => b.id === baseSelecionadaId)?.nome}` : '(Geral)'}</Typography>
          {renderCards(cardsOperacionais)}

          {isAdmin && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 4, color: '#555' }}>Ranking de Bases - Piores Primeiro</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1a237e' }}>
                      <TableCell sx={{ color: 'white' }}>Base</TableCell>
                      <TableCell sx={{ color: 'white' }}>Equip. Parados</TableCell>
                      <TableCell sx={{ color: 'white' }}>Afericoes Vencidas</TableCell>
                      <TableCell sx={{ color: 'white' }}>Afericoes Vencendo</TableCell>
                      <TableCell sx={{ color: 'white' }}>Contratos Encerrando</TableCell>
                      <TableCell sx={{ color: 'white' }}>Pecas Atraso Critico</TableCell>
                      <TableCell sx={{ color: 'white' }}>Total de Alertas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ranking.map(({ base, stats }, index) => (
                      <TableRow key={base.id} hover sx={{ cursor: 'pointer', backgroundColor: index === 0 && stats.totalAlertas > 0 ? '#ffebee' : 'inherit' }} onClick={() => setBaseSelecionadaId(base.id)}>
                        <TableCell>{base.nome} - {base.estado}</TableCell>
                        <TableCell>{stats.equipParados}</TableCell>
                        <TableCell>{stats.afericoesVencidas}</TableCell>
                        <TableCell>{stats.afericoesVencendo}</TableCell>
                        <TableCell>{stats.contratosEncerrando}</TableCell>
                        <TableCell>{stats.pecasAtrasoCritico}</TableCell>
                        <TableCell><Chip label={stats.totalAlertas} color={stats.totalAlertas === 0 ? 'success' : stats.totalAlertas <= 2 ? 'warning' : 'error'} size="small" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </Layout>
  );
};

export default Dashboard;