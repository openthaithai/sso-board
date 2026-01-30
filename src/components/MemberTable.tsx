import React from 'react';
import { Calendar } from 'lucide-react';
import type { MemberStats } from '../lib/hooks/useSSOData';

interface MemberTableProps {
    members: MemberStats[];
    yearRange: number[];
    selectedYear: number | 'All';
    allYears: number[];
    dataMode: 'sample' | 'full' | 'simulated';
    baseUrl: string;
}

const MemberTable: React.FC<MemberTableProps> = ({
    members, yearRange, selectedYear, allYears, dataMode, baseUrl
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar size={18} /> Timeline การดำรงตำแหน่ง
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1"><span className="text-base">🪑</span> มีตำแหน่ง</div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                        ไม่มีตำแหน่ง
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px] p-6">
                    {/* Header Row */}
                    <div className="flex mb-2">
                        <div className="w-64 flex-shrink-0 font-semibold text-slate-600 text-sm">รายชื่อกรรมการ</div>
                        <div className="w-48 flex-shrink-0 text-center text-xs font-semibold text-slate-500">ระยะเวลา (ปี)</div>
                        <div className="w-24 flex-shrink-0 text-center text-xs font-semibold text-slate-500 border-r border-slate-200 mr-2">ต่อเนื่อง (ปี)</div>
                        <div className="flex-1 flex gap-1">
                            {yearRange.map(year => (
                                <div key={year}
                                    className={`flex-1 min-w-[30px] text-center text-xs ${dataMode === 'sample' && year > 2550 && year < 2566 ? 'text-red-300' : (selectedYear === year ? 'text-blue-600 font-bold bg-blue-50 rounded' : 'text-slate-500')}`}>
                                    {year}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                        {members.map((member, idx) => (
                            <div key={idx} className="flex items-center hover:bg-slate-50 transition-colors py-2 border-b border-slate-50 last:border-0 group">
                                <div className="w-64 flex-shrink-0 pr-4 pl-2 flex flex-col items-center gap-2 text-center">
                                    <div className="flex-shrink-0 w-24 h-24 rounded-full overflow-hidden border border-slate-200 cursor-default">
                                        <img
                                            src={`${baseUrl}/images/${member.name}.jpg`}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `${baseUrl}/images/placeholder.jpg`;
                                            }}
                                        />
                                    </div>
                                    <div className="w-full text-center">
                                        <div className="text-sm font-medium text-slate-700 truncate" title={member.name}>{member.name}</div>
                                        <div className="text-xs text-slate-400 truncate" title={Object.values(member.history)[0]}>{Object.values(member.history)[0]}</div>
                                        <div className="text-[10px] text-indigo-500 font-medium mt-0.5 max-w-full">
                                            {member.uniqueRoles.map((role, i) => (
                                                <div key={i} className="truncate">{role}</div>
                                            ))}
                                            {member.uniqueRoles.length === 0 && '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-48 flex-shrink-0 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${member.totalYears > 5 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {member.totalYears} ปี จากข้อมูลทั้งหมด {allYears.length} ปี
                                    </span>
                                </div>
                                <div className="w-24 flex-shrink-0 text-center border-r border-slate-200 mr-2">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${member.maxConsecutive > 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {member.maxConsecutive}
                                    </span>
                                </div>

                                {/* Timeline Grid */}
                                <div className="flex-1 flex gap-1 h-8">
                                    {yearRange.map(year => {
                                        const hasPosition = member.years.includes(year);
                                        const positionName = member.history[year];
                                        const typeName = member.typeHistory[year];
                                        const isMissingGap = dataMode === 'sample' && year > 2550 && year < 2566;
                                        const isSimulated = dataMode === 'simulated' && year > 2550 && year < 2566;
                                        const isSelectedYear = selectedYear === year;
                                        const yearsServedSoFar = member.years.filter(y => y <= year).length;
                                        const dynamicSize = Math.min(28, 12 + (yearsServedSoFar * 1.5));

                                        return (
                                            <div
                                                key={year}
                                                className={`flex-1 min-w-[30px] rounded-sm relative group/cell transition-all border border-transparent flex items-center justify-center
                                                    ${hasPosition ? 'cursor-pointer hover:bg-slate-100' : isMissingGap ? 'bg-slate-50 opacity-50' : 'bg-slate-50'}
                                                    ${isSelectedYear && !hasPosition ? 'bg-slate-100' : ''}
                                                    ${isSelectedYear && hasPosition ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                                                `}
                                            >
                                                {hasPosition && (
                                                    <>
                                                        <span
                                                            className={`leading-none select-none filter transition-all ${isSimulated ? 'opacity-50 grayscale' : ''}`}
                                                            style={{ fontSize: `${dynamicSize}px` }}
                                                        >
                                                            🪑
                                                        </span>
                                                        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/cell:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg pointer-events-none font-sans z-50 shadow-2xl">
                                                            <div className="font-bold text-blue-200">ปี {year} {isSimulated ? '(จำลอง)' : ''}</div>
                                                            <div className="mb-1 text-white">{positionName}</div>
                                                            <div className="text-slate-300 mb-1 border-t border-slate-700 pt-1">
                                                                <span className="font-semibold text-blue-300">ประเภท:</span> {typeName || '-'}
                                                            </div>
                                                            <div className="text-slate-300 mb-1">
                                                                <span className="font-semibold text-blue-300">คณะ:</span> {member.committeeHistory[year]?.join(', ') || '-'}
                                                            </div>
                                                            <div className="text-slate-400">อยู่ในตำแหน่งมา: {yearsServedSoFar} ปี</div>
                                                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberTable;
