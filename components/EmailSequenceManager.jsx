'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Plus, Edit3, Trash2, Copy, Eye, Power, PowerOff,
    X, Save, AlertCircle, CheckCircle, Clock, Zap
} from 'lucide-react';
import { replaceMergeTags } from '../lib/email-sequences';

export default function EmailSequenceManager() {
    const [sequences, setSequences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSequence, setEditingSequence] = useState(null);
    const [previewLead, setPreviewLead] = useState({
        name: 'Sarah Chen',
        productCategory: 'Fashion',
        instagram: '@sarahsfashion',
        email: 'sarah@example.com',
        store_url: 'https://sarahsfashion.com'
    });
    const [showPreview, setShowPreview] = useState(false);
    const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);

    // Available merge tags
    const mergeTags = [
        { tag: '{{name}}', description: 'Lead name', example: 'Sarah Chen' },
        { tag: '{{business_category}}', description: 'Product category', example: 'Fashion' },
        { tag: '{{instagram}}', description: 'Instagram handle', example: '@sarahsfashion' },
        { tag: '{{email}}', description: 'Email address', example: 'sarah@example.com' },
        { tag: '{{store_url}}', description: 'Store URL', example: 'https://sarahsfashion.com' }
    ];

    useEffect(() => {
        fetchSequences();
    }, []);

    const fetchSequences = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/sequences');
            const data = await response.json();
            if (data.success) {
                setSequences(data.sequences);
            }
        } catch (error) {
            console.error('Error fetching sequences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (sequence) => {
        setEditingSequence({ ...sequence });
        setSelectedEmailIndex(0);
    };

    const handleSave = async () => {
        try {
            const response = await fetch('/api/sequences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingSequence)
            });

            const data = await response.json();
            if (data.success) {
                await fetchSequences();
                setEditingSequence(null);
                alert('Sequence updated successfully!');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error saving sequence:', error);
            alert('Failed to save sequence: ' + error.message);
        }
    };

    const handleToggleActive = async (sequence) => {
        try {
            const response = await fetch('/api/sequences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: sequence.id,
                    active: !sequence.active
                })
            });

            const data = await response.json();
            if (data.success) {
                await fetchSequences();
            }
        } catch (error) {
            console.error('Error toggling sequence:', error);
        }
    };

    const handleDuplicate = async (sequence) => {
        try {
            const response = await fetch('/api/sequences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${sequence.name} (Copy)`,
                    description: sequence.description,
                    sequence_type: sequence.sequence_type,
                    emails: sequence.emails
                })
            });

            const data = await response.json();
            if (data.success) {
                await fetchSequences();
                alert('Sequence duplicated successfully!');
            }
        } catch (error) {
            console.error('Error duplicating sequence:', error);
        }
    };

    const handleDelete = async (sequence) => {
        if (!confirm(`Are you sure you want to delete "${sequence.name}"?`)) return;

        try {
            const response = await fetch(`/api/sequences?id=${sequence.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                await fetchSequences();
                alert('Sequence deleted successfully!');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error deleting sequence:', error);
            alert('Failed to delete sequence: ' + error.message);
        }
    };

    const updateEmail = (index, field, value) => {
        const updatedEmails = [...editingSequence.emails];
        updatedEmails[index] = { ...updatedEmails[index], [field]: value };
        setEditingSequence({ ...editingSequence, emails: updatedEmails });
    };

    const addEmail = () => {
        const newEmail = {
            step: editingSequence.emails.length + 1,
            delay_days: 0,
            subject: '',
            body: ''
        };
        setEditingSequence({
            ...editingSequence,
            emails: [...editingSequence.emails, newEmail]
        });
    };

    const removeEmail = (index) => {
        if (editingSequence.emails.length <= 1) {
            alert('Sequence must have at least one email');
            return;
        }
        const updatedEmails = editingSequence.emails.filter((_, i) => i !== index);
        // Renumber steps
        updatedEmails.forEach((email, i) => email.step = i + 1);
        setEditingSequence({ ...editingSequence, emails: updatedEmails });
    };

    const insertMergeTag = (tag) => {
        // Insert tag at cursor position in body textarea
        const textarea = document.getElementById(`email-body-${selectedEmailIndex}`);
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentBody = editingSequence.emails[selectedEmailIndex].body;
            const newBody = currentBody.substring(0, start) + tag + currentBody.substring(end);
            updateEmail(selectedEmailIndex, 'body', newBody);

            // Restore cursor position
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + tag.length, start + tag.length);
            }, 0);
        }
    };

    const getPreviewEmail = (email) => {
        return {
            subject: replaceMergeTags(email.subject, previewLead),
            body: replaceMergeTags(email.body, previewLead)
        };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading sequences...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sequences</h2>
                <p className="text-gray-600">Manage automated email follow-up sequences</p>
            </div>

            {/* Sequences List */}
            <div className="grid gap-4">
                {sequences.map((sequence) => (
                    <div
                        key={sequence.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{sequence.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sequence.active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {sequence.active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                        {sequence.emails.length} emails
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{sequence.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {sequence.emails.map(e => e.delay_days).join(' → ')} days
                                    </span>
                                    <span>Type: {sequence.sequence_type}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(sequence)}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                    title={sequence.active ? 'Deactivate' : 'Activate'}
                                >
                                    {sequence.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleEdit(sequence)}
                                    className="p-2 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDuplicate(sequence)}
                                    className="p-2 text-gray-400 hover:text-green-600 rounded transition-colors"
                                    title="Duplicate"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(sequence)}
                                    className="p-2 text-gray-400 hover:text-red-600 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingSequence && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setEditingSequence(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">Edit Sequence</h3>
                                    <button
                                        onClick={() => setEditingSequence(null)}
                                        className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Sequence Info */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sequence Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingSequence.name}
                                        onChange={(e) => setEditingSequence({ ...editingSequence, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Email Steps */}
                                <div className="space-y-4">
                                    {editingSequence.emails.map((email, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-gray-900">
                                                    Email {index + 1}
                                                    {index > 0 && (
                                                        <span className="ml-2 text-sm text-gray-500">
                                                            (Sent {email.delay_days} days after Email {index})
                                                        </span>
                                                    )}
                                                </h4>
                                                {editingSequence.emails.length > 1 && (
                                                    <button
                                                        onClick={() => removeEmail(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {index > 0 && (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Delay (days after previous email)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={email.delay_days}
                                                        onChange={(e) => updateEmail(index, 'delay_days', parseInt(e.target.value))}
                                                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                            )}

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Subject
                                                </label>
                                                <input
                                                    type="text"
                                                    value={email.subject}
                                                    onChange={(e) => updateEmail(index, 'subject', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    placeholder="Email subject..."
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Body
                                                </label>
                                                <textarea
                                                    id={`email-body-${index}`}
                                                    value={email.body}
                                                    onChange={(e) => updateEmail(index, 'body', e.target.value)}
                                                    onFocus={() => setSelectedEmailIndex(index)}
                                                    rows={8}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                                    placeholder="Email body..."
                                                />
                                            </div>

                                            {/* Merge Tags Helper */}
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-700 mb-2">Available Merge Tags:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {mergeTags.map((mt) => (
                                                        <button
                                                            key={mt.tag}
                                                            onClick={() => {
                                                                setSelectedEmailIndex(index);
                                                                insertMergeTag(mt.tag);
                                                            }}
                                                            className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                            title={`${mt.description} (e.g., ${mt.example})`}
                                                        >
                                                            {mt.tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Email Button */}
                                <button
                                    onClick={addEmail}
                                    className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Another Email
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    {showPreview ? 'Hide' : 'Show'} Preview
                                </button>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditingSequence(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            {/* Preview Panel */}
                            {showPreview && (
                                <div className="border-t border-gray-200 bg-gray-50 p-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">Preview with Sample Data</h4>
                                    <div className="space-y-4">
                                        {editingSequence.emails.map((email, index) => {
                                            const preview = getPreviewEmail(email);
                                            return (
                                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <div className="text-xs text-gray-500 mb-2">Email {index + 1}</div>
                                                    <div className="font-semibold text-gray-900 mb-2">Subject: {preview.subject}</div>
                                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{preview.body}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
