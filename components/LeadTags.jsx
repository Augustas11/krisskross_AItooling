/**
 * TagComponents - Client-Safe Version
 * UI components for displaying tags (no server-side imports)
 */

'use client';
import React from 'react';

/**
 * Get tag color by category
 */
function getTagColor(fullTag) {
  const category = fullTag?.split(':')[0] || '';
  const colors = {
    'business': '#FF6B9D',
    'geo': '#3B82F6',
    'platform': '#8B5CF6',
    'followers': '#22C55E',
    'engagement': '#10B981',
    'pain': '#DC2626',
    'content': '#8B5CF6',
    'posting': '#3B82F6',
    'icp': '#F59E0B',
    'priority': '#10B981',
    'status': '#3B82F6',
    'outreach': '#EC4899',
    'products': '#F59E0B',
    'revenue': '#10B981',
    'special': '#8B5CF6',
    'scraped': '#6B7280'
  };
  return colors[category] || '#6B7280';
}

/**
 * Normalize a tag (handles both simple strings and complex objects)
 */
function normalizeTag(tag) {
  if (typeof tag === 'string') {
    const [category, name] = tag.split(':');
    return {
      full_tag: tag,
      category: category,
      name: name,
      applied_by: 'auto'
    };
  }
  return tag;
}

/**
 * Get tags by category (client-safe helper)
 */
function getTagsByCategory(lead, category) {
  if (!lead?.tags || !Array.isArray(lead.tags)) return [];
  return lead.tags
    .map(normalizeTag)
    .filter(tag => tag && tag.category === category);
}

/**
 * Get priority tag (client-safe helper)
 */
function getPriorityTag(lead) {
  const tags = getTagsByCategory(lead, 'priority');
  return tags.length > 0 ? tags[0] : null;
}

/**
 * TagBadge Component
 */
export function TagBadge({ tag, onRemove }) {
  const color = getTagColor(tag.full_tag);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm"
      style={{
        backgroundColor: `${color}15`,
        borderColor: color,
        color: color
      }}
    >
      <span>{tag.name || tag.full_tag}</span>

      {tag.applied_by === 'ai' && tag.confidence && (
        <span className="text-[10px] opacity-70" title={`AI Confidence: ${(tag.confidence * 100).toFixed(0)}%`}>
          🤖{(tag.confidence * 100).toFixed(0)}%
        </span>
      )}

      {tag.applied_by === 'manual' && (
        <span className="text-[10px] opacity-70" title="Manually applied">✏️</span>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.full_tag);
          }}
          className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
          title="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
}

/**
 * TagCategory Component
 */
export function TagCategory({ title, icon, tags, onRemoveTag }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
        {icon && <span className="text-base">{icon}</span>}
        <span>{title}</span>
        <span className="text-xs text-gray-400 font-normal">({tags.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <TagBadge
            key={tag.full_tag}
            tag={tag}
            onRemove={onRemoveTag}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * TagsSection Component
 */
export default function TagsSection({ lead, onUpdateTags, onLoadingStateChange }) {
  const [showTags, setShowTags] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const priorityTag = getPriorityTag(lead);
  const tagCount = lead?.tags?.length || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onLoadingStateChange) onLoadingStateChange(true);

    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, leadData: lead })
      });

      const data = await response.json();

      if (data.success && onUpdateTags) {
        onUpdateTags(data.enrichedData);
        alert('✅ Lead enriched successfully!');
      } else {
        alert('❌ Refresh failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('❌ Refresh failed: ' + error.message);
    } finally {
      setRefreshing(false);
      if (onLoadingStateChange) onLoadingStateChange(false);
    }
  };

  // Auto-enrich effect
  React.useEffect(() => {
    // Check if we should auto-trigger enrichment
    // 1. Lead has NO tags (not even basic ones, implying no previous enrichment)
    // 2. We haven't tried refreshing yet in this session
    // 3. We are not currently refreshing
    if (tagCount === 0 && !refreshing && !lead.enrichmentHistory?.length) {
      console.log('🤖 Auto-triggering enrichment for empty lead:', lead.name);
      handleRefresh();
    }
  }, [tagCount, lead.id]); // Dependency on ID ensures it runs when lead changes

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      <button
        onClick={() => setShowTags(!showTags)}
        className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏷️</span>
          <span className="font-semibold text-sm text-gray-900">Tags</span>
          <span className="text-xs text-gray-500">({tagCount})</span>
          {priorityTag && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              {priorityTag.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={refreshing}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh Instagram data and re-tag"
          >
            {refreshing ? '⏳' : '🔄'}
          </button>
          <span className="text-xs text-gray-400">{showTags ? '▼' : '▶'}</span>
        </div>
      </button>

      {showTags && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          {tagCount === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {refreshing ? (
                <span className="animate-pulse">🔮 Analyzing lead with Deep Research...</span>
              ) : (
                "No Deep Research tags yet. Click refresh to analyze."
              )}
            </p>
          ) : (
            <div className="space-y-4">
              <TagCategory
                title="Priority"
                icon="🎯"
                tags={getTagsByCategory(lead, 'priority')}
              />
              <TagCategory
                title="Business"
                icon="🏢"
                tags={getTagsByCategory(lead, 'business')}
              />
              <TagCategory
                title="Geography"
                icon="🌍"
                tags={getTagsByCategory(lead, 'geo')}
              />
              <TagCategory
                title="Platform"
                icon="📱"
                tags={getTagsByCategory(lead, 'platform')}
              />
              <TagCategory
                title="Audience"
                icon="👥"
                tags={[
                  ...getTagsByCategory(lead, 'followers'),
                  ...getTagsByCategory(lead, 'engagement')
                ]}
              />
              <TagCategory
                title="Pain Points"
                icon="😰"
                tags={getTagsByCategory(lead, 'pain')}
              />
              <TagCategory
                title="Content"
                icon="🎨"
                tags={[
                  ...getTagsByCategory(lead, 'content'),
                  ...getTagsByCategory(lead, 'posting')
                ]}
              />
              <TagCategory
                title="ICP Match"
                icon="🤝"
                tags={getTagsByCategory(lead, 'icp')}
              />
              <TagCategory
                title="Outreach"
                icon="✉️"
                tags={getTagsByCategory(lead, 'outreach')}
              />
              <TagCategory
                title="Products"
                icon="📦"
                tags={getTagsByCategory(lead, 'products')}
              />
              {/* Other Tags (Catchall for any uncategorized tags) */}
              <TagCategory
                title="Other Tags"
                icon="🏷️"
                tags={lead?.tags?.map(normalizeTag).filter(tag =>
                  tag &&
                  tag.full_tag &&
                  !tag.full_tag.includes('}') && // Filter out obviously malformed json artifacts
                  ![
                    'priority', 'business', 'geo', 'platform',
                    'followers', 'engagement', 'pain', 'content',
                    'posting', 'icp', 'outreach', 'products'
                  ].includes(tag.category)
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
