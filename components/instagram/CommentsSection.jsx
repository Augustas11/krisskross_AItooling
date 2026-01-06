/**
 * Instagram Comments Section Component
 * Collapsible section for displaying Instagram comments in LeadIntelligenceCard
 */

import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import CommentList from './CommentList';

export default function InstagramCommentsSection({ leadId, instagramHandle }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header - Clickable to expand/collapse */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800">Instagram Comments</h3>
                    <span className="text-xs text-gray-500">@{instagramHandle}</span>
                </div>

                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-4 border-t bg-gray-50">
                    <CommentList leadId={leadId} />
                </div>
            )}
        </div>
    );
}
