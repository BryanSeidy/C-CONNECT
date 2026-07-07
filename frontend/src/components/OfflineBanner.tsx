'use client';

import { MessageSquareWarning } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleStatusChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            setIsOffline(customEvent.detail);
        };

        window.addEventListener('database-offline', handleStatusChange);
        return () => window.removeEventListener('database-offline', handleStatusChange);
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-amber-500 text-white text-center py-2 px-4 fixed top-0 left-0 right-0 z-50 animate-pulse font-medium shadow-md">
            <MessageSquareWarning size={16} aria-hidden="true" /> Mode hors ligne actif. Vos données sont enregistrées localement et seront synchronisées dès le retour du réseau.
        </div>
    );
}