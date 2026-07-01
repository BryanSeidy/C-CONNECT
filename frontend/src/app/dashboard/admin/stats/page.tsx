'use client';
import React from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Wallet, Truck, ShieldCheck, BarChart3 } from 'lucide-react';
export default function AdminStats() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem'}}>
        <KpiCard label="Volume total" value="Connectez la DB" icon={<Wallet size={20}/>} variant="default" />
        <KpiCard label="Commandes" value="—" icon={<Truck size={20}/>} variant="success" />
        <KpiCard label="Entreprises vérifiées" value="—" icon={<ShieldCheck size={20}/>} variant="gold" />
        <KpiCard label="Taux complétion" value="—" icon={<BarChart3 size={20}/>} variant="default" />
      </div>
      <div style={{background:'var(--bg-card)',borderRadius:'var(--radius-md)',padding:'2rem',textAlign:'center',color:'var(--text-muted)',border:'1px dashed var(--border-color)'}}>
        Les graphiques de statistiques seront disponibles après connexion à la base de données de production.
      </div>
    </div>
  );
}
