'use client';
import React, { useState } from 'react';
import { Sparkles, Clock, DollarSign, TrendingUp, Copy, RefreshCw, CheckCircle, MessageSquare, Trash2, X } from 'lucide-react';

export default function KrissKrossPitchGenerator() {
    const [targetType, setTargetType] = useState('fashion-seller');
    const [customName, setCustomName] = useState('');
    const [context, setContext] = useState('');
    const [generatedPitch, setGeneratedPitch] = useState('');
    const [copied, setCopied] = useState(false);
    const [outreaches, setOutreaches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [wasAiGenerated, setWasAiGenerated] = useState(false);
    const [genError, setGenError] = useState(null);
    const [lastTemplateIndex, setLastTemplateIndex] = useState(-1);

    // Lead Sourcing State
    const [sourceUrl, setSourceUrl] = useState('');
    const [foundLeads, setFoundLeads] = useState([]);
    const [isSourcing, setIsSourcing] = useState(false);
    const [sourceError, setSourceError] = useState(null);

    // Enrichment State
    const [enrichingLeads, setEnrichingLeads] = useState({}); // { [index]: boolean }

    // CRM State (Persistent)
    const [savedLeads, setSavedLeads] = useState([]);
    const [isCrmInitialized, setIsCrmInitialized] = useState(false);

    // Load Leads from LocalStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('kk_leads_crm');
        if (saved) {
            try {
                setSavedLeads(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved leads', e);
            }
        }
        setIsCrmInitialized(true);
    }, []);

    // Save Leads to LocalStorage whenever they change
    React.useEffect(() => {
        if (isCrmInitialized) {
            localStorage.setItem('kk_leads_crm', JSON.stringify(savedLeads));
        }
    }, [savedLeads, isCrmInitialized]);

    // Keep templates as fallback
    const pitchTemplates = {
        'fashion-seller': [
            {
                hook: "Spending 10+ hours every week editing TikTok videos?",
                value: "KrissKross turns your product photos into scroll-stopping TikTok videos in minutes. No editing skills needed.",
                proof: "Save $250-500/month on freelancers. Just $20.99 for 50 videos.",
                cta: "Want to see how it works with your products?"
            },
            {
                hook: "Your TikTok Shop needs fresh videos daily, but editing is killing your schedule.",
                value: "KrissKross transforms static product shots into TikTok-ready content automatically. Upload photos, get videos in minutes.",
                proof: "From 10+ hours/week to 3 hours of setup. $20.99/month vs hundreds on freelancers.",
                cta: "Let me show you a quick demo with your actual products."
            },
            {
                hook: "Every hour you spend editing videos is an hour you're not making sales.",
                value: "KrissKross handles your video creation so you can focus on what actually drives revenue. Product photos in, TikTok videos out.",
                proof: "Our sellers reclaim 40+ hours per month. That's $20.99 vs your hourly rate times 40.",
                cta: "Ready to get those hours back?"
            }
        ],
        'ecommerce-owner': [
            {
                hook: "Running an e-commerce store means juggling everything—and video content always falls behind.",
                value: "KrissKross automates your TikTok video creation. Upload your product catalog, get platform-ready videos without the production hassle.",
                proof: "Scale from 0 to 50 videos/month for $20.99. No freelancers, no agencies, no technical headaches.",
                cta: "Want to see it work with your store's products?"
            },
            {
                hook: "TikTok Shop could 10x your revenue, but creating videos for every product feels impossible.",
                value: "KrissKross turns your existing product photos into TikTok content automatically. Same photos you already have, new revenue channel unlocked.",
                proof: "Go from product photos to 50 TikTok videos for less than one freelancer video.",
                cta: "Let me walk you through exactly how it works for stores like yours."
            }
        ],
        'affiliate': [
            {
                hook: "Promoting products on TikTok without custom videos? You're leaving commissions on the table.",
                value: "KrissKross lets you create professional product videos from brand photos in minutes. More content = more conversions = more commissions.",
                proof: "Create 50 videos/month for $20.99. Each video takes minutes, not hours. Your ROI on the first few sales.",
                cta: "Want to see how fast you can turn around video content?"
            },
            {
                hook: "Other affiliates are posting daily TikTok videos. Can't keep up without spending hours editing?",
                value: "KrissKross turns any product image into engagement-ready TikTok content. Stay consistent without the editing grind.",
                proof: "From product photo to posted video in under 10 minutes. 50 videos/month for less than dinner for two.",
                cta: "Let me show you exactly how simple this is."
            }
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
            console.error('AI Generation failed, using fallback template:', error);
            setGenError(error.message);

            // Fallback logic
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

        // Log the outreach automatically
        const newOutreach = {
            id: Date.now(),
            name: customName || 'Prospect',
            type: targetType,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            replied: false,
            pitch: generatedPitch
        };
        setOutreaches(prev => [newOutreach, ...prev]);

        setTimeout(() => setCopied(false), 2000);
    };

    const toggleReplied = (id) => {
        setOutreaches(prev => prev.map(o =>
            o.id === id ? { ...o, replied: !o.replied } : o
        ));
    };

    const removeOutreach = (id) => {
        setOutreaches(prev => prev.filter(o => o.id !== id));
    };

    const targetTypes = [
        { id: 'fashion-seller', label: 'TikTok Shop Fashion Seller', icon: '👗' },
        { id: 'ecommerce-owner', label: 'E-commerce Store Owner', icon: '🛍️' },
        { id: 'affiliate', label: 'Online Affiliate', icon: '💰' }
    ];

    const handleSourceLeads = async () => {
        if (!sourceUrl) {
            console.warn('[DEBUG] Source URL is empty, skipping sourcing.');
            return;
        }

        console.log('[DEBUG] Sourcing started for URL:', sourceUrl);
        setIsSourcing(true);
        setSourceError(null);

        try {
            console.log('[DEBUG] Sending request to /api/leads/source...');
            const response = await fetch('/api/leads/source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: sourceUrl }),
            });

            console.log('[DEBUG] Response status:', response.status);
            const data = await response.json();
            console.log('[DEBUG] Received data:', data);

            if (!response.ok) {
                const errorMsg = data.error || 'Failed to source leads';
                console.error('[DEBUG] Sourcing API Error:', errorMsg);
                throw new Error(errorMsg);
            }

            if (data.message) {
                console.info('[DEBUG] Server message:', data.message);
            }

            const leads = data.leads || [];
            console.log('[DEBUG] Found leads count:', leads.length);
            setFoundLeads(leads);

            if (leads.length === 0) {
                setSourceError(data.message || 'No leads were found. The AI couldn\'t find any shop listings on this page.');
            }
        } catch (error) {
            console.error('[DEBUG] Lead sourcing catch block:', error);
            setSourceError(error.message);
        } finally {
            console.log('[DEBUG] Sourcing process finished.');
            setIsSourcing(false);
        }
    };

    const handleEnrichLead = async (lead, index) => {
        if (!lead.storeUrl && !sourceUrl) return;

        setEnrichingLeads(prev => ({ ...prev, [index]: true }));
        try {
            console.log(`[DEBUG] Enriching lead: ${lead.name}`);
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

            console.log('[DEBUG] Enrichment data received:', data);

            // Update the lead in the foundLeads array
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
            console.error('[DEBUG] Enrichment error:', error);
            // Optionally show error in UI
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
        setSavedLeads(prev => [newLead, ...prev]);
    };

    const updateLeadStatus = (leadId, newStatus) => {
        setSavedLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, lastInteraction: new Date().toLocaleDateString() } : l
        ));
    };

    const deleteFromCrm = (leadId) => {
        if (window.confirm('Are you sure you want to remove this lead from the CRM?')) {
            setSavedLeads(prev => prev.filter(l => l.id !== leadId));
        }
    };

    const selectLead = (lead) => {
        setCustomName(lead.name || '');
        setContext(`${lead.briefDescription || ''} ${lead.productCategory ? `Category: ${lead.productCategory}` : ''} ${lead.storeUrl ? `Store: ${lead.storeUrl}` : ''}`.trim());
        // Scroll to generator
        const generatorElement = document.getElementById('main-generator');
        if (generatorElement) {
            generatorElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="text-[180px] font-black text-rose-600 transform -rotate-12">KK</div>
                    </div>
                    <div className="relative">
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 mb-4 tracking-tight">
                            KrissKross
                        </h1>
                        <p className="text-2xl text-gray-700 font-semibold">Pitch Generator</p>
                        <p className="text-gray-600 mt-2">On-brand outreach in seconds, not hours</p>
                    </div>
                </div>

                {/* Lead Discovery Section - Step 1 */}
                <div className="mb-12 bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-blue-500">
                    <div className="bg-blue-500 p-6 text-white">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <Sparkles className="w-8 h-8" />
                            Step 1: AI Lead Discovery
                        </h2>
                        <p className="opacity-90 mt-1 font-medium">Automatic extraction from Amazon, eBay, or any shop listing</p>
                    </div>

                    <div className="p-8">
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Target URL</label>
                                <input
                                    type="text"
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    placeholder="Paste Amazon category URL or Shop listing page..."
                                    className="w-full px-4 py-3 border-3 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleSourceLeads}
                                    disabled={isSourcing || !sourceUrl}
                                    className={`px-8 py-3 bg-blue-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 ${isSourcing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:scale-105 shadow-lg'
                                        }`}
                                >
                                    {isSourcing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {isSourcing ? 'Sourcing...' : 'Source Leads'}
                                </button>
                            </div>
                        </div>

                        {sourceError && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 border border-red-100 italic">
                                Sourcing failed: {sourceError}
                            </div>
                        )}

                        {foundLeads.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {foundLeads.map((lead, idx) => (
                                    <div key={idx} className={`border-3 rounded-2xl p-5 transition-all flex flex-col justify-between bg-white shadow-sm hover:shadow-md ${lead.enriched ? 'border-green-400' : 'border-gray-100 hover:border-blue-300'
                                        }`}>
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-extrabold text-xl text-gray-800">{lead.name}</h4>
                                                {lead.enriched && (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                                                        AI Enriched
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-widest">{lead.productCategory}</p>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{lead.briefDescription}</p>

                                            {lead.enriched && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                                    {lead.instagram && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                                                            <span className="w-5 h-5 flex items-center justify-center bg-rose-50 rounded text-[10px]">IG</span>
                                                            {lead.instagram}
                                                        </div>
                                                    )}
                                                    {lead.email && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                                                            <span className="w-5 h-5 flex items-center justify-center bg-blue-50 rounded text-[10px]">EM</span>
                                                            {lead.email}
                                                        </div>
                                                    )}
                                                    {lead.businessAddress && (
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
                                                            <span className="w-5 h-5 flex items-center justify-center bg-gray-50 rounded text-[10px]">AD</span>
                                                            {lead.businessAddress}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 mt-6">
                                            <button
                                                onClick={() => {
                                                    selectLead(lead);
                                                    saveLeadToCrm(lead);
                                                }}
                                                className="flex-1 py-3 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-md"
                                            >
                                                SAVE & PITCH
                                            </button>
                                            <button
                                                onClick={() => handleEnrichLead(lead, idx)}
                                                disabled={enrichingLeads[idx] || lead.enriched}
                                                className={`flex-1 py-3 border-2 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${lead.enriched
                                                    ? 'border-green-500 text-green-600 bg-green-50'
                                                    : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                                                    } ${enrichingLeads[idx] ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {enrichingLeads[idx] ? (
                                                    <>
                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                        ENRICH...
                                                    </>
                                                ) : lead.enriched ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        ENRICHED
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-3 h-3" />
                                                        ENRICH CONTACTS
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {foundLeads.length === 0 && !isSourcing && (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No leads sourced yet. Paste a URL above to start.</p>
                                <p className="text-xs mt-1">E.g. https://www.amazon.com/Fashion-Brands/...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lead CRM Section - New Dashboard */}
                <div className="mb-12 bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-indigo-600">
                    <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <Clock className="w-8 h-8" />
                                KrissKross Leads CRM
                            </h2>
                            <p className="opacity-90 mt-1 font-medium">Your permanent prospecting pipeline</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-black">{savedLeads.length}</div>
                                <div className="text-[10px] uppercase font-bold opacity-70">Total Leads</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-green-300">{savedLeads.filter(l => l.status === 'Replied').length}</div>
                                <div className="text-[10px] uppercase font-bold opacity-70">Replies</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {savedLeads.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="text-lg font-bold">Your CRM is empty</p>
                                <p className="text-sm">Source leads above and click "Save & Pitch" to start building your list.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100">
                                            <th className="py-4 font-black text-gray-400 uppercase text-xs tracking-widest">Lead / Brand</th>
                                            <th className="py-4 font-black text-gray-400 uppercase text-xs tracking-widest">Contact Info</th>
                                            <th className="py-4 font-black text-gray-400 uppercase text-xs tracking-widest">Status</th>
                                            <th className="py-4 font-black text-gray-400 uppercase text-xs tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {savedLeads.map((lead) => (
                                            <tr key={lead.id} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-black text-gray-800">{lead.name}</div>
                                                    <div className="text-[10px] text-indigo-500 font-bold uppercase">{lead.productCategory || 'Sourced Lead'}</div>
                                                    <div className="text-xs text-gray-400 mt-1">Added: {lead.addedAt}</div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="space-y-1">
                                                        {lead.instagram ? (
                                                            <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
                                                                <span className="opacity-50 text-[8px]">IG</span> {lead.instagram}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-gray-300 italic">No social found</div>
                                                        )}
                                                        {lead.email && (
                                                            <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                                                <span className="opacity-50 text-[8px]">EM</span> {lead.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <select
                                                        value={lead.status}
                                                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                        className={`text-xs font-black px-3 py-1.5 rounded-full border-2 focus:outline-none ${lead.status === 'Replied' ? 'bg-green-100 border-green-500 text-green-700' :
                                                            lead.status === 'Pitched' ? 'bg-blue-100 border-blue-500 text-blue-700' :
                                                                'bg-gray-100 border-gray-300 text-gray-600'
                                                            }`}
                                                    >
                                                        <option value="New">NEW</option>
                                                        <option value="Enriched">ENRICHED</option>
                                                        <option value="Pitched">PITCHED</option>
                                                        <option value="Replied">REPLIED</option>
                                                        <option value="Dead">DEAD</option>
                                                    </select>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                selectLead(lead);
                                                                updateLeadStatus(lead.id, 'Pitched');
                                                            }}
                                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                            title="Pitch again"
                                                        >
                                                            <Sparkles className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteFromCrm(lead.id)}
                                                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
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
                </div>

                {/* Main Card */}
                <div id="main-generator" className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-rose-600">
                    {/* Stats Bar */}
                    <div className="bg-gradient-to-r from-rose-600 to-orange-600 p-6 grid grid-cols-3 gap-4 text-white">
                        <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2" />
                            <div className="text-2xl font-bold">10+ hrs</div>
                            <div className="text-sm opacity-90">saved weekly</div>
                        </div>
                        <div className="text-center">
                            <DollarSign className="w-8 h-8 mx-auto mb-2" />
                            <div className="text-2xl font-bold">$20.99</div>
                            <div className="text-sm opacity-90">vs $250-500</div>
                        </div>
                        <div className="text-center">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                            <div className="text-2xl font-bold">50</div>
                            <div className="text-sm opacity-90">videos/month</div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Target Selector */}
                        <div className="mb-8">
                            <label className="block text-lg font-bold text-gray-800 mb-4">
                                Who are you reaching out to?
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
                                        className={`p-4 rounded-xl border-3 transition-all transform hover:scale-105 ${targetType === type.id
                                            ? 'border-rose-600 bg-rose-50 shadow-lg'
                                            : 'border-gray-200 bg-white hover:border-rose-300'
                                            }`}
                                    >
                                        <div className="text-4xl mb-2">{type.icon}</div>
                                        <div className={`font-bold ${targetType === type.id ? 'text-rose-600' : 'text-gray-700'
                                            }`}>
                                            {type.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="mb-6">
                            <label className="block text-lg font-bold text-gray-800 mb-3">
                                Personalize with their name (optional)
                            </label>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="e.g., Sarah, Mike, Jessica..."
                                className="w-full px-6 py-4 border-3 border-gray-300 rounded-xl focus:border-rose-600 focus:outline-none text-lg"
                            />
                        </div>

                        {/* Context Input */}
                        <div className="mb-8">
                            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-rose-600" />
                                Add Context or Profile Link
                                <span className="text-xs font-normal text-gray-400 font-sans">(Highly Recommended)</span>
                            </label>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="Paste social profile link, bio, or specific product details here... Claude will use this to tailor the pitch."
                                className="w-full px-6 py-4 border-3 border-gray-300 rounded-xl focus:border-rose-600 focus:outline-none text-lg min-h-[120px] resize-none"
                            />
                        </div>

                        <button
                            onClick={generatePitch}
                            disabled={isLoading}
                            className={`w-full bg-gradient-to-r from-rose-600 to-orange-600 text-white py-5 rounded-xl font-bold text-xl transform transition-all flex items-center justify-center gap-3 mb-8 ${isLoading ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:shadow-2xl hover:scale-105'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    Claude is writing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    Generate Unique AI Pitch
                                    <RefreshCw className="w-6 h-6" />
                                </>
                            )}
                        </button>

                        {/* Generated Pitch */}
                        {generatedPitch && (
                            <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-6 border-3 border-rose-200">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-rose-600" />
                                        Your KrissKross Pitch
                                        {wasAiGenerated ? (
                                            <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] uppercase tracking-widest rounded-full animate-pulse">
                                                AI Optimized
                                            </span>
                                        ) : (
                                            <span className="ml-2 px-2 py-0.5 bg-gray-400 text-white text-[10px] uppercase tracking-widest rounded-full">
                                                Template Fallback
                                            </span>
                                        )}
                                    </h3>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-rose-600 text-rose-600 font-semibold hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copied ? 'Copied & Logged!' : 'Copy & Log Sent'}
                                    </button>
                                </div>
                                {genError && (
                                    <div className="mb-4 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 italic">
                                        AI specifically tailored message failed: {genError}. Showing safest template instead.
                                    </div>
                                )}
                                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-lg text-left">
                                    {generatedPitch}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Outreach Tracker - New Section */}
                {outreaches.length > 0 && (
                    <div className="mt-12 bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-amber-400">
                        <div className="bg-amber-400 p-4 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-6 h-6" />
                                Recent Outreaches
                            </h2>
                            <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-amber-600">
                                {outreaches.filter(o => o.replied).length} / {outreaches.length} Replied
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {outreaches.map((outreach) => (
                                <div
                                    key={outreach.id}
                                    className={`p-4 flex items-center justify-between transition-colors ${outreach.replied ? 'bg-green-50' : 'bg-white'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-800">{outreach.name}</span>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase font-bold">
                                                {outreach.type.split('-')[0]}
                                            </span>
                                            <span className="text-xs text-gray-400">{outreach.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate max-w-md">
                                            {outreach.pitch.substring(0, 100)}...
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleReplied(outreach.id)}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${outreach.replied
                                                ? 'bg-green-600 text-white'
                                                : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500'
                                                }`}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {outreach.replied ? 'Replied' : 'Mark Replied'}
                                        </button>
                                        <button
                                            onClick={() => removeOutreach(outreach.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Brand Voice Reminder */}
                <div className="mt-8 bg-white rounded-2xl p-6 border-3 border-amber-300 shadow-lg">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">💡</span>
                        KrissKross Brand Voice Reminders
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span className="text-gray-700">Direct, benefit-focused</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span className="text-gray-700">Specific numbers (time/cost)</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-red-600 font-bold">✗</span>
                            <span className="text-gray-700">No tech jargon</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-red-600 font-bold">✗</span>
                            <span className="text-gray-700">No "go viral" promises</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-600">
                    <p className="text-sm">Built with KrissKross brand voice guidelines</p>
                    <p className="text-xs mt-2 opacity-70">Problem → Solution → Proof → CTA</p>
                </div>
            </div>
        </div>
    );
}
