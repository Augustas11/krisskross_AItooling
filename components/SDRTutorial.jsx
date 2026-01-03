'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, ChevronDown, ChevronRight, Activity, Search, Users,
    Mail, Sparkles, BarChart3, Zap, Target, TrendingUp, CheckCircle,
    AlertCircle, HelpCircle, Lightbulb, FileText, ExternalLink
} from 'lucide-react';

export default function SDRTutorial() {
    const [expandedSections, setExpandedSections] = useState(new Set(['welcome']));
    const scrollPositionRef = useRef(0);
    const containerRef = useRef(null);

    const toggleSection = (sectionId) => {
        // Save current scroll position
        scrollPositionRef.current = window.scrollY;

        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    // Restore scroll position after state update
    useEffect(() => {
        if (scrollPositionRef.current > 0) {
            window.scrollTo(0, scrollPositionRef.current);
        }
    }, [expandedSections]);

    const Section = ({ id, title, icon: Icon, children }) => {
        const isExpanded = expandedSections.has(id);
        return (
            <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        toggleSection(id);
                    }}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    type="button"
                >
                    <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                </button>
                {isExpanded && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    const InfoBox = ({ type = 'info', children }) => {
        const styles = {
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            tip: 'bg-green-50 border-green-200 text-green-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        };
        const icons = {
            info: AlertCircle,
            tip: Lightbulb,
            warning: AlertCircle,
        };
        const Icon = icons[type];
        return (
            <div className={`p-4 rounded-lg border ${styles[type]} mb-4`}>
                <div className="flex gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">{children}</div>
                </div>
            </div>
        );
    };

    const Step = ({ number, title, children }) => (
        <div className="mb-6 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {number}
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
                <div className="text-gray-700 text-sm space-y-2">{children}</div>
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    KrissKross CRM Tutorial
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Your complete guide to mastering the KrissKross CRM system and maximizing your outreach effectiveness
                </p>
            </div>

            {/* Welcome Section */}
            <Section id="welcome" title="Welcome to KrissKross CRM" icon={Target}>
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 mb-4">
                        Welcome! KrissKross CRM is your all-in-one platform for discovering, managing, and converting leads.
                        This tutorial will guide you through every feature to help you become a power user.
                    </p>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">What You'll Learn:</h3>
                    <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>How to discover and source new leads from any website</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Managing your lead database effectively</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Using AI to enrich leads with valuable data</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Generating personalized pitches with AI</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Setting up automated email sequences</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Tracking your performance with analytics</span>
                        </li>
                    </ul>
                </div>
            </Section>

            {/* Activity Feed */}
            <Section id="activity" title="Activity Feed" icon={Activity}>
                <div className="space-y-4">
                    <p className="text-gray-700">
                        The Activity Feed is your command center, showing all recent actions across your CRM in real-time.
                    </p>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">What You'll See:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                New Leads
                            </h4>
                            <p className="text-sm text-gray-600">See when new leads are added to your CRM</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                Lead Enrichment
                            </h4>
                            <p className="text-sm text-gray-600">Track when leads are enriched with AI data</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-green-600" />
                                Email Activity
                            </h4>
                            <p className="text-sm text-gray-600">Monitor sent emails and responses</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                                Status Changes
                            </h4>
                            <p className="text-sm text-gray-600">See lead progression through your funnel</p>
                        </div>
                    </div>

                    <InfoBox type="tip">
                        <strong>Pro Tip:</strong> Check the Activity Feed first thing each day to stay on top of your pipeline and never miss important updates.
                    </InfoBox>
                </div>
            </Section>

            {/* Lead Discovery */}
            <Section id="discovery" title="Lead Discovery" icon={Search}>
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Lead Discovery helps you find potential customers from any website, marketplace, or directory.
                    </p>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">How to Discover Leads:</h3>

                    <Step number="1" title="Enter a URL">
                        <p>Paste any website URL where potential leads might be listed (e.g., Etsy, Instagram, business directories).</p>
                    </Step>

                    <Step number="2" title="Choose Your Method">
                        <div className="space-y-2">
                            <p><strong>Fast Scrape:</strong> Quick extraction of visible contact information</p>
                            <p><strong>Deep Hunt:</strong> AI-powered deep search that finds hidden details and enriches data automatically</p>
                        </div>
                    </Step>

                    <Step number="3" title="Review Results">
                        <p>Browse discovered leads, review their information, and select which ones to save to your CRM.</p>
                    </Step>

                    <Step number="4" title="Save to CRM">
                        <p>Click "Save to CRM" on any lead card to add them to your database.</p>
                    </Step>

                    <InfoBox type="info">
                        <strong>Best Sources:</strong> E-commerce marketplaces (Etsy, Shopify stores), social media profiles, business directories, and industry-specific platforms work great for lead discovery.
                    </InfoBox>

                    <InfoBox type="tip">
                        <strong>Pro Tip:</strong> Use Deep Hunt mode for higher-quality leads when you need detailed information. Use Fast Scrape when you're doing bulk discovery and will enrich later.
                    </InfoBox>
                </div>
            </Section>

            {/* CRM Management */}
            <Section id="crm" title="CRM Management" icon={Users}>
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Your CRM is where all your leads live. Here's how to manage them effectively.
                    </p>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Lead Statuses:</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">New</span>
                            <span className="text-sm text-gray-700">Freshly added leads, not yet contacted</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">Enriched</span>
                            <span className="text-sm text-gray-700">Leads with AI-enhanced data and insights</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Pitched</span>
                            <span className="text-sm text-gray-700">Pitch generated, ready to send</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Emailed</span>
                            <span className="text-sm text-gray-700">Outreach email sent</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Dead</span>
                            <span className="text-sm text-gray-700">Not interested or unqualified</span>
                        </div>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Key Actions:</h3>

                    <Step number="1" title="View Lead Details">
                        <p>Click on any lead card to open the Intelligence Card with full details, AI research summary, and contact information.</p>
                    </Step>

                    <Step number="2" title="Edit Lead Information">
                        <p>Click the Edit button to update any field. Changes are automatically saved to the database.</p>
                    </Step>

                    <Step number="3" title="Enrich Leads">
                        <p>Click "Deep Research" to use AI to find additional contact info, social media profiles, and business insights.</p>
                    </Step>

                    <Step number="4" title="Filter and Search">
                        <p>Use the filter dropdown to view leads by status. Use the search bar to find specific leads by name or business.</p>
                    </Step>

                    <Step number="5" title="Bulk Actions">
                        <p>Select multiple leads using checkboxes, then use bulk delete or export to CSV for external use.</p>
                    </Step>

                    <InfoBox type="tip">
                        <strong>Pro Tip:</strong> Regularly enrich your "New" leads to gather more contact information before reaching out. This increases your chances of successful contact.
                    </InfoBox>
                </div>
            </Section>

            {/* Lead Enrichment */}
            <Section id="enrichment" title="Lead Enrichment with AI" icon={Sparkles}>
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Lead enrichment uses AI to automatically find and add valuable information about your leads.
                    </p>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">What Gets Enriched:</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span><strong>Contact Information:</strong> Email addresses, phone numbers, business addresses</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span><strong>Social Media:</strong> Instagram, TikTok, Facebook, YouTube profiles</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span><strong>Business Insights:</strong> Brand identity, product offerings, target audience</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span><strong>Pain Points:</strong> AI-identified challenges your product can solve</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span><strong>Smart Tags:</strong> Automatic categorization based on business type and needs</span>
                        </li>
                    </ul>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">How to Enrich:</h3>
                    <Step number="1" title="Open Lead Intelligence Card">
                        <p>Click on a lead to view their full profile.</p>
                    </Step>

                    <Step number="2" title="Click 'Deep Research'">
                        <p>The AI will search the web for additional information about this lead.</p>
                    </Step>

                    <Step number="3" title="Review Enriched Data">
                        <p>Check the AI Research Summary and newly populated contact fields.</p>
                    </Step>

                    <InfoBox type="info">
                        <strong>Note:</strong> Enrichment works best when you have at least a business name and website/social profile. The more initial data you have, the better the enrichment results.
                    </InfoBox>
                </div>
            </Section>

            {/* Pitch Generator */}
            <Section id="pitch" title="Pitch Generator" icon={Sparkles}>
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Generate personalized, AI-powered pitches tailored to each lead's specific business and needs.
                    </p>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">How to Generate a Pitch:</h3>

                    <Step number="1" title="Select a Lead">
                        <p>From the CRM, click "Generate Pitch" on any lead card, or open their Intelligence Card and click the pitch button.</p>
                    </Step>

                    <Step number="2" title="Review Context">
                        <p>The AI automatically pulls in the lead's business info, AI research summary, and pain points as context.</p>
                    </Step>

                    <Step number="3" title="Choose Target Type">
                        <p>Select the lead type (Fashion Seller, E-commerce Owner, Affiliate) for optimized messaging.</p>
                    </Step>

                    <Step number="4" title="Generate">
                        <p>Click "Generate Pitch" and the AI will create a personalized message in seconds.</p>
                    </Step>

                    <Step number="5" title="Edit and Send">
                        <p>Review the pitch, make any edits, then copy to clipboard or send directly via email.</p>
                    </Step>

                    <InfoBox type="tip">
                        <strong>Pro Tip:</strong> Enrich leads before generating pitches. The AI uses the research summary to create highly personalized messages that mention specific pain points and opportunities.
                    </InfoBox>

                    <InfoBox type="info">
                        <strong>Email Integration:</strong> You can send pitches directly from the CRM. The system will automatically update the lead status to "Emailed" and log the activity.
                    </InfoBox>
                </div>
            </Section>

            {/* Email Sequences */}
            <Section id="sequences" title="Email Sequences" icon={Mail}>
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Set up automated email sequences to nurture leads over time without manual follow-ups.
                    </p>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Creating a Sequence:</h3>

                    <Step number="1" title="Create New Sequence">
                        <p>Click "New Sequence" and give it a descriptive name (e.g., "Fashion Seller Outreach").</p>
                    </Step>

                    <Step number="2" title="Add Email Steps">
                        <p>Add multiple emails with delays between them (e.g., Day 0, Day 3, Day 7).</p>
                    </Step>

                    <Step number="3" title="Write Email Content">
                        <p>Craft each email in the sequence. Use personalization variables like {`{{name}}`} and {`{{business}}`}.</p>
                    </Step>

                    <Step number="4" title="Enroll Leads">
                        <p>Add leads to the sequence from the CRM. They'll automatically receive emails based on your schedule.</p>
                    </Step>

                    <Step number="5" title="Monitor Performance">
                        <p>Track opens, clicks, and replies in the sequence dashboard.</p>
                    </Step>

                    <InfoBox type="tip">
                        <strong>Best Practice:</strong> A typical sequence has 3-5 emails spaced 2-4 days apart. Start with value, follow up with social proof, and end with a clear call-to-action.
                    </InfoBox>
                </div>
            </Section>

            {/* Analytics */}
            <Section id="analytics" title="Analytics Dashboard" icon={BarChart3}>
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Track your performance and optimize your outreach strategy with comprehensive analytics.
                    </p>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Key Metrics:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Funnel Metrics</h4>
                            <p className="text-sm text-gray-600">Track leads through each stage from New to Converted</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Conversion Rates</h4>
                            <p className="text-sm text-gray-600">See what percentage of leads move to each stage</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Email Performance</h4>
                            <p className="text-sm text-gray-600">Monitor send rates, opens, and responses</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Activity Trends</h4>
                            <p className="text-sm text-gray-600">View your outreach activity over time</p>
                        </div>
                    </div>

                    <InfoBox type="tip">
                        <strong>Pro Tip:</strong> Review your analytics weekly to identify bottlenecks in your funnel and optimize your messaging strategy.
                    </InfoBox>
                </div>
            </Section>

            {/* Best Practices */}
            <Section id="best-practices" title="SDR Best Practices" icon={Lightbulb}>
                <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Daily Workflow:</h3>
                    <div className="space-y-3">
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-bold text-blue-600">1.</span>
                            <div>
                                <p className="font-semibold text-gray-900">Check Activity Feed</p>
                                <p className="text-sm text-gray-600">Review overnight activities and responses</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-bold text-blue-600">2.</span>
                            <div>
                                <p className="font-semibold text-gray-900">Discover New Leads</p>
                                <p className="text-sm text-gray-600">Spend 30-60 minutes sourcing fresh prospects</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-bold text-blue-600">3.</span>
                            <div>
                                <p className="font-semibold text-gray-900">Enrich Your Pipeline</p>
                                <p className="text-sm text-gray-600">Run Deep Research on 10-20 new leads</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-bold text-blue-600">4.</span>
                            <div>
                                <p className="font-semibold text-gray-900">Generate Pitches</p>
                                <p className="text-sm text-gray-600">Create personalized pitches for enriched leads</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-bold text-blue-600">5.</span>
                            <div>
                                <p className="font-semibold text-gray-900">Send Outreach</p>
                                <p className="text-sm text-gray-600">Send 20-50 personalized emails daily</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-bold text-blue-600">6.</span>
                            <div>
                                <p className="font-semibold text-gray-900">Review Analytics</p>
                                <p className="text-sm text-gray-600">Check performance and adjust strategy</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Quality Over Quantity:</h3>
                    <InfoBox type="tip">
                        <strong>Remember:</strong> 20 highly personalized, well-researched pitches will outperform 100 generic messages. Use the AI enrichment and research features to make every outreach count.
                    </InfoBox>
                </div>
            </Section>

            {/* Troubleshooting */}
            <Section id="troubleshooting" title="Troubleshooting" icon={HelpCircle}>
                <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Common Issues:</h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Lead Discovery Returns No Results</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Try a different URL or page on the same site</li>
                                <li>• Switch to Deep Hunt mode for better extraction</li>
                                <li>• Ensure the URL contains actual business listings</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Enrichment Not Finding Contact Info</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Ensure the lead has a website or social media profile</li>
                                <li>• Manually add more initial data (Instagram handle, etc.)</li>
                                <li>• Try enriching again after adding more context</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Email Not Sending</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Verify the lead has a valid email address</li>
                                <li>• Check your email integration settings</li>
                                <li>• Contact support if the issue persists</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Changes Not Saving</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Check your internet connection</li>
                                <li>• Refresh the page and try again</li>
                                <li>• Clear browser cache if problems persist</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Section>

            {/* FAQ */}
            <Section id="faq" title="Frequently Asked Questions" icon={HelpCircle}>
                <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">How many leads should I add per day?</h4>
                        <p className="text-sm text-gray-700">
                            Aim for 20-50 quality leads daily. Focus on leads that match your ideal customer profile rather than maximizing quantity.
                        </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Should I enrich every lead?</h4>
                        <p className="text-sm text-gray-700">
                            Yes, enrichment significantly improves your outreach success rate. Prioritize enriching leads before sending pitches.
                        </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">How do I know if a lead is high-quality?</h4>
                        <p className="text-sm text-gray-700">
                            Check the AI Research Summary for pain points that match your solution. Leads with active social media and clear business models are typically higher quality.
                        </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Can I edit AI-generated pitches?</h4>
                        <p className="text-sm text-gray-700">
                            Absolutely! The AI provides a strong foundation, but you should always personalize further based on your knowledge of the lead.
                        </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">What's the best time to send outreach emails?</h4>
                        <p className="text-sm text-gray-700">
                            Tuesday-Thursday, 10 AM - 2 PM in the recipient's timezone typically sees the best response rates. Avoid Mondays and Fridays.
                        </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">How long should I wait before following up?</h4>
                        <p className="text-sm text-gray-700">
                            Wait 3-4 days between follow-ups. Use email sequences to automate this process and ensure consistent follow-through.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Footer */}
            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="text-center">
                    <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Get Started?</h3>
                    <p className="text-gray-700 mb-4">
                        You now have everything you need to master KrissKross CRM. Start discovering leads and watch your pipeline grow!
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Print Tutorial
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
