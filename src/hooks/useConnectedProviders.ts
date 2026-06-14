import { useState, useEffect } from 'react';
import { integrationService } from '@/services/integrationService';

export function useConnectedProviders() {
    const [providers, setProviders] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        integrationService.getIntegrations()
            .then(integrations => {
                setProviders(new Set(
                    integrations
                        .filter(i => i.status === 'Connected')
                        .map(i => i.provider)
                ));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { providers, loading };
}
