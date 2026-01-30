import { User, Briefcase, Building2, Calendar } from 'lucide-react';
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
            min_start_date: number; // For sorting
        }>();

        ministers.forEach(m => {
            if (!groups.has(m.full_name)) {
                groups.set(m.full_name, {
                    full_name: m.full_name,
                    roles: [],
                    min_start_date: new Date(m.start_date || '9999-99-99').getTime()
                });
            }
            const group = groups.get(m.full_name)!;
            group.roles.push(m);
            // Update min start date if earlier
            const time = new Date(m.start_date || '9999-99-99').getTime();
            if (time < group.min_start_date) {
                group.min_start_date = time;
            }
        });

        // Convert to array
        return Array.from(groups.values()).sort((a, b) => {
            // Sort logic matching parent if possible, but parent sorts raw list.
            // Here we can sort by most recent role or total duration logic if we had it.
            // For now, let's respect the order they appeared (which was sorted by parent)
            // or just use name/start date.
            // Actually, `ministers` passed in is already sorted! 
            // So we can just rely on the order of `ministers` to dictate order here.
            // But Map iteration order is insertion order in JS.
            return 0;
        });
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
                <div className="min-w-[800px] p-6">
                    {/* Header */}
                    <div className="flex mb-2 border-b border-slate-100 pb-2">
                        <div className="w-96 flex-shrink-0 font-semibold text-slate-600 text-sm">รายชื่อรัฐมนตรี</div>
                        <div className="flex-1 flex gap-1">
                            {timelineCabinets.map(cabinet => (
                                <div key={cabinet} className="flex-1 min-w-[30px] text-center text-xs text-slate-500 font-medium">
                                    {cabinet}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                        {groupedMinisters.map((person, idx) => {
                            const history = ministerHistory[person.full_name] || [];

                            return (
                                <div key={person.full_name} className="flex items-start hover:bg-slate-50 transition-colors py-4 border-b border-slate-50 last:border-0 group">

                                    {/* Info Column */}
                                    <div className="w-96 flex-shrink-0 pr-4 flex gap-3">
                                        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 mt-1">
                                            <User size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-base font-medium text-slate-700 truncate mb-1">{person.full_name}</div>
                                            <div className="space-y-1">
                                                {person.roles.map((role, rIdx) => (
                                                    <div key={rIdx} className="text-xs text-slate-500 flex items-start gap-1">
                                                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 min-w-[24px] text-center mt-0.5">
                                                            {role.cabinet}
                                                        </span>
                                                        <span className="flex-1 leading-tight">
                                                            {role.position === 'นายกรัฐมนตรี' ? <span className="text-blue-600 font-medium">นายกรัฐมนตรี</span> : role.position}
                                                            <span className="text-slate-400 mx-1">|</span>
                                                            {role.ministry}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Grid */}
                                    <div className="flex-1 flex gap-1 h-full pt-2">
                                        {timelineCabinets.map(cabinet => {
                                            const isActive = history.includes(cabinet);

                                            return (
                                                <div key={cabinet} className={`flex-1 min-w-[30px] flex justify-center relative group/cell ${isActive ? 'cursor-default' : ''}`}>
                                                    {isActive ? (
                                                        <>
                                                            <span className="text-lg leading-none select-none filter transition-all hover:scale-125">
                                                                🪑
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <div className="w-1 h-1 bg-slate-100 rounded-full mt-2"></div>
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
                                <div className="text-xs text-slate-400">พบ {person.roles.length} ตำแหน่ง</div>
                            </div>
                        </div>

                        <div className="space-y-2 pl-2 border-l-2 border-slate-100 ml-4">
                            {person.roles.map((role, rIdx) => (
                                <div key={rIdx} className="relative pl-4">
                                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-slate-200 rounded-full border-2 border-white"></div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-md">
                                            ชุด {role.cabinet}
                                        </span>
                                        <span className={`text-sm font-medium ${role.position.includes('นายก') ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {role.position}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                        <Building2 size={12} /> {role.ministry}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 ml-0.5">
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
