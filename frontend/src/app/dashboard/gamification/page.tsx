'use client';

import { RoleGuard } from '@/components/RoleGuard';
import { GamificationWidget } from '@/components/GamificationWidget';

export default function GamificationPage() {
  return (
    <RoleGuard allowedRoles={['seller']}>
      <div style={{ maxWidth: 640 }}>
        <GamificationWidget />
      </div>
    </RoleGuard>
  );
}
