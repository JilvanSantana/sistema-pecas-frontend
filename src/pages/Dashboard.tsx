import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Inventory,
  Build,
  LocalShipping,
  Warning,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

interface ResumoEquipamento {
  total: number;
  ativos: number;
  parados: number;
  manutencao: number;
}

interface ResumoPeca {
  total: number;
  em_estoque: number;
  em_transito: number;
  instaladas: number;
  nao_localizadas: number;
}

const Dashboard: React.FC = () => {
  const [resumoEquipamento, setResumoEquipamento] = useState<ResumoEquipamento | null>(null);
  const [resumoPeca, setResumoPeca] = useState<ResumoPeca | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resEq, resPeca] = await Promise.all([
          api.get('/equipamento/resumo'),
          api.get('/peca/resumo'),
        ]);
        setResumoEquipamento(resEq.data);
        setResumoPeca(resPeca.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, []);

  const cards = [
    {
      titulo: 'Equipamentos Ativos',
      valor: resumoEquipamento?.ativos ?? 0,
      total: resumoEquipamento?.total ?? 0,
      icone: <Build sx={{ fontSize: 40, color: '#1976d2' }} />,
      cor: '#e3f2fd',
    },
    {
      titulo: 'Equipamentos Parados',
      valor: resumoEquipamento?.parados ?? 0,
      total: resumoEquipamento?.total ?? 0,
      icone: <Warning sx={{ fontSize: 40, color: '#d32f2f' }} />,
      cor: '#ffebee',
    },
    {
      titulo: 'Peças em Estoque',
      valor: resumoPeca?.em_estoque ?? 0,
      total: resumoPeca?.total ?? 0,
      icone: <Inventory sx={{ fontSize: 40, color: '#388e3c' }} />,
      cor: '#e8f5e9',
    },
    {
      titulo: 'Peças em Trânsito',
      valor: resumoPeca?.em_transito ?? 0,
      total: resumoPeca?.total ?? 0,
      icone: <LocalShipping sx={{ fontSize: 40, color: '#f57c00' }} />,
      cor: '#fff3e0',
    },
  ];

  return (
    <Layout>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Dashboard
      </Typography>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} columns={12}>
          {cards.map((card, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card sx={{ backgroundColor: card.cor }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {card.titulo}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {card.valor}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        de {card.total} total
                      </Typography>
                    </Box>
                    {card.icone}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Layout>
  );
};

export default Dashboard;