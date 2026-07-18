import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const CORES = {
  cabecalho: 'FF1A237E',
  cabecalhoTexto: 'FFFFFFFF',
  linhaAlt: 'FFF0F2FA',
  bordaCinza: 'FFCCCCCC',
  verde: 'FFC8E6C9',
  verdeTexto: 'FF2E7D32',
  vermelho: 'FFFFCDD2',
  vermelhoTexto: 'FFC62828',
  amarelo: 'FFFFF3CD',
  amareloTexto: 'FF856404',
};

interface Coluna {
  cabecalho: string;
  chave: string;
  largura?: number;
}

interface OpcoesExportacao {
  colunas: Coluna[];
  dados: any[];
  nomeArquivo: string;
  nomePlanilha: string;
  // função opcional: recebe a linha de dados, devolve 'verde' | 'vermelho' | 'amarelo' | undefined
  corLinha?: (linha: any) => 'verde' | 'vermelho' | 'amarelo' | undefined;
}

const aplicarCorLinha = (row: ExcelJS.Row, cor: 'verde' | 'vermelho' | 'amarelo', totalColunas: number) => {
  const fundo = cor === 'verde' ? CORES.verde : cor === 'vermelho' ? CORES.vermelho : CORES.amarelo;
  const texto = cor === 'verde' ? CORES.verdeTexto : cor === 'vermelho' ? CORES.vermelhoTexto : CORES.amareloTexto;
  for (let i = 1; i <= totalColunas; i++) {
    const cell = row.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fundo } };
    cell.font = { color: { argb: texto }, bold: cor === 'vermelho' };
  }
};

export const exportarComEstilo = async (opcoes: OpcoesExportacao) => {
  const { colunas, dados, nomeArquivo, nomePlanilha, corLinha } = opcoes;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ControlePeças';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(nomePlanilha, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = colunas.map((c) => ({
    header: c.cabecalho,
    key: c.chave,
    width: c.largura || 18,
  }));

  // Estilo do cabeçalho
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.cabecalho } };
    cell.font = { color: { argb: CORES.cabecalhoTexto }, bold: true, size: 12 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: CORES.bordaCinza } },
      bottom: { style: 'thin', color: { argb: CORES.bordaCinza } },
      left: { style: 'thin', color: { argb: CORES.bordaCinza } },
      right: { style: 'thin', color: { argb: CORES.bordaCinza } },
    };
  });
  headerRow.height = 24;

  // Linhas de dados
  dados.forEach((linha, index) => {
    const row = sheet.addRow(linha);
    const zebra = index % 2 === 1;

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: CORES.bordaCinza } },
        bottom: { style: 'thin', color: { argb: CORES.bordaCinza } },
        left: { style: 'thin', color: { argb: CORES.bordaCinza } },
        right: { style: 'thin', color: { argb: CORES.bordaCinza } },
      };
      cell.alignment = { vertical: 'middle' };
      if (zebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.linhaAlt } };
      }
    });

    const cor = corLinha ? corLinha(linha) : undefined;
    if (cor) {
      aplicarCorLinha(row, cor, colunas.length);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveAs(blob, `${nomeArquivo}.xlsx`);
};

export const exportarPecas = (pecas: any[]) => {
  const dados = pecas.map((p) => ({
    qr: p.codigo_qr,
    descricao: p.descricao,
    categoria: p.categoria,
    status: p.status_atual,
    base: p.base ? `${p.base.nome} - ${p.base.estado}` : '',
    data: new Date(p.criado_em).toLocaleDateString('pt-BR'),
  }));

  exportarComEstilo({
    colunas: [
      { cabecalho: 'QR Code', chave: 'qr', largura: 18 },
      { cabecalho: 'Descrição', chave: 'descricao', largura: 30 },
      { cabecalho: 'Categoria', chave: 'categoria', largura: 20 },
      { cabecalho: 'Status', chave: 'status', largura: 22 },
      { cabecalho: 'Base Atual', chave: 'base', largura: 20 },
      { cabecalho: 'Data Cadastro', chave: 'data', largura: 16 },
    ],
    dados,
    nomeArquivo: 'relatorio-pecas',
    nomePlanilha: 'Peças',
    corLinha: (linha) => {
      if (linha.status === 'defeituosa_aguardando_analise' || linha.status === 'nao_localizada') return 'vermelho';
      if (linha.status === 'em_transito' || linha.status === 'aguardando_remessa') return 'amarelo';
      if (linha.status === 'em_estoque_base' || linha.status === 'instalada_equipamento') return 'verde';
      return undefined;
    },
  });
};

export const exportarMovimentacoes = (movimentacoes: any[]) => {
  const dados = movimentacoes.map((m) => ({
    peca: m.peca?.descricao,
    qr: m.peca?.codigo_qr,
    motivo: m.motivo_envio,
    origem: m.origem_tipo,
    destino: m.destino_tipo,
    rastreio: m.codigo_rastreio || '',
    transportadora: m.transportadora || '',
    parada: m.causou_parada ? 'Sim' : 'Não',
    status: m.status,
    dataEnvio: new Date(m.data_envio).toLocaleDateString('pt-BR'),
    dataRecebimento: m.data_confirmacao_recebimento
      ? new Date(m.data_confirmacao_recebimento).toLocaleDateString('pt-BR')
      : '',
    problema: m.descricao_problema || '',
  }));

  exportarComEstilo({
    colunas: [
      { cabecalho: 'Peça', chave: 'peca', largura: 25 },
      { cabecalho: 'QR Code', chave: 'qr', largura: 16 },
      { cabecalho: 'Motivo', chave: 'motivo', largura: 20 },
      { cabecalho: 'Origem', chave: 'origem', largura: 14 },
      { cabecalho: 'Destino', chave: 'destino', largura: 14 },
      { cabecalho: 'Rastreio', chave: 'rastreio', largura: 16 },
      { cabecalho: 'Transportadora', chave: 'transportadora', largura: 18 },
      { cabecalho: 'Causou Parada', chave: 'parada', largura: 14 },
      { cabecalho: 'Status', chave: 'status', largura: 16 },
      { cabecalho: 'Data Envio', chave: 'dataEnvio', largura: 14 },
      { cabecalho: 'Data Recebimento', chave: 'dataRecebimento', largura: 16 },
      { cabecalho: 'Problema', chave: 'problema', largura: 30 },
    ],
    dados,
    nomeArquivo: 'relatorio-movimentacoes',
    nomePlanilha: 'Movimentações',
    corLinha: (linha) => (linha.parada === 'Sim' ? 'vermelho' : undefined),
  });
};

export const exportarEquipamentos = (equipamentos: any[]) => {
  const dados = equipamentos.map((e) => ({
    tipo: e.tipo,
    modelo: e.modelo,
    fabricante: e.fabricante || '',
    serie: e.numero_serie,
    localizacao: e.localizacao_instalacao,
    faixas: e.quantidade_faixas ?? '',
    base: e.base ? `${e.base.nome} - ${e.base.estado}` : '',
    contrato: e.contrato?.numero_contrato || '',
    orgao: e.contrato?.orgao_contratante || '',
    status: e.status_operacional,
    qr: e.qr_code,
  }));

  exportarComEstilo({
    colunas: [
      { cabecalho: 'Tipo', chave: 'tipo', largura: 14 },
      { cabecalho: 'Modelo', chave: 'modelo', largura: 18 },
      { cabecalho: 'Fabricante', chave: 'fabricante', largura: 18 },
      { cabecalho: 'Nº Série', chave: 'serie', largura: 14 },
      { cabecalho: 'Localização', chave: 'localizacao', largura: 30 },
      { cabecalho: 'Faixas', chave: 'faixas', largura: 10 },
      { cabecalho: 'Base', chave: 'base', largura: 18 },
      { cabecalho: 'Contrato', chave: 'contrato', largura: 16 },
      { cabecalho: 'Órgão', chave: 'orgao', largura: 18 },
      { cabecalho: 'Status', chave: 'status', largura: 18 },
      { cabecalho: 'QR Code', chave: 'qr', largura: 18 },
    ],
    dados,
    nomeArquivo: 'relatorio-equipamentos',
    nomePlanilha: 'Equipamentos',
    corLinha: (linha) => {
      if (linha.status === 'inativo_aguardando_peca') return 'vermelho';
      if (linha.status === 'em_manutencao') return 'amarelo';
      if (linha.status === 'ativo') return 'verde';
      return undefined;
    },
  });
};

export const exportarContratos = (contratos: any[]) => {
  const dados = contratos.map((c) => ({
    numero: c.numero_contrato,
    orgao: c.orgao_contratante,
    sla: `${c.sla_horas_atendimento}h`,
    inicio: new Date(c.data_inicio).toLocaleDateString('pt-BR'),
    fim: c.data_fim ? new Date(c.data_fim).toLocaleDateString('pt-BR') : '',
    status: c.status === 'ativo' ? 'Ativo' : 'Encerrado',
  }));

  exportarComEstilo({
    colunas: [
      { cabecalho: 'Número', chave: 'numero', largura: 16 },
      { cabecalho: 'Órgão Contratante', chave: 'orgao', largura: 24 },
      { cabecalho: 'SLA', chave: 'sla', largura: 10 },
      { cabecalho: 'Início', chave: 'inicio', largura: 14 },
      { cabecalho: 'Fim', chave: 'fim', largura: 14 },
      { cabecalho: 'Status', chave: 'status', largura: 14 },
    ],
    dados,
    nomeArquivo: 'relatorio-contratos',
    nomePlanilha: 'Contratos',
    corLinha: (linha) => (linha.status === 'Ativo' ? 'verde' : undefined),
  });
};

export const exportarAfericoes = (afericoes: any[]) => {
  const dados = afericoes.map((a) => {
    const hoje = new Date();
    const validade = new Date(a.data_validade);
    const diasRestantes = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    const statusLabel = diasRestantes < 0 ? 'Vencida' : diasRestantes <= 45 ? `Vence em ${diasRestantes}d` : 'Válida';

    return {
      equipamento: a.equipamento
        ? `${a.equipamento.tipo} - ${a.equipamento.numero_serie || 's/ série'}`
        : '',
      localizacao: a.equipamento?.localizacao_instalacao || '',
      dataAfericao: new Date(a.data_afericao).toLocaleDateString('pt-BR'),
      dataValidade: new Date(a.data_validade).toLocaleDateString('pt-BR'),
      orgao: a.orgao_responsavel,
      certificado: a.numero_certificado || '',
      status: statusLabel,
      _dias: diasRestantes,
    };
  });

  exportarComEstilo({
    colunas: [
      { cabecalho: 'Equipamento', chave: 'equipamento', largura: 24 },
      { cabecalho: 'Localização', chave: 'localizacao', largura: 28 },
      { cabecalho: 'Data Aferição', chave: 'dataAfericao', largura: 16 },
      { cabecalho: 'Validade', chave: 'dataValidade', largura: 16 },
      { cabecalho: 'Órgão Responsável', chave: 'orgao', largura: 20 },
      { cabecalho: 'Certificado', chave: 'certificado', largura: 18 },
      { cabecalho: 'Status', chave: 'status', largura: 16 },
    ],
    dados,
    nomeArquivo: 'relatorio-afericoes',
    nomePlanilha: 'Aferições',
    corLinha: (linha) => {
      if (linha._dias < 0) return 'vermelho';
      if (linha._dias <= 45) return 'amarelo';
      return 'verde';
    },
  });
};