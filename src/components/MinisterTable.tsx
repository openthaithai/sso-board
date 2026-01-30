import { User, Building2 } from 'lucide-react';
import { useMemo } from 'react';

export interface MinisterRecord {
    cabinet: string;
    full_name: string;
    position: string;
    ministry: string;
    start_date: string;
    end_date: string | null;
}

interface MinisterTableProps {
    ministers: MinisterRecord[];
    isLoading: boolean;
    timelineCabinets: string[];
    ministerHistory: Record<string, string[]>;
}

const MinisterTable = ({ ministers, isLoading, timelineCabinets, ministerHistory }: MinisterTableProps) => {

    const groupedMinisters = useMemo(() => {
        const groups = new Map<string, {
            full_name: string;
            roles: MinisterRecord[];
            uniqueCabinets: Set<string>;
            min_start_date: number; // For sorting
        }>();

        ministers.forEach(m => {
            if (!groups.has(m.full_name)) {
                groups.set(m.full_name, {
                    full_name: m.full_name,
                    roles: [],
                    uniqueCabinets: new Set(),
                    min_start_date: new Date(m.start_date || '9999-99-99').getTime()
                });
            }
            const group = groups.get(m.full_name)!;
            group.roles.push(m);
            group.uniqueCabinets.add(m.cabinet);
            // Update min start date if earlier
            const time = new Date(m.start_date || '9999-99-99').getTime();
            if (time < group.min_start_date) {
                group.min_start_date = time;
            }
        });

        // Convert to array and sort to keep some consistency
        return Array.from(groups.values());
    }, [ministers]);

    // Re-sorting roles inside each person to be newest (Cabinet number descending)
    groupedMinisters.forEach(person => {
        person.roles.sort((a, b) => Number(b.cabinet) - Number(a.cabinet));
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-slate-500 font-prompt">กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    if (ministers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="text-4xl mb-4">📝</div>
                <div className="text-slate-500 font-prompt text-lg">ไม่พบข้อมูลรัฐมนตรีที่ค้นหา</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-prompt">
            {/* Desktop Timeline View */}
            <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[1000px] p-6">
                    {/* Header */}
                    <div className="flex mb-4 border-b border-slate-100 pb-4">
                        <div className="w-[450px] flex-shrink-0 font-semibold text-slate-600 text-sm">รายชื่อรัฐมนตรี</div>
                        <div className="flex-1 flex gap-1">
                            {timelineCabinets.map(cabinet => (
                                <div key={cabinet} className="flex-1 min-w-[30px] text-center text-xs text-slate-500 font-medium">
                                    {cabinet}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-4">
                        {groupedMinisters.map((person, idx) => {
                            const history = ministerHistory[person.full_name] || [];

                            return (
                                <div key={person.full_name} className="flex items-start hover:bg-slate-50/50 transition-colors py-6 border-b border-slate-50 last:border-0 group rounded-lg">

                                    {/* Info Column - Enhanced with Rich Details */}
                                    <div className="w-[450px] flex-shrink-0 pr-8 flex gap-4">
                                        <div className="w-16 h-16 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 mt-1">
                                            <User size={32} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xl font-bold text-slate-800 mb-1">{person.full_name}</div>
                                            <div className="text-sm text-slate-400 mb-4 font-normal">
                                                พบ {person.roles.length} ตำแหน่ง อยู่ใน {person.uniqueCabinets.size} ชุดคณะรัฐมนตรี
                                            </div>

                                            <div className="space-y-4 pl-3 border-l-2 border-slate-100 ml-1">
                                                {person.roles.map((role, rIdx) => (
                                                    <div key={rIdx} className="relative pl-6">
                                                        <div className="absolute -left-[11px] top-1.5 w-4 h-4 bg-slate-200 rounded-full border-4 border-white"></div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                                                                ชุด {role.cabinet}
                                                            </span>
                                                            <span className={`text-base font-bold ${role.position.includes('นายก') ? 'text-blue-700' : 'text-slate-700'}`}>
                                                                {role.position}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 mb-1">
                                                            <Building2 size={14} className="text-slate-400" />
                                                            {role.ministry}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-normal">
                                                            {new Date(role.start_date).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })}
                                                            {' - '}
                                                            {role.end_date ? new Date(role.end_date).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' }) : 'ปัจจุบัน'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Grid */}
                                    <div className="flex-1 flex gap-1 h-full pt-4">
                                        {timelineCabinets.map(cabinet => {
                                            const isActive = history.includes(cabinet);

                                            return (
                                                <div key={cabinet} className={`flex-1 min-w-[30px] flex justify-center relative group/cell ${isActive ? 'cursor-default' : ''}`}>
                                                    {isActive ? (
                                                        <>
                                                            <span className="text-2xl leading-none select-none filter transition-all hover:scale-125">
                                                                🪑
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 bg-slate-100 rounded-full mt-3"></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
                {groupedMinisters.map((person, idx) => (
                    <div key={`m-${idx}`} className="p-4 space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-700">{person.full_name}</div>
                                <div className="text-xs text-slate-400">พบ {person.roles.length} ตำแหน่ง อยู่ใน {person.uniqueCabinets.size} ชุดคณะรัฐมนตรี</div>
                            </div>
                        </div>

                        <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-4">
                            {person.roles.map((role, rIdx) => (
                                <div key={rIdx} className="relative pl-5">
                                    <div className="absolute -left-[23px] top-1.5 w-4 h-4 bg-slate-200 rounded-full border-4 border-white"></div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-md">
                                            ชุด {role.cabinet}
                                        </span>
                                        <span className={`text-sm font-bold ${role.position.includes('นายก') ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {role.position}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                                        <Building2 size={12} className="text-slate-400" /> {role.ministry}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-normal">
                                        {new Date(role.start_date).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })}
                                        {' - '}
                                        {role.end_date ? new Date(role.end_date).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' }) : 'ปัจจุบัน'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MinisterTable;
