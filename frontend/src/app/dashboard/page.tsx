import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function DashboardOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Ventes Totales (Mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              1,240,000 FCFA
            </div>
            <div style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>
              +14% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Commandes Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              12
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              4 en attente d'expédition
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Mise en Relation (Matchs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              8
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <Button variant="ghost" size="sm" style={{ padding: 0, color: 'var(--accent-color)' }}>
                Voir suggestions →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <CardTitle>Commandes Récentes</CardTitle>
          <Button variant="outline" size="sm">Voir tout</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client / Partenaire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>#ORD-0244</TableCell>
                <TableCell>
                  <div style={{ fontWeight: 500 }}>AgroTech Gabon</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Libreville, GA</div>
                </TableCell>
                <TableCell>12 Mai 2026</TableCell>
                <TableCell>145,000 FCFA</TableCell>
                <TableCell><Badge variant="warning">En attente</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>#ORD-0243</TableCell>
                <TableCell>
                  <div style={{ fontWeight: 500 }}>TransMarket S.A</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Douala, CM</div>
                </TableCell>
                <TableCell>10 Mai 2026</TableCell>
                <TableCell>350,000 FCFA</TableCell>
                <TableCell><Badge variant="success">Confirmé</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>#ORD-0240</TableCell>
                <TableCell>
                  <div style={{ fontWeight: 500 }}>Global Foods</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yaoundé, CM</div>
                </TableCell>
                <TableCell>08 Mai 2026</TableCell>
                <TableCell>210,000 FCFA</TableCell>
                <TableCell><Badge variant="info">Expédié</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
