'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadIntelligenceCard } from './LeadIntelligenceCard';
import { TagsSection } from './LeadTags';
import EmailSequenceManager from './EmailSequenceManager';
import LeadLifecycleDashboard from './LeadLifecycleDashboard';
import ActivityFeed from './ActivityFeed';
import SDRTutorial from './SDRTutorial';
import {
    Sparkles, RefreshCw, MessageSquare, Clock, DollarSign, TrendingUp,
    Copy, CheckCircle, Trash2, Target, Search, Download, ChevronRight,
    Zap, Users, Mail, Instagram, MapPin, ExternalLink, Filter, BarChart3,
    FileText, Settings, Plus, Edit3, X, Globe, Phone, Eye, Upload,
    Youtube, Facebook, Send, Pencil, Check, BriefcaseBusiness, Skull, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function KrissKrossPitchGeneratorV2() {
    const [activeTab, setActiveTab] = useState('activity');
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
    const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false); // Separate from Settings modal
    const [selectedLeadIndices, setSelectedLeadIndices] = useState(new Set());
    const [searchHistory, setSearchHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // CRM State
    const [viewingLead, setViewingLead] = useState(null);

    // --- SETTINGS STATE ---
    const [calendlyLink, setCalendlyLink] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            const { data } = await supabase.from('app_settings').select('value').eq('key', 'calendly_link').single();
            if (data?.value) setCalendlyLink(data.value);
        };
        loadSettings();
    }, []);

    const saveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({ key: 'calendly_link', value: calendlyLink });

            if (error) throw error;
            setIsSettingsOpen(false);
        } catch (e) {
            console.error('Failed to save settings:', e);
            alert('Error saving settings');
        } finally {
            setIsSavingSettings(false);
        }
    };


    // CRM State
    const [savedLeads, setSavedLeads] = useState([]);
    const [isCrmInitialized, setIsCrmInitialized] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false); // New flag to track if initial data fetch is complete
    const [isSyncing, setIsSyncing] = useState(false);
    const [crmFilter, setCrmFilter] = useState('all');
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [selectedCrmLeadIds, setSelectedCrmLeadIds] = useState(new Set());
    // Pagination & Bulk Processing State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [crmProcessing, setCrmProcessing] = useState(false);
    const [hasProcessedDeepLink, setHasProcessedDeepLink] = useState(false);
    // duplicate viewingLead removed

    // Email Sending State
    const [pitchLead, setPitchLead] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isEnrichingLead, setIsEnrichingLead] = useState(false);
    const enrichTriggerRef = React.useRef(null);

    const [emailError, setEmailError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null); // Toast notification state

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

    // Lead Card Editing State
    const [editingLeadIndex, setEditingLeadIndex] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const initiateEdit = (index, lead) => {
        setEditingLeadIndex(index);
        setEditFormData({ ...lead });
    };

    const cancelEdit = () => {
        setEditingLeadIndex(null);
        setEditFormData({});
    };

    const handleEditFormChange = (key, value) => {
        setEditFormData(prev => ({ ...prev, [key]: value }));
    };

    const saveEdit = (index) => {
        const updatedLeads = [...foundLeads];
        updatedLeads[index] = { ...updatedLeads[index], ...editFormData };
        setFoundLeads(updatedLeads);
        setEditingLeadIndex(null);
        setEditFormData({});
    };

    // CRM Lead Editing State
    const [editingCrmLeadId, setEditingCrmLeadId] = useState(null);

    const initiateCrmEdit = (lead) => {
        setEditingCrmLeadId(lead.id);
        setEditFormData({ ...lead });
    };

    const cancelCrmEdit = () => {
        setEditingCrmLeadId(null);
        setEditFormData({});
    };

    const saveCrmEdit = async (leadId) => {
        setSavedLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...editFormData } : l));
        setEditingCrmLeadId(null);
        setEditFormData({});

        // Send update to server
        try {
            // Find full lead data to merge (or just send partial if API supported it, but our transform needs full obj usually)
            // API PUT implementation expects 'lead' object. Ideally we send just fields to update, but currently transformToDb expects full lead.
            // Let's find the lead from state to be safe
            const leadToUpdate = savedLeads.find(l => l.id === leadId);
            if (leadToUpdate) {
                await fetch('/api/crm/leads', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lead: { ...leadToUpdate, ...editFormData } })
                });
            }
        } catch (e) {
            console.error('Failed to update lead', e);
        }
    };

    // Modal Edit State & Handlers
    const [isEditingModal, setIsEditingModal] = useState(false);

    const initiateModalEdit = () => {
        setIsEditingModal(true);
        setEditFormData({ ...viewingLead });
    };

    const cancelModalEdit = () => {
        setIsEditingModal(false);
        // Dont clear formData here immediately or it might flicker, but safe to do so.
    };

    const saveModalEdit = async () => {
        if (!viewingLead) return;

        // Update the main list locally
        setSavedLeads(prev => prev.map(l => l.id === viewingLead.id ? { ...l, ...editFormData } : l));

        // Update viewing lead locally
        setViewingLead(prev => ({ ...prev, ...editFormData }));

        setIsEditingModal(false);

        // Send update to server
        try {
            await fetch('/api/crm/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead: { ...viewingLead, ...editFormData } })
            });
        } catch (e) {
            console.error('Failed to update lead', e);
            alert('Failed to save changes to cloud.');
        }

        // Update the main list
        setSavedLeads(prev => prev.map(l => l.id === viewingLead.id ? { ...l, ...editFormData } : l));

        // Update the currently viewed lead so the modal shows new data
        setViewingLead(prev => ({ ...prev, ...editFormData }));

        setIsEditingModal(false);
        // setEditFormData({}); // Keep it populated or clear it? Clearing is safer.
    };

    // Reset modal edit state when modal closes
    useEffect(() => {
        if (!viewingLead) setIsEditingModal(false);
    }, [viewingLead]);

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

    // Realtime Subscription for Concurrent Users
    React.useEffect(() => {
        if (!isCrmInitialized) return;

        console.log('📡 [Realtime] Subscribing to CRM changes...');
        const channel = supabase
            .channel('public:leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
                console.log('🔔 [Realtime] Change received:', payload);
                // Simple strategy: Re-fetch leads to ensure full consistency
                // This handles all cases (INSERT, UPDATE, DELETE) and field mappings automatically
                fetchLeads();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isCrmInitialized]);

    // Deep Link Logic: Auto-open intelligence card if leadId is in URL
    React.useEffect(() => {
        if (isDataLoaded && !hasProcessedDeepLink && savedLeads.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const leadIdParam = params.get('leadId');

            if (leadIdParam) {
                const lead = savedLeads.find(l => l.id === leadIdParam || String(l.id) === leadIdParam);
                if (lead) {
                    console.log(`🎯 [Deep Link] Opening intelligence card for: ${lead.name}`);
                    setViewingLead(lead);
                    setActiveTab('crm');
                    setHasProcessedDeepLink(true);
                }
            }
        }
    }, [isDataLoaded, hasProcessedDeepLink, savedLeads]);

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
                body: JSON.stringify({
                    targetType,
                    customName,
                    context,
                    leadId: pitchLead?.id // Pass leadId if available for auto-population
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'AI Generation failed');
            }

            setGeneratedPitch(data.pitch);
            setWasAiGenerated(true);
            loadActivityHistory();

            // Auto-update status to Pitched if it's a CRM lead
            if (pitchLead && pitchLead.id && !pitchLead.id.startsWith('lead_')) {
                updateLeadStatus(pitchLead.id, 'Pitched');
            }
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
        setSuccessMessage(null);

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
            setSuccessMessage(`✅ Email sent to ${recipientEmail}`);
            loadActivityHistory();

            // Update CRM status to Emailed
            console.log(`📧 [DEBUG] Email sent successfully, updating lead status to Emailed...`);
            console.log(`📧 [DEBUG] pitchLead.id = ${pitchLead?.id}`);
            if (pitchLead && pitchLead.id) {
                await updateLeadStatus(pitchLead.id, 'Emailed');
                console.log(`✅ [DEBUG] Status update to Emailed completed`);
            } else {
                console.error(`❌ [DEBUG] Cannot update status - pitchLead.id is missing!`);
            }

            // Extended timeout for success state (5 seconds)
            setTimeout(() => {
                setEmailSent(false);
                setSuccessMessage(null);
            }, 5000);

            // Log success or show notification
            console.log('Email sent successfully:', data);

        } catch (error) {
            console.error('Email sending error:', error);
            setEmailError(error.message);
            // Clear error after 8 seconds
            setTimeout(() => setEmailError(null), 8000);
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

    const saveLeadToCrm = async (lead) => {
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

        // Optimistic UI Update
        setSavedLeads(prev => [newLead, ...prev]);
        setActiveTab('crm');

        try {
            await fetch('/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead: newLead })
            });
        } catch (e) {
            console.error('Failed to save to cloud', e);
            alert('Failed to save lead to database. Please try again.');
        }
    };

    const updateLeadStatus = async (leadId, newStatus) => {
        console.log(`🔄 [DEBUG] updateLeadStatus called: leadId=${leadId}, newStatus=${newStatus}`);
        const updatedDate = new Date().toLocaleDateString();

        // Find the lead first to make sure we have the latest data
        let targetLead = savedLeads.find(l => l.id === leadId);

        if (!targetLead) {
            console.warn(`⚠️ [CRM] Lead ${leadId} not found in local state, cannot update status to ${newStatus}`);
            return;
        }

        console.log(`📋 [DEBUG] Found lead: ${targetLead.name}, current status: ${targetLead.status} → updating to: ${newStatus}`);

        const updatedLead = { ...targetLead, status: newStatus, lastInteraction: updatedDate };

        // Optimistic Update
        setSavedLeads(prev => prev.map(l =>
            l.id === leadId ? updatedLead : l
        ));

        // Save status change to server
        try {
            console.log(`🌐 [DEBUG] Sending PUT request to /api/crm/leads for ${targetLead.name}...`);
            const response = await fetch('/api/crm/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead: updatedLead })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            console.log(`✅ [CRM] Status updated for ${targetLead.name}: ${targetLead.status} → ${newStatus}`);
        } catch (e) {
            console.error('❌ [CRM] Failed to update status on server:', e);
            // We could revert optimistic update here if needed
        }
    };

    const handleLeadUpdate = async (leadId, updates) => {
        // Optimistic update
        setSavedLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
        if (viewingLead && viewingLead.id === leadId) {
            setViewingLead(prev => ({ ...prev, ...updates }));
        }

        // Server update
        try {
            // Find current lead to merge
            const currentLead = savedLeads.find(l => l.id === leadId);
            if (!currentLead) return;

            const updatedLead = { ...currentLead, ...updates }; // Merge updates

            await fetch('/api/crm/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead: updatedLead })
            });
            console.log('✅ Lead updated successfully');
        } catch (e) {
            console.error('Update failed', e);
            alert('Failed to save changes.');
        }
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

            // Auto-tagging based on score
            // Legacy scoring removed. Tags are applied by auto-tagger backend logic if needed.

            // Update in CRM list
            setSavedLeads(prev => prev.map(l => l.id === lead.id ? enrichedLead : l));

            // Update if currently viewing
            if (viewingLead && viewingLead.id === lead.id) {
                setViewingLead(enrichedLead);
            }

            // Persistence: Save enriched data to server
            await fetch('/api/crm/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead: enrichedLead })
            });

            alert(`Enrichment Complete! Tags updated.`);

        } catch (error) {
            console.error('Enrichment error:', error);
            alert(`Enrichment failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteFromCrm = async (leadId) => {
        if (window.confirm('Remove this lead from CRM?')) {
            // Optimistic Update
            setSavedLeads(prev => prev.filter(l => l.id !== leadId));
            setSelectedCrmLeadIds(prev => {
                const next = new Set(prev);
                next.delete(leadId);
                return next;
            });

            // API Call
            try {
                await fetch(`/api/crm/leads?id=${leadId}`, { method: 'DELETE' });
            } catch (e) {
                console.error('Failed to delete lead', e);
            }
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

    const deleteSelectedCrmLeads = async () => {
        if (selectedCrmLeadIds.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedCrmLeadIds.size} selected leads? This cannot be undone.`)) {
            // Optimistic
            setSavedLeads(prev => prev.filter(l => !selectedCrmLeadIds.has(l.id)));
            const idsToDelete = Array.from(selectedCrmLeadIds);
            setSelectedCrmLeadIds(new Set());

            // API Call - Loop for now as we didn't implement bulk DELETE fully yet in API (simple ID param only)
            // Or we can add bulk support to API. The API changes I made:
            // "or we can parse body for multiple IDs. Let's stick to ID param for single delete and body for bulk if explicitly requested"
            // I actually implemented: check body for { ids: [...] }. So I can use that!
            try {
                await fetch('/api/crm/leads', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete })
                });
            } catch (e) {
                console.error('Failed to delete leads', e);
            }
        }
    };

    // Bulk status change for selected CRM leads
    const handleBulkStatusChange = async (newStatus) => {
        if (selectedCrmLeadIds.size === 0) return;

        setCrmProcessing(true);
        const idsToUpdate = Array.from(selectedCrmLeadIds);

        // Optimistic update
        setSavedLeads(prev => prev.map(lead =>
            selectedCrmLeadIds.has(lead.id) ? { ...lead, status: newStatus } : lead
        ));
        setSelectedCrmLeadIds(new Set());

        try {
            // Update each lead in Supabase
            for (const leadId of idsToUpdate) {
                await fetch(`/api/crm/leads?id=${leadId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
            }
        } catch (e) {
            console.error('Failed to bulk update status', e);
            // Refresh to get accurate state
            fetchLeads();
        } finally {
            setCrmProcessing(false);
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
                // Optimistic UI Update
                setSavedLeads(prev => [...newLeads, ...prev]);

                // Persist to Database immediately
                fetch('/api/crm/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leads: newLeads })
                }).then(res => {
                    if (!res.ok) throw new Error('Database write failed');
                    console.log(`✅ [CSV Import] Successfully persisted ${addedCount} leads to DB`);
                }).catch(err => {
                    console.error('❌ [CSV Import] Failed to save leads to database:', err);
                    alert('Warning: Imported leads are visible but failed to save to the database. They may disappear on refresh.');
                });

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
    const handleSaveAllToCrm = async () => {
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
            // Optimistic
            setSavedLeads(prev => [...newLeads, ...prev]);
            alert(`Saving ${addedCount} new leads to CRM... (${skippedCount} duplicates skipped)`);
            setActiveTab('crm');

            // API Call
            try {
                await fetch('/api/crm/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leads: newLeads })
                });
            } catch (e) {
                console.error('Failed to bulk save', e);
                alert('Error saving batch to cloud.');
            }

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

    // Toggle all leads in Lead Discovery (Select All)
    const toggleAllLeadSelection = () => {
        // Get indices of leads NOT already in CRM (only selectable leads)
        const selectableIndices = foundLeads
            .map((lead, idx) => ({ lead, idx }))
            .filter(({ lead }) => !savedLeads.some(l =>
                (l.storeUrl && lead.storeUrl && l.storeUrl === lead.storeUrl) ||
                (l.name.toLowerCase() === lead.name.toLowerCase())
            ))
            .map(({ idx }) => idx);

        if (selectedLeadIndices.size === selectableIndices.length && selectableIndices.length > 0) {
            // All selected, deselect all
            setSelectedLeadIndices(new Set());
        } else {
            // Select all selectable
            setSelectedLeadIndices(new Set(selectableIndices));
        }
    };

    // Handle saving selected leads to CRM (or all if none selected)
    const handleSaveSelectedToCrm = async () => {
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
            // Optimistic
            setSavedLeads(prev => [...newLeads, ...prev]);
            alert(`Saving ${addedCount} selected leads to CRM...`);
            setActiveTab('crm');

            // API Call
            try {
                await fetch('/api/crm/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leads: newLeads })
                });
            } catch (e) {
                console.error('Failed to bulk save', e);
                alert('Error saving batch to cloud.');
            }
        } else {
            alert('No new unique leads to add.');
        }
    };



    const selectLead = (lead) => {
        setPitchLead(lead); // Store complete lead for emailing
        setRecipientEmail(lead.email || '');
        setCustomName(lead.name || '');

        // Build rich context from CRM data
        const contextParts = [];

        // 1. Full AI Research Summary (most valuable!)
        if (lead.aiResearchSummary || lead.ai_research_summary) {
            const summary = lead.aiResearchSummary || lead.ai_research_summary;
            contextParts.push(`=== COMPANY RESEARCH ===\n${summary}\n`);
        }

        // 2. Business basics
        if (lead.productCategory || lead.product_category) {
            contextParts.push(`Business Type: ${lead.productCategory || lead.product_category}`);
        }
        if (lead.businessAddress || lead.business_address) {
            contextParts.push(`Location: ${lead.businessAddress || lead.business_address}`);
        }

        // 3. Social proof
        if (lead.instagramFollowers || lead.instagram_followers) {
            const followers = lead.instagramFollowers || lead.instagram_followers;
            contextParts.push(`Instagram: ${followers.toLocaleString()} followers`);
        }
        if (lead.engagementRate || lead.engagement_rate) {
            const rate = lead.engagementRate || lead.engagement_rate;
            contextParts.push(`Engagement Rate: ${rate}%`);
        }

        // 4. Tags (pain points, business insights, content gaps)
        if (lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0) {
            const painTags = lead.tags.filter(t => t.category === 'pain').map(t => t.name);
            const businessTags = lead.tags.filter(t => t.category === 'business').map(t => t.name);
            const contentTags = lead.tags.filter(t => t.category === 'content').map(t => t.name);

            if (painTags.length > 0) contextParts.push(`\n=== PAIN POINTS ===\n${painTags.join(', ')}`);
            if (businessTags.length > 0) contextParts.push(`\n=== BUSINESS INSIGHTS ===\n${businessTags.join(', ')}`);
            if (contentTags.length > 0) contextParts.push(`\n=== CONTENT GAPS ===\n${contentTags.join(', ')}`);
        }

        setContext(contextParts.join('\n'));
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

    // Then apply search query
    const filteredLeads = crmSearchQuery.trim() === ''
        ? statusFilteredLeads
        : statusFilteredLeads.filter(lead => {
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
        { id: 'activity', label: 'Activity Feed', icon: Activity },
        { id: 'discover', label: 'Lead Discovery', icon: Search },
        { id: 'crm', label: 'CRM', icon: Users, badge: savedLeads.length },
        { id: 'sequences', label: 'Email Sequences', icon: Mail },
        { id: 'pitch', label: 'Pitch Generator', icon: Sparkles },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* SETTINGS MODAL */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setIsSettingsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-gray-500" />
                                    Settings
                                </h2>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Your Scheduling Link
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400">📅</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="https://calendly.com/your-name"
                                            value={calendlyLink}
                                            onChange={(e) => setCalendlyLink(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        This link will be used when you click "Book Meeting" in the CRM.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveSettings}
                                    disabled={isSavingSettings}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSavingSettings ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Top Navigation Bar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
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

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'analytics'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                title="Analytics"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Analytics</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('tutorial')}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'tutorial'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                title="Tutorial"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">Tutorial</span>
                            </button>
                            {isSyncing && (
                                <span className="flex items-center gap-2 text-xs text-gray-500">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Syncing...
                                </span>
                            )}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
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
                    {/* Activity Feed Tab */}
                    {activeTab === 'activity' && (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ActivityFeed />
                        </motion.div>
                    )}

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
                                        onClick={() => setIsSearchOptionsOpen(!isSearchOptionsOpen)}
                                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Settings className="w-3 h-3" />
                                        {isSearchOptionsOpen ? 'Hide Options' : 'Search Options'}
                                    </button>

                                    {isSearchOptionsOpen && (
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
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedLeadIndices.size > 0 && selectedLeadIndices.size === foundLeads.filter((lead) => !savedLeads.some(l =>
                                                    (l.storeUrl && lead.storeUrl && l.storeUrl === lead.storeUrl) ||
                                                    (l.name.toLowerCase() === lead.name.toLowerCase())
                                                )).length}
                                                onChange={toggleAllLeadSelection}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Select All</span>
                                        </label>
                                        {selectedLeadIndices.size > 0 && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                {selectedLeadIndices.size} selected
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Found {foundLeads.length} Leads
                                        </h3>
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

                                        if (editingLeadIndex === idx) {
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="rounded-lg shadow-md border border-blue-200 p-4 bg-white relative ring-2 ring-blue-100"
                                                >
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                                            <input
                                                                type="text"
                                                                value={editFormData.name || ''}
                                                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                                                                className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 font-semibold text-gray-900"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-500 uppercase">Website</label>
                                                                <input
                                                                    type="text"
                                                                    value={editFormData.storeUrl || ''}
                                                                    onChange={(e) => handleEditFormChange('storeUrl', e.target.value)}
                                                                    className="w-full text-xs border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-500 uppercase">Instagram</label>
                                                                <input
                                                                    type="text"
                                                                    value={editFormData.instagram || ''}
                                                                    onChange={(e) => handleEditFormChange('instagram', e.target.value)}
                                                                    className="w-full text-xs border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                                            <input
                                                                type="text"
                                                                value={editFormData.email || ''}
                                                                onChange={(e) => handleEditFormChange('email', e.target.value)}
                                                                className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                                            <textarea
                                                                value={editFormData.briefDescription || ''}
                                                                onChange={(e) => handleEditFormChange('briefDescription', e.target.value)}
                                                                rows={2}
                                                                className="w-full text-xs border border-gray-200 rounded p-2 focus:border-blue-500 outline-none resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                                        <button
                                                            onClick={() => saveEdit(idx)}
                                                            className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm font-semibold hover:bg-blue-700 flex justify-center items-center gap-1"
                                                        >
                                                            <Check className="w-3 h-3" /> Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="px-3 bg-gray-100 text-gray-600 py-1.5 rounded text-sm font-semibold hover:bg-gray-200"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        }

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`rounded-lg shadow-sm border p-5 transition-all duration-200 ${isAlreadyInCrm ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:shadow-lg hover:-translate-y-1'}`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-start gap-3 w-full">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedLeadIndices.has(idx)}
                                                            onChange={() => toggleLeadSelection(idx)}
                                                            disabled={isAlreadyInCrm}
                                                            className="mt-1.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50 flex-shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-semibold truncate ${isAlreadyInCrm ? 'text-gray-500' : 'text-gray-900'}`}>{lead.name}</h4>
                                                                {!isAlreadyInCrm && (
                                                                    <button
                                                                        onClick={() => initiateEdit(idx, lead)}
                                                                        className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                                                        title="Edit Lead Deatils"
                                                                    >
                                                                        <Pencil className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isAlreadyInCrm && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 whitespace-nowrap ml-2">In CRM ✓</span>}
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
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <div className="max-w-md mx-auto">
                                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                            <Search className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No leads discovered yet</h3>
                                        <p className="text-gray-600 mb-6">Start by pasting a URL from an e-commerce platform or marketplace to discover potential leads</p>
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
                                            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Quick Start:</p>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                <li>• Amazon category or seller pages</li>
                                                <li>• Etsy shop listings</li>
                                                <li>• TikTok Shop collections</li>
                                            </ul>
                                        </div>
                                    </div>
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
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-semibold rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete ({selectedCrmLeadIds.size})
                                            </button>
                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleBulkStatusChange(e.target.value);
                                                        e.target.value = ''; // Reset dropdown
                                                    }
                                                }}
                                                disabled={crmProcessing}
                                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="">Move to...</option>
                                                <option value="New">New</option>
                                                <option value="Pitched">Pitched</option>
                                                <option value="Emailed">Emailed</option>
                                                <option value="Replied">Replied</option>
                                                <option value="Dead">Dead</option>
                                            </select>
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
                                        <div className="text-2xl font-bold text-blue-500">{savedLeads.filter(l => l.status === 'Emailed').length}</div>
                                        <div className="text-sm text-gray-600">Emailed</div>
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
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all"
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
                                    {['all', 'New', 'Pitched', 'Emailed', 'Replied', 'Dead'].map(filter => (
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
                                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
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
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tags</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((lead) => (
                                                        <tr
                                                            key={lead.id}
                                                            onClick={(e) => {
                                                                // Only open if we are NOT in edit mode
                                                                if (editingCrmLeadId !== lead.id) {
                                                                    setViewingLead(lead);
                                                                }
                                                            }}
                                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedCrmLeadIds.has(lead.id) ? 'bg-blue-50/50' : ''}`}
                                                        >
                                                            {editingCrmLeadId === lead.id ? (
                                                                // EDIT MODE ROW
                                                                <>
                                                                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                                        <input type="checkbox" disabled className="w-4 h-4 text-gray-400 rounded border-gray-300" />
                                                                    </td>
                                                                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                                        <div className="space-y-2">
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-sm font-semibold border-b border-blue-300 focus:border-blue-500 outline-none"
                                                                                value={editFormData.name || ''}
                                                                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                                                                                placeholder="Name"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-xs text-gray-500 border-b border-gray-200 focus:border-blue-500 outline-none"
                                                                                value={editFormData.productCategory || ''}
                                                                                onChange={(e) => handleEditFormChange('productCategory', e.target.value)}
                                                                                placeholder="Category"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 opacity-50" onClick={e => e.stopPropagation()}>
                                                                        <span className="text-xs text-gray-400 italic">Tags not editable</span>
                                                                    </td>
                                                                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${editFormData.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                            editFormData.status === 'Pitched' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                                editFormData.status === 'Emailed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                                    editFormData.status === 'Replied' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                                        'bg-red-50 text-red-700 border-red-200'
                                                                            }`}>
                                                                            {editFormData.status || 'New'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                onClick={() => saveCrmEdit(lead.id)}
                                                                                className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                                                                                title="Save"
                                                                            >
                                                                                <Check className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={cancelCrmEdit}
                                                                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                                                                title="Cancel"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                // VIEW MODE ROW
                                                                <>
                                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedCrmLeadIds.has(lead.id)}
                                                                            onChange={() => toggleCrmLeadSelection(lead.id)}
                                                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="font-semibold text-gray-900 leading-tight">
                                                                                {lead.name}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                                            {lead.productCategory || 'Sourced Lead'} • {lead.addedAt}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        {lead.tags && lead.tags.length > 0 ? (
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {(() => {
                                                                                    // Priority sort tags: business > pain > content > other
                                                                                    const priority = { business: 1, pain: 2, content: 3, other: 4 };
                                                                                    const sortedTags = [...lead.tags].sort((a, b) => {
                                                                                        const catA = typeof a === 'string' ? 'other' : (a.category || 'other');
                                                                                        const catB = typeof b === 'string' ? 'other' : (b.category || 'other');
                                                                                        return (priority[catA] || 4) - (priority[catB] || 4);
                                                                                    });
                                                                                    return sortedTags.slice(0, 3).map((tag, idx) => {
                                                                                        const [cat, name] = typeof tag === 'string' ? tag.split(':') : [tag.category, tag.name];
                                                                                        return (
                                                                                            <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] uppercase font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                                                {name || cat}
                                                                                            </span>
                                                                                        );
                                                                                    });
                                                                                })()}
                                                                                {lead.tags.length > 3 && (
                                                                                    <span className="px-1.5 py-0.5 text-[10px] text-gray-400">+{lead.tags.length - 3}</span>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-400 italic">No tags</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex items-center gap-2">
                                                                            <select
                                                                                value={lead.status || 'New'}
                                                                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                                                className={`text-[10px] font-bold px-2 py-1 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400' :
                                                                                        lead.status === 'Enriched' ? 'bg-teal-50 text-teal-700 border-teal-200 focus:ring-teal-400' :
                                                                                            lead.status === 'Pitched' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-400' :
                                                                                                lead.status === 'Emailed' ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-400' :
                                                                                                    lead.status === 'Replied' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-400' :
                                                                                                        'bg-red-50 text-red-700 border-red-200 focus:ring-red-400'
                                                                                    }`}
                                                                            >
                                                                                <option value="New">NEW</option>
                                                                                <option value="Enriched">ENRICHED</option>
                                                                                <option value="Pitched">PITCHED</option>
                                                                                <option value="Emailed">EMAILED</option>
                                                                                <option value="Replied">REPLIED</option>
                                                                                <option value="Dead">DEAD</option>
                                                                            </select>
                                                                            {lead.in_sequence && (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200" title="In automated follow-up sequence">
                                                                                    📧 Sequence
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                onClick={() => initiateCrmEdit(lead)}
                                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                                title="Edit Lead"
                                                                            >
                                                                                <Pencil className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateLeadStatus(lead.id, 'Dead')}
                                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                title="Mark as Dead"
                                                                            >
                                                                                <Skull className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteFromCrm(lead.id)}
                                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                                title="Delete Lead"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
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
                                                    className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-lg"
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
                                                            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
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

                                                    {/* Success/Error Toast Banner */}
                                                    <AnimatePresence>
                                                        {successMessage && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                                                            >
                                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                                <span className="text-green-800 font-medium">{successMessage}</span>
                                                            </motion.div>
                                                        )}
                                                        {emailError && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
                                                            >
                                                                <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                                <span className="text-red-800 font-medium">Failed to send: {emailError}</span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

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

                    {/* Email Sequences Tab */}
                    {activeTab === 'sequences' && (
                        <motion.div
                            key="sequences"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <EmailSequenceManager />
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
                            <LeadLifecycleDashboard />
                        </motion.div>
                    )}

                    {/* Tutorial Tab */}
                    {activeTab === 'tutorial' && (
                        <motion.div
                            key="tutorial"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SDRTutorial />
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
                                {/* Modal Header - Simplified for Lead Card View */}
                                <div className={`flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 ${!isEditingModal ? 'absolute top-0 right-0 z-20 bg-transparent border-none w-auto p-4' : ''}`}>
                                    {isEditingModal ? (
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
                                                {viewingLead.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 mr-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editFormData.name || ''}
                                                            onChange={(e) => handleEditFormChange('name', e.target.value)}
                                                            className="text-xl font-bold text-gray-900 border-b border-blue-500 focus:outline-none bg-transparent w-full"
                                                            placeholder="Lead Name"
                                                        />
                                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${editFormData.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            editFormData.status === 'Pitched' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                editFormData.status === 'Emailed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                    editFormData.status === 'Replied' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                        'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                            {editFormData.status || 'New'}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={editFormData.productCategory || ''}
                                                        onChange={(e) => handleEditFormChange('productCategory', e.target.value)}
                                                        className="text-sm text-gray-600 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent w-full"
                                                        placeholder="Category"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Hidden header content when viewing card, just spacer or nothing
                                        null
                                    )}

                                    <div className="flex items-center gap-2">
                                        {!isEditingModal && (
                                            <button
                                                onClick={initiateModalEdit}
                                                className="p-2 bg-white/80 hover:bg-white shadow-sm border border-gray-200 rounded-full transition-all text-gray-500 hover:text-blue-600 backdrop-blur-sm"
                                                title="Edit Details"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setViewingLead(null)}
                                            className={`p-2 rounded-full transition-colors ${!isEditingModal ? 'bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-500 backdrop-blur-sm' : 'hover:bg-gray-200 text-gray-500'}`}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body - Scrollable */}
                                {/* Modal Body - Scrollable */}
                                <div className="overflow-y-auto custom-scrollbar flex-grow bg-white">
                                    {isEditingModal ? (
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                                                    <Users className="w-4 h-4" /> Contact Info
                                                </h3>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Email Address</label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.email || ''}
                                                            onChange={e => handleEditFormChange('email', e.target.value)}
                                                            className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Phone Number</label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.phone || ''}
                                                            onChange={e => handleEditFormChange('phone', e.target.value)}
                                                            className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Instagram Handle</label>
                                                        <div className="relative">
                                                            <Instagram className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                                            <input
                                                                type="text"
                                                                value={editFormData.instagram || ''}
                                                                onChange={e => handleEditFormChange('instagram', e.target.value)}
                                                                className="w-full border border-gray-300 pl-9 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Website URL</label>
                                                        <div className="relative">
                                                            <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                                            <input
                                                                type="text"
                                                                value={editFormData.website || ''}
                                                                onChange={e => handleEditFormChange('website', e.target.value)}
                                                                className="w-full border border-gray-300 pl-9 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                                                    <BriefcaseBusiness className="w-4 h-4" /> Business Details
                                                </h3>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Physical Address</label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.businessAddress || ''}
                                                            onChange={e => handleEditFormChange('businessAddress', e.target.value)}
                                                            className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Store / Listing URL</label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.storeUrl || ''}
                                                            onChange={e => handleEditFormChange('storeUrl', e.target.value)}
                                                            className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Business Description</label>
                                                        <textarea
                                                            value={editFormData.briefDescription || ''}
                                                            onChange={e => handleEditFormChange('briefDescription', e.target.value)}
                                                            className="w-full border border-gray-300 p-2 rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all custom-scrollbar"
                                                            placeholder="Add notes or description..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <LeadIntelligenceCard
                                            lead={viewingLead}
                                            isEnriching={isEnrichingLead}
                                            onTriggerEnrichment={() => enrichTriggerRef.current?.()}
                                            userCalendlyLink={calendlyLink}
                                            onUpdate={handleLeadUpdate}
                                        />
                                    )}

                                    {/* Tags Section with Enrich Button */}
                                    {!isEditingModal && (
                                        <div className="px-6 pb-6 bg-white">
                                            <TagsSection
                                                lead={viewingLead}
                                                onLoadingStateChange={setIsEnrichingLead}
                                                onUpdateTags={(enrichedData) => {
                                                    console.log('🔄 [UI] Updating lead with enriched data:', enrichedData);
                                                    setViewingLead(prev => ({ ...prev, ...enrichedData }));
                                                    setSavedLeads(prev => prev.map(l =>
                                                        l.id === viewingLead.id ? { ...l, ...enrichedData } : l
                                                    ));
                                                }}
                                                ref={enrichTriggerRef}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center mt-auto">
                                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Added {viewingLead.addedAt}
                                    </div>
                                    <div className="flex gap-3">
                                        {isEditingModal ? (
                                            <>
                                                <button
                                                    onClick={saveModalEdit}
                                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={cancelModalEdit}
                                                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg flex items-center gap-2 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {isLoading ? (
                                                    <span className="text-gray-500 text-sm animate-pulse">Enriching...</span>
                                                ) : null}

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
                                            </>
                                        )}
                                    </div>
                                </div >
                            </motion.div >
                        </motion.div >
                    )
                    }
                </AnimatePresence >
            </div >
        </div >
    );
}
