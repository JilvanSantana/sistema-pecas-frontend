export type NivelAlerta = 'ok' | 'atencao' | 'critico';

export interface StatusPrazo {
  dias: number;
  nivel: NivelAlerta;
  label: string;
}

/**
 * Calcula há quantos dias uma data está em aberto (contando a partir dela até hoje).
 * limiteAtencao: a partir de quantos dias já mostra alerta amarelo
 * limiteCritico: a partir de quantos dias já mostra alerta vermelho piscando
 */
export const calcularTempoAberto = (
  dataInicio: string,
  limiteAtencao: number,
  limiteCritico: number
): StatusPrazo => {
  const inicio = new Date(dataInicio);
  const hoje = new Date();
  const dias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));

  let nivel: NivelAlerta = 'ok';
  if (dias >= limiteCritico) nivel = 'critico';
  else if (dias >= limiteAtencao) nivel = 'atencao';

  const label = dias === 0 ? 'Hoje' : dias === 1 ? '1 dia' : `${dias} dias`;

  return { dias, nivel, label };
};