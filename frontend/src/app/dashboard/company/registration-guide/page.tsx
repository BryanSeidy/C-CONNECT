'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { companyService } from '@/services/companies';
import { Company } from '@/types';
import styles from './RegistrationGuide.module.css';

interface Step {
  id: string;
  title: string;
  description: string;
  documents?: string[];
}

const STEPS: Step[] = [
  {
    id: 'documents',
    title: "Rassembler les pièces nécessaires",
    description: "Avant de vous déplacer, préparez ces documents — cela évite un aller-retour.",
    documents: [
      "Carte Nationale d'Identité (CNI) en cours de validité",
      "Plan de localisation de votre local professionnel",
      "2 photos d'identité",
      "Justificatif d'occupation du local (bail, titre foncier, ou attestation)",
    ],
  },
  {
    id: 'formulaire',
    title: "Retirer et remplir le formulaire de déclaration",
    description: "Disponible au greffe du Tribunal de Première Instance de votre ville, ou au Guichet Unique de Création d'Entreprise (GUCE) le plus proche.",
  },
  {
    id: 'depot',
    title: "Déposer le dossier au greffe ou au GUCE",
    description: "Le Guichet Unique (GUCE) permet en principe d'obtenir RCCM + NIU + immatriculation CNPS en une seule démarche, ce qui est plus rapide que de passer par chaque administration séparément.",
  },
  {
    id: 'paiement',
    title: "Régler les frais d'immatriculation",
    description: "Le montant varie selon le type d'entreprise (entreprise individuelle vs société). Demandez le reçu — il vous sera utile en cas de suivi.",
  },
  {
    id: 'recuperation',
    title: "Récupérer votre numéro RCCM",
    description: "Une fois délivré, notez-le au format exact indiqué sur votre extrait (ex : RC/DLA/2020/B/1234) et renseignez-le dans votre profil C-Connect.",
  },
];

function StepChecklist({ company, onProgressChange }: { company: Company | null; onProgressChange: (checklist: Record<string, boolean>) => void }) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>(company?.registrationChecklist ?? {});

  useEffect(() => {
    if (company?.registrationChecklist) setChecklist(company.registrationChecklist);
  }, [company?.registrationChecklist]);

  const toggle = (stepId: string) => {
    const next = { ...checklist, [stepId]: !checklist[stepId] };
    setChecklist(next);
    onProgressChange(next);
  };

  const doneCount = STEPS.filter((s) => checklist[s.id]).length;

  return (
    <div className={styles.checklist}>
      <div className={styles.progressHeader}>
        <span>{doneCount}/{STEPS.length} étapes complétées</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(doneCount / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {STEPS.map((step, i) => (
        <div key={step.id} className={styles.stepCard}>
          <button
            type="button"
            className={styles.stepCheckbox}
            onClick={() => toggle(step.id)}
            aria-pressed={!!checklist[step.id]}
            aria-label={`Marquer l'étape "${step.title}" comme ${checklist[step.id] ? 'non terminée' : 'terminée'}`}
          >
            {checklist[step.id] ? <CheckCircle2 size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}
          </button>
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>
              <span className={styles.stepNumber}>{i + 1}</span>
              {step.title}
            </div>
            <p className={styles.stepDescription}>{step.description}</p>
            {step.documents && (
              <ul className={styles.docList}>
                {step.documents.map((doc) => (
                  <li key={doc}><FileText size={13} aria-hidden="true" /> {doc}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RegistrationGuideContent() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.companyId) { setLoading(false); return; }
    companyService.getCompanyBySlugOrId(String(user.companyId))
      .then((res) => setCompany(res.data))
      .finally(() => setLoading(false));
  }, [user?.companyId]);

  const handleProgressChange = async (checklist: Record<string, boolean>) => {
    if (!company) return;
    setSaving(true);
    try {
      const doneCount = Object.values(checklist).filter(Boolean).length;
      const status = doneCount === 0 ? 'non_demarre' : doneCount === STEPS.length ? 'termine' : 'en_cours';
      await companyService.updateCompany(company.id, {
        registrationChecklist: checklist,
        registrationStatus: status,
      });
    } catch {
      // Échec silencieux — la progression reste visible localement même si
      // la sauvegarde échoue, l'utilisateur peut continuer sans être bloqué.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link href="/dashboard/company" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" /> Retour à mon entreprise
      </Link>

      <div className={styles.hero}>
        <h1 className={styles.title}>Guide d&apos;immatriculation RCCM</h1>
        <p className={styles.subtitle}>
          Une entreprise vérifiée (badge RCCM) inspire davantage confiance aux acheteurs et apparaît
          mieux dans les résultats de recherche. Voici comment obtenir votre numéro, étape par étape.
        </p>
        <div className={styles.assistantCta}>
          <Sparkles size={16} aria-hidden="true" />
          <span>Une question sur une étape ? Ouvrez l&apos;assistant IA (bulle en bas à droite) — il connaît ce guide.</span>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
      ) : (
        <>
          <StepChecklist company={company} onProgressChange={handleProgressChange} />
          {saving && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enregistrement…</p>}
        </>
      )}

      <Card>
        <CardContent style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            <strong>Important :</strong> C-Connect ne peut pas effectuer cette démarche à votre place —
            l&apos;immatriculation reste une procédure officielle auprès du greffe/GUCE. Ce guide vous
            aide à vous préparer et à suivre votre progression ; une fois votre RCCM obtenu, renseignez-le
            simplement dans votre profil entreprise pour lancer la vérification automatique de format.
          </p>
        </CardContent>
      </Card>

      <Link href="/dashboard/company">
        <Button variant="primary" style={{ width: '100%' }}>
          J&apos;ai mon RCCM — renseigner mon profil
        </Button>
      </Link>
    </div>
  );
}

export default function RegistrationGuidePage() {
  return (
    <RoleGuard allowedRoles={['seller']}>
      <RegistrationGuideContent />
    </RoleGuard>
  );
}
