/**
 * Instagram Admin Connection Component
 * Displays Instagram Business API connection status and management controls
 */

import React, { useState, useEffect } from 'react';
import { Instagram, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Calendar, Shield } from 'lucide-react';

export function InstagramAdminConnection() {
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [message, setMessage] = useState(null);

    // Fetch connection status on mount
    useEffect(() => {
        fetchConnectionStatus();
    }, []);

    const fetchConnectionStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/instagram/connection-status');
            const data = await response.json();
            setConnectionStatus(data);
        } catch (error) {
            console.error('Failed to fetch connection status:', error);
            setMessage({ type: 'error', text: 'Failed to load connection status' });
        } finally {
            setLoading(false);
        }
    };

    const initializeConnection = async () => {
        try {
            setIsInitializing(true);
            setMessage(null);

            const response = await fetch('/api/instagram/verify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                setMessage({
                    type: 'success',
                    text: `✓ Connected to Instagram account: @${data.account.username}`
                });
                // Refresh status
                await fetchConnectionStatus();
            } else {
                setMessage({
                    type: 'error',
                    text: data.error || 'Failed to initialize connection'
                });
            }
        } catch (error) {
            console.error('Connection initialization error:', error);
            setMessage({ type: 'error', text: 'Connection failed. Check server logs.' });
        } finally {
            setIsInitializing(false);
        }
    };

    const testConnection = async () => {
        try {
            setIsTesting(true);
            setMessage(null);

            const response = await fetch('/api/instagram/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.healthy) {
                setMessage({
                    type: 'success',
                    text: '✓ Connection healthy! Instagram API is responding.'
                });

                if (data.warnings && data.warnings.length > 0) {
                    setTimeout(() => {
                        setMessage({
                            type: 'warning',
                            text: data.warnings[0]
                        });
                    }, 2000);
                }
            } else {
                setMessage({
                    type: 'error',
                    text: data.error || 'Connection test failed'
                });
            }
        } catch (error) {
            console.error('Connection test error:', error);
            setMessage({ type: 'error', text: 'Test failed. Check server logs.' });
        } finally {
            setIsTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading connection status...</p>
                </div>
            </div>
        );
    }

    const isConnected = connectionStatus?.connected;
    const isExpired = connectionStatus?.token_expired;
    const daysUntilExpiry = connectionStatus?.days_until_expiry;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Instagram className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Instagram Business API</h1>
                                <p className="text-sm text-gray-500 mt-1">Manage Instagram DM and comment tracking integration</p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Connected
                                </span>
                            ) : isExpired ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Token Expired
                                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Not Connected
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Message Alerts */}
                {message && (
                    <div className={`rounded-lg border p-4 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                            message.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Connection Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Account Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            Instagram Account
                        </h2>

                        <div className="space-y-3">
                            <InfoRow
                                label="Username"
                                value={connectionStatus?.instagram_username || 'Not configured'}
                            />
                            <InfoRow
                                label="Account ID"
                                value={connectionStatus?.instagram_account_id ?
                                    `${connectionStatus.instagram_account_id.substring(0, 15)}...` :
                                    'Not configured'
                                }
                            />
                            <InfoRow
                                label="Status"
                                value={connectionStatus?.connection_status || 'Unknown'}
                                valueColor={isConnected ? 'text-green-600' : 'text-gray-500'}
                            />
                        </div>
                    </div>

                    {/* Token Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Access Token
                        </h2>

                        <div className="space-y-3">
                            <InfoRow
                                label="Expires At"
                                value={connectionStatus?.token_expires_at ?
                                    new Date(connectionStatus.token_expires_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) :
                                    'Not configured'
                                }
                            />
                            <InfoRow
                                label="Days Remaining"
                                value={daysUntilExpiry !== undefined ?
                                    `${daysUntilExpiry} days` :
                                    'Unknown'
                                }
                                valueColor={
                                    daysUntilExpiry > 14 ? 'text-green-600' :
                                        daysUntilExpiry > 7 ? 'text-yellow-600' :
                                            'text-red-600'
                                }
                            />
                            {daysUntilExpiry !== undefined && daysUntilExpiry < 14 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-800">
                                        ⚠️ Token expiring soon! Plan to refresh before {new Date(connectionStatus.token_expires_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sync Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Synchronization
                        </h2>

                        <div className="space-y-3">
                            <InfoRow
                                label="Last Sync"
                                value={connectionStatus?.last_sync_at ?
                                    new Date(connectionStatus.last_sync_at).toLocaleString() :
                                    'Never'
                                }
                            />
                            <InfoRow
                                label="Connection Created"
                                value={connectionStatus?.created_at ?
                                    new Date(connectionStatus.created_at).toLocaleDateString() :
                                    'N/A'
                                }
                            />
                        </div>
                    </div>

                    {/* Health Status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Integration Status
                        </h2>

                        <div className="space-y-2">
                            <HealthIndicator label="API Connection" status={isConnected} />
                            <HealthIndicator label="Token Valid" status={!isExpired && isConnected} />
                            <HealthIndicator label="Webhook Configured" status={false} note="Phase 2" />
                            <HealthIndicator label="Sync Job Active" status={false} note="Phase 2" />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-800 mb-4">Actions</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {!isConnected ? (
                            <button
                                onClick={initializeConnection}
                                disabled={isInitializing}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isInitializing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Initializing...
                                    </>
                                ) : (
                                    <>
                                        <Instagram className="w-4 h-4" />
                                        Initialize Connection
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={testConnection}
                                disabled={isTesting}
                                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isTesting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Test Connection
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={fetchConnectionStatus}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Status
                        </button>

                        <button
                            disabled
                            className="px-4 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                            title="Token refresh will be implemented in Phase 6"
                        >
                            <Shield className="w-4 h-4" />
                            Refresh Token (Coming Soon)
                        </button>
                    </div>
                </div>

                {/* Setup Instructions */}
                {!isConnected && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Setup Instructions
                        </h3>
                        <div className="text-sm text-blue-800 space-y-2">
                            <p>1. Ensure environment variables are configured:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1 font-mono text-xs">
                                <li>INSTAGRAM_APP_ID</li>
                                <li>INSTAGRAM_APP_SECRET</li>
                                <li>INSTAGRAM_ACCESS_TOKEN</li>
                            </ul>
                            <p className="mt-3">2. Click "Initialize Connection" to verify credentials and connect your Instagram Business account.</p>
                            <p>3. Once connected, you'll be able to track DMs and comments from leads.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper components
function InfoRow({ label, value, valueColor = 'text-gray-900' }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-sm font-medium ${valueColor} text-right max-w-[200px] truncate`}>
                {value}
            </span>
        </div>
    );
}

function HealthIndicator({ label, status, note }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-600">{label}</span>
            <div className="flex items-center gap-2">
                {note && <span className="text-xs text-gray-400 italic">{note}</span>}
                {status ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                    <XCircle className="w-4 h-4 text-gray-300" />
                )}
            </div>
        </div>
    );
}

export default InstagramAdminConnection;
