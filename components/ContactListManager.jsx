'use client';

import { useState } from 'react';
import { useLists } from '@/hooks/useLists';

/**
 * ContactListManager Component
 * 
 * Manages contact lists - create, view, add/remove leads.
 * Can be integrated into the CRM leads view.
 */
export default function ContactListManager({ selectedLeadIds = [], onClose }) {
    const { lists, loading, createList, addLeadsToList, deleteList } = useLists();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [actionStatus, setActionStatus] = useState(null);

    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        const result = await createList({
            name: newListName,
            description: newListDescription
        });

        if (result.success) {
            setNewListName('');
            setNewListDescription('');
            setShowCreateForm(false);
            setActionStatus({ type: 'success', message: `Created list: ${newListName}` });
        } else {
            setActionStatus({ type: 'error', message: result.error });
        }

        setTimeout(() => setActionStatus(null), 3000);
    };

    const handleAddToList = async (listId, listName) => {
        if (selectedLeadIds.length === 0) {
            setActionStatus({ type: 'error', message: 'No leads selected' });
            return;
        }

        const result = await addLeadsToList(listId, selectedLeadIds);

        if (result.success) {
            setActionStatus({
                type: 'success',
                message: `Added ${result.added} lead(s) to "${listName}"`
            });
        } else {
            setActionStatus({ type: 'error', message: result.error });
        }

        setTimeout(() => setActionStatus(null), 3000);
    };

    const handleDeleteList = async (listId, listName) => {
        if (!confirm(`Delete list "${listName}"? This cannot be undone.`)) return;

        const result = await deleteList(listId);

        if (result.success) {
            setActionStatus({ type: 'success', message: `Deleted list: ${listName}` });
        } else {
            setActionStatus({ type: 'error', message: result.error });
        }

        setTimeout(() => setActionStatus(null), 3000);
    };

    return (
        <div className="contact-list-manager">
            <div className="manager-header">
                <h3>📋 Contact Lists</h3>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>✕</button>
                )}
            </div>

            {/* Status Message */}
            {actionStatus && (
                <div className={`status-message ${actionStatus.type}`}>
                    {actionStatus.message}
                </div>
            )}

            {/* Selected leads indicator */}
            {selectedLeadIds.length > 0 && (
                <div className="selected-indicator">
                    {selectedLeadIds.length} lead(s) selected
                </div>
            )}

            {/* Create New List */}
            {!showCreateForm ? (
                <button
                    className="create-list-btn"
                    onClick={() => setShowCreateForm(true)}
                >
                    + Create New List
                </button>
            ) : (
                <form className="create-list-form" onSubmit={handleCreateList}>
                    <input
                        type="text"
                        placeholder="List name..."
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        autoFocus
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                    />
                    <div className="form-actions">
                        <button type="submit" className="save-btn">Create</button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => setShowCreateForm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Lists */}
            {loading ? (
                <div className="loading">Loading lists...</div>
            ) : lists.length === 0 ? (
                <div className="empty-state">
                    No lists yet. Create one to organize your leads!
                </div>
            ) : (
                <div className="lists-container">
                    {lists.map(list => (
                        <div key={list.id} className="list-item">
                            <div className="list-info">
                                <span className="list-name">{list.name}</span>
                                <span className="list-count">
                                    {list.contact_count || 0} contacts
                                </span>
                                {list.description && (
                                    <span className="list-description">{list.description}</span>
                                )}
                            </div>
                            <div className="list-actions">
                                {selectedLeadIds.length > 0 && (
                                    <button
                                        className="add-to-btn"
                                        onClick={() => handleAddToList(list.id, list.name)}
                                        title="Add selected leads to this list"
                                    >
                                        + Add
                                    </button>
                                )}
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteList(list.id, list.name)}
                                    title="Delete list"
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .contact-list-manager {
                    background: #1a1a2e;
                    border-radius: 12px;
                    padding: 16px;
                    color: #fff;
                    min-width: 300px;
                }
                .manager-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .manager-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    font-size: 18px;
                }
                .status-message {
                    padding: 8px 12px;
                    border-radius: 6px;
                    margin-bottom: 12px;
                    font-size: 13px;
                }
                .status-message.success {
                    background: #10b981;
                    color: #fff;
                }
                .status-message.error {
                    background: #ef4444;
                    color: #fff;
                }
                .selected-indicator {
                    background: #4f46e5;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    margin-bottom: 12px;
                    text-align: center;
                }
                .create-list-btn {
                    width: 100%;
                    background: #2a2a4e;
                    border: 1px dashed #444;
                    color: #888;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-bottom: 16px;
                    transition: all 0.2s;
                }
                .create-list-btn:hover {
                    background: #3a3a5e;
                    color: #fff;
                }
                .create-list-form {
                    background: #2a2a4e;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                .create-list-form input {
                    width: 100%;
                    background: #1a1a2e;
                    border: 1px solid #444;
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                .create-list-form input:focus {
                    outline: none;
                    border-color: #4f46e5;
                }
                .form-actions {
                    display: flex;
                    gap: 8px;
                }
                .save-btn {
                    flex: 1;
                    background: #4f46e5;
                    border: none;
                    color: #fff;
                    padding: 8px;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .cancel-btn {
                    background: #444;
                    border: none;
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .lists-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #2a2a4e;
                    padding: 12px;
                    border-radius: 8px;
                }
                .list-info {
                    display: flex;
                    flex-direction: column;
                }
                .list-name {
                    font-weight: 500;
                }
                .list-count {
                    font-size: 12px;
                    color: #888;
                }
                .list-description {
                    font-size: 11px;
                    color: #666;
                    margin-top: 2px;
                }
                .list-actions {
                    display: flex;
                    gap: 8px;
                }
                .add-to-btn {
                    background: #10b981;
                    border: none;
                    color: #fff;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .delete-btn {
                    background: none;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    padding: 6px;
                }
                .delete-btn:hover {
                    color: #ef4444;
                }
                .loading, .empty-state {
                    text-align: center;
                    color: #666;
                    padding: 24px;
                }
            `}</style>
        </div>
    );
}
