import { User, Briefcase, Building2, Calendar } from 'lucide-react';

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
    minYear: number;
    maxYear: number;
}

const MinisterTable = ({ ministers, isLoading, minYear, maxYear }: MinisterTableProps) => {

    const years = [];
    for (let y = minYear; y <= maxYear; y++) {
        years.push(y);
    }

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
                        <div className="w-80 flex-shrink-0 font-semibold text-slate-600 text-sm">รายชื่อรัฐมนตรี</div>
                        <div className="w-32 flex-shrink-0 text-center text-xs font-semibold text-slate-500">สังกัด</div>
                        <div className="flex-1 flex gap-1">
                            {years.map(year => (
                                <div key={year} className="flex-1 min-w-[30px] text-center text-xs text-slate-500 font-medium">
                                    {year}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                        {ministers.map((minister, idx) => {
                            const startYear = new Date(minister.start_date).getFullYear() + 543;
                            const endYear = minister.end_date ? new Date(minister.end_date).getFullYear() + 543 : new Date().getFullYear() + 543;

                            return (
                                <div key={`${minister.cabinet}-${minister.full_name}-${idx}`} className="flex items-center hover:bg-slate-50 transition-colors py-3 border-b border-slate-50 last:border-0 group">

                                    {/* Info Column */}
                                    <div className="w-80 flex-shrink-0 pr-4 flex items-center gap-3">
                                        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                                            <User size={20} />
                                            {/* Logic to load image if available can be added here similar to SSO */}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-slate-700 truncate">{minister.full_name}</div>
                                            <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                <Briefcase size={10} /> {minister.position}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate mt-0.5">
                                                ครม. ชุดที่ {minister.cabinet}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ministry Column */}
                                    <div className="w-32 flex-shrink-0 text-center px-2">
                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-full" title={minister.ministry}>
                                            {minister.ministry}
                                        </span>
                                    </div>

                                    {/* Timeline Grid */}
                                    <div className="flex-1 flex gap-1 h-8">
                                        {years.map(year => {
                                            const isActive = year >= startYear && year <= endYear;

                                            return (
                                                <div key={year} className={`flex-1 min-w-[30px] flex items-center justify-center relative group/cell ${isActive ? 'cursor-default' : ''}`}>
                                                    {isActive ? (
                                                        <>
                                                            <span className="text-lg leading-none select-none filter transition-all hover:scale-125">
                                                                🪑
                                                            </span>

                                                            {/* Tooltip */}
                                                            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/cell:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg pointer-events-none font-sans z-50">
                                                                <div className="font-bold text-blue-200">ปี {year}</div>
                                                                <div className="mb-1 text-white">{minister.position}</div>
                                                                <div className="text-slate-300">ครม. {minister.cabinet}</div>
                                                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-1 h-1 bg-slate-100 rounded-full"></div>
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

            {/* Mobile Card View (Unchanged from previous version for simplicity, or slightly updated) */}
            <div className="md:hidden divide-y divide-slate-100">
                {ministers.map((minister, idx) => (
                    <div key={`m-${idx}`} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-700">{minister.full_name}</div>
                                    <div className="text-xs text-slate-400">ครม. {minister.cabinet}</div>
                                </div>
                            </div>
                            {minister.end_date ? (
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                    อดีต
                                </span>
                            ) : (
                                <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded font-medium">
                                    ปัจจุบัน
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-sm pl-12">
                            <div className="flex items-start gap-2 text-slate-600">
                                <Briefcase size={16} className="text-slate-400 mt-0.5" />
                                <span>{minister.position}</span>
                            </div>
                            <div className="flex items-start gap-2 text-slate-600">
                                <Building2 size={16} className="text-slate-400 mt-0.5" />
                                <span>{minister.ministry}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                <Calendar size={14} className="text-slate-400" />
                                <span>
                                    {new Date(minister.start_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    {' - '}
                                    {minister.end_date ? new Date(minister.end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'ปัจจุบัน'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MinisterTable;
