import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Chip,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Base { id: string; nome: string; estado: string; }
interface Peca { id: string; descricao: string; categoria: string; codigo_qr: string; base: Base | null; }

const EstoquePorBase: React.FC = () => {
  const { usuario } = useAuth();
  const isAdmin = usuario?.papel === 'admin_global';
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const carregar = async () => {
      try {
        const empresa_id = usuario?.empresa_id || JSON.parse(localStorage.getItem('usuario') || '{}')?.empresa_id;
        const [resPecas, resBases] = await Promise.all([
          api.get('/peca?status=em_estoque_base', { signal: ac.signal }),
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

  const pecasDaBase = (baseId: string) => pecas.filter(p => p.base?.id === baseId);

  const tabelaPecas = (lista: Peca[]) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
            <TableCell>Descricao</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>QR Code</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lista.length === 0 ? (
            <TableRow><TableCell colSpan={3} align="center" sx={{ color: '#999' }}>Nenhuma peca em estoque</TableCell></TableRow>
          ) : lista.map(p => (
            <TableRow key={p.id} hover>
              <TableCell>{p.descricao}</TableCell>
              <TableCell>{p.categoria}</TableCell>
              <TableCell><Chip label={p.codigo_qr} size="small" variant="outlined" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (carregando) return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box></Layout>;

  return (
    <Layout>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Estoque por Base</Typography>
      {isAdmin ? (
        bases.map(base => {
          const lista = pecasDaBase(base.id);
          return (
            <Accordion key={base.id} defaultExpanded={lista.length > 0} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontWeight: "bold" }}>{base.nome} - {base.estado}</Typography>
                  <Chip label={`${lista.length} peca(s)`} size="small" color={lista.length > 0 ? 'primary' : 'default'} />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>{tabelaPecas(lista)}</AccordionDetails>
            </Accordion>
          );
        })
      ) : (
        <Paper>
          <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography sx={{ fontWeight: "bold" }}>
              {bases.find(b => b.id === usuario?.base_id)?.nome || 'Minha Base'} - {pecas.length} peca(s) em estoque
            </Typography>
          </Box>
          {tabelaPecas(pecas)}
        </Paper>
      )}
    </Layout>
  );
};
export default EstoquePorBase;