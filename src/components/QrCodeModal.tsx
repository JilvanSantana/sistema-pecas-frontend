import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { Print, Download } from '@mui/icons-material';
import QRCode from 'qrcode';

interface QrCodeModalProps {
  aberto: boolean;
  onFechar: () => void;
  codigo: string;
  descricao: string;
  categoria: string;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({
  aberto,
  onFechar,
  codigo,
  descricao,
  categoria,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (aberto && codigo) {
      QRCode.toDataURL(codigo, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      }).then((url) => {
        setQrDataUrl(url);
      });

      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, codigo, {
          width: 256,
          margin: 2,
        });
      }
    }
  }, [aberto, codigo]);

  const handleImprimir = () => {
    const janela = window.open('', '_blank');
    if (janela) {
      janela.document.write(`
        <html>
          <head>
            <title>QR Code — ${codigo}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              img { width: 200px; height: 200px; }
              .codigo { font-size: 12px; color: #666; margin-top: 8px; }
              .descricao { font-size: 14px; font-weight: bold; margin-top: 4px; }
              .categoria { font-size: 12px; color: #888; }
            </style>
          </head>
          <body>
            <img src="${qrDataUrl}" />
            <div class="descricao">${descricao}</div>
            <div class="categoria">${categoria}</div>
            <div class="codigo">${codigo}</div>
            <script>window.onload = () => { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      janela.document.close();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `qrcode-${codigo}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <Dialog open={aberto} onClose={onFechar} maxWidth="xs" fullWidth>
      <DialogTitle>QR Code da Peça</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
          )}
          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2, textAlign: 'center' }}>
            {descricao}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {categoria}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {codigo}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Fechar</Button>
        <Button onClick={handleDownload} startIcon={<Download />}>
          Baixar
        </Button>
        <Button variant="contained" onClick={handleImprimir} startIcon={<Print />}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QrCodeModal;