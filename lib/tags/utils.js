/**
 * Tag Utility Functions
 * Core functions for manipulating tags on lead objects
 */

import { TAG_DEFINITIONS, isValidTag } from './definitions.js';

/**
 * Create a tag object with metadata
 * @param {string} fullTag - Full tag name (e.g., "business:fashion")
 * @param {object} metadata - Additional metadata (applied_by, confidence, etc.)
 * @returns {object} Tag object
 */
export function createTag(fullTag, metadata = {}) {
    if (!isValidTag(fullTag)) {
        console.warn(`[TAGS] Invalid tag: ${fullTag}`);
        return null;
    }

    const [category, name] = fullTag.split(':');

    return {
        category,
        name,
        full_tag: fullTag,
        applied_by: metadata.applied_by || 'auto',
        applied_at: metadata.applied_at || new Date().toISOString(),
        ...(metadata.confidence && { confidence: metadata.confidence }),
        ...(metadata.evidence && { evidence: metadata.evidence })
    };
}

/**
 * Add a tag to a lead
 * @param {object} lead - Lead object
 * @param {string} fullTag - Full tag name
 * @param {object} metadata - Tag metadata
 * @returns {object} Updated lead object
 */
export function addTag(lead, fullTag, metadata = {}) {
    if (!lead.tags) {
        lead.tags = [];
    }

    // Check if tag already exists
    if (hasTag(lead, fullTag)) {
        console.log(`[TAGS] Lead ${lead.id} already has tag: ${fullTag}`);
        return lead;
    }

    const tag = createTag(fullTag, metadata);
    if (tag) {
        lead.tags.push(tag);
        console.log(`[TAGS] Added tag ${fullTag} to lead ${lead.id} (${metadata.applied_by || 'auto'})`);
    }

    return lead;
}

/**
 * Remove a tag from a lead
 * @param {object} lead - Lead object
 * @param {string} fullTag - Full tag name to remove
 * @returns {object} Updated lead object
 */
export function removeTag(lead, fullTag) {
    if (!lead.tags) {
        return lead;
    }

    const initialLength = lead.tags.length;
    lead.tags = lead.tags.filter(tag => tag.full_tag !== fullTag);

    if (lead.tags.length < initialLength) {
        console.log(`[TAGS] Removed tag ${fullTag} from lead ${lead.id}`);
    }

    return lead;
}

/**
 * Check if lead has a specific tag
 * @param {object} lead - Lead object
 * @param {string} fullTag - Full tag name to check
 * @returns {boolean} True if lead has the tag
 */
export function hasTag(lead, fullTag) {
    if (!lead.tags || !Array.isArray(lead.tags)) {
        return false;
    }
    return lead.tags.some(tag => tag.full_tag === fullTag);
}

/**
 * Get all tags in a specific category for a lead
 * @param {object} lead - Lead object
 * @param {string} category - Category name (e.g., "business", "geo")
 * @returns {array} Array of tag objects in that category
 */
export function getTagsByCategory(lead, category) {
    if (!lead.tags || !Array.isArray(lead.tags)) {
        return [];
    }
    return lead.tags.filter(tag => tag.category === category);
}

/**
 * Remove all tags in a specific category
 * @param {object} lead - Lead object
 * @param {string} category - Category name
 * @returns {object} Updated lead object
 */
export function removeTagsByCategory(lead, category) {
    if (!lead.tags) {
        return lead;
    }

    const initialLength = lead.tags.length;
    lead.tags = lead.tags.filter(tag => tag.category !== category);

    const removed = initialLength - lead.tags.length;
    if (removed > 0) {
        console.log(`[TAGS] Removed ${removed} tags from category ${category} for lead ${lead.id}`);
    }

    return lead;
}

/**
 * Get the first tag in a category (useful for single-value categories like priority)
 * @param {object} lead - Lead object
 * @param {string} category - Category name
 * @returns {object|null} Tag object or null
 */
export function getFirstTagInCategory(lead, category) {
    const tags = getTagsByCategory(lead, category);
    return tags.length > 0 ? tags[0] : null;
}

/**
 * Replace all tags in a category with a new tag
 * @param {object} lead - Lead object
 * @param {string} fullTag - New tag to set
 * @param {object} metadata - Tag metadata
 * @returns {object} Updated lead object
 */
export function setTagInCategory(lead, fullTag, metadata = {}) {
    const [category] = fullTag.split(':');
    removeTagsByCategory(lead, category);
    return addTag(lead, fullTag, metadata);
}

/**
 * Get priority tag (helper for common use case)
 * @param {object} lead - Lead object
 * @returns {object|null} Priority tag object
 */
export function getPriorityTag(lead) {
    return getFirstTagInCategory(lead, 'priority');
}

/**
 * Get ICP tag (helper for common use case)
 * @param {object} lead - Lead object
 * @returns {object|null} ICP tag object
 */
export function getICPTag(lead) {
    return getFirstTagInCategory(lead, 'icp');
}

/**
 * Format tag for display in UI
 * @param {object} tag - Tag object
 * @returns {object} Formatted tag with display properties
 */
export function formatTagForDisplay(tag) {
    const definition = TAG_DEFINITIONS[tag.full_tag];

    return {
        ...tag,
        label: definition?.label || tag.name,
        color: definition?.color || '#6B7280',
        icon: definition?.icon,
        description: definition?.description
    };
}

/**
 * Get all unique tags across multiple leads
 * @param {array} leads - Array of lead objects
 * @returns {object} Object with categories as keys, arrays of unique tags as values
 */
export function getAllUniqueTags(leads) {
    const uniqueTags = {};

    leads.forEach(lead => {
        if (!lead.tags) return;

        lead.tags.forEach(tag => {
            if (!uniqueTags[tag.category]) {
                uniqueTags[tag.category] = new Set();
            }
            uniqueTags[tag.category].add(tag.full_tag);
        });
    });

    // Convert Sets to sorted arrays
    Object.keys(uniqueTags).forEach(category => {
        uniqueTags[category] = Array.from(uniqueTags[category]).sort();
    });

    return uniqueTags;
}

/**
 * Filter leads by tags (AND logic - lead must have ALL specified tags)
 * @param {array} leads - Array of lead objects
 * @param {array} tagFilters - Array of full tag names to filter by
 * @returns {array} Filtered leads
 */
export function filterLeadsByTags(leads, tagFilters) {
    if (!tagFilters || tagFilters.length === 0) {
        return leads;
    }

    return leads.filter(lead => {
        return tagFilters.every(fullTag => hasTag(lead, fullTag));
    });
}

/**
 * Filter leads by tags (OR logic - lead must have ANY of the specified tags)
 * @param {array} leads - Array of lead objects
 * @param {array} tagFilters - Array of full tag names to filter by
 * @returns {array} Filtered leads
 */
export function filterLeadsByTagsOr(leads, tagFilters) {
    if (!tagFilters || tagFilters.length === 0) {
        return leads;
    }

    return leads.filter(lead => {
        return tagFilters.some(fullTag => hasTag(lead, fullTag));
    });
}

/**
 * Get tag statistics across all leads
 * @param {array} leads - Array of lead objects
 * @returns {object} Statistics object with tag counts
 */
export function getTagStatistics(leads) {
    const stats = {};

    leads.forEach(lead => {
        if (!lead.tags) return;

        lead.tags.forEach(tag => {
            if (!stats[tag.full_tag]) {
                stats[tag.full_tag] = {
                    count: 0,
                    category: tag.category,
                    applied_by_auto: 0,
                    applied_by_manual: 0,
                    applied_by_ai: 0
                };
            }

            stats[tag.full_tag].count++;

            if (tag.applied_by === 'auto') stats[tag.full_tag].applied_by_auto++;
            else if (tag.applied_by === 'manual') stats[tag.full_tag].applied_by_manual++;
            else if (tag.applied_by === 'ai') stats[tag.full_tag].applied_by_ai++;
        });
    });

    return stats;
}

/**
 * Validate lead tags (check for invalid tags, duplicates, etc.)
 * @param {object} lead - Lead object
 * @returns {object} Validation result with errors and warnings
 */
export function validateLeadTags(lead) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    if (!lead.tags || !Array.isArray(lead.tags)) {
        result.warnings.push('Lead has no tags array');
        return result;
    }

    const seenTags = new Set();

    lead.tags.forEach((tag, index) => {
        // Check for required fields
        if (!tag.full_tag) {
            result.errors.push(`Tag at index ${index} missing full_tag`);
            result.valid = false;
        }

        // Check for valid tag definition
        if (tag.full_tag && !isValidTag(tag.full_tag)) {
            result.warnings.push(`Unknown tag: ${tag.full_tag}`);
        }

        // Check for duplicates
        if (tag.full_tag && seenTags.has(tag.full_tag)) {
            result.warnings.push(`Duplicate tag: ${tag.full_tag}`);
        }
        seenTags.add(tag.full_tag);

        // Check AI tags have confidence scores
        if (tag.applied_by === 'ai' && !tag.confidence) {
            result.warnings.push(`AI tag ${tag.full_tag} missing confidence score`);
        }
    });

    return result;
}

/**
 * Clean up lead tags (remove duplicates, invalid tags, etc.)
 * @param {object} lead - Lead object
 * @returns {object} Updated lead object with cleaned tags
 */
export function cleanLeadTags(lead) {
    if (!lead.tags || !Array.isArray(lead.tags)) {
        lead.tags = [];
        return lead;
    }

    const seenTags = new Set();
    const cleanedTags = [];

    lead.tags.forEach(tag => {
        // Skip if missing full_tag
        if (!tag.full_tag) return;

        // Skip if duplicate
        if (seenTags.has(tag.full_tag)) return;

        // Skip if invalid (unless manually applied)
        if (!isValidTag(tag.full_tag) && tag.applied_by !== 'manual') return;

        seenTags.add(tag.full_tag);
        cleanedTags.push(tag);
    });

    lead.tags = cleanedTags;
    return lead;
}
