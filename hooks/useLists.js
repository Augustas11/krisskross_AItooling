import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for managing contact lists
 * 
 * Usage:
 * const { lists, loading, createList, addLeadsToList, removeLeadsFromList } = useLists();
 */
export function useLists() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all lists
    const fetchLists = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/lists?include_contacts=true');
            const data = await response.json();

            if (data.success) {
                setLists(data.lists);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new list
    const createList = async ({ name, description, is_dynamic, filter_criteria }) => {
        try {
            const response = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, is_dynamic, filter_criteria })
            });
            const data = await response.json();

            if (data.success) {
                setLists(prev => [data.list, ...prev]);
                return { success: true, list: data.list };
            }
            return { success: false, error: data.error };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Delete a list
    const deleteList = async (listId) => {
        try {
            const response = await fetch(`/api/lists/${listId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                setLists(prev => prev.filter(l => l.id !== listId));
                return { success: true };
            }
            return { success: false, error: data.error };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Add leads to a list
    const addLeadsToList = async (listId, leadIds) => {
        try {
            const response = await fetch(`/api/lists/${listId}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead_ids: leadIds })
            });
            const data = await response.json();

            if (data.success) {
                // Update local list contact count
                setLists(prev => prev.map(l =>
                    l.id === listId ? { ...l, contact_count: data.total_contacts } : l
                ));
                return { success: true, added: data.added, total: data.total_contacts };
            }
            return { success: false, error: data.error };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Remove leads from a list
    const removeLeadsFromList = async (listId, leadIds) => {
        try {
            const response = await fetch(`/api/lists/${listId}/contacts`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead_ids: leadIds })
            });
            const data = await response.json();

            if (data.success) {
                setLists(prev => prev.map(l =>
                    l.id === listId ? { ...l, contact_count: data.total_contacts } : l
                ));
                return { success: true, removed: data.removed, total: data.total_contacts };
            }
            return { success: false, error: data.error };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Get list details with contacts
    const getListDetails = async (listId) => {
        try {
            const response = await fetch(`/api/lists/${listId}`);
            const data = await response.json();
            return data;
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    return {
        lists,
        loading,
        error,
        fetchLists,
        createList,
        deleteList,
        addLeadsToList,
        removeLeadsFromList,
        getListDetails
    };
}

export default useLists;
