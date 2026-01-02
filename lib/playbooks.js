import { Search, Mail, Phone, FileText, CheckCircle, Video, CreditCard } from 'lucide-react';

/**
 * Standard Sales Playbooks
 * Maps Status (or Tags) to a list of actionable steps.
 */
export const PLAYBOOKS = {
    'New': {
        title: 'Initial Research & Qualify',
        steps: [
            { id: 'verify_icp', label: 'Verify Lead Matches ICP', icon: Search },
            { id: 'check_website', label: 'Review Website & Store', icon: Globe }, // Globe needs import if valid icon
            { id: 'find_decision_maker', label: 'Identify Decision Maker', icon: User },
        ]
    },
    'Enriched': {
        title: 'Outreach Preparation',
        steps: [
            { id: 'review_ai_summary', label: 'Read AI Research Summary', icon: Brain },
            { id: 'check_socials', label: 'Check Instagram/TikTok Content', icon: Instagram },
            { id: 'draft_pitch', label: 'Generate & Review Pitch', icon: FileText },
        ]
    },
    'Pitched': {
        title: 'Follow-Up Protocol',
        steps: [
            { id: 'verify_delivery', label: 'Check Email Open Status', icon: Mail },
            { id: 'linked_connection', label: 'Send LinkedIn Connection Request', icon: Link },
            { id: 'follow_up_1', label: 'Send Follow-up Email (Day 3)', icon: Mail },
        ]
    },
    'Replied': {
        title: 'Negotiation & Closing',
        steps: [
            { id: 'respond_in_24h', label: 'Respond within 24 hours', icon: Clock },
            { id: 'schedule_demo', label: 'Book Demo / Call', icon: Calendar },
            { id: 'send_pricing', label: 'Send Pricing Options', icon: CreditCard },
        ]
    },
    'Trial': {
        title: 'Trial Rescue / Onboarding',
        steps: [
            { id: 'welcome_check', label: 'Verify Welcome Email Sent', icon: CheckCircle },
            { id: 'check_usage', label: 'Check Login Activity', icon: Eye },
            { id: 'send_video', label: 'Send "Getting Started" Video', icon: Video },
        ]
    }
};

// Fallback icons logic or simpler imports if we want to avoid icon complex imports here
import { Globe, User, Brain, Instagram, Link, Clock, Calendar, Eye } from 'lucide-react';
