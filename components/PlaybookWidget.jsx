import React from 'react';
import { CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { PLAYBOOKS } from '../lib/playbooks';

export function PlaybookWidget({ lead, onUpdate }) {
    if (!lead || !lead.status) return null;

    // Determine active playbook based on status
    // Fallback: Use 'New' if status not found, or maybe just null?
    // Let's default to 'New' if status is unknown, or handle specific known statuses.
    const activePlaybook = PLAYBOOKS[lead.status] || PLAYBOOKS['New'];

    // Safety check for playbook definition
    if (!activePlaybook || !activePlaybook.title) return null;

    // Get current progress from lead data
    // Data structure: { playbookId: { stepId: { completed: true, at: timestamp } } }
    // Or simplified: playbook_data: { step_id: true } (if steps are unique across playbooks)
    // Let's use simple flat map for now within the lead's JSONB: { "verify_icp": true, ... }
    const progress = lead.playbook_data || {};

    const toggleStep = (stepId) => {
        const isCompleted = !!progress[stepId];
        const newProgress = {
            ...progress,
            [stepId]: !isCompleted
            // We could store timestamp: isCompleted ? null : new Date().toISOString()
        };

        // Persist
        onUpdate(lead.id, { playbook_data: newProgress });
    };

    const completedCount = activePlaybook.steps.filter(s => progress[s.id]).length;
    const totalCount = activePlaybook.steps.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Sales Playbook</h3>
                        <p className="text-xs text-indigo-600 font-medium">{activePlaybook.title}</p>
                    </div>
                </div>
                {/* Progress Bar/Badge */}
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-500">{progressPercent}% Done</span>
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50">
                {activePlaybook.steps.map((step) => {
                    const isDone = !!progress[step.id];
                    const StepIcon = step.icon;

                    return (
                        <button
                            key={step.id}
                            onClick={() => toggleStep(step.id)}
                            className={`w-full text-left p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors group ${isDone ? 'bg-gray-50/50' : ''}`}
                        >
                            <div className={`mt-0.5 flex-shrink-0 transition-colors ${isDone ? 'text-green-500' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </div>

                            <div className="flex-1">
                                <p className={`text-sm font-medium transition-all ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                    {step.label}
                                </p>
                            </div>

                            {StepIcon && (
                                <StepIcon className={`w-4 h-4 ${isDone ? 'text-gray-300' : 'text-gray-400'}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
