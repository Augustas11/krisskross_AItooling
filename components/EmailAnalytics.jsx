'use client';

import { useState } from 'react';
import { useEmailAnalytics } from '@/hooks/useEmailAnalytics';

/**
 * EmailAnalytics Component
 * 
 * Displays email performance metrics, daily trends, and top engaged leads.
 * Can be integrated into the main CRM dashboard.
 */
export default function EmailAnalytics() {
    const { analytics, loading, error, period, changePeriod } = useEmailAnalytics('30d');
    const [selectedTab, setSelectedTab] = useState('overview');

    if (loading) {
        return (
            <div className="email-analytics loading">
                <div className="loading-spinner">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="email-analytics error">
                <p>⚠️ Failed to load analytics: {error}</p>
            </div>
        );
    }

    const summary = analytics?.summary || {};
    const dailyData = analytics?.daily_breakdown || [];
    const topLeads = analytics?.top_engaged_leads || [];
    const recentEvents = analytics?.recent_events || [];

    return (
        <div className="email-analytics">
            {/* Header */}
            <div className="analytics-header">
                <h2>📧 Email Analytics</h2>
                <div className="period-selector">
                    {['7d', '30d', '90d'].map(p => (
                        <button
                            key={p}
                            className={period === p ? 'active' : ''}
                            onClick={() => changePeriod(p)}
                        >
                            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="analytics-tabs">
                {['overview', 'engagement', 'activity'].map(tab => (
                    <button
                        key={tab}
                        className={selectedTab === tab ? 'active' : ''}
                        onClick={() => setSelectedTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {selectedTab === 'overview' && (
                <div className="analytics-overview">
                    <div className="metrics-grid">
                        <MetricCard
                            label="Emails Sent"
                            value={summary.total_sent || 0}
                            icon="📤"
                        />
                        <MetricCard
                            label="Delivered"
                            value={summary.delivered || 0}
                            rate={summary.delivery_rate}
                            icon="✅"
                            color="green"
                        />
                        <MetricCard
                            label="Opened"
                            value={summary.opened || 0}
                            rate={summary.open_rate}
                            icon="👁"
                            color="blue"
                        />
                        <MetricCard
                            label="Clicked"
                            value={summary.clicked || 0}
                            rate={summary.click_rate}
                            icon="🔗"
                            color="purple"
                        />
                        <MetricCard
                            label="Bounced"
                            value={summary.bounced || 0}
                            rate={summary.bounce_rate}
                            icon="⚠️"
                            color="orange"
                        />
                        <MetricCard
                            label="Unsubscribed"
                            value={summary.unsubscribed || 0}
                            icon="🚫"
                            color="red"
                        />
                    </div>

                    {/* Daily Trend */}
                    {dailyData.length > 0 && (
                        <div className="daily-trend">
                            <h3>Daily Trend</h3>
                            <div className="trend-chart">
                                {dailyData.slice(-14).map((day, i) => (
                                    <div key={day.date} className="trend-bar">
                                        <div className="bar-stack">
                                            <div
                                                className="bar sent"
                                                style={{ height: `${Math.min(day.sent * 10, 100)}px` }}
                                                title={`Sent: ${day.sent}`}
                                            />
                                            <div
                                                className="bar opened"
                                                style={{ height: `${Math.min(day.opened * 10, 100)}px` }}
                                                title={`Opened: ${day.opened}`}
                                            />
                                        </div>
                                        <span className="bar-label">{day.date.slice(-5)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Engagement Tab */}
            {selectedTab === 'engagement' && (
                <div className="analytics-engagement">
                    <h3>🏆 Top Engaged Leads</h3>
                    {topLeads.length === 0 ? (
                        <p className="empty-state">No engagement data yet. Send some emails!</p>
                    ) : (
                        <table className="engagement-table">
                            <thead>
                                <tr>
                                    <th>Lead</th>
                                    <th>Emails</th>
                                    <th>Opens</th>
                                    <th>Clicks</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topLeads.map((item, i) => (
                                    <tr key={item.lead?.id || i}>
                                        <td>
                                            <div className="lead-info">
                                                <span className="lead-name">{item.lead?.name || 'Unknown'}</span>
                                                <span className="lead-category">{item.lead?.business_category || ''}</span>
                                            </div>
                                        </td>
                                        <td>{item.emails}</td>
                                        <td className="metric-opens">{item.opens}</td>
                                        <td className="metric-clicks">{item.clicks}</td>
                                        <td>
                                            <span className="engagement-score">{item.engagement_score}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Activity Tab */}
            {selectedTab === 'activity' && (
                <div className="analytics-activity">
                    <h3>📋 Recent Activity</h3>
                    {recentEvents.length === 0 ? (
                        <p className="empty-state">No recent events. Webhooks may not be configured.</p>
                    ) : (
                        <div className="activity-list">
                            {recentEvents.map((event, i) => (
                                <div key={event.id || i} className={`activity-item ${event.event_type}`}>
                                    <span className="event-icon">{getEventIcon(event.event_type)}</span>
                                    <div className="event-details">
                                        <span className="event-type">{event.event_type}</span>
                                        <span className="event-email">
                                            {event.email_sends?.sent_to_email || 'Unknown'}
                                        </span>
                                        <span className="event-subject">
                                            {event.email_sends?.subject_line || ''}
                                        </span>
                                    </div>
                                    <span className="event-time">
                                        {formatTimeAgo(event.created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .email-analytics {
                    padding: 20px;
                    background: #1a1a2e;
                    border-radius: 12px;
                    color: #fff;
                }
                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .analytics-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                .period-selector button, .analytics-tabs button {
                    background: #2a2a4e;
                    border: none;
                    padding: 8px 16px;
                    color: #aaa;
                    cursor: pointer;
                    border-radius: 6px;
                    margin-left: 8px;
                    transition: all 0.2s;
                }
                .period-selector button.active, .analytics-tabs button.active {
                    background: #4f46e5;
                    color: #fff;
                }
                .analytics-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 12px;
                }
                .analytics-tabs button {
                    margin-left: 0;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .metric-card {
                    background: #2a2a4e;
                    padding: 16px;
                    border-radius: 10px;
                    text-align: center;
                }
                .metric-card .icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                }
                .metric-card .value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #fff;
                }
                .metric-card .rate {
                    font-size: 14px;
                    color: #666;
                    margin-top: 4px;
                }
                .metric-card .label {
                    font-size: 12px;
                    color: #888;
                    margin-top: 4px;
                }
                .daily-trend h3 {
                    margin-bottom: 16px;
                }
                .trend-chart {
                    display: flex;
                    gap: 8px;
                    align-items: flex-end;
                    height: 150px;
                    overflow-x: auto;
                }
                .trend-bar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 40px;
                }
                .bar-stack {
                    display: flex;
                    flex-direction: column-reverse;
                }
                .bar {
                    width: 20px;
                    border-radius: 3px;
                    min-height: 2px;
                }
                .bar.sent { background: #4f46e5; }
                .bar.opened { background: #10b981; }
                .bar-label {
                    font-size: 10px;
                    color: #666;
                    margin-top: 4px;
                }
                .engagement-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .engagement-table th, .engagement-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #333;
                }
                .engagement-table th {
                    color: #888;
                    font-weight: 500;
                }
                .lead-info {
                    display: flex;
                    flex-direction: column;
                }
                .lead-name {
                    font-weight: 500;
                }
                .lead-category {
                    font-size: 12px;
                    color: #666;
                }
                .metric-opens { color: #3b82f6; }
                .metric-clicks { color: #8b5cf6; }
                .engagement-score {
                    background: #4f46e5;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }
                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #2a2a4e;
                    border-radius: 8px;
                }
                .event-icon {
                    font-size: 20px;
                }
                .event-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .event-type {
                    font-weight: 500;
                    text-transform: capitalize;
                }
                .event-email {
                    font-size: 12px;
                    color: #888;
                }
                .event-subject {
                    font-size: 11px;
                    color: #666;
                }
                .event-time {
                    font-size: 12px;
                    color: #666;
                }
                .empty-state {
                    color: #666;
                    text-align: center;
                    padding: 40px;
                }
                .loading, .error {
                    padding: 40px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}

function MetricCard({ label, value, rate, icon, color }) {
    return (
        <div className="metric-card">
            <div className="icon">{icon}</div>
            <div className="value" style={{ color: color ? `var(--${color})` : '#fff' }}>
                {value}
            </div>
            {rate !== undefined && (
                <div className="rate">{rate}%</div>
            )}
            <div className="label">{label}</div>
        </div>
    );
}

function getEventIcon(type) {
    const icons = {
        delivered: '✅',
        open: '👁',
        click: '🔗',
        bounce: '⚠️',
        spamreport: '🚩',
        unsubscribe: '🚫',
        processed: '📤',
        dropped: '❌',
        deferred: '⏳'
    };
    return icons[type] || '📧';
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
