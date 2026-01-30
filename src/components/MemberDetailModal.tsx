import React from 'react';
import { X } from 'lucide-react';
import type { MemberStats } from '../lib/hooks/useSSOData';

interface MemberDetailModalProps {
    selectedMember: MemberStats | null;
    setSelectedMember: (member: MemberStats | null) => void;
    baseUrl: string;
    mode?: 'sso' | 'minister';
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ selectedMember, setSelectedMember, baseUrl, mode = 'sso' }) => {
    if (!selectedMember) return null;

    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header / Image */}
                <div className="p-6 pb-0 flex flex-col items-center text-center relative">
                    <button
                        onClick={() => setSelectedMember(null)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-32 h-32 rounded-full p-1 bg-white shadow-lg -mb-4 z-10 relative">
                        <img
                            src={mode === 'minister' ? `${cleanBaseUrl}/images/ministers/${selectedMember.name}.jpg` : `${cleanBaseUrl}/images/${selectedMember.name}.jpg`}
                            alt={selectedMember.name}
                            className="w-full h-full object-cover rounded-full border border-slate-100"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `${cleanBaseUrl}/images/placeholder.jpg`;
                            }}
                        />
                    </div>
                </div>

                {/* Modal Content */}
                <div className="bg-slate-50 pt-16 pb-8 px-8 flex flex-col items-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-1 font-prompt">{selectedMember.name}</h2>
                    <div className="text-sm font-semibold text-blue-600 mb-6 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {mode === 'minister' ? `รวม ${selectedMember.totalYears} สมัย` : `ครองตำแหน่งรวม: ${selectedMember.totalYears} ปี`}
                    </div>

                    <div className="w-full space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Iterate history in reverse chronological order */}
                        {selectedMember.years.slice().sort((a, b) => b - a).map(year => (
                            <div key={year} className="flex gap-3 text-sm border-b border-slate-200 last:border-0 pb-3 last:pb-0">
                                <div className="font-bold text-slate-500 w-16 flex-shrink-0">
                                    {mode === 'minister' ? `ชุดที่ ${year}` : year}
                                </div>
                                <div className="text-left text-slate-700">
                                    <div className="font-medium">{selectedMember.history[year]}</div>
                                    {/* For SSO, show committees. For Minister, show Ministry/Party if avail in history? 
                                        Currently MinisterStats doesn't populate committeeHistory. 
                                        But we could fetch ministry info if needed. 
                                        For now, hide committee loop if empty.
                                     */}
                                    {selectedMember.committeeHistory && selectedMember.committeeHistory[year]?.map((comm, i) => (
                                        <div key={i} className="text-xs text-slate-500 mt-0.5">
                                            ({comm})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                        onClick={() => setSelectedMember(null)}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailModal;
