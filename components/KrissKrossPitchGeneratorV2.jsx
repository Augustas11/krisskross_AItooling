'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, RefreshCw, MessageSquare, Clock, DollarSign, TrendingUp,
    Copy, CheckCircle, Trash2, Target, Search, Download, ChevronRight,
    Zap, Users, Mail, Instagram, MapPin, ExternalLink, Filter, BarChart3,
    FileText, Settings, Plus, Edit3, X, Globe, Phone, Eye, Upload,
    Youtube, Facebook, Send
} from 'lucide-react';
import { TIERS, getTierForScore } from '../lib/scoring-constants';

export default function KrissKrossPitchGeneratorV3() {
    const [activeTab, setActiveTab] = useState('crm');
    const [targetType, setTargetType] = useState('fashion-seller');
    const [customName, setCustomName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
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
    const [provider, setProvider] = useState('perplexity'); // 'perplexity' | 'grok' (Firecrawl removed - out of credits)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedLeadIndices, setSelectedLeadIndices] = useState(new Set());
    const [searchHistory, setSearchHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // CRM State
    const [viewingLead, setViewingLead] = useState(null);


    // CRM State
    const [savedLeads, setSavedLeads] = useState([]);
    const [isCrmInitialized, setIsCrmInitialized] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false); // New flag to track if initial data fetch is complete
    const [isSyncing, setIsSyncing] = useState(false);
    const [crmFilter, setCrmFilter] = useState('all');
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [selectedCrmLeadIds, setSelectedCrmLeadIds] = useState(new Set());
    // Pagination & Bulk Processing State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [crmProcessing, setCrmProcessing] = useState(false);
    // duplicate viewingLead removed

    // Email Sending State
    const [pitchLead, setPitchLead] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const [emailError, setEmailError] = useState(null);

    // History State
    const [activityHistory, setActivityHistory] = useState({ pushes: [], emails: [] });
    const [showActivityHistory, setShowActivityHistory] = useState(false);

    const loadActivityHistory = async () => {
        try {
            const res = await fetch('/api/history/activity');
            const data = await res.json();
            if (data) setActivityHistory({ pushes: data.pushes || [], emails: data.emails || [] });
        } catch (e) {
            console.error('Failed to load activity history', e);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'pitch') loadActivityHistory();
    }, [activeTab]);

    // Load Leads from Server (Supabase ONLY - NO localStorage)
    // Load Leads from Server (Supabase ONLY - NO localStorage)
    const fetchLeads = async () => {
        console.log('🔄 [CRM] Loading leads from Supabase...');
        try {
            const response = await fetch('/api/crm/leads');
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            const data = await response.json();
            console.log('📥 [CRM] Server response:', data);
            if (data.leads) {
                console.log(`✅ [CRM] Loaded ${data.leads.length} leads from Supabase`);
                // Use functional update to avoid dependency issues if needed, but direct set is fine here
                setSavedLeads(data.leads);
            } else {
                console.warn('⚠️ [CRM] No leads property in server response');
                setSavedLeads([]);
            }
        } catch (e) {
            console.error('❌ [CRM] CRITICAL: Failed to load leads from Supabase:', e);
            // Only alert on critical failures if user needs to know
            // alert('Error loading leads: ' + e.message); 
            setSavedLeads([]);
        } finally {
            setIsCrmInitialized(true);
            setIsDataLoaded(true); // Only allow syncing AFTER this is true
            console.log('✓ [CRM] Initialization complete');
        }
    };

    React.useEffect(() => {
        fetchLeads();
    }, []);

    // Sync Leads to Supabase (ONLY when data is modified by user)
    React.useEffect(() => {
        // Prevent sync until we have fully loaded the initial data
        if (!isDataLoaded || !isCrmInitialized) {
            return;
        }

        const syncLeads = async () => {
            console.log(`💾 [CRM] Syncing ${savedLeads.length} leads to server...`);
            setIsSyncing(true);
            try {
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
                // alert('Warning: Failed to sync leads to server. Data saved locally only.'); // Suppressed per user request
            } finally {
                setIsSyncing(false);
            }
        };

        // Debounce sync slightly to avoid rapid updates
        const timeoutId = setTimeout(() => {
            syncLeads();
        }, 1000);

        return () => clearTimeout(timeoutId);

    }, [savedLeads, isCrmInitialized, isDataLoaded]);

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

    const handleSendEmail = async () => {
        if (!generatedPitch) return;

        // Ensure we have a valid email recipient
        // Use the editable recipientEmail state
        if (!recipientEmail) {
            alert('Please enter a recipient email address.');
            return;
        }



        setIsSendingEmail(true);
        setEmailError(null);
        setEmailSent(false);

        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: pitchLead.id,
                    leadEmail: recipientEmail,
                    leadContext: {
                        ...pitchLead
                    },
                    emailBody: generatedPitch,
                    emailSubject: generatedPitch.split('\n')[0].replace(/^Subject:\s*/i, '') || 'KrissKross Outreach'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email');
            }

            setEmailSent(true);

            // Update CRM status
            if (pitchLead && pitchLead.id) {
                updateLeadStatus(pitchLead.id, 'Pitched');
            }

            setTimeout(() => {
                setEmailSent(false);
            }, 3000);

            // Log success or show notification
            console.log('Email sent successfully:', data);

        } catch (error) {
            console.error('Email sending error:', error);
            setEmailError(error.message);
        } finally {
            setIsSendingEmail(false);
        }
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
            } else {
                // Auto-save to history
                try {
                    fetch('/api/history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            searchUrl: sourceUrl,
                            provider: provider,
                            leads: leads
                        })
                    }).then(() => loadSearchHistory()); // Refresh history in background
                } catch (err) {
                    console.error('Failed to save history', err);
                }
            }
        } catch (error) {
            setSourceError(error.message);
        } finally {
            setIsSourcing(false);
        }
    };

    const loadSearchHistory = async () => {
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (data.history) setSearchHistory(data.history);
        } catch (e) {
            console.error('Failed to load history', e);
        }
    };

    React.useEffect(() => {
        loadSearchHistory();
    }, []);

    // Helper to check if lead should be marked as enriched
    const checkShouldBeEnriched = (leadData) => {
        const contactFields = [
            leadData.email,
            leadData.phone,
            leadData.instagram,
            leadData.tiktok,
            leadData.website,
            leadData.businessAddress
        ];
        // Count fields that are not null/undefined/empty string
        const populatedCount = contactFields.filter(field => field && field.trim().length > 0).length;

        // "more than 2 fields" means > 2, i.e., 3 or more.
        return populatedCount > 2;
    };

    // Helper to ensure URLs are absolute
    const ensureAbsoluteUrl = (url) => {
        if (!url) return '#';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
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
            status: 'New', // Default, will override below if enriched criteria met
            addedAt: new Date().toLocaleDateString(),
            lastInteraction: null
        };

        // Check availability of contact info on import/save
        if (checkShouldBeEnriched(newLead)) {
            newLead.status = 'Enriched';
        }

        console.log('➕ [CRM] Adding new lead:', newLead.name);
        setSavedLeads(prev => [newLead, ...prev]);
        setActiveTab('crm'); // Auto-switch to CRM tab
    };

    const updateLeadStatus = (leadId, newStatus) => {
        setSavedLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, lastInteraction: new Date().toLocaleDateString() } : l
        ));
    };

    const handleEnrichLead = async (lead) => {
        if (!lead || !lead.id) return;

        setIsLoading(true); // Re-using general loading state or create a specific one
        try {
            console.log(`✨ [Enrich] enriching lead: ${lead.name}`);
            const response = await fetch('/api/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId: lead.id, leadData: lead })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Enrichment failed');

            console.log('✅ [Enrich] Success:', result);

            // Update local state with enriched data
            const enrichedLead = { ...lead, ...result.enrichedData };

            // Update in CRM list
            setSavedLeads(prev => prev.map(l => l.id === lead.id ? enrichedLead : l));

            // Update if currently viewing
            if (viewingLead && viewingLead.id === lead.id) {
                setViewingLead(enrichedLead);
            }

            alert(`Enrichment Complete! Status: ${enrichedLead.tier} (${enrichedLead.score}/100)`);

        } catch (error) {
            console.error('Enrichment error:', error);
            alert(`Enrichment failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteFromCrm = (leadId) => {
        if (window.confirm('Remove this lead from CRM?')) {
            setSavedLeads(prev => prev.filter(l => l.id !== leadId));
            setSelectedCrmLeadIds(prev => {
                const next = new Set(prev);
                next.delete(leadId);
                return next;
            });
        }
    };

    const toggleCrmLeadSelection = (leadId) => {
        setSelectedCrmLeadIds(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) {
                next.delete(leadId);
            } else {
                next.add(leadId);
            }
            return next;
        });
    };

    const toggleAllCrmLeadSelection = () => {
        if (selectedCrmLeadIds.size === filteredLeads.length) {
            setSelectedCrmLeadIds(new Set());
        } else {
            setSelectedCrmLeadIds(new Set(filteredLeads.map(l => l.id)));
        }
    };

    const deleteSelectedCrmLeads = () => {
        if (selectedCrmLeadIds.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedCrmLeadIds.size} selected leads? This cannot be undone.`)) {
            setSavedLeads(prev => prev.filter(l => !selectedCrmLeadIds.has(l.id)));
            setSelectedCrmLeadIds(new Set());
        }
    };

    const exportToCsv = () => {
        if (savedLeads.length === 0) return;

        const headers = ['Name', 'Category', 'Description', 'Status', 'Instagram', 'Email', 'Address', 'AddedAt', 'StoreURL', 'Website'];
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
                `"${l.addedAt || ''}"`,
                `"${l.storeUrl || ''}"`,
                `"${l.website || ''}"`
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

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;

            // Robust CSV Line Splitter (handles newlines inside quotes)
            // Note: This is a simplified regex-based parser. For very complex CSVs, a library is better.
            const rows = [];
            let currentRow = [];
            let currentField = '';
            let insideQuotes = false;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1];

                if (char === '"') {
                    if (insideQuotes && nextChar === '"') {
                        currentField += '"';
                        i++; // skip escaped quote
                    } else {
                        insideQuotes = !insideQuotes;
                    }
                } else if (char === ',' && !insideQuotes) {
                    currentRow.push(currentField);
                    currentField = '';
                } else if ((char === '\r' || char === '\n') && !insideQuotes) {
                    if (char === '\r' && nextChar === '\n') i++; // handle CRLF
                    currentRow.push(currentField);
                    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) { // skip empty lines
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField);
                rows.push(currentRow);
            }

            if (rows.length < 2) {
                alert('Invalid CSV file or empty.');
                return;
            }

            // Clean headers (remove BOM, trim, lowercase)
            const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/^\ufeff/, ''));
            const dataRows = rows.slice(1);

            console.log('Parsed Headers:', headers);

            // Smart Field Mapping
            const map = {
                name: headers.findIndex(h => /(name|company|business|shop|lead|title)/.test(h)),
                storeUrl: headers.findIndex(h => /(url|website|link|store|site|web)/.test(h)),
                productCategory: headers.findIndex(h => /(category|cat|niche|industry|type|segment)/.test(h)),
                email: headers.findIndex(h => /(email|mail|contact)/.test(h)),
                instagram: headers.findIndex(h => /(instagram|insta|ig|social)/.test(h)),
                status: headers.findIndex(h => /(status|state|phase)/.test(h)),
                briefDescription: headers.findIndex(h => /(description|desc|about|info)/.test(h)),
                businessAddress: headers.findIndex(h => /(address|location|hq)/.test(h)),
                phone: headers.findIndex(h => /(phone|tel|mobile)/.test(h)),
            };

            console.log('Field Mapping:', map);

            const importedLeads = dataRows.map(row => {
                // Helper to safely get value or empty string
                const getVal = (idx) => idx !== -1 && row[idx] ? row[idx].trim() : '';

                // If Name is missing, try to infer from URL or set Unknown
                let name = getVal(map.name);
                const url = getVal(map.storeUrl);

                if (!name && url) {
                    try {
                        name = new URL(url).hostname.replace('www.', '').split('.')[0];
                        name = name.charAt(0).toUpperCase() + name.slice(1);
                    } catch (e) { name = 'Unknown Lead'; }
                } else if (!name) {
                    return null; // Skip completely empty value rows implies invalid data for our needs
                }

                return {
                    id: `lead_imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: name,
                    productCategory: getVal(map.productCategory) || 'Imported',
                    storeUrl: url,
                    rating: 0,
                    briefDescription: getVal(map.briefDescription) || 'Imported via CSV',
                    status: getVal(map.status) || 'New',
                    addedAt: new Date().toLocaleDateString(),
                    lastInteraction: null,
                    businessAddress: getVal(map.businessAddress),
                    email: getVal(map.email),
                    phone: getVal(map.phone),
                    instagram: getVal(map.instagram),
                    website: url, // Assuming storeUrl is the website
                    enriched: false
                };
            }).filter(l => l !== null);

            // Deduplicate against existing CRM
            let addedCount = 0;
            const newLeads = [];

            importedLeads.forEach(lead => {
                const isDuplicate = savedLeads.some(l =>
                    (l.storeUrl && lead.storeUrl && l.storeUrl === lead.storeUrl) ||
                    (l.name.toLowerCase() === lead.name.toLowerCase())
                );
                if (!isDuplicate) {
                    newLeads.push(lead);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                setSavedLeads(prev => [...newLeads, ...prev]);
                alert(`Successfully imported ${addedCount} leads! (${importedLeads.length - addedCount} duplicates skipped)`);
            } else {
                alert('No new leads found. All imported leads were duplicates.');
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    // Bulk Actions
    const handleSaveAllToCrm = () => {
        let addedCount = 0;
        let skippedCount = 0;
        const newLeads = [];

        foundLeads.forEach(lead => {
            const isDuplicate = savedLeads.some(l =>
                (l.storeUrl && lead.storeUrl && l.storeUrl === lead.storeUrl) ||
                (l.name.toLowerCase() === lead.name.toLowerCase())
            );

            if (!isDuplicate) {
                newLeads.push({
                    ...lead,
                    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    status: 'New',
                    addedAt: new Date().toLocaleDateString(),
                    lastInteraction: null
                });
                addedCount++;
            } else {
                skippedCount++;
            }
        });

        if (addedCount > 0) {
            setSavedLeads(prev => [...newLeads, ...prev]);
            alert(`Saved ${addedCount} new leads to CRM! (${skippedCount} duplicates skipped)`);
            setActiveTab('crm');
        } else {
            alert(`No new leads added. All ${skippedCount} leads were already in the CRM.`);
        }
    };

    // Toggle selection for individual leads in Lead Discovery
    const toggleLeadSelection = (index) => {
        setSelectedLeadIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Handle saving selected leads to CRM (or all if none selected)
    const handleSaveSelectedToCrm = () => {
        let addedCount = 0;
        const newLeads = [];

        // If no leads are selected, save all leads
        const leadsToSave = selectedLeadIndices.size > 0
            ? foundLeads.filter((_, index) => selectedLeadIndices.has(index))
            : foundLeads;

        leadsToSave.forEach(lead => {
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
            alert(`Saved ${addedCount} new lead${addedCount > 1 ? 's' : ''} to CRM!`);
            setActiveTab('crm');
            setSelectedLeadIndices(new Set()); // Clear selection after saving
        } else {
            alert(selectedLeadIndices.size > 0
                ? 'All selected leads are already in the CRM!'
                : 'All leads are already in the CRM!');
        }
    };

    const selectLead = (lead) => {
        setPitchLead(lead); // Store complete lead for emailing
        setRecipientEmail(lead.email || ''); // Pre-fill email, allow editing
        setCustomName(lead.name || '');
        setContext(`${lead.briefDescription || ''} ${lead.productCategory ? `Category: ${lead.productCategory}` : ''} ${lead.storeUrl ? `Store: ${lead.storeUrl}` : ''}`.trim());
        setActiveTab('pitch');
        setGeneratedPitch('');
        setWasAiGenerated(false);
        setEmailSent(false);
        setEmailError(null);
    };



    // Filter by status first
    const statusFilteredLeads = crmFilter === 'all'
        ? savedLeads
        : savedLeads.filter(l => (l.status || '').toLowerCase() === crmFilter.toLowerCase());

    // Then by tier
    const tierFilteredLeads = tierFilter === 'all'
        ? statusFilteredLeads
        : statusFilteredLeads.filter(l => (l.tier || 'GRAY') === tierFilter);

    // Then apply search query
    const filteredLeads = crmSearchQuery.trim() === ''
        ? tierFilteredLeads
        : tierFilteredLeads.filter(lead => {
            const searchLower = crmSearchQuery.toLowerCase();
            return (
                lead.name?.toLowerCase().includes(searchLower) ||
                lead.email?.toLowerCase().includes(searchLower) ||
                lead.productCategory?.toLowerCase().includes(searchLower) ||
                lead.instagram?.toLowerCase().includes(searchLower) ||
                lead.phone?.toLowerCase().includes(searchLower) ||
                lead.businessAddress?.toLowerCase().includes(searchLower) ||
                lead.website?.toLowerCase().includes(searchLower) ||
                lead.briefDescription?.toLowerCase().includes(searchLower)
            );
        });

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
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                    <Clock className="w-4 h-4" />
                                    Recent Searches ({searchHistory.length})
                                </button>
                            </div>

                            {showHistory && searchHistory.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                                >
                                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Search History</h3>
                                        <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {searchHistory.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setSourceUrl(item.search_url);
                                                    if (item.leads_data) {
                                                        setFoundLeads(item.leads_data);
                                                    }
                                                    setShowHistory(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex justify-between items-center group transition-colors"
                                            >
                                                <div className="truncate pr-4 flex-1">
                                                    <div className="font-medium text-gray-900 truncate">{item.search_url}</div>
                                                    <div className="text-xs text-gray-500 flex gap-2">
                                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{item.provider}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-600">
                                                    <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-700">{item.leads_count} leads</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

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

                                {/* Search Settings Toggle - REMOVED Enrichment Options */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Settings className="w-3 h-3" />
                                        {isSettingsOpen ? 'Hide Options' : 'Search Options'}
                                    </button>

                                    {isSettingsOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                                        >
                                            <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Search settings (Coming Soon)</div>
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
                                            onClick={handleSaveSelectedToCrm}
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
                                    {foundLeads.map((lead, idx) => {
                                        const isAlreadyInCrm = savedLeads.some(l =>
                                            (l.storeUrl && lead.storeUrl && l.storeUrl === lead.storeUrl) ||
                                            (l.name.toLowerCase() === lead.name.toLowerCase())
                                        );

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`rounded-lg shadow-sm border p-5 transition-shadow ${isAlreadyInCrm ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:shadow-md'}`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedLeadIndices.has(idx)}
                                                            onChange={() => toggleLeadSelection(idx)}
                                                            disabled={isAlreadyInCrm}
                                                            className="mt-1.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                                        />
                                                        <div>
                                                            <h4 className={`font-semibold ${isAlreadyInCrm ? 'text-gray-500' : 'text-gray-900'}`}>{lead.name}</h4>
                                                        </div>
                                                    </div>
                                                    {isAlreadyInCrm && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">In CRM ✓</span>}
                                                </div>
                                                <p className="text-xs font-medium text-blue-600 mb-2">{lead.productCategory}</p>
                                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{lead.briefDescription}</p>



                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveLeadToCrm(lead)}
                                                        disabled={isAlreadyInCrm}
                                                        className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors ${isAlreadyInCrm
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            }`}
                                                    >
                                                        {isAlreadyInCrm ? 'Already in CRM' : 'Save to CRM'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
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
                                <div className="flex gap-2">
                                    {selectedCrmLeadIds.size > 0 && (
                                        <>
                                            <button
                                                onClick={deleteSelectedCrmLeads}
                                                disabled={crmProcessing}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-semibold rounded-lg transition-colors mr-2 border border-red-200 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Selected ({selectedCrmLeadIds.size})
                                            </button>
                                        </>
                                    )}
                                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer">
                                        <Upload className="w-4 h-4" />
                                        Import CSV
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                    <button
                                        onClick={exportToCsv}
                                        disabled={savedLeads.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const btn = document.getElementById('check-mail-crm-btn');
                                            if (btn) {
                                                const originalText = btn.innerHTML;
                                                btn.innerHTML = '<span class="animate-pulse">Checking...</span>';
                                                btn.disabled = true;

                                                try {
                                                    const res = await fetch('/api/email/check-replies', { method: 'POST' });
                                                    if (res.ok) {
                                                        const result = await res.json();
                                                        alert('Inbox check complete! Any new replies have been updated in the CRM.');
                                                        // Refresh leads to show new status
                                                        fetchLeads();
                                                    } else {
                                                        const err = await res.json();
                                                        alert('Failed to check replies: ' + (err.error || 'Unknown error'));
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    alert('Error checking replies. Check console for details.');
                                                } finally {
                                                    btn.innerHTML = originalText;
                                                    btn.disabled = false;
                                                }
                                            }
                                        }}
                                        id="check-mail-crm-btn"
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Check Mail
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Stats Row */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{savedLeads.length}</div>
                                        <div className="text-sm text-gray-600">Total</div>
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
                                    <div>
                                        <div className="text-2xl font-bold text-red-600">{savedLeads.filter(l => l.status === 'Dead').length}</div>
                                        <div className="text-sm text-gray-600">Dead</div>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="px-4 pt-4 pb-2 border-b border-gray-200">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={crmSearchQuery}
                                            onChange={(e) => {
                                                setCrmSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            placeholder="Search leads by name, email, category, Instagram..."
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400"
                                        />
                                        {crmSearchQuery && (
                                            <button
                                                onClick={() => setCrmSearchQuery('')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    {crmSearchQuery && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Found {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} matching "{crmSearchQuery}"
                                        </p>
                                    )}
                                </div>

                                {/* Filters */}
                                <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
                                    {['all', 'New', 'Pitched', 'Replied', 'Dead'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setCrmFilter(filter);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${crmFilter === filter
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {filter === 'all' ? 'All Status' : filter}
                                        </button>
                                    ))}
                                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                                    <span className="text-xs font-semibold text-gray-500 mr-2 flex items-center">TIER:</span>
                                    {['all', 'GREEN', 'YELLOW', 'RED'].map(tier => (
                                        <button
                                            key={tier}
                                            onClick={() => {
                                                setTierFilter(tier);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${tierFilter === tier
                                                ? 'bg-gray-800 text-white border-gray-800'
                                                : `${TIERS[tier]?.color || 'bg-white text-gray-600'} ${TIERS[tier]?.border || 'border-gray-200'} hover:opacity-80`
                                                }`}
                                        >
                                            {tier === 'all' ? 'All' : tier}
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
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left w-10">
                                                            <input
                                                                type="checkbox"
                                                                checked={filteredLeads.length > 0 && selectedCrmLeadIds.size === filteredLeads.length}
                                                                onChange={toggleAllCrmLeadSelection}
                                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added</th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((lead) => (
                                                        <tr key={lead.id} className={`hover:bg-gray-50 transition-colors ${selectedCrmLeadIds.has(lead.id) ? 'bg-blue-50/50' : ''}`}>
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCrmLeadIds.has(lead.id)}
                                                                    onChange={() => toggleCrmLeadSelection(lead.id)}
                                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                            </td>
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
                                                                {lead.score > 0 ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${TIERS[lead.tier]?.color || 'bg-gray-100 text-gray-800'} ${TIERS[lead.tier]?.border}`}>
                                                                            {lead.score}
                                                                        </span>
                                                                        {lead.tags && lead.tags.length > 0 && (
                                                                            <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                                                                {lead.tags.length} tags
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">-</span>
                                                                )}
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
                                        {/* Pagination Controls */}
                                        {filteredLeads.length > itemsPerPage && (
                                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-700">
                                                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-medium">{filteredLeads.length}</span> results
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                            <button
                                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                                disabled={currentPage === 1}
                                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            >
                                                                <span className="sr-only">Previous</span>
                                                                <ChevronRight className="h-5 w-5 rotate-180" aria-hidden="true" />
                                                            </button>
                                                            {/* Simple Page Numbers */}
                                                            {[...Array(Math.ceil(filteredLeads.length / itemsPerPage)).keys()].map(number => (
                                                                <button
                                                                    key={number + 1}
                                                                    onClick={() => setCurrentPage(number + 1)}
                                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === number + 1
                                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    {number + 1}
                                                                </button>
                                                            ))}
                                                            <button
                                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredLeads.length / itemsPerPage)))}
                                                                disabled={currentPage === Math.ceil(filteredLeads.length / itemsPerPage)}
                                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            >
                                                                <span className="sr-only">Next</span>
                                                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                                            </button>
                                                        </nav>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
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
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Pitch Generator</h2>
                                    <p className="text-gray-600">Create personalized outreach messages powered by Claude AI</p>
                                </div>
                                <button
                                    onClick={() => setShowActivityHistory(!showActivityHistory)}
                                    className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                    <Clock className="w-4 h-4" />
                                    History
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Generator Column */}
                                <div className={`${showActivityHistory ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all`}>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                                        <div className="space-y-6">
                                            {/* Target Type */}


                                            {/* Email Input */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                    Recipient Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={recipientEmail}
                                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                                    placeholder="lead@example.com"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400"
                                                />
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
                                                            onClick={handleSendEmail}
                                                            disabled={isSendingEmail || emailSent || !pitchLead}
                                                            className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-colors ${emailSent ? 'bg-green-600 hover:bg-green-700' :
                                                                !pitchLead ? 'bg-gray-400 cursor-not-allowed' :
                                                                    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                                                }`}
                                                        >
                                                            {isSendingEmail ? (
                                                                <>
                                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                                    Sending...
                                                                </>
                                                            ) : emailSent ? (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Sent!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-4 h-4" />
                                                                    Send Email
                                                                </>
                                                            )}
                                                        </button>
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
                                                    <textarea
                                                        value={generatedPitch}

                                                        onChange={(e) => setGeneratedPitch(e.target.value)}
                                                        className="w-full h-64 bg-white rounded-lg p-4 text-gray-800 font-mono text-sm border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                                                        placeholder="Pitch content will appear here..."
                                                    />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* History Sidebar */}
                                    {showActivityHistory && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="lg:col-span-1 space-y-4"
                                        >
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full max-h-[800px] overflow-y-auto">
                                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    Recent Activity
                                                </h3>

                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Generated Pitches</h4>
                                                        <div className="space-y-3">
                                                            {activityHistory.pushes?.length > 0 ? activityHistory.pushes.map(push => (
                                                                <div
                                                                    key={push.id}
                                                                    onClick={() => {
                                                                        setCustomName(push.lead_name);
                                                                        setContext(push.context);
                                                                        setGeneratedPitch(push.generated_pitch);
                                                                        setWasAiGenerated(true);
                                                                    }}
                                                                    className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-lg cursor-pointer transition-colors group"
                                                                >
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-medium text-sm text-gray-900">{push.lead_name}</span>
                                                                        <span className="text-[10px] text-gray-400">{new Date(push.created_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 line-clamp-2">{push.generated_pitch}</p>
                                                                </div>
                                                            )) : <p className="text-xs text-gray-400 italic">No pitch history yet.</p>}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sent Emails</h4>
                                                        <div className="space-y-3">
                                                            {activityHistory.emails?.length > 0 ? activityHistory.emails.map(email => (
                                                                <div key={email.id} className="p-3 bg-white border border-gray-100 rounded-lg">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-medium text-sm text-gray-900 truncate max-w-[150px]">{email.recipient_email}</span>
                                                                        <span className="text-[10px] text-gray-400">{new Date(email.sent_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-xs text-blue-600 mb-1">{email.subject}</p>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                        <span className="text-[10px] text-gray-500 uppercase">Sent</span>
                                                                    </div>
                                                                </div>
                                                            )) : <p className="text-xs text-gray-400 italic">No email history yet.</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
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
                                                        <div className="text-sm text-gray-900 break-all">
                                                            {viewingLead.instagram ? (
                                                                <a
                                                                    href={viewingLead.instagram.startsWith('http') ? viewingLead.instagram : `https://instagram.com/${viewingLead.instagram.replace('@', '')}`}
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

                                                {/* YouTube */}
                                                {viewingLead.youtube && (
                                                    <div className="group flex items-start gap-4">
                                                        <div className="mt-1 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                                                            <Youtube className="w-4 h-4 text-red-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-xs text-gray-500 font-medium mb-0.5">YouTube</div>
                                                            <div className="text-sm text-gray-900 break-all">
                                                                <a href={ensureAbsoluteUrl(viewingLead.youtube)} target="_blank" rel="noreferrer" className="hover:text-red-600 hover:underline flex items-center gap-1">
                                                                    {viewingLead.youtube} <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Facebook */}
                                                {viewingLead.facebook && (
                                                    <div className="group flex items-start gap-4">
                                                        <div className="mt-1 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                                            <Facebook className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-xs text-gray-500 font-medium mb-0.5">Facebook</div>
                                                            <div className="text-sm text-gray-900 break-all">
                                                                <a href={ensureAbsoluteUrl(viewingLead.facebook)} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline flex items-center gap-1">
                                                                    {viewingLead.facebook} <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TikTok Shop */}
                                                <div className="group flex items-start gap-4">
                                                    <div className="mt-1 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 group-hover:bg-black/10 transition-colors">
                                                        <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] text-black">TT</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-500 font-medium mb-0.5">TikTok</div>
                                                        <div className="text-sm text-gray-900">
                                                            {viewingLead.tiktok ? (
                                                                <a href={ensureAbsoluteUrl(viewingLead.tiktok)} target="_blank" rel="noreferrer" className="hover:text-black hover:underline flex items-center gap-1 break-all">
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
                                                                <a href={ensureAbsoluteUrl(viewingLead.website)} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline flex items-center gap-1 break-all">
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

                                                {/* Scoring Profile */}
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Scoring Profile</div>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${TIERS[viewingLead.tier]?.color} ${TIERS[viewingLead.tier]?.border}`}>
                                                            {viewingLead.tier || 'GRAY'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-end gap-2 mb-3">
                                                        <span className="text-3xl font-bold text-gray-900">{viewingLead.score || 0}</span>
                                                        <span className="text-sm text-gray-500 mb-1">/100 Impact Score</span>
                                                    </div>

                                                    {viewingLead.tags && viewingLead.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {viewingLead.tags.map((tag, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {(!viewingLead.tags || viewingLead.tags.length === 0) && (
                                                        <p className="text-xs text-gray-400 italic">No automated tags generated yet.</p>
                                                    )}
                                                </div>
                                            </div>
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
                                                    <a href={ensureAbsoluteUrl(viewingLead.storeUrl)} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all block">
                                                        {viewingLead.storeUrl}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">Not available</span>
                                                )}
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
                                            onClick={() => handleEnrichLead(viewingLead)}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                                        >
                                            <Zap className="w-4 h-4" />
                                            {isLoading ? 'Enriching...' : 'Enrich Data'}
                                        </button>

                                        <button
                                            onClick={() => {
                                                selectLead(viewingLead);
                                                setViewingLead(null);
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
            </div >
        </div >
    );
}
