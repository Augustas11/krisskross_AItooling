'use client';
import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function ReplyDetectionPanel() {
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [result, setResult] = useState(null);

    const checkReplies = async () => {
        setIsChecking(true);
        setResult(null);

        try {
            const response = await fetch('/api/email/check-replies-auto');
            const data = await response.json();

            if (data.success) {
                setResult({
                    type: 'success',
                    message: data.message,
                    unenrolledCount: data.unenrolledCount
                });
            } else {
                setResult({
                    type: 'error',
                    message: data.error || 'Failed to check replies'
                });
            }

            setLastCheck(new Date());

        } catch (error) {
            console.error('Error checking replies:', error);
            setResult({
                type: 'error',
                message: 'Failed to connect to reply checker'
            });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Reply Detection
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Automatically detect email replies and update lead status
                    </p>
                </div>
                <button
                    onClick={checkReplies}
                    disabled={isChecking}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? 'Checking...' : 'Check Now'}
                </button>
            </div>

            {/* Status */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                        {lastCheck
                            ? `Last checked: ${lastCheck.toLocaleTimeString()}`
                            : 'Never checked manually'}
                    </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                        <strong>Automatic checks:</strong> Every hour via cron job
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                        Replies are detected automatically and leads are updated to "Replied" status
                    </p>
                </div>

                {/* Result */}
                {result && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${result.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                        {result.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className={`text-sm font-medium ${result.type === 'success' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                {result.message}
                            </p>
                            {result.unenrolledCount > 0 && (
                                <p className="text-xs text-green-700 mt-1">
                                    {result.unenrolledCount} lead{result.unenrolledCount !== 1 ? 's' : ''} removed from email sequences
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* How it works */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">How it works:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Connects to your email inbox via IMAP</li>
                    <li>• Scans for unread replies from leads in CRM</li>
                    <li>• Updates lead status to "Replied"</li>
                    <li>• Removes lead from email sequences</li>
                    <li>• Marks email as read (processed)</li>
                </ul>
            </div>
        </div>
    );
}
