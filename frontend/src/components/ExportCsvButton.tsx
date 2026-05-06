'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';

export const ExportCsvButton = ({ data }: { data: any[] }) => {
  const exportToCsv = () => {
    // CSV Header matching the Dashboard Orders table
    const header = "Numero,Produit,Quantite,Prix_Total,Client,Statut\n";
    const rows = data.map(o => `${o.number},"${o.product}",${o.quantity},${o.price},"${o.client}",${o.status}`).join('\n');
    
    // Create Blob and Download link
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes_commandes_cconnect.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return <Button variant="outline" size="sm" onClick={exportToCsv}>Exporter CSV</Button>;
};
