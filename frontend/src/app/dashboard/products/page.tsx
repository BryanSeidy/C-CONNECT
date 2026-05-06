import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function DashboardProducts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Gestion de mon Catalogue
        </h2>
        <Link href="/dashboard/products/add">
          <Button variant="primary">+ Ajouter un Produit</Button>
        </Link>
      </div>

      <Card>
        <CardContent style={{ padding: '1.5rem' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix (FCFA)</TableHead>
                <TableHead>Stock disponible</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>Maïs Jaune Séché</TableCell>
                <TableCell>Agroalimentaire</TableCell>
                <TableCell>12,000 / 50Kg</TableCell>
                <TableCell>1200 Sacs</TableCell>
                <TableCell><Badge variant="success">Actif</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--info)', padding: '4px 8px' }}>Modifier</Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--error)', padding: '4px 8px' }}>Retirer</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>Cacao Fèves (Grade A)</TableCell>
                <TableCell>Agroalimentaire</TableCell>
                <TableCell>1,500 / Kg</TableCell>
                <TableCell>4500 Kg</TableCell>
                <TableCell><Badge variant="success">Actif</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--info)', padding: '4px 8px' }}>Modifier</Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--error)', padding: '4px 8px' }}>Retirer</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>Huile de Palme Rouge</TableCell>
                <TableCell>Transformation</TableCell>
                <TableCell>18,000 / 20L</TableCell>
                <TableCell>0 Bidons</TableCell>
                <TableCell><Badge variant="error" style={{ whiteSpace: 'nowrap' }}>Rupture de stock</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--info)', padding: '4px 8px' }}>Modifier</Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--error)', padding: '4px 8px' }}>Retirer</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
