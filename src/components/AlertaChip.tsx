import React from 'react';
import { Chip } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { NivelAlerta } from '../utils/prazos';

interface AlertaChipProps {
  label: string;
  nivel: NivelAlerta;
}

const AlertaChip: React.FC<AlertaChipProps> = ({ label, nivel }) => {
  if (nivel === 'critico') {
    return (
      <Chip
        icon={<WarningAmber />}
        label={label}
        color="error"
        size="small"
        sx={{
          fontWeight: 'bold',
          '@keyframes piscar': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.35 },
            '100%': { opacity: 1 },
          },
          animation: 'piscar 1s infinite',
        }}
      />
    );
  }
  if (nivel === 'atencao') {
    return <Chip icon={<WarningAmber />} label={label} color="warning" size="small" />;
  }
  return <Chip label={label} color="success" size="small" />;
};

export default AlertaChip;