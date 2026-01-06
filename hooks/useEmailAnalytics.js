import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for email analytics
 * 
 * Usage:
 * const { analytics, loading, fetchAnalytics } = useEmailAnalytics('30d');
 */
export function useEmailAnalytics(initialPeriod = '30d') {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState(initialPeriod);

    // Fetch analytics data
    const fetchAnalytics = useCallback(async (options = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('period', options.period || period);
            if (options.leadId) params.set('lead_id', options.leadId);
            if (options.campaignId) params.set('campaign_id', options.campaignId);

            const response = await fetch(`/api/analytics/email?${params}`);
            const data = await response.json();

            if (data.success) {
                setAnalytics(data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [period]);

    // Change period and refetch
    const changePeriod = (newPeriod) => {
        setPeriod(newPeriod);
        fetchAnalytics({ period: newPeriod });
    };

    // Initial fetch
    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return {
        analytics,
        loading,
        error,
        period,
        changePeriod,
        fetchAnalytics
    };
}

export default useEmailAnalytics;
