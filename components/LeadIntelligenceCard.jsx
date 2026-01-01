
import React, { useState } from 'react';
import {
    Instagram, Globe, Mail, Phone, MapPin,
    TrendingUp, Eye, Video, Brain,
    History, ChevronDown, ChevronUp, Copy,
    CheckCircle2, AlertTriangle, X, Sparkles, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LeadIntelligenceCard - The ultimate SDR view
 * Displays comprehensive lead data from Apify, Perplexity, and Claude
 */
export function LeadIntelligenceCard({ lead, isEnriching, onRunDeepResearch }) {
    const [activeTab, setActiveTab] = useState('overview'); // overview, history, raw
    const [isResearchExpanded, setResearchExpanded] = useState(true);

    if (!lead) return null;

    // Helper: Copy text
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Toast logic could go here
    };

    // Helper: Categorize tags - NOW DYNAMIC!
    const organizeTags = (tags) => {
        const groups = {};

        (tags || []).forEach(tag => {
            // Handle both string tags ("followers:10k-100k") and object tags
            let category, name, fullTag, evidence;

            if (typeof tag === 'string') {
                const parts = tag.split(':');
                category = parts[0] || 'other';
                name = parts[1] || tag;
                fullTag = tag;
            } else if (tag && tag.category) {
                category = tag.category;
                name = tag.name || tag.full_tag;
                fullTag = tag.full_tag || `${tag.category}:${tag.name}`;
                evidence = tag.evidence;
            } else {
                return; // Skip invalid tags
            }

            if (!groups[category]) {
                groups[category] = [];
            }

            groups[category].push({
                name,
                full_tag: fullTag,
                evidence,
                category
            });
        });

        return groups;
    };

    const tagGroups = organizeTags(lead.tags);

    return (
        <div className="bg-gray-50/50 min-h-full">
            {/* 1. HEADER HERO */}
            <div className="bg-white border-b sticky top-0 z-10 p-6 flex justify-between items-start shadow-sm">
                <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                            {lead.verified && <CheckCircle2 className="w-5 h-5 text-blue-500" fill="currentColor" />}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${lead.enriched ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                                {lead.enriched ? 'ENRICHED' : 'NEW LEAD'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {lead.instagramBusinessCategory && (
                                <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {lead.instagramBusinessCategory}
                                </span>
                            )}
                            {lead.website && (
                                <a
                                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                >
                                    <Globe className="w-3 h-3" />
                                    {lead.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                            {lead.instagram && (
                                <a href={`https://instagram.com/${lead.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-pink-600 transition-colors">
                                    <Instagram className="w-3 h-3" />
                                    @{lead.instagram}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Score Card */}
                <div className="flex flex-col items-end">
                    <div className="text-3xl font-black text-gray-900">{lead.score || 0}</div>
                    <div className="text-xs uppercase tracking-wide font-semibold text-gray-400">Match Score</div>
                </div>
            </div>

            {/* 2. MAIN CONTENT GRID (Horizontal Layout) */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* LEFT COLUMN: Vitals + Tags (35% width) */}
                <div className="lg:col-span-4 space-y-4">

                    {/* SOCIAL VITAL SIGNS */}
                    <div>
                        <SectionTitle icon={<TrendingUp className="w-4 h-4" />} title="Social Vital Signs" />
                        <div className="grid grid-cols-2 gap-4">
                            {/* Only show metrics if data exists */}
                            {lead.instagramFollowers && (
                                <MetricCard
                                    label="Followers"
                                    value={lead.instagramFollowers.toLocaleString()}
                                    subValue={lead.instagramFollowers > 10000 ? '🔥 Great Reach' : '🌱 Growing'}
                                    icon={<Instagram className="w-4 h-4 text-pink-500" />}
                                />
                            )}
                            {lead.engagementRate && (
                                <MetricCard
                                    label="Engagement"
                                    value={`${lead.engagementRate}%`}
                                    subValue={lead.engagementRate > 2 ? '✅ Healthy' : '⚠️ Needs Help'}
                                    icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                                />
                            )}
                            {lead.avgVideoViews && (
                                <MetricCard
                                    label="Avg Video Views"
                                    value={lead.avgVideoViews.toLocaleString()}
                                    icon={<Eye className="w-4 h-4 text-blue-500" />}
                                />
                            )}
                            {lead.hasReels !== undefined && lead.hasReels !== null && (
                                <MetricCard
                                    label="Content Type"
                                    value={lead.hasReels ? 'Reels Active' : 'Static Only'}
                                    subValue={lead.hasReels ? '📹 Video Focused' : '📸 Photo Focused'}
                                    isWarning={!lead.hasReels}
                                    icon={<Video className="w-4 h-4 text-purple-500" />}
                                />
                            )}
                            {/* Show placeholder if no metrics available */}
                            {!lead.instagramFollowers && !lead.engagementRate && !lead.avgVideoViews && !lead.hasReels && (
                                <div className="col-span-2 text-center py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-xl">
                                    No social metrics available yet. Run Deep Research to populate.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CONTACT INFO (Compact) */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Contact Details</div>
                        <div className="space-y-2">
                            <ContactRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={lead.email} copyable />
                            <ContactRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={lead.phone} copyable />
                            <ContactRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={lead.businessAddress || 'Unknown'} />
                        </div>
                    </div>

                    {/* AI TAGS ANALYSIS - DYNAMIC */}
                    <div>
                        <SectionTitle icon={<Brain className="w-4 h-4" />} title="AI Analysis" />
                        {Object.keys(tagGroups).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Render all tag categories dynamically */}
                                {tagGroups.pain && tagGroups.pain.length > 0 && (
                                    <TagGroup
                                        title="Pain Points"
                                        tags={tagGroups.pain}
                                        icon={<AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                        color="red"
                                    />
                                )}
                                {tagGroups.business && tagGroups.business.length > 0 && (
                                    <TagGroup
                                        title="Business"
                                        tags={tagGroups.business}
                                        icon={<Globe className="w-3.5 h-3.5 text-blue-500" />}
                                        color="blue"
                                    />
                                )}
                                {tagGroups.content && tagGroups.content.length > 0 && (
                                    <TagGroup
                                        title="Content"
                                        tags={tagGroups.content}
                                        icon={<Video className="w-3.5 h-3.5 text-purple-500" />}
                                        color="purple"
                                    />
                                )}
                                {tagGroups.geo && tagGroups.geo.length > 0 && (
                                    <TagGroup
                                        title="Geography"
                                        tags={tagGroups.geo}
                                        icon={<MapPin className="w-3.5 h-3.5 text-green-500" />}
                                        color="green"
                                    />
                                )}
                                {tagGroups.platform && tagGroups.platform.length > 0 && (
                                    <TagGroup
                                        title="Platform"
                                        tags={tagGroups.platform}
                                        icon={<Instagram className="w-3.5 h-3.5 text-pink-500" />}
                                        color="pink"
                                    />
                                )}
                                {tagGroups.icp && tagGroups.icp.length > 0 && (
                                    <TagGroup
                                        title="ICP Match"
                                        tags={tagGroups.icp}
                                        icon={<CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />}
                                        color="indigo"
                                    />
                                )}
                                {tagGroups.priority && tagGroups.priority.length > 0 && (
                                    <TagGroup
                                        title="Priority"
                                        tags={tagGroups.priority}
                                        icon={<TrendingUp className="w-3.5 h-3.5 text-orange-500" />}
                                        color="orange"
                                    />
                                )}
                                {tagGroups.followers && tagGroups.followers.length > 0 && (
                                    <TagGroup
                                        title="Followers"
                                        tags={tagGroups.followers}
                                        icon={<Instagram className="w-3.5 h-3.5 text-purple-500" />}
                                        color="purple"
                                    />
                                )}
                                {tagGroups.engagement && tagGroups.engagement.length > 0 && (
                                    <TagGroup
                                        title="Engagement"
                                        tags={tagGroups.engagement}
                                        icon={<TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                                        color="green"
                                    />
                                )}
                                {/* Render any other categories not explicitly handled */}
                                {Object.keys(tagGroups).filter(cat =>
                                    !['pain', 'business', 'content', 'geo', 'platform', 'icp', 'priority', 'followers', 'engagement'].includes(cat)
                                ).map(category => {
                                    if (tagGroups[category] && tagGroups[category].length > 0) {
                                        return (
                                            <TagGroup
                                                key={category}
                                                title={category.charAt(0).toUpperCase() + category.slice(1)}
                                                tags={tagGroups[category]}
                                                icon={<Brain className="w-3.5 h-3.5 text-gray-500" />}
                                                color="gray"
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-xl">
                                No AI tags available. Run Deep Research to analyze this lead.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Deep Research (65% width) */}
                <div className="lg:col-span-8 space-y-4">
                    {/* DEEP RESEARCH INSIGHTS */}
                    <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col">
                        <div className="bg-indigo-50/50 p-4 flex justify-between items-center border-b border-indigo-100">
                            <div
                                className="flex items-center gap-2 cursor-pointer flex-1"
                                onClick={() => setResearchExpanded(!isResearchExpanded)}
                            >
                                <Brain className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-indigo-900">Deep Research Insights (Triple Threat)</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Run Deep Research Button */}
                                {onRunDeepResearch && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRunDeepResearch();
                                        }}
                                        disabled={isEnriching}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                                        title="Run Deep Research (Triple Threat)"
                                    >
                                        {isEnriching ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Running...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Run Deep Research
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => setResearchExpanded(!isResearchExpanded)}
                                    className="p-1 hover:bg-indigo-100 rounded transition-colors"
                                >
                                    {isResearchExpanded ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-indigo-400" />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isResearchExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="p-6 text-sm text-gray-700 leading-relaxed overflow-y-auto max-h-[450px] custom-scrollbar"
                                >
                                    {lead.ai_research_summary ? (
                                        <div className="prose prose-sm max-w-none text-gray-700">
                                            {lead.ai_research_summary.split('\n').map((para, i) => (
                                                <p key={i} className={`mb-3 ${para.startsWith('**') || para.startsWith('###') ? 'font-bold text-indigo-900 text-base mt-4' : ''}`}>
                                                    {para.replace(/\*\*/g, '').replace(/\[\d+\]/g, '').replace(/###/g, '')}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 italic text-center py-10 flex flex-col items-center justify-center gap-4">
                                            {isEnriching ? (
                                                <span className="flex items-center justify-center gap-2 animate-pulse text-indigo-500">
                                                    <Sparkles className="w-5 h-5" />
                                                    Running Deep Research (Triple Threat)...
                                                </span>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-12 h-12 text-gray-300" />
                                                    <div className="mb-2">No deep research available yet.</div>
                                                    <div className="text-xs text-gray-500">Click "Run Deep Research" button above to start Triple Threat analysis.</div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* FOOTER HISTORY LOG (If applicable) */}
            <div className="p-6 border-t border-gray-200 mt-6 bg-gray-100/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    <History className="w-4 h-4" />
                    Enrichment History
                </div>
                <div className="space-y-3">
                    {lead.enrichmentHistory && lead.enrichmentHistory.length > 0 ? (
                        lead.enrichmentHistory.map((event, idx) => (
                            <HistoryItem
                                key={idx}
                                date={event.timestamp}
                                action={event.method}
                                details={event.details}
                            />
                        ))
                    ) : (
                        <>
                            <HistoryItem
                                date={lead.lastEnrichedAt}
                                action="Legacy Enrichment"
                                details="Enriched with older system version"
                            />
                            <HistoryItem
                                date={lead.addedAt}
                                action="Lead Captured"
                                details={`Imported via ${lead.source === 'manual' ? 'CSV Import' : (lead.source === 'discovery' ? 'Lead Discovery' : (lead.briefDescription ? 'Scraper' : 'System'))}`}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function SectionTitle({ icon, title }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
    );
}

function MetricCard({ label, value, subValue, icon, isWarning }) {
    return (
        <div className={`p-4 rounded-xl border ${isWarning ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'} shadow-sm flex flex-col justify-between h-full transition-colors`}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold text-gray-900 leading-none">{value}</div>
                {subValue && <div className={`text-xs mt-2 font-semibold ${isWarning ? 'text-orange-600' : 'text-green-600'}`}>{subValue}</div>}
            </div>
        </div>
    );
}

function ContactRow({ icon, label, value, copyable }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {icon}
                </div>
                {value ? (
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{value}</span>
                ) : (
                    <span className="text-sm italic text-gray-400">N/A</span>
                )}
            </div>
            {value && copyable && (
                <button
                    onClick={() => navigator.clipboard.writeText(value)}
                    className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                >
                    <Copy className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

function TagGroup({ title, tags, icon, color }) {
    const colorClasses = {
        red: 'bg-red-50 border-red-100 text-red-700',
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        purple: 'bg-purple-50 border-purple-100 text-purple-700',
        orange: 'bg-orange-50 border-orange-100 text-orange-700',
        green: 'bg-green-50 border-green-100 text-green-700',
        pink: 'bg-pink-50 border-pink-100 text-pink-700',
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
        gray: 'bg-gray-50 border-gray-200 text-gray-700',
    };

    if (!tags || tags.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                {icon}
                <span className="text-sm font-bold text-gray-800">{title}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                    <div
                        key={idx}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${colorClasses[color] || colorClasses.blue} hover:brightness-95 cursor-help transition-all`}
                        title={tag.evidence} // Tooltip showing the "WHY" (Perplexity evidence)
                    >
                        {tag.name}
                    </div>
                ))}
            </div>
            {tags.length > 0 && tags[0].evidence && (
                <div className="mt-3 text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2 line-clamp-2">
                    "{tags[0].evidence}"
                </div>
            )}
        </div>
    );
}

function HistoryItem({ date, action, details }) {
    if (!date) return null;
    return (
        <div className="flex gap-4 items-start">
            <div className="w-24 text-xs text-gray-400 font-mono pt-0.5">
                {new Date(date).toLocaleDateString()}
            </div>
            <div>
                <div className="text-sm font-semibold text-gray-800">{action}</div>
                <div className="text-xs text-gray-500">{details}</div>
            </div>
        </div>
    );
}
