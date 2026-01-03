'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ActivityFeedItem from './ActivityFeedItem';

/**
 * ActivityFeed Component
 * Displays a real-time feed of all CRM activities with filtering and infinite scroll
 */
export default function ActivityFeed({ entityId = null, entityType = null }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        scope: 'team', // 'team', 'my', 'system'
        actionType: '', // '', 'lead', 'email', 'pitch', 'status_change'
        timeRange: 'all' // 'today', 'week', 'month', 'all'
    });

    // Refs
    const observerRef = useRef(null);
    const loadMoreRef = useRef(null);

    /**
     * Fetch activities from API
     */
    const fetchActivities = useCallback(async (cursor = null, isLoadMore = false) => {
        try {
            if (!isLoadMore) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            // Build query params
            const params = new URLSearchParams();
            if (cursor) params.append('cursor', cursor);
            if (entityId) params.append('entityId', entityId);
            if (entityType) params.append('entityType', entityType);
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.timeRange !== 'all') params.append('timeRange', filters.timeRange);
            params.append('limit', '20');

            const response = await fetch(`/api/activity-feed?${params.toString()}`);
            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            if (isLoadMore) {
                setActivities(prev => [...prev, ...result.data]);
            } else {
                setActivities(result.data);
            }

            setNextCursor(result.nextCursor);
            setHasMore(result.hasMore);
            setError(null);

        } catch (err) {
            console.error('Error fetching activity feed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [entityId, entityType, filters]);

    /**
     * Initial load and polling
     */
    useEffect(() => {
        fetchActivities();

        // Poll for updates every 10 seconds
        const interval = setInterval(() => {
            fetchActivities(null, false);
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchActivities]);

    /**
     * Infinite scroll observer
     */
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    fetchActivities(nextCursor, true);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);
        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, loadingMore, nextCursor, fetchActivities]);

    /**
     * Handle filter changes
     */
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setNextCursor(null);
        setHasMore(true);
    };

    if (loading && activities.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-500">Loading activity feed...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">Error loading activities: {error}</p>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            {/* Header */}
            {!entityId && (
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Activity Feed</h2>
                    <p className="text-sm text-gray-600">Real-time updates from your CRM</p>
                </div>
            )}

            {/* Filters */}
            {!entityId && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-3">
                        {/* Action Type Filter */}
                        <select
                            value={filters.actionType}
                            onChange={(e) => handleFilterChange({ ...filters, actionType: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Actions</option>
                            <option value="lead">Leads</option>
                            <option value="email">Emails</option>
                            <option value="pitch">Pitches</option>
                            <option value="status_change">Status Changes</option>
                        </select>

                        {/* Time Range Filter */}
                        <select
                            value={filters.timeRange}
                            onChange={(e) => handleFilterChange({ ...filters, timeRange: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Activity List */}
            <div className="space-y-3">
                {activities.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600">No activities yet</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Activities will appear here as you work in the CRM
                        </p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <ActivityFeedItem key={activity.id} activity={activity} />
                    ))
                )}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
                <div ref={loadMoreRef} className="mt-4 text-center p-4">
                    {loadingMore ? (
                        <div className="text-gray-500 text-sm">Loading more...</div>
                    ) : (
                        <div className="text-gray-400 text-xs">Scroll for more</div>
                    )}
                </div>
            )}

            {/* End of Feed */}
            {!hasMore && activities.length > 0 && (
                <div className="mt-4 text-center p-4 text-gray-400 text-sm">
                    That's all for now
                </div>
            )}
        </div>
    );
}
