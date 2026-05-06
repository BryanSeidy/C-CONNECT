import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExportCsvButton } from '@/components/ExportCsvButton';

export default function DashboardOrders() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Suivi des Commandes
        </h2>
        <div style={{ flex: 1 }}></div>
        <Button variant="outline" size="sm">Filtrer</Button>
        <ExportCsvButton data={[
          { number: '#ORD-0244', product: 'Maïs Jaune Séché', quantity: '10 Sacs', price: 120000, client: 'AgroTech Gabon', status: 'PENDING' },
          { number: '#ORD-0243', product: 'Cacao Fèves (Grade A)', quantity: '200 Kg', price: 300000, client: 'TransMarket S.A', status: 'CONFIRMED' }
        ]} />
      </div>

      <Card>
        <CardContent style={{ padding: '1.5rem' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix Total (FCFA)</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>#ORD-0244</TableCell>
                <TableCell>Maïs Jaune Séché</TableCell>
                <TableCell>10 Sacs</TableCell>
                <TableCell>120,000</TableCell>
                <TableCell>AgroTech Gabon</TableCell>
                <TableCell><Badge variant="warning">PENDING</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--primary-color)', padding: '4px 8px' }}>Confirmer</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>#ORD-0243</TableCell>
                <TableCell>Cacao Fèves (Grade A)</TableCell>
                <TableCell>200 Kg</TableCell>
                <TableCell>300,000</TableCell>
                <TableCell>TransMarket S.A</TableCell>
                <TableCell><Badge variant="success">CONFIRMED</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--info)', padding: '4px 8px' }}>Détails</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
