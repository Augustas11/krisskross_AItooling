/**
 * Tag System - Main Export
 * Central export point for all tag-related functions
 */

// Tag definitions and metadata
export {
    TAG_CATEGORIES,
    TAG_DEFINITIONS,
    getTagsByCategory as getTagDefinitionsByCategory,
    getTagDefinition,
    isValidTag,
    getAllCategories
} from './definitions.js';

// Tag utility functions
export {
    createTag,
    addTag,
    removeTag,
    hasTag,
    getTagsByCategory,
    removeTagsByCategory,
    getFirstTagInCategory,
    setTagInCategory,
    getPriorityTag,
    getICPTag,
    formatTagForDisplay,
    getAllUniqueTags,
    filterLeadsByTags,
    filterLeadsByTagsOr,
    getTagStatistics,
    validateLeadTags,
    cleanLeadTags
} from './utils.js';

// Auto-tagging engine
export {
    autoTagLead,
    retagLead,
    batchAutoTag,
    applyBasicTags,
    applyPlatformTags,
    applyAudienceTags,
    applyPostingFrequencyTags,
    applyCompositeTags,
    // applyPriorityTier, // Removed
    calculatePostingFrequency
} from './auto-tagger.js';

// AI analysis
export {
    // analyzeCaptionsForPainPoints, // Removed
    analyzeBusinessType
} from './ai-analyzer.js';

// Enrichment (Apify + AI + Auto-tagging)
export {
    enrichAndTagLead,
    batchEnrichAndTag
} from './enrichment.js';
