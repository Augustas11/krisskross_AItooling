'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
    Mail, Phone, Calendar, Flag
} from 'lucide-react';

export default function TasksDueToday({ onLeadClick }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch('/api/tasks?status=pending&dueToday=true');
            const data = await response.json();
            if (data.success) {
                setTasks(data.tasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const completeTask = async (taskId) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status: 'completed' })
            });

            if (response.ok) {
                setTasks(tasks.filter(t => t.id !== taskId));
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-blue-600 bg-blue-50';
            case 'low': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'call': return <Phone className="w-4 h-4" />;
            case 'meeting': return <Calendar className="w-4 h-4" />;
            default: return <Flag className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Tasks Due Today</h3>
                </div>
                <div className="text-center text-gray-500 py-4">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Tasks Due Today</h3>
                    {tasks.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {tasks.length}
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 space-y-3">
                            {tasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                    <p className="font-medium">All caught up!</p>
                                    <p className="text-sm">No tasks due today</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                {/* Task Header */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`p-1 rounded ${getPriorityColor(task.priority)}`}>
                                                        {getTypeIcon(task.type)}
                                                    </span>
                                                    <h4 className="font-medium text-gray-900 text-sm truncate">
                                                        {task.title}
                                                    </h4>
                                                </div>

                                                {/* Lead Info */}
                                                {task.leads && (
                                                    <button
                                                        onClick={() => onLeadClick && onLeadClick(task.leads)}
                                                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline mb-1"
                                                    >
                                                        {task.leads.name} • {task.leads.product_category}
                                                    </button>
                                                )}

                                                {/* Description */}
                                                {task.description && (
                                                    <p className="text-xs text-gray-600 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                {/* Priority Badge */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {task.type}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Complete Button */}
                                            <button
                                                onClick={() => completeTask(task.id)}
                                                className="flex-shrink-0 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Mark as complete"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
