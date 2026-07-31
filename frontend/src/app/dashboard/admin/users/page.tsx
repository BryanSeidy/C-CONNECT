'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { adminService, AdminUserRow } from '@/services/admin';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { extractApiError } from '@/lib/errors';
import styles from '../Admin.module.css';

const ROLE_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  admin:  { label: 'Administrateur', variant: 'warning' },
  seller: { label: 'Vendeur',        variant: 'success' },
  buyer:  { label: 'Acheteur',       variant: 'default' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers(targetPage);
      setUsers(res.items);
      setLastPage(res.lastPage);
      setTotal(res.total);
      setPage(res.currentPage);
    } catch (err) {
      setError(extractApiError(err, 'Impossible de charger les utilisateurs.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{total} utilisateur(s)</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Chargement…</p>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} message="Aucun utilisateur trouvé." />
      ) : (
        <>
          <div className={styles.table}>
            <div className={styles.thead}>
              <span>Utilisateur</span><span>Email</span><span>Rôle</span><span>Entreprise</span><span>Inscrit le</span><span />
            </div>
            {users.map((u) => (
              <div key={u.id} className={styles.trow}>
                <span className={styles.cell}>
                  <span className={styles.cellMain}>{u.fullName}</span>
                </span>
                <span className={styles.cell}>{u.email}</span>
                <span className={styles.cell}>
                  <Badge variant={ROLE_LABELS[u.role]?.variant ?? 'default'}>
                    {ROLE_LABELS[u.role]?.label ?? u.role}
                  </Badge>
                </span>
                <span className={styles.cell}>{u.companyId ?? '—'}</span>
                <span className={styles.cell}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                </span>
                <span className={styles.cell} />
              </div>
            ))}
          </div>

          {lastPage > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0' }}>
              <button
                className={styles.actionBtn}
                disabled={page <= 1}
                onClick={() => fetchUsers(page - 1)}
              >
                Précédent
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page} / {lastPage}</span>
              <button
                className={styles.actionBtn}
                disabled={page >= lastPage}
                onClick={() => fetchUsers(page + 1)}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
