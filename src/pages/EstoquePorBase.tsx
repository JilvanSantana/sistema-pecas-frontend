import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, TextField, MenuItem,
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Peca {
  id: string;
  descricao: string;
  codigo_qr: string;
  categoria: string;
  status_atual: string;
  base: { id: string; nome: string; estado: string } | null;
}

interface Base { id: string; nome: string; estado: string; }

const EstoquePorBase: React.FC = () => {
  const { usuario } = useAuth();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [baseSelecionada, setBaseSelecionada] = useState('');

  useEffect(() => {
    const ac = new AbortController();
    const carregar = async () => {
      try {
        const [resPecas, resBases] = await Promise.all([
          api.get('/peca?status=em_estoque_base', { signal: ac.signal }),
          api.get(`/empresa/${usuario?.empresa_id}/bases`, { signal: ac.signal }),
        ]);
        setPecas(resPecas.data);
        setBases(resBases.data);
      } catch (e: any) {
        if (e?.code !== 'ERR_CANCELED') console.error(e);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
    return () => ac.abort();
  }, [usuario]);

  const pecasFiltradas = baseSelecionada ? pecas.filter((p) => p.base?.id === baseSelecionada) : pecas;

  const porBase = bases.map((b) => ({
    base: b,
    total: pecas.filter((p) => p.base?.id === b.id).length,
  }));

  return (
    <Layout>
      <Box sx={{ ...cabecalhoPaginaFixo, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Estoque por Base</Typography>
        <TextField select size="small" label="Filtrar por Base" value={baseSelecionada} onChange={(e) => setBaseSelecionada(e.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="">Todas as Bases</MenuItem>
          {bases.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.nome} - {b.estado} ({pecas.filter((p) => p.base?.id === b.id).length} peças)
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : (
        <>
          {!baseSelecionada && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              {porBase.map(({ base, total }) => (
                <Box key={base.id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minWidth: 160, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => setBaseSelecionada(base.id)}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{base.nome}</Typography>
                  <Typography variant="caption" color="text.secondary">{base.estado}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{total}</Typography>
                  <Typography variant="caption" color="text.secondary">peças em estoque</Typography>
                </Box>
              ))}
            </Box>
          )}

          <TableContainer component={Paper} sx={containerTabelaFixa}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={celulaCabecalhoFixo}>QR Code</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Descrição</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Categoria</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Base</TableCell>
                  <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pecasFiltradas.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography variant="caption">{p.codigo_qr}</Typography></TableCell>
                    <TableCell>{p.descricao}</TableCell>
                    <TableCell>{p.categoria}</TableCell>
                    <TableCell>{p.base ? `${p.base.nome} - ${p.base.estado}` : '—'}</TableCell>
                    <TableCell><Chip label="Em Estoque" color="success" size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Layout>
  );
};

export default EstoquePorBase;