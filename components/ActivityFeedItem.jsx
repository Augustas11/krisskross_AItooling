'use client';

import { formatDistanceToNow } from 'date-fns';

/**
 * Icon mapping for different activity types
 */
const ICON_MAP = {
    created: '🆕',
    enriched: '🔍',
    updated: '✏️',
    sent: '📧',
    scheduled: '📅',
    moved: '🔄',
    generated: '✨',
    replied: '💬',
    won: '🎉',
    lost: '😔',
    deleted: '🗑️',
    tagged: '🏷️',
    viewed: '👁️'
};

/**
 * Priority-based border colors
 */
const PRIORITY_COLORS = {
    high: 'border-l-4 border-l-green-500 bg-green-50',
    medium: 'border-l-4 border-l-yellow-500 bg-yellow-50',
    low: 'border-l-4 border-l-gray-300 bg-white'
};

/**
 * Format relative timestamp
 */
function formatRelativeTime(timestamp) {
    try {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
        return 'recently';
    }
}

/**
 * Build deep link to entity
 */
function buildDeepLink(activity) {
    switch (activity.entity_type) {
        case 'lead':
            return `/crm/dashboard?leadId=${activity.entity_id}`;
        case 'deal':
            return `/deals/${activity.entity_id}`;
        case 'contact':
            return `/contacts/${activity.entity_id}`;
        default:
            return '/crm/dashboard';
    }
}

/**
 * ActivityFeedItem Component
 * Displays a single activity entry with icon, description, and metadata
 */
export default function ActivityFeedItem({ activity }) {
    const icon = ICON_MAP[activity.action_verb] || '📌';
    const timeAgo = formatRelativeTime(activity.created_at);

    // Determine priority class
    const priorityClass = activity.priority > 6 ? PRIORITY_COLORS.high :
        activity.priority > 3 ? PRIORITY_COLORS.medium :
            PRIORITY_COLORS.low;

    // Build description text
    const getDescription = () => {
        const actorName = activity.actor_name || 'System';
        const actionVerb = activity.action_verb;
        const actionType = activity.action_type;
        const entityName = activity.entity_name || 'Unknown';

        // Aggregated message
        if (activity.aggregated_count && activity.aggregated_count > 1) {
            return (
                <span>
                    <strong className="font-semibold">{actorName}</strong>{' '}
                    {actionVerb}{' '}
                    <span className="font-medium">{activity.aggregated_count}</span> {actionType}s on{' '}
                    <a
                        href={buildDeepLink(activity)}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        {entityName}
                    </a>
                </span>
            );
        }

        // Single action message
        return (
            <span>
                <strong className="font-semibold">{actorName}</strong>{' '}
                {actionVerb} {actionType}:{' '}
                <a
                    href={buildDeepLink(activity)}
                    className="text-blue-600 hover:underline font-medium"
                >
                    {entityName}
                </a>
            </span>
        );
    };

    // Extract metadata for display
    const metadata = activity.metadata || {};
    const showSubject = metadata.subject && activity.action_verb === 'sent';
    const showFieldChanges = metadata.fields_updated && activity.action_verb === 'updated';
    const showStatusChange = metadata.from && metadata.to && activity.action_verb === 'moved';

    return (
        <div
            className={`p-4 rounded-lg shadow hover:shadow-md transition-shadow ${priorityClass} ${activity.is_read ? 'opacity-75' : ''
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <span className="text-2xl flex-shrink-0">{icon}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Description */}
                    <p className="text-sm text-gray-900">
                        {getDescription()}
                        {activity.aggregated_count > 1 && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded text-xs font-medium">
                                ×{activity.aggregated_count}
                            </span>
                        )}
                    </p>

                    {/* Metadata */}
                    {showSubject && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                            "{metadata.subject}"
                        </p>
                    )}

                    {showFieldChanges && (
                        <p className="text-xs text-gray-500 mt-1">
                            Updated: {metadata.fields_updated.slice(0, 3).join(', ')}
                            {metadata.fields_updated.length > 3 && ` +${metadata.fields_updated.length - 3} more`}
                        </p>
                    )}

                    {showStatusChange && (
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">{metadata.from}</span>{' '}
                            → <span className="font-medium text-green-600">{metadata.to}</span>
                        </p>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                </div>
            </div>
        </div>
    );
}
