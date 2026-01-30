import React from 'react';
import {
    Calendar, Filter, Search, BarChart3,
    Building2, Users, FileText
} from 'lucide-react';

interface SSOFilterProps {
    selectedYear: number | 'All';
    setSelectedYear: (year: number | 'All') => void;
    allYears: number[];
    selectedCommittee: string;
    setSelectedCommittee: (committee: string) => void;
    committees: string[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortBy: 'total' | 'consecutive' | 'name';
    setSortBy: (sort: 'total' | 'consecutive' | 'name') => void;
    filterStats: {
        count: number;
        minYear: number;
        maxYear: number;
    };
}

interface MinisterFilterProps {
    selectedCabinet: string;
    setSelectedCabinet: (cabinet: string) => void;
    cabinets: string[];
    selectedMinistry: string;
    setSelectedMinistry: (ministry: string) => void;
    ministries: string[];
    ministerSearchQuery: string;
    setMinisterSearchQuery: (query: string) => void;
    ministerSortBy: 'total' | 'consecutive';
    setMinisterSortBy: (sort: 'total' | 'consecutive') => void;
    uniqueMinisterCount: number;
}

interface DashboardFiltersProps {
    activeTab: 'sso' | 'minister';
    ssoProps: SSOFilterProps;
    ministerProps: MinisterFilterProps;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ activeTab, ssoProps, ministerProps }) => {
    if (activeTab === 'minister') {
        const {
            selectedCabinet, setSelectedCabinet, cabinets,
            selectedMinistry, setSelectedMinistry, ministries,
            ministerSearchQuery, setMinisterSearchQuery,
            ministerSortBy, setMinisterSortBy,
            uniqueMinisterCount
        } = ministerProps;

        return (
            <div id='minister-controls' className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Cabinet Filter */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <Users size={16} /> เลือกคณะรัฐมนตรี
                    </label>
                    <select
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-prompt"
                        value={selectedCabinet}
                        onChange={(e) => setSelectedCabinet(e.target.value)}
                    >
                        <option value="All">ทุกคณะ (All Cabinets)</option>
                        {cabinets.map(c => (
                            <option key={c} value={c}>คณะที่ {c}</option>
                        ))}
                    </select>
                </div>

                {/* Ministry Filter */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <Building2 size={16} /> เลือกกระทรวง
                    </label>
                    <select
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-prompt"
                        value={selectedMinistry}
                        onChange={(e) => setSelectedMinistry(e.target.value)}
                    >
                        <option value="All">แสดงทั้งหมด (All Ministries)</option>
                        {ministries.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <Search size={16} /> ค้นหา
                    </label>
                    <input
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-prompt"
                        placeholder="พิมพ์ชื่อรัฐมนตรี, ตำแหน่ง..."
                        value={ministerSearchQuery}
                        onChange={(e) => setMinisterSearchQuery(e.target.value)}
                    />
                </div>

                {/* Sort */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <BarChart3 size={16} /> เรียงลำดับตาม
                    </label>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setMinisterSortBy('total')}
                            className={`flex-1 py-1 text-xs md:text-sm rounded-md transition-all ${ministerSortBy === 'total' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}
                        >
                            อยู่นานสุด
                        </button>
                        <button
                            onClick={() => setMinisterSortBy('consecutive')}
                            className={`flex-1 py-1 text-xs md:text-sm rounded-md transition-all ${ministerSortBy === 'consecutive' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}
                        >
                            ต่อเนื่องสุด
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center relative overflow-hidden h-full">
                    <div className="relative z-10">
                        <div className="text-sm text-blue-600 font-medium">พบข้อมูล (ท่าน)</div>
                        <div className="text-3xl font-bold text-slate-800">{uniqueMinisterCount}</div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">
                            {selectedCabinet !== 'All' ? `เฉพาะคณะที่ ${selectedCabinet}` : 'แสดงทุกคณะ'}
                        </div>
                    </div>
                    <FileText className="absolute right-1 bottom-1 text-blue-100 w-12 h-12 pointer-events-none opacity-50" />
                </div>
            </div>
        );
    }

    const {
        selectedYear, setSelectedYear, allYears,
        selectedCommittee, setSelectedCommittee, committees,
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        filterStats
    } = ssoProps;

    return (
        <div id='table' className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <Calendar size={16} /> เลือกปีที่ดำรงตำแหน่ง
                </label>
                <select
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-prompt bg-slate-50"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                >
                    <option value="All">ทุกปี (แสดงทั้งหมด)</option>
                    {allYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <Filter size={16} /> เลือกคณะกรรมการ
                </label>
                <select
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={selectedCommittee}
                    onChange={(e) => setSelectedCommittee(e.target.value)}
                >
                    {committees.map(c => (
                        <option key={c} value={c}>{c === 'All' ? 'แสดงทั้งหมด (All Committees)' : c}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <Search size={16} /> ค้นหาชื่อ
                </label>
                <input
                    type="text"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-prompt"
                    placeholder="พิมพ์ชื่อกรรมการ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <BarChart3 size={16} /> เรียงลำดับตาม
                </label>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setSortBy('total')}
                        className={`flex-1 py-1 text-xs md:text-sm rounded-md transition-all ${sortBy === 'total' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}
                    >
                        อยู่นานสุด
                    </button>
                    <button
                        onClick={() => setSortBy('consecutive')}
                        className={`flex-1 py-1 text-xs md:text-sm rounded-md transition-all ${sortBy === 'consecutive' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}
                    >
                        ต่อเนื่องสุด
                    </button>
                    <button
                        onClick={() => setSortBy('name')}
                        className={`flex-1 py-1 text-xs md:text-sm rounded-md transition-all ${sortBy === 'name' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}
                    >
                        ตามชื่อ
                    </button>
                </div>
            </div>

            {/* SSO Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center relative overflow-hidden h-full">
                <div className="relative z-10">
                    <div className="text-sm text-blue-600 font-medium">พบข้อมูล (ท่าน)</div>
                    <div className="text-3xl font-bold text-slate-800">{filterStats.count}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        {selectedYear !== 'All' ? `เฉพาะปี ${selectedYear}` : `${filterStats.minYear === 3000 ? '-' : filterStats.minYear} - ${filterStats.maxYear === 0 ? '-' : filterStats.maxYear}`}
                    </div>
                </div>
                <FileText className="absolute right-1 bottom-1 text-blue-100 w-12 h-12 pointer-events-none opacity-50" />
            </div>
        </div>
    );
};

export default DashboardFilters;
