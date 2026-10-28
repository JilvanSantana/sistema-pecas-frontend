import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Chip,
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Base { id: string; nome: string; estado: string; }
interface Mov { data_envio: string; motivo_envio: string; descricao_problema: string | null; origem_tipo: string; origem_id: string; }
interface Peca { id: string; descricao: string; categoria: string; status_atual: string; movimentacao: Mov[]; }

const statusLabel: Record<string, { label: string; cor: 'warning' | 'error' }> = {
  em_reparo_fabricante: { label: 'Em Reparo', cor: 'warning' },
  defeituosa_aguardando_analise: { label: 'Aguardando Analise', cor: 'error' },
};
const motivoLabel: Record<string, string> = {
  manutencao_corretiva: 'Manutencao Corretiva', manutencao_preventiva: 'Manutencao Preventiva',
  garantia_troca: 'Garantia / Troca', reposicao_estoque: 'Reposicao de Estoque',
  transferencia_bases: 'Transferencia entre Bases', devolucao: 'Devolucao', outro: 'Outro',
};

const PecasManutencao: React.FC = () => {
  const { usuario } = useAuth();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const carregar = async () => {
      try {
        const empresa_id = usuario?.empresa_id || JSON.parse(localStorage.getItem('usuario') || '{}')?.empresa_id;
        const [resPecas, resBases] = await Promise.all([
          api.get('/peca/manutencao', { signal: ac.signal }),
          empresa_id ? api.get(`/empresa/${empresa_id}/bases`, { signal: ac.signal }) : Promise.resolve({ data: [] }),
        ]);
        setPecas(resPecas.data);
        setBases(resBases.data);
      } catch (e: any) { if (e?.code !== 'ERR_CANCELED') console.error(e); }
      finally { setCarregando(false); }
    };
    carregar();
    return () => ac.abort();
  }, [usuario]);

  const nomeBase = (id: string) => { const b = bases.find(b => b.id === id); return b ? `${b.nome} - ${b.estado}` : id; };

  if (carregando) return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box></Layout>;

  return (
    <Layout>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Pecas em Manutencao</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1a237e' }}>
              <TableCell sx={{ color: 'white' }}>Peca</TableCell>
              <TableCell sx={{ color: 'white' }}>Categoria</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Base de Origem</TableCell>
              <TableCell sx={{ color: 'white' }}>Data do Envio</TableCell>
              <TableCell sx={{ color: 'white' }}>Motivo</TableCell>
              <TableCell sx={{ color: 'white' }}>Observacao</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pecas.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>Nenhuma peca em manutencao</TableCell></TableRow>
            ) : pecas.map(p => {
              const mov = p.movimentacao?.[0];
              const si = statusLabel[p.status_atual] || { label: p.status_atual, cor: 'default' as any };
              return (
                <TableRow key={p.id} hover>
                  <TableCell>{p.descricao}</TableCell>
                  <TableCell>{p.categoria}</TableCell>
                  <TableCell><Chip label={si.label} color={si.cor} size="small" /></TableCell>
                  <TableCell>{mov?.origem_tipo === 'base' ? nomeBase(mov.origem_id) : '-'}</TableCell>
                  <TableCell>{mov ? new Date(mov.data_envio).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>{mov ? (motivoLabel[mov.motivo_envio] || mov.motivo_envio) : '-'}</TableCell>
                  <TableCell>{mov?.descricao_problema || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
};
export default PecasManutencao;