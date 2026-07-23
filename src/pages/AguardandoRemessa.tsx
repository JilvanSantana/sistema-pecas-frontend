import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface PecaAguardando {
  id: string;
  codigo_qr: string;
  descricao: string;
  categoria: string;
  movimentacao: {
    data_envio: string;
    equipamento?: { tipo: string; modelo: string; localizacao_instalacao: string };
  }[];
}

const AguardandoRemessa: React.FC = () => {
  const [pecas, setPecas] = useState<PecaAguardando[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get('/movimentacao/aguardando-remessa');
        setPecas(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Aguardando Remessa
        </Typography>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : pecas.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: '#666' }}>
          <Typography variant="h6">✅ Nenhuma peça aguardando remessa</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Todas as peças defeituosas já foram enviadas para a sede.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={celulaCabecalhoFixo}>QR Code</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Descrição</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Categoria</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Equipamento de Origem</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Data da Substituição</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pecas.map((peca) => {
                const ultimaMov = peca.movimentacao?.[0];
                return (
                  <TableRow key={peca.id} hover>
                    <TableCell>
                      <Typography variant="caption">{peca.codigo_qr}</Typography>
                    </TableCell>
                    <TableCell>{peca.descricao}</TableCell>
                    <TableCell>{peca.categoria}</TableCell>
                    <TableCell>
                      {ultimaMov?.equipamento
                        ? `${ultimaMov.equipamento.tipo} — ${ultimaMov.equipamento.modelo} (${ultimaMov.equipamento.localizacao_instalacao})`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {ultimaMov ? new Date(ultimaMov.data_envio).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Layout>
  );
};

export default AguardandoRemessa;