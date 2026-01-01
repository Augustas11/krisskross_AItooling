
import React, { useState } from 'react';
import {
    Instagram, Globe, Mail, Phone, MapPin,
    TrendingUp, Eye, Video, Brain,
    History, ChevronDown, ChevronUp, Copy,
    CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTierForScore } from '../lib/scoring-constants';

/**
 * LeadIntelligenceCard - The ultimate SDR view
 * Displays comprehensive lead data from Apify, Perplexity, and Claude
 */
export function LeadIntelligenceCard({ lead, isEnriching }) {
    const [activeTab, setActiveTab] = useState('overview'); // overview, history, raw
    const [isResearchExpanded, setResearchExpanded] = useState(true);

    if (!lead) return null;

    // Helper: Copy text
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Toast logic could go here
    };

    // Helper: Categorize tags
    const organizeTags = (tags) => {
        const groups = {
            business: [],
            pain: [],
            content: [],
            other: []
        };

        (tags || []).forEach(tag => {
            const cat = tag.category;
            if (groups[cat]) groups[cat].push(tag);
            else groups.other.push(tag);
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
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Vitals + Contact (35% width) */}
                <div className="lg:col-span-1 space-y-6">

                    {/* SOCIAL VITAL SIGNS - Compact Table */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <SectionTitle icon={<TrendingUp className="w-4 h-4" />} title="Social Metrics" />
                        <div className="space-y-2 mt-3">
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                                    Followers
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {lead.instagramFollowers ? lead.instagramFollowers.toLocaleString() : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                                    Engagement
                                </span>
                                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                    {lead.engagementRate ? `${lead.engagementRate}%` : '-'}
                                    {lead.engagementRate && (lead.engagementRate > 2 ? <span className="text-xs">✅</span> : <span className="text-xs">⚠️</span>)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    Avg Views
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {lead.avgVideoViews ? lead.avgVideoViews.toLocaleString() : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <Video className="w-3.5 h-3.5 text-purple-500" />
                                    Content
                                </span>
                                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                    {lead.hasReels === true ? 'Reels' : (lead.hasReels === false ? 'Static' : '-')}
                                    {lead.hasReels === true && <span className="text-xs">📹</span>}
                                    {lead.hasReels === false && <span className="text-xs">⚠️</span>}
                                </span>
                            </div>
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

                    {/* TIER + SCORE INDICATOR */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Match Score</div>
                                <div className="text-2xl font-black text-gray-900">{lead.score || 0}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 mb-1">Tier</div>
                                <div className="text-sm font-bold text-gray-700">{getTierForScore(lead.score)?.name || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Tags + AI Research (65% width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* UNIFIED AI TAGS */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <SectionTitle icon={<Brain className="w-4 h-4" />} title="AI Insights" />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {(() => {
                                // Priority sort all tags: business > pain > content > other
                                const priority = { business: 1, pain: 2, content: 3, other: 4 };
                                const colorClasses = {
                                    business: 'bg-blue-50 border-blue-200 text-blue-700',
                                    pain: 'bg-red-50 border-red-200 text-red-700',
                                    content: 'bg-purple-50 border-purple-200 text-purple-700',
                                    other: 'bg-gray-50 border-gray-200 text-gray-700'
                                };
                                const allTags = [...(tagGroups.business || []), ...(tagGroups.pain || []), ...(tagGroups.content || []), ...(tagGroups.other || [])];
                                const sortedTags = allTags.sort((a, b) => (priority[a.category] || 4) - (priority[b.category] || 4));
                                const visibleTags = sortedTags.slice(0, 8);

                                return (
                                    <>
                                        {visibleTags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${colorClasses[tag.category] || colorClasses.other}`}
                                                title={tag.evidence}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                        {sortedTags.length > 8 && (
                                            <span className="px-2.5 py-1 text-xs text-gray-400">+{sortedTags.length - 8} more</span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* CONDENSED AI RESEARCH */}
                    <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
                        <SectionTitle icon={<Brain className="w-4 h-4 text-indigo-600" />} title="AI Research Summary" />
                        <div className="mt-3">
                            {lead.ai_research_summary ? (
                                <>
                                    <div className={`text-sm text-gray-700 leading-relaxed ${!isResearchExpanded ? 'line-clamp-4' : ''}`}>
                                        {lead.ai_research_summary.split('\n').slice(0, isResearchExpanded ? undefined : 3).map((para, i) => (
                                            <p key={i} className="mb-2">
                                                {para.replace(/\*\*/g, '').replace(/\[\d+\]/g, '').replace(/###/g, '')}
                                            </p>
                                        ))}
                                    </div>
                                    {lead.ai_research_summary.split('\n').length > 3 && (
                                        <button
                                            onClick={() => setResearchExpanded(!isResearchExpanded)}
                                            className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                        >
                                            {isResearchExpanded ? (
                                                <><ChevronUp className="w-3 h-3" /> Show Less</>
                                            ) : (
                                                <><ChevronDown className="w-3 h-3" /> Expand Full Research</>
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="text-gray-400 italic text-sm py-4 text-center">
                                    {isEnriching ? (
                                        <span className="flex items-center justify-center gap-2 animate-pulse text-indigo-500">
                                            Running Deep Research...
                                        </span>
                                    ) : (
                                        'No research available yet'
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
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
