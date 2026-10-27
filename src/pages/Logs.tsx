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
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface LogEntry {
  id: string;
  entidade: string;
  entidade_id: string;
  acao: string;
  timestamp: string;
  empresa_id: string;
  dados_novos: any;
  usuario: {
    id: string;
    nome: string;
    email: string;
    papel: string;
  } | null;
}

interface Empresa {
  id: string;
  nome_fantasia: string;
  razao_social: string;
}

const acaoCores: Record<string, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
  LOGIN: 'success',
  CREATE: 'info',
  UPDATE: 'warning',
  DELETE: 'error',
};

const papelLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_global: 'Admin Global',
  admin_base: 'Admin Base',
  operador: 'Operador',
  tecnico: 'Técnico',
};

const Logs: React.FC = () => {
  const { usuario } = useAuth();
  const isSuperAdmin = usuario?.papel === 'super_admin';

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroAcao, setFiltroAcao] = useState('');
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      api.get('/empresas').then((res) => setEmpresas(res.data)).catch(() => {});
    }
  }, [isSuperAdmin]);

  const carregarLogs = async (signal?: AbortSignal) => {
    try {
      setCarregando(true);
      const params: any = { limite: 200 };
      if (filtroAcao) params.acao = filtroAcao;
      if (filtroEntidade) params.entidade = filtroEntidade;

      let res;
      if (isSuperAdmin) {
        if (filtroEmpresa) params.empresa_id = filtroEmpresa;
        res = await api.get('/audit/todas-empresas', { params, signal });
      } else {
        res = await api.get('/audit', { params, signal });
      }
      setLogs(res.data);
    } catch (error: any) {
      if (error?.code !== 'ERR_CANCELED') console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    carregarLogs(ac.signal);
    return () => ac.abort();
  }, [filtroAcao, filtroEntidade, filtroEmpresa]);

  const nomeEmpresa = (empresa_id: string) => {
    const e = empresas.find((e) => e.id === empresa_id);
    return e ? (e.nome_fantasia || e.razao_social) : empresa_id?.slice(0, 8) + '...';
  };

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Logs de Acesso e Auditoria
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {isSuperAdmin && (
            <TextField
              select
              size="small"
              label="Empresa"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todas as empresas</MenuItem>
              {empresas.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.nome_fantasia || e.razao_social}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            select
            size="small"
            label="Ação"
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="LOGIN">Login</MenuItem>
            <MenuItem value="CREATE">Criação</MenuItem>
            <MenuItem value="UPDATE">Atualização</MenuItem>
            <MenuItem value="DELETE">Exclusão</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Entidade"
            value={filtroEntidade}
            onChange={(e) => setFiltroEntidade(e.target.value)}
            placeholder="ex: login, equipamento"
            sx={{ minWidth: 180 }}
          />
        </Box>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={containerTabelaFixa}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={celulaCabecalhoFixo}>Data/Hora</TableCell>
                {isSuperAdmin && <TableCell sx={celulaCabecalhoFixo}>Empresa</TableCell>}
                <TableCell sx={celulaCabecalhoFixo}>Usuário</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Perfil</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Ação</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Entidade</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Detalhes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell sx={{ fontSize: 12, color: '#555' }}>
                        {nomeEmpresa(log.empresa_id)}
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {log.usuario?.nome || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {log.usuario?.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#555' }}>
                        {papelLabels[log.usuario?.papel || ''] || log.usuario?.papel || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.acao}
                        color={acaoCores[log.acao] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{log.entidade}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#555', maxWidth: 220 }}>
                      {log.dados_novos
                        ? Object.entries(log.dados_novos)
                            .filter(([k]) => k !== 'timestamp')
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Layout>
  );
};

export default Logs;