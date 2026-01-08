import React from 'react';
import { X, Mail, User, Calendar } from 'lucide-react';

export function EmailContentModal({ isOpen, onClose, email }) {
    if (!isOpen || !email) return null;

    const { subject, to, body, status } = email;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-gray-100 p-4 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Email Details</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Sent to {to}</span>
                                {status && (
                                    <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                            <div className="text-gray-900 font-medium text-lg mt-1">{subject || '(No Subject)'}</div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message Body</label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                {body || <span className="text-gray-400 italic">No content available.</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
