'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, RefreshCw, MessageSquare, Clock, DollarSign, TrendingUp,
    Copy, CheckCircle, Trash2, Target, Search, Download, ChevronRight,
    Zap, Users, Mail, Instagram, MapPin, ExternalLink, Filter, BarChart3,
    FileText, Settings, Plus, Edit3, X, Globe, Phone, Eye
} from 'lucide-react';

export default function KrissKrossPitchGeneratorV3() {
    const [activeTab, setActiveTab] = useState('discover');
    const [targetType, setTargetType] = useState('fashion-seller');
    const [customName, setCustomName] = useState('');
    const [context, setContext] = useState('');
    const [generatedPitch, setGeneratedPitch] = useState('');
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [wasAiGenerated, setWasAiGenerated] = useState(false);
    const [genError, setGenError] = useState(null);
    const [lastTemplateIndex, setLastTemplateIndex] = useState(-1);

    // Lead Sourcing State
    const [sourceUrl, setSourceUrl] = useState('');
    const [foundLeads, setFoundLeads] = useState([]);
    const [isSourcing, setIsSourcing] = useState(false);
    const [isDeepHunt, setIsDeepHunt] = useState(false);
    const [sourceError, setSourceError] = useState(null);
    const [provider, setProvider] = useState('firecrawl'); // 'firecrawl' | 'perplexity' | 'grok'
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBulkAction, setIsBulkAction] = useState(false);
    const [selectedLeadIndices, setSelectedLeadIndices] = useState(new Set());

    // Enrichment State
    const [enrichingLeads, setEnrichingLeads] = useState({});
    const [viewingLead, setViewingLead] = useState(null);
    const [isEnrichingViewingLead, setIsEnrichingViewingLead] = useState(false);
    const [enrichmentStatus, setEnrichmentStatus] = useState("Initializing AI...");


    // CRM State
    const [savedLeads, setSavedLeads] = useState([]);
    const [isCrmInitialized, setIsCrmInitialized] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [crmFilter, setCrmFilter] = useState('all');
    // duplicate viewingLead removed

    // Load Leads from Server on mount
    React.useEffect(() => {
        const loadLeads = async () => {
            console.log('🔄 [CRM] Loading leads from server...');
            try {
                const response = await fetch('/api/crm/leads');
                const data = await response.json();
                console.log('📥 [CRM] Server response:', data);
                if (data.leads) {
                    console.log(`✅ [CRM] Loaded ${data.leads.length} leads from server`);
                    setSavedLeads(data.leads);
                } else {
                    console.warn('⚠️ [CRM] No leads property in server response');
                }
            } catch (e) {
                console.error('❌ [CRM] Failed to load leads from server:', e);
                const saved = localStorage.getItem('kk_leads_crm');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    console.log(`📦 [CRM] Loaded ${parsed.length} leads from localStorage (fallback)`);
                    setSavedLeads(parsed);
                }
            } finally {
                setIsCrmInitialized(true);
                console.log('✓ [CRM] Initialization complete');
            }
        };
        loadLeads();
    }, []);

    // Sync Leads to Server (IMMEDIATE - no delay to prevent data loss)
    React.useEffect(() => {
        if (isCrmInitialized && savedLeads.length >= 0) {
            const syncLeads = async () => {
                console.log(`💾 [CRM] Syncing ${savedLeads.length} leads to server...`);
                setIsSyncing(true);
                try {
                    // Save to localStorage as backup
                    localStorage.setItem('kk_leads_crm', JSON.stringify(savedLeads));
                    console.log('📦 [CRM] Saved to localStorage');

                    // Sync to server
                    const response = await fetch('/api/crm/leads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leads: savedLeads }),
                    });

                    if (!response.ok) {
                        throw new Error(`Server responded with ${response.status}`);
                    }

                    const result = await response.json();
                    console.log('✅ [CRM] Server sync successful:', result.message);
                } catch (e) {
                    console.error('❌ [CRM] Sync failed:', e);
                    alert('Warning: Failed to sync leads to server. Data saved locally only.');
                } finally {
                    setIsSyncing(false);
                }
            };

            // Sync immediately (no delay)
            syncLeads();
        }
    }, [savedLeads, isCrmInitialized]);

    const pitchTemplates = {
        'fashion-seller': [
            {
                hook: "Spending 10+ hours every week editing TikTok videos?",
                value: "KrissKross turns your product photos into scroll-stopping TikTok videos in minutes. No editing skills needed.",
                proof: "Save $250-500/month on freelancers. Just $20.99 for 50 videos.",
                cta: "Want to see how it works with your products?"
            },
        ],
        'ecommerce-owner': [
            {
                hook: "Running an e-commerce store means juggling everything—and video content always falls behind.",
                value: "KrissKross automates your TikTok video creation. Upload your product catalog, get platform-ready videos without the production hassle.",
                proof: "Scale from 0 to 50 videos/month for $20.99. No freelancers, no agencies, no technical headaches.",
                cta: "Want to see it work with your store's products?"
            },
        ],
        'affiliate': [
            {
                hook: "Promoting products on TikTok without custom videos? You're leaving commissions on the table.",
                value: "KrissKross lets you create professional product videos from brand photos in minutes. More content = more conversions = more commissions.",
                proof: "Create 50 videos/month for $20.99. Each video takes minutes, not hours. Your ROI on the first few sales.",
                cta: "Want to see how fast you can turn around video content?"
            },
        ]
    };

    const generatePitch = async () => {
        setIsLoading(true);
        setGenError(null);
        setWasAiGenerated(false);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetType, customName, context }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'AI Generation failed');
            }

            setGeneratedPitch(data.pitch);
            setWasAiGenerated(true);
        } catch (error) {
            console.error('AI Generation failed:', error);
            setGenError(error.message);

            const templates = pitchTemplates[targetType] || pitchTemplates['fashion-seller'];
            let templateIndex;
            do {
                templateIndex = Math.floor(Math.random() * templates.length);
            } while (templateIndex === lastTemplateIndex && templates.length > 1);

            setLastTemplateIndex(templateIndex);
            const template = templates[templateIndex];
            const fallbackPitch = `${customName ? `Hey ${customName}, ` : 'Hey, '}

${template.hook}

${template.value}

${template.proof}

${template.cta}`;
            setGeneratedPitch(fallbackPitch);
            setWasAiGenerated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPitch);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSourceLeads = async () => {
        if (!sourceUrl) return;

        setIsSourcing(true);
        setSourceError(null);

        try {
            const response = await fetch('/api/leads/source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: sourceUrl, deep: isDeepHunt, provider }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to source leads');
            }

            const leads = data.leads || [];
            setFoundLeads(leads);

            if (leads.length === 0) {
                setSourceError(data.message || 'No leads found on this page.');
            }
        } catch (error) {
            setSourceError(error.message);
        } finally {
            setIsSourcing(false);
        }
    };

    const handleEnrichLead = async (lead, index) => {
        if (!lead.storeUrl && !sourceUrl) return;

        setEnrichingLeads(prev => ({ ...prev, [index]: true }));
        try {
            const response = await fetch('/api/leads/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: lead.storeUrl || sourceUrl,
                    name: lead.name,
                    provider
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to enrich lead');

            const enrichedInfo = data.enrichedData;
            setFoundLeads(prev => prev.map((l, i) => {
                if (i === index) {
                    return {
                        ...l,
                        enriched: true,
                        businessAddress: enrichedInfo.contact_information?.business_address,
                        email: enrichedInfo.contact_information?.customer_service?.email,
                        phone: enrichedInfo.contact_information?.customer_service?.phone_number,
                        instagram: enrichedInfo.contact_information?.customer_service?.instagram,
                        website: enrichedInfo.contact_information?.customer_service?.website,
                        tiktok: enrichedInfo.contact_information?.customer_service?.tiktok
                    };
                }
                return l;
            }));
        } catch (error) {
            console.error('Enrichment error:', error);
        } finally {
            setEnrichingLeads(prev => ({ ...prev, [index]: false }));
        }
    };

    const enrichViewingLead = async () => {
        if (!viewingLead || (!viewingLead.storeUrl && !sourceUrl)) return;

        setIsEnrichingViewingLead(true);

        // Cycle status messages to keep user informed
        const messages = [
            "Initializing AI Agent...",
            "Navigating to store page...",
            "Scanning for contact details...",
            "Extracting business info...",
            "Verifying data points..."
        ];
        let msgIdx = 0;
        setEnrichmentStatus(messages[0]);

        const intervalId = setInterval(() => {
            msgIdx = (msgIdx + 1) % messages.length;
            setEnrichmentStatus(messages[msgIdx]);
        }, 2000);

        try {
            const response = await fetch('/api/leads/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: viewingLead.storeUrl || sourceUrl,
                    name: viewingLead.name,
                    provider
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to enrich lead');

            const enrichedInfo = data.enrichedData;

            // Check if we actually found useful data
            const hasData = enrichedInfo.contact_information?.business_address ||
                enrichedInfo.contact_information?.customer_service?.email ||
                enrichedInfo.contact_information?.customer_service?.phone_number ||
                enrichedInfo.contact_information?.customer_service?.instagram ||
                enrichedInfo.contact_information?.customer_service?.tiktok ||
                enrichedInfo.contact_information?.customer_service?.website;

            const newFields = {
                enriched: !!hasData, // Only mark enriched if we successfully found data
                businessAddress: enrichedInfo.contact_information?.business_address,
                email: enrichedInfo.contact_information?.customer_service?.email,
                phone: enrichedInfo.contact_information?.customer_service?.phone_number,
                instagram: enrichedInfo.contact_information?.customer_service?.instagram,
                website: enrichedInfo.contact_information?.customer_service?.website,
                tiktok: enrichedInfo.contact_information?.customer_service?.tiktok
            };

            setViewingLead(prev => ({ ...prev, ...newFields }));
            setSavedLeads(prev => prev.map(l =>
                l.id === viewingLead.id ? { ...l, ...newFields } : l
            ));

            if (!hasData) {
                console.log('Enrichment finished but no specific contact fields found.');
            }

        } catch (error) {
            console.error('Enrichment error:', error);
            alert('Failed to enrich lead: ' + error.message);
        } finally {
            clearInterval(intervalId);
            setIsEnrichingViewingLead(false);
            setEnrichmentStatus('');
        }
    };

    const saveLeadToCrm = (lead) => {
        const isDuplicate = savedLeads.some(l => l.name === lead.name && l.storeUrl === lead.storeUrl);
        if (isDuplicate) {
            alert('Lead already in CRM!');
            return;
        }

        const newLead = {
            ...lead,
            id: `lead_${Date.now()}`,
            status: 'New',
            addedAt: new Date().toLocaleDateString(),
            lastInteraction: null
        };
        console.log('➕ [CRM] Adding new lead:', newLead.name);
        setSavedLeads(prev => [newLead, ...prev]);
        setActiveTab('crm'); // Auto-switch to CRM tab
    };

    const updateLeadStatus = (leadId, newStatus) => {
        setSavedLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, lastInteraction: new Date().toLocaleDateString() } : l
        ));
    };

    const deleteFromCrm = (leadId) => {
        if (window.confirm('Remove this lead from CRM?')) {
            setSavedLeads(prev => prev.filter(l => l.id !== leadId));
        }
    };

    const exportToCsv = () => {
        if (savedLeads.length === 0) return;

        const headers = ['Name', 'Category', 'Description', 'Status', 'Instagram', 'Email', 'Address', 'AddedAt'];
        const csvRows = [
            headers.join(','),
            ...savedLeads.map(l => [
                `"${l.name || ''}"`,
                `"${l.productCategory || ''}"`,
                `"${(l.briefDescription || '').replace(/"/g, '""')}"`,
                `"${l.status || ''}"`,
                `"${l.instagram || ''}"`,
                `"${l.email || ''}"`,
                `"${(l.businessAddress || '').replace(/"/g, '""')}"`,
                `"${l.addedAt || ''}"`
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `krisskross_leads_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Bulk Actions
    const handleEnrichAll = async () => {
        setIsBulkAction(true);
        const unenrichedIndices = foundLeads
            .map((lead, index) => ({ lead, index }))
            .filter(({ lead }) => !lead.enriched);

        if (unenrichedIndices.length === 0) {
            alert('All leads are already enriched!');
            setIsBulkAction(false);
            return;
        }

        // Process sequentially to be safe with rate limits
        for (const { lead, index } of unenrichedIndices) {
            await handleEnrichLead(lead, index);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setIsBulkAction(false);
    };

    const handleSaveAllToCrm = () => {
        let addedCount = 0;
        const newLeads = [];

        foundLeads.forEach(lead => {
            const isDuplicate = savedLeads.some(l => l.name === lead.name && l.storeUrl === lead.storeUrl);
            if (!isDuplicate) {
                newLeads.push({
                    ...lead,
                    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    status: 'New',
                    addedAt: new Date().toLocaleDateString(),
                    lastInteraction: null
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            setSavedLeads(prev => [...newLeads, ...prev]);
            alert(`Saved ${addedCount} new leads to CRM!`);
            setActiveTab('crm');
        } else {
            alert('All leads are already in the CRM!');
        }
    };

    const selectLead = (lead) => {
        setCustomName(lead.name || '');
        setContext(`${lead.briefDescription || ''} ${lead.productCategory ? `Category: ${lead.productCategory}` : ''} ${lead.storeUrl ? `Store: ${lead.storeUrl}` : ''}`.trim());
        setActiveTab('pitch');
    };

    const targetTypes = [
        { id: 'fashion-seller', label: 'Fashion Seller', icon: '👗' },
        { id: 'ecommerce-owner', label: 'E-commerce', icon: '🛍️' },
        { id: 'affiliate', label: 'Affiliate', icon: '💰' }
    ];

    const filteredLeads = crmFilter === 'all'
        ? savedLeads
        : savedLeads.filter(l => l.status === crmFilter);

    const tabs = [
        { id: 'discover', label: 'Lead Discovery', icon: Search },
        { id: 'crm', label: 'CRM', icon: Users, badge: savedLeads.length },
        { id: 'pitch', label: 'Pitch Generator', icon: Sparkles },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-black text-lg">KK</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">KrissKross</h1>
                                <p className="text-xs text-gray-500">Pitch Generator CRM</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isSyncing && (
                                <span className="flex items-center gap-2 text-xs text-gray-500">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Syncing...
                                </span>
                            )}
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Settings className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence mode="wait">
                    {/* Lead Discovery Tab */}
                    {activeTab === 'discover' && (
                        <motion.div
                            key="discover"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Lead Discovery</h2>
                                <p className="text-gray-600">Extract leads from Amazon, eBay, or any shop listing page</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                                <div className="flex gap-3 mb-4">
                                    <input
                                        type="text"
                                        value={sourceUrl}
                                        onChange={(e) => setSourceUrl(e.target.value)}
                                        placeholder="Paste Amazon category URL or shop listing page..."
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400"
                                    />
                                    <button
                                        onClick={handleSourceLeads}
                                        disabled={isSourcing || !sourceUrl}
                                        className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all min-w-[160px] justify-center ${isSourcing || !sourceUrl
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
                                            }`}
                                    >
                                        {isSourcing ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-5 h-5" />
                                                Find Leads
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Search Settings Toggle */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Settings className="w-3 h-3" />
                                        {isSettingsOpen ? 'Hide Options' : 'Search & Enrich Options'}
                                    </button>

                                    {isSettingsOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                                        >
                                            {/* Provider Selection */}
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Provider (Sourcing & Enrichment)</p>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="provider"
                                                            checked={provider === 'firecrawl'}
                                                            onChange={() => setProvider('firecrawl')}
                                                            className="text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">Firecrawl (Scraping)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="provider"
                                                            checked={provider === 'perplexity'}
                                                            onChange={() => setProvider('perplexity')}
                                                            className="text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">Perplexity (Deep Search)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="provider"
                                                            checked={provider === 'grok'}
                                                            onChange={() => setProvider('grok')}
                                                            className="text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">Grok (xAI)</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Firecrawl Specific Options */}
                                            {provider === 'firecrawl' && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Firecrawl Strategy</p>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isDeepHunt}
                                                                onChange={(e) => setIsDeepHunt(e.target.checked)}
                                                                className="text-blue-600 focus:ring-blue-500 rounded"
                                                            />
                                                            <span className="text-sm text-gray-700">Enable Deep Hunt Agent (Slow but thorough)</span>
                                                        </label>
                                                        <div className="flex gap-4 ml-6">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="strategy"
                                                                    checked={!isDeepHunt} // Visual only if checkbox maps to it
                                                                    disabled
                                                                    className="text-gray-400"
                                                                />
                                                                <span className="text-sm text-gray-400">Auto (Smart Detect) - Active when Deep Hunt is off</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {sourceError && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        {sourceError}
                                    </div>
                                )}
                            </div>

                            {/* Bulk Actions Header */}
                            {foundLeads.length > 0 && (
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Found {foundLeads.length} Leads
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleEnrichSelected}
                                            disabled={isBulkAction}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isBulkAction ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Zap className="w-4 h-4" />
                                            )}
                                            {selectedLeadIndices.size > 0
                                                ? `Enrich Selected (${selectedLeadIndices.size})`
                                                : "Enrich All"}
                                        </button>
                                        <button
                                            onClick={handleSaveSelectedToCrm}
                                            disabled={isBulkAction}
                                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Users className="w-4 h-4" />
                                            {selectedLeadIndices.size > 0
                                                ? `Save Selected (${selectedLeadIndices.size})`
                                                : "Save All to CRM"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {foundLeads.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {foundLeads.map((lead, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeadIndices.has(idx)}
                                                        onChange={() => toggleLeadSelection(idx)}
                                                        className="mt-1.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                                                        {lead.enriched && (
                                                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded inline-block mt-1">
                                                                ENRICHED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium text-blue-600 mb-2">{lead.productCategory}</p>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{lead.briefDescription}</p>

                                            {lead.enriched && (
                                                <div className="space-y-1 mb-4 p-3 bg-gray-50 rounded-lg text-xs">
                                                    {lead.instagram && (
                                                        <div className="flex items-center gap-2 text-pink-600">
                                                            <Instagram className="w-3 h-3" />
                                                            {lead.instagram}
                                                        </div>
                                                    )}
                                                    {lead.email && (
                                                        <div className="flex items-center gap-2 text-blue-600">
                                                            <Mail className="w-3 h-3" />
                                                            {lead.email}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveLeadToCrm(lead)}
                                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                                >
                                                    Save to CRM
                                                </button>
                                                <button
                                                    onClick={() => handleEnrichLead(lead, idx)}
                                                    disabled={enrichingLeads[idx] || lead.enriched}
                                                    className={`flex-1 py-2 border text-sm font-semibold rounded-lg transition-colors ${lead.enriched
                                                        ? 'border-green-300 text-green-700 bg-green-50'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        } ${enrichingLeads[idx] ? 'opacity-50' : ''}`}
                                                >
                                                    {enrichingLeads[idx] ? 'Enriching...' : lead.enriched ? 'Enriched' : `Enrich (${['perplexity', 'grok'].includes(provider) ? 'AI' : 'Crawl'})`}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads sourced yet</h3>
                                    <p className="text-gray-600">Paste a URL above to start discovering leads</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* CRM Tab */}
                    {activeTab === 'crm' && (
                        <motion.div
                            key="crm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Leads CRM</h2>
                                    <p className="text-gray-600">Manage your prospecting pipeline</p>
                                </div>
                                <button
                                    onClick={exportToCsv}
                                    disabled={savedLeads.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Stats Row */}
                                <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{savedLeads.length}</div>
                                        <div className="text-sm text-gray-600">Total Leads</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">{savedLeads.filter(l => l.status === 'New').length}</div>
                                        <div className="text-sm text-gray-600">New</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-indigo-600">{savedLeads.filter(l => l.status === 'Pitched').length}</div>
                                        <div className="text-sm text-gray-600">Pitched</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">{savedLeads.filter(l => l.status === 'Replied').length}</div>
                                        <div className="text-sm text-gray-600">Replied</div>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
                                    {['all', 'New', 'Enriched', 'Pitched', 'Replied', 'Dead'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setCrmFilter(filter)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${crmFilter === filter
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {filter === 'all' ? 'All Leads' : filter}
                                        </button>
                                    ))}
                                </div>

                                {/* Leads Table */}
                                {savedLeads.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads in CRM</h3>
                                        <p className="text-gray-600 mb-4">Start by discovering leads in the Lead Discovery tab</p>
                                        <button
                                            onClick={() => setActiveTab('discover')}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            Go to Lead Discovery
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredLeads.map((lead) => (
                                                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div
                                                                className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                                                                onClick={() => setViewingLead(lead)}
                                                            >
                                                                {lead.name}
                                                            </div>
                                                            <div className="text-sm text-blue-600">{lead.productCategory || 'Sourced Lead'}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1 text-sm">
                                                                {lead.instagram ? (
                                                                    <div className="flex items-center gap-1 text-pink-600">
                                                                        <Instagram className="w-3 h-3" />
                                                                        {lead.instagram}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-gray-400 italic">No contact</div>
                                                                )}
                                                                {lead.email && (
                                                                    <div className="flex items-center gap-1 text-blue-600">
                                                                        <Mail className="w-3 h-3" />
                                                                        {lead.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <select
                                                                value={lead.status}
                                                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                                className={`text-sm font-semibold px-3 py-1.5 rounded-lg border-2 ${lead.status === 'Replied' ? 'bg-green-50 border-green-500 text-green-700' :
                                                                    lead.status === 'Pitched' ? 'bg-blue-50 border-blue-500 text-blue-700' :
                                                                        'bg-gray-50 border-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                <option value="New">New</option>
                                                                <option value="Enriched">Enriched</option>
                                                                <option value="Pitched">Pitched</option>
                                                                <option value="Replied">Replied</option>
                                                                <option value="Dead">Dead</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {lead.addedAt}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setViewingLead(lead)}
                                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => selectLead(lead)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Create pitch"
                                                                >
                                                                    <Sparkles className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteFromCrm(lead.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Pitch Generator Tab */}
                    {activeTab === 'pitch' && (
                        <motion.div
                            key="pitch"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Pitch Generator</h2>
                                <p className="text-gray-600">Create personalized outreach messages powered by Claude AI</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                                <div className="space-y-6">
                                    {/* Target Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                                            Target Audience
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {targetTypes.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => {
                                                        setTargetType(type.id);
                                                        setLastTemplateIndex(-1);
                                                        setGeneratedPitch('');
                                                    }}
                                                    className={`p-4 rounded-lg border-2 transition-all ${targetType === type.id
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="text-3xl mb-2">{type.icon}</div>
                                                    <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Name Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Prospect Name (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            placeholder="e.g., Sarah, Mike, Jessica..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400"
                                        />
                                    </div>

                                    {/* Context Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Context or Profile Link
                                            <span className="ml-2 text-xs font-normal text-gray-500">(Highly Recommended)</span>
                                        </label>
                                        <textarea
                                            value={context}
                                            onChange={(e) => setContext(e.target.value)}
                                            placeholder="Paste social profile link, bio, or product details... Claude will use this to tailor the pitch."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[120px] resize-none text-gray-900 placeholder-gray-400"
                                        />
                                    </div>

                                    {/* Generate Button */}
                                    <button
                                        onClick={generatePitch}
                                        disabled={isLoading}
                                        className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Generating with Claude AI...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate AI Pitch
                                                <ChevronRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    {/* Generated Pitch */}
                                    {generatedPitch && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                                    Your Pitch
                                                    {wasAiGenerated ? (
                                                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                            AI OPTIMIZED
                                                        </span>
                                                    ) : (
                                                        <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded">
                                                            TEMPLATE
                                                        </span>
                                                    )}
                                                </h3>
                                                <button
                                                    onClick={copyToClipboard}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                                >
                                                    {copied ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4" />
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-gray-800 whitespace-pre-wrap font-mono text-sm border border-blue-200">
                                                {generatedPitch}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
                                <p className="text-gray-600">Track your outreach performance</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                                <p className="text-gray-600">Track response rates, conversion metrics, and more</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Lead Details Modal */}
                <AnimatePresence>
                    {viewingLead && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                            onClick={() => setViewingLead(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                {/* Modal Header */}
                                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-sm">
                                            {viewingLead.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                                {viewingLead.name}
                                                {viewingLead.status && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${viewingLead.status === 'Replied' ? 'bg-green-50 border-green-200 text-green-700' :
                                                        viewingLead.status === 'Pitched' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                            'bg-gray-50 border-gray-200 text-gray-600'
                                                        }`}>
                                                        {viewingLead.status}
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-sm text-gray-500 font-medium">{viewingLead.productCategory}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewingLead(null)}
                                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>

                                {/* Modal Body - Scrollable */}
                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Contact Section */}
                                        <div className="space-y-6 relative">
                                            {isEnrichingViewingLead && (
                                                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-4 rounded-xl backdrop-blur-sm transition-all border border-indigo-100">
                                                    <div className="relative mb-4">
                                                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-base font-bold text-indigo-900 animate-pulse transition-all duration-300">{enrichmentStatus}</h3>
                                                    <p className="text-xs text-indigo-400 mt-2 font-medium">Analyzing page content...</p>
                                                </div>
                                            )}
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                                                <Users className="w-4 h-4" /> Contact Information
                                            </h3>

                                            <div className="space-y-4">
                                                {/* Email */}
                                                <div className="group flex items-start gap-4">
                                                    <div className="mt-1 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                                        <Mail className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Email Address</div>
                                                        <div className="text-sm text-gray-900 break-all select-all">
                                                            {viewingLead.email ? (
                                                                <a href={`mailto:${viewingLead.email}`} className="hover:text-blue-600 hover:underline">
                                                                    {viewingLead.email}
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Not available</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Phone */}
                                                <div className="group flex items-start gap-4">
                                                    <div className="mt-1 w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                                                        <Phone className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Phone Number</div>
                                                        <div className="text-sm text-gray-900 select-all">
                                                            {viewingLead.phone || <span className="text-gray-400 italic">Not available</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Instagram */}
                                                <div className="group flex items-start gap-4">
                                                    <div className="mt-1 w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-100 transition-colors">
                                                        <Instagram className="w-4 h-4 text-pink-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Instagram</div>
                                                        <div className="text-sm text-gray-900">
                                                            {viewingLead.instagram ? (
                                                                <a
                                                                    href={`https://instagram.com/${viewingLead.instagram.replace('@', '')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="hover:text-pink-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    {viewingLead.instagram} <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Not available</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* TikTok Shop */}
                                                <div className="group flex items-start gap-4">
                                                    <div className="mt-1 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 group-hover:bg-black/10 transition-colors">
                                                        <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] text-black">TT</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">TikTok Shop</div>
                                                        <div className="text-sm text-gray-900">
                                                            {viewingLead.tiktok ? (
                                                                <a href={viewingLead.tiktok} target="_blank" rel="noreferrer" className="hover:text-black hover:underline flex items-center gap-1 break-all">
                                                                    {viewingLead.tiktok} <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Not available</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Official Website */}
                                                <div className="group flex items-start gap-4">
                                                    <div className="mt-1 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                        <Globe className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Website</div>
                                                        <div className="text-sm text-gray-900">
                                                            {viewingLead.website ? (
                                                                <a href={viewingLead.website} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline flex items-center gap-1 break-all">
                                                                    {viewingLead.website} <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Not available</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Section */}
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                                                <Target className="w-4 h-4" /> Business Profile
                                            </h3>

                                            <div className="space-y-4">
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">About Business</div>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        {viewingLead.briefDescription || 'No description available for this lead.'}
                                                    </p>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Physical Address</div>
                                                        <p className="text-sm text-gray-900">
                                                            {viewingLead.businessAddress || <span className="text-gray-400 italic">Address not available</span>}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Target className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Listing/Store URL</div>
                                                        {viewingLead.storeUrl ? (
                                                            <a href={viewingLead.storeUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all block">
                                                                {viewingLead.storeUrl}
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">Not available</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center mt-auto">
                                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Added {viewingLead.addedAt}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={enrichViewingLead}
                                            disabled={isEnrichingViewingLead || (viewingLead.enriched && viewingLead.email && viewingLead.instagram && viewingLead.tiktok && viewingLead.website)}
                                            className={`px-4 py-2 border font-semibold rounded-lg flex items-center gap-2 transition-all ${viewingLead.enriched && viewingLead.email && viewingLead.instagram && viewingLead.tiktok && viewingLead.website
                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                : isEnrichingViewingLead ? 'border-gray-200 bg-gray-50 text-gray-400'
                                                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                } ${isEnrichingViewingLead ? 'cursor-wait' : ''}`}
                                        >
                                            {isEnrichingViewingLead ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Enriching...
                                                </>
                                            ) : (viewingLead.enriched && viewingLead.email && viewingLead.instagram && viewingLead.tiktok && viewingLead.website) ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Fully Enriched
                                                </>
                                            ) : viewingLead.enriched ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4" />
                                                    Enrich Again
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4" />
                                                    Enrich Data
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const body = `Hey ${viewingLead.name},\n\nI was checking out your store and loved your products!`;
                                                window.open(`mailto:${viewingLead.email}?subject=Collaboration&body=${encodeURIComponent(body)}`);
                                            }}
                                            disabled={!viewingLead.email}
                                            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </button>
                                        <button
                                            onClick={() => {
                                                selectLead(viewingLead);
                                                setViewingLead(null);
                                            }}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Generate Pitch
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
