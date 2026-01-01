
import React, { useState } from 'react';
import {
    Instagram, Globe, Mail, Phone, MapPin,
    TrendingUp, Eye, Video, Brain,
    History, ChevronDown, ChevronUp, Copy,
    CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LeadIntelligenceCard - The ultimate SDR view
 * Displays comprehensive lead data from Apify, Perplexity, and Claude
 */
export function LeadIntelligenceCard({ lead }) {
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
                                <a href={`https://${lead.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                    <Globe className="w-3 h-3" />
                                    {lead.website}
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

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMN 1: METRICS & VITAL SIGNS (Apify) */}
                <div className="space-y-6">
                    <SectionTitle icon={<TrendingUp className="w-4 h-4" />} title="Social Vital Signs" />

                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                            label="Followers"
                            value={lead.instagramFollowers?.toLocaleString() || '-'}
                            subValue={lead.instagramFollowers > 10000 ? '🔥 Great Reach' : '🌱 Growing'}
                            icon={<Instagram className="w-4 h-4 text-pink-500" />}
                        />
                        <MetricCard
                            label="Engagement"
                            value={lead.engagementRate ? `${lead.engagementRate}%` : '-'}
                            subValue={lead.engagementRate > 2 ? '✅ Healthy' : '⚠️ Needs Help'}
                            icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                        />
                        <MetricCard
                            label="Avg Video Views"
                            value={lead.avgVideoViews?.toLocaleString() || '-'}
                            icon={<Eye className="w-4 h-4 text-blue-500" />}
                        />
                        <MetricCard
                            label="Content Type"
                            value={lead.hasReels ? 'Reels Active' : 'Static Only'}
                            subValue={lead.hasReels ? '📹 Video Focused' : '📸 Photo Focused'}
                            isWarning={!lead.hasReels}
                            icon={<Video className="w-4 h-4 text-purple-500" />}
                        />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Contact Info</div>
                        <div className="space-y-3">
                            <ContactRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} copyable />
                            <ContactRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone} copyable />
                            <ContactRow icon={<MapPin className="w-4 h-4" />} label="Location" value={lead.businessAddress || 'Unknown'} />
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: INTELLIGENCE & RESEARCH (Perplexity + Claude) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Perplexity Deep Dive */}
                    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                        <div
                            className="bg-indigo-50/50 p-4 flex justify-between items-center cursor-pointer hover:bg-indigo-50 transition-colors"
                            onClick={() => setResearchExpanded(!isResearchExpanded)}
                        >
                            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                Deep Research Insights
                            </div>
                            {isResearchExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
                        </div>

                        <AnimatePresence>
                            {isResearchExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="p-5 text-sm text-gray-700 leading-relaxed border-t border-indigo-100"
                                >
                                    {lead.ai_research_summary ? (
                                        <div className="prose prose-sm max-w-none text-gray-700">
                                            {/* Simple formatting for text blocks */}
                                            {lead.ai_research_summary.split('\n').map((para, i) => (
                                                <p key={i} className={`mb-2 ${para.startsWith('**') ? 'font-semibold text-indigo-900' : ''}`}>
                                                    {para.replace(/\*\*/g, '')}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 italic text-center py-4">
                                            No deep research available. Run enrichment to generate insights.
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Claude Tags Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TagGroup
                            title="Detected Pain Points"
                            tags={tagGroups.pain}
                            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                            color="red"
                        />
                        <TagGroup
                            title="Business DNA"
                            tags={tagGroups.business}
                            icon={<Globe className="w-4 h-4 text-blue-500" />}
                            color="blue"
                        />
                        <TagGroup
                            title="Content Strategy"
                            tags={tagGroups.content}
                            icon={<Video className="w-4 h-4 text-purple-500" />}
                            color="purple"
                        />
                        <TagGroup
                            title="Posting Habits"
                            tags={tagGroups.posting}
                            icon={<History className="w-4 h-4 text-orange-500" />}
                            color="orange"
                        />
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
                                details={`Imported via ${lead.briefDescription ? 'Scraper' : 'System'}`}
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
        <div className={`p-4 rounded-xl border ${isWarning ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'} shadow-sm flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                {subValue && <div className={`text-xs mt-1 font-medium ${isWarning ? 'text-orange-600' : 'text-green-600'}`}>{subValue}</div>}
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
