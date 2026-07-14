import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportarExcel = (dados: any[], nomeArquivo: string, nomePlanilha: string) => {
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `${nomeArquivo}.xlsx`);
};

export const exportarPecas = (pecas: any[]) => {
  const dados = pecas.map((p) => ({
    'QR Code': p.codigo_qr,
    'Descrição': p.descricao,
    'Categoria': p.categoria,
    'Status': p.status_atual,
    'Base Atual': p.base ? `${p.base.nome} - ${p.base.estado}` : '',
    'Data Cadastro': new Date(p.criado_em).toLocaleDateString('pt-BR'),
  }));
  exportarExcel(dados, 'relatorio-pecas', 'Peças');
};

export const exportarMovimentacoes = (movimentacoes: any[]) => {
  const dados = movimentacoes.map((m) => ({
    'Peça': m.peca?.descricao,
    'QR Code': m.peca?.codigo_qr,
    'Motivo': m.motivo_envio,
    'Origem': m.origem_tipo,
    'Destino': m.destino_tipo,
    'Rastreio': m.codigo_rastreio || '',
    'Transportadora': m.transportadora || '',
    'Causou Parada': m.causou_parada ? 'Sim' : 'Não',
    'Status': m.status,
    'Data Envio': new Date(m.data_envio).toLocaleDateString('pt-BR'),
    'Data Recebimento': m.data_confirmacao_recebimento
      ? new Date(m.data_confirmacao_recebimento).toLocaleDateString('pt-BR')
      : '',
    'Problema': m.descricao_problema || '',
  }));
  exportarExcel(dados, 'relatorio-movimentacoes', 'Movimentações');
};

export const exportarEquipamentos = (equipamentos: any[]) => {
  const dados = equipamentos.map((e) => ({
    'Tipo': e.tipo,
    'Modelo': e.modelo,
    'Fabricante': e.fabricante || '',
    'Nº Série': e.numero_serie,
    'Localização': e.localizacao_instalacao,
    'Base': e.base ? `${e.base.nome} - ${e.base.estado}` : '',
    'Contrato': e.contrato?.numero_contrato || '',
    'Órgão': e.contrato?.orgao_contratante || '',
    'Status': e.status_operacional,
    'QR Code': e.qr_code,
  }));
  exportarExcel(dados, 'relatorio-equipamentos', 'Equipamentos');
};