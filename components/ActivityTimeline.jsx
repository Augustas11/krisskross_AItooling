import React, { useEffect, useState } from 'react';
import { History, Mail, Edit, CheckCircle2, Clock, Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import { EmailContentModal } from './EmailContentModal';

export function ActivityTimeline({ lead }) {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);

    useEffect(() => {
        if (lead?.id) {
            fetchActivity();
        }
    }, [lead?.id, lead?.lastInteraction]); // Refresh if lastInteraction updates

    const fetchActivity = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/history/activity?leadId=${lead.id}`);
            const json = await res.json();
            if (json.data) {
                setActivities(json.data);
            }
        } catch (e) {
            console.error('Failed to load timeline:', e);
            setError('Could not load history');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && activities.length === 0) {
        return <div className="p-4 text-center text-gray-400 text-xs">Loading timeline...</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No activity recorded yet</p>
                <p className="text-xs text-gray-400">Actions taken will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Activity History</h3>
            </div>

            <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pl-6 pb-2">
                {activities.map((item, idx) => {
                    const isEmail = item.type === 'email';
                    const isReply = item.type === 'reply';
                    const isCreate = item.action === 'create_lead';
                    const icon = isEmail ? <Mail className="w-4 h-4" /> :
                        isReply ? <Mail className="w-4 h-4" /> :
                            isCreate ? <PlusCircle className="w-4 h-4" /> :
                                <Edit className="w-4 h-4" />;

                    const colorClass = isEmail ? 'bg-blue-100 text-blue-600 border-blue-200' :
                        isReply ? 'bg-purple-100 text-purple-600 border-purple-200' :
                            isCreate ? 'bg-green-100 text-green-600 border-green-200' :
                                'bg-gray-100 text-gray-500 border-gray-200';

                    return (
                        <div key={item.id || idx} className="relative group">
                            {/* Dot on timeline */}
                            <div className={`absolute -left-[31px] w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${colorClass}`}>
                                {icon}
                            </div>

                            <div
                                className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow ${isEmail ? 'cursor-pointer hover:border-blue-300' : ''}`}
                                onClick={() => {
                                    if (isEmail) {
                                        setSelectedEmail({
                                            subject: item.details?.subject,
                                            to: item.details?.to,
                                            status: item.details?.status,
                                            body: item.details?.body
                                        });
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-sm text-gray-900 capitalize">
                                        {formatActionName(item.action)}
                                    </span>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-600 mt-1 space-y-1">
                                    {renderDetails(item)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <EmailContentModal
                isOpen={!!selectedEmail}
                onClose={() => setSelectedEmail(null)}
                email={selectedEmail}
            />
        </div>
    );
}

function formatActionName(action) {
    if (!action) return 'Action';
    return action.replace(/_/g, ' ');
}

function renderDetails(item) {
    if (item.type === 'email') {
        const { subject, status } = item.details || {};
        return (
            <div>
                <p><span className="font-medium">Subject:</span> {subject || '(No Subject)'}</p>
                {status && (
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${status === 'sent' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                        {status}
                    </span>
                )}
            </div>
        );
    }

    if (item.type === 'reply') {
        const { subject, from, preview } = item.details || {};
        return (
            <div>
                <p><span className="font-medium text-pink-600">Reply from {from}</span></p>
                <p className="text-gray-500 italic mt-1">"{preview}"</p>
                <p className="text-[10px] text-gray-400 mt-1">{subject}</p>
            </div>
        );
    }

    if (item.action === 'sent' && item.type === 'activity') { // Handle 'sent' from activity feed
        const { subject, recipient } = item.details || {};
        return (
            <div>
                <p><span className="font-medium">Subject:</span> {subject || '(No Subject)'}</p>
                <p className="text-xs text-gray-400">To: {recipient}</p>
            </div>
        );
    }

    const actionLower = (item.action || '').toLowerCase();

    // Consolidated Update Handler (covers 'updated' from ActivityFeed and 'update_lead' from Logs)
    if (actionLower === 'updated' || actionLower === 'update_lead') {
        const details = item.details || {};
        // ActivityFeed uses 'fields_updated', generic logs uses 'updates'
        const fields = details.fields_updated || details.updates;

        if (fields && Array.isArray(fields)) {
            return (
                <div className="flex flex-wrap gap-1">
                    <span className="text-gray-500 text-xs">Updated fields:</span>
                    {fields.map(f => (
                        <span key={f} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] code">
                            {f}
                        </span>
                    ))}
                </div>
            );
        }
    }


    // Generic Logs
    if (item.details) {
        // Safe check for simple updates list from old logs
        if (item.details.updates && Array.isArray(item.details.updates)) {
            return <p>Updated fields: {item.details.updates.join(', ')}</p>;
        }
        // General text dump for now if complex, but skip empty objects
        if (Object.keys(item.details).length === 0) return null;

        return (
            <pre className="whitespace-pre-wrap font-mono text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded mt-1 border border-gray-100">
                {JSON.stringify(item.details, null, 2)}
            </pre>
        );
    }
    return null;
}
