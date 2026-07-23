/**
 * Estilos compartilhados para tabelas com cabeçalho fixo.
 * Usado em todas as telas de listagem do painel.
 */

// Aplicar no <TableContainer>
export const containerTabelaFixa = {
  maxHeight: 'calc(100vh - 240px)',
  overflow: 'auto',
};

// Aplicar em cada <TableCell> do cabeçalho
export const celulaCabecalhoFixo = {
  color: 'white',
  backgroundColor: '#1a237e',
  position: 'sticky' as const,
  top: 0,
  zIndex: 2,
};

// Aplicar no Box de título+botões de cada página
export const cabecalhoPaginaFixo = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 3,
  position: 'sticky' as const,
  top: 0,
  zIndex: 3,
  backgroundColor: '#f0f2f5',
  py: 2,
};