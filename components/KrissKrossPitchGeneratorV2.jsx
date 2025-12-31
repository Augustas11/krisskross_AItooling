'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, RefreshCw, MessageSquare, Clock, DollarSign, TrendingUp,
    Copy, CheckCircle, Trash2, Target, Search, Download, ChevronRight,
    Zap, Users, Mail, Instagram, MapPin, ExternalLink, Filter, BarChart3,
    FileText, Settings, Plus, Edit3
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

    // Enrichment State
    const [enrichingLeads, setEnrichingLeads] = useState({});

    // CRM State
    const [savedLeads, setSavedLeads] = useState([]);
    const [isCrmInitialized, setIsCrmInitialized] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [crmFilter, setCrmFilter] = useState('all');

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
                body: JSON.stringify({ url: sourceUrl, deep: isDeepHunt }),
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
                    name: lead.name
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
                        website: enrichedInfo.contact_information?.customer_service?.website
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
                                        className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${isSourcing || !sourceUrl
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : isDeepHunt
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                    >
                                        {isSourcing ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Sourcing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5" />
                                                {isDeepHunt ? 'Deep Hunt' : 'Fast Scrape'}
                                            </>
                                        )}
                                    </button>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer w-fit">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isDeepHunt}
                                            onChange={() => setIsDeepHunt(!isDeepHunt)}
                                        />
                                        <div className={`w-11 h-6 rounded-full transition-colors ${isDeepHunt ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isDeepHunt ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        Strategic Deep Hunt (slower, higher quality)
                                    </span>
                                </label>

                                {sourceError && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {sourceError}
                                    </div>
                                )}
                            </div>

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
                                                <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                                                {lead.enriched && (
                                                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                                                        ENRICHED
                                                    </span>
                                                )}
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
                                                    {enrichingLeads[idx] ? 'Enriching...' : lead.enriched ? 'Enriched' : 'Enrich'}
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
                                                            <div className="font-semibold text-gray-900">{lead.name}</div>
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
            </div>
        </div>
    );
}
