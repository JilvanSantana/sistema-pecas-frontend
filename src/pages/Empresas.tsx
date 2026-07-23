import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Block, CheckCircle } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { containerTabelaFixa, celulaCabecalhoFixo, cabecalhoPaginaFixo } from '../styles/tabela';

interface Empresa {
  id: string;
  razao_social: string;
  cnpj: string;
  status_assinatura: string;
  criado_em: string;
  plano: { nome: string } | null;
  _count: { usuario: number; equipamento: number; base: number };
}

const statusCores: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  ativo: 'success',
  ativa: 'success',
  trial: 'warning',
  bloqueada: 'error',
  cancelada: 'default',
};

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  ativa: 'Ativo',
  trial: 'Trial',
  bloqueada: 'Bloqueada',
  cancelada: 'Cancelada',
};

const estados = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

const Empresas: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [empresaParaBloquear, setEmpresaParaBloquear] = useState<Empresa | null>(null);
  const [processando, setProcessando] = useState(false);
  const [form, setForm] = useState({
    razao_social: '',
    cnpj: '',
    admin_nome: '',
    admin_email: '',
    admin_senha: '',
    base_nome: '',
    base_estado: '',
    base_cidade: '',
  });

  const carregarDados = async () => {
    try {
      const res = await api.get('/empresa');
      setEmpresas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSalvar = async () => {
    try {
      setProcessando(true);
      await api.post('/empresa/onboarding', form);
      setAbrirDialog(false);
      setForm({ razao_social: '', cnpj: '', admin_nome: '', admin_email: '', admin_senha: '', base_nome: '', base_estado: '', base_cidade: '' });
      carregarDados();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao criar empresa';
      alert(msg);
    } finally {
      setProcessando(false);
    }
  };

  const handleBloquear = async () => {
    if (!empresaParaBloquear) return;
    try {
      setProcessando(true);
      const estaBloqueada = empresaParaBloquear.status_assinatura === 'bloqueada';
      if (estaBloqueada) {
        await api.patch(`/empresa/${empresaParaBloquear.id}/desbloquear`);
      } else {
        await api.patch(`/empresa/${empresaParaBloquear.id}/bloquear`);
      }
      setEmpresaParaBloquear(null);
      carregarDados();
    } catch (error) {
      console.error(error);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Layout>
      <Box sx={cabecalhoPaginaFixo}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Empresas (Super Admin)
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAbrirDialog(true)}>
          Nova Empresa
        </Button>
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
                <TableCell sx={celulaCabecalhoFixo}>Razão Social</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>CNPJ</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Plano</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Bases</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Equipamentos</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Usuários</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Cadastro</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Status</TableCell>
                <TableCell sx={celulaCabecalhoFixo}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#666' }}>
                    Nenhuma empresa cadastrada ainda
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((e) => (
                  <TableRow key={e.id} hover sx={e.status_assinatura === 'bloqueada' ? { opacity: 0.55, backgroundColor: '#fafafa' } : {}}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{e.razao_social}</TableCell>
                    <TableCell>{e.cnpj}</TableCell>
                    <TableCell>{e.plano?.nome || 'Sem plano'}</TableCell>
                    <TableCell>{e._count?.base ?? '-'}</TableCell>
                    <TableCell>{e._count?.equipamento ?? '-'}</TableCell>
                    <TableCell>{e._count?.usuario ?? '-'}</TableCell>
                    <TableCell>{new Date(e.criado_em).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[e.status_assinatura] || e.status_assinatura}
                        color={statusCores[e.status_assinatura] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {e.status_assinatura === 'bloqueada' ? (
                        <Tooltip title="Desbloquear empresa">
                          <IconButton color="success" size="small" onClick={() => setEmpresaParaBloquear(e)}>
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Bloquear empresa">
                          <IconButton color="error" size="small" onClick={() => setEmpresaParaBloquear(e)}>
                            <Block />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!empresaParaBloquear} onClose={() => setEmpresaParaBloquear(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {empresaParaBloquear?.status_assinatura === 'bloqueada' ? 'Desbloquear empresa?' : 'Bloquear empresa?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{empresaParaBloquear?.razao_social}</strong> ({empresaParaBloquear?.cnpj})
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontSize: 14, color: '#666' }}>
            {empresaParaBloquear?.status_assinatura === 'bloqueada'
              ? 'Ao desbloquear, todos os usuários dessa empresa poderão logar novamente.'
              : 'Ao bloquear, nenhum usuário dessa empresa conseguirá acessar o sistema até que você desbloqueie.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmpresaParaBloquear(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={empresaParaBloquear?.status_assinatura === 'bloqueada' ? 'success' : 'error'}
            onClick={handleBloquear}
            disabled={processando}
          >
            {processando ? <CircularProgress size={22} color="inherit" /> :
              empresaParaBloquear?.status_assinatura === 'bloqueada' ? 'Desbloquear' : 'Bloquear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirDialog} onClose={() => setAbrirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Empresa (Onboarding)</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1a237e' }}>
            Dados da Empresa
          </Typography>
          <TextField fullWidth label="Razão Social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1a237e' }}>
            Sede (Base Principal)
          </Typography>
          <TextField fullWidth label="Nome da Base/Sede" value={form.base_nome} onChange={(e) => setForm({ ...form, base_nome: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Estado" value={form.base_estado} onChange={(e) => setForm({ ...form, base_estado: e.target.value })} sx={{ mb: 2 }}>
            {estados.map((uf) => (
              <MenuItem key={uf} value={uf}>{uf}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Cidade" value={form.base_cidade} onChange={(e) => setForm({ ...form, base_cidade: e.target.value })} sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1a237e' }}>
            Administrador da Empresa
          </Typography>
          <TextField fullWidth label="Nome do Admin" value={form.admin_nome} onChange={(e) => setForm({ ...form, admin_nome: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email do Admin" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Senha inicial" type="password" value={form.admin_senha} onChange={(e) => setForm({ ...form, admin_senha: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar} disabled={processando}>
            {processando ? <CircularProgress size={22} color="inherit" /> : 'Criar Empresa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Empresas;