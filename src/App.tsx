import { useState, useEffect, lazy, Suspense } from 'react';
import { LayoutGrid, List, AlertCircle } from 'lucide-react';
const BubbleChart = lazy(() => import('./components/BubbleChart'));
import MinisterTable from './components/MinisterTable';
import DashboardFilters from './components/DashboardFilters';
import MemberTable from './components/MemberTable';
import MemberDetailModal from './components/MemberDetailModal';
import Hero from './components/Hero';
import DashboardSection from './components/DashboardSection';
import CTA from './components/CTA';
import { useSSOData, type MemberStats } from './lib/hooks/useSSOData';
import { useMinisterData } from './lib/hooks/useMinisterData';

interface AppProps {
    baseUrl?: string;
}

const App = ({ baseUrl = '/' }: AppProps) => {
    // --- State ---
    const [selectedCommittee, setSelectedCommittee] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
    const [sortBy, setSortBy] = useState<'total' | 'consecutive'>('total');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [viewMode, setViewMode] = useState<'table' | 'bubble'>('table');
    const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);

    // --- Minister State ---
    const [activeTab, setActiveTab] = useState<'sso' | 'minister'>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('view') === 'minister' ? 'minister' : 'sso';
    });

    const [selectedMinistry, setSelectedMinistry] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('ministry') || 'All';
    });
    const [selectedCabinet, setSelectedCabinet] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('cabinet') || 'All';
    });
    const [ministerSearchQuery, setMinisterSearchQuery] = useState<string>('');
    const [ministerSortBy, setMinisterSortBy] = useState<'total' | 'consecutive'>('total');

    // --- Hooks ---
    const {
        rawData,
        isLoading: isSSOLoading,
        dataMode,
        allYears,
        committees,
        getStats
    } = useSSOData(baseUrl);

    const {
        ministersData,
        isLoading: isMinisterLoading,
        ministries,
        cabinets,
        timelineCabinets,
        ministerHistory,
        getFilteredMinisters,
        cabinetPMs
    } = useMinisterData(baseUrl, activeTab);

    // --- Derived State ---
    // 1. SSO Stats
    useEffect(() => {
        if (allYears.length > 0 && selectedYear === 'All' && activeTab === 'sso') {
            // Only set default year on first load if needed, but 'All' is default in state
            setSelectedYear(allYears[0]);
        }
    }, [allYears, activeTab]);

    const statsData = getStats(selectedCommittee, searchQuery, sortBy, selectedYear);

    // 2. Minister Stats
    const { filteredMinisters, uniqueMinisterCount, ministerStats } = getFilteredMinisters(
        selectedMinistry,
        selectedCabinet,
        ministerSearchQuery,
        ministerSortBy
    );

    // --- URL Sync ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const currentView = params.get('view');
        const currentMinistry = params.get('ministry');
        const currentCabinet = params.get('cabinet');

        let updated = false;

        if (activeTab === 'minister') {
            if (currentView !== 'minister') {
                params.set('view', 'minister');
                updated = true;
            }
        } else {
            if (currentView) {
                params.delete('view');
                updated = true;
            }
        }

        if (selectedMinistry !== 'All') {
            if (currentMinistry !== selectedMinistry) {
                params.set('ministry', selectedMinistry);
                updated = true;
            }
        } else {
            if (currentMinistry) {
                params.delete('ministry');
                updated = true;
            }
        }

        if (selectedCabinet !== 'All') {
            if (currentCabinet !== selectedCabinet) {
                params.set('cabinet', selectedCabinet);
                updated = true;
            }
        } else {
            if (currentCabinet) {
                params.delete('cabinet');
                updated = true;
            }
        }

        if (updated) {
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState(null, '', newUrl);
        }
    }, [activeTab, selectedMinistry, selectedCabinet]);

    const handleDownloadJSON = () => {
        if (activeTab === 'minister') {
            if (ministersData.length === 0) return;
            const dataStr = JSON.stringify(ministersData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "ministers_data.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            if (rawData.length === 0) return;
            const dataStr = JSON.stringify(rawData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "sso_board_data.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900 flex flex-col">
            <Hero baseUrl={baseUrl} onScrollClick={() => document.getElementById('table-controls')?.scrollIntoView({ behavior: 'smooth' })} />

            <DashboardSection title={activeTab === 'minister' ? 'รัฐมนตรี' : 'บอร์ดประกันสังคม'} />

            <div className="max-w-7xl mx-auto space-y-6 flex-grow w-full p-4 md:p-8" id="table-controls">

                {/* Tab Menu */}
                <div className="flex justify-center mb-6">
                    <div className="bg-slate-200 p-1 rounded-full flex gap-1">
                        <button
                            onClick={() => setActiveTab('sso')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'sso' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            สำนักงานประกันสังคม
                        </button>
                        <button
                            onClick={() => setActiveTab('minister')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'minister' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            รัฐมนตรี
                        </button>
                    </div>
                </div>

                <DashboardFilters
                    activeTab={activeTab}
                    ssoProps={{
                        selectedYear, setSelectedYear, allYears,
                        selectedCommittee, setSelectedCommittee, committees,
                        searchQuery, setSearchQuery,
                        sortBy, setSortBy,
                        filterStats: {
                            count: statsData.members.length,
                            minYear: statsData.minYear,
                            maxYear: statsData.maxYear
                        }
                    }}
                    ministerProps={{
                        selectedCabinet, setSelectedCabinet, cabinets,
                        selectedMinistry, setSelectedMinistry, ministries,
                        ministerSearchQuery, setMinisterSearchQuery,
                        ministerSortBy, setMinisterSortBy,
                        uniqueMinisterCount
                    }}
                />

                {/* View Toggle - Show for both tabs */}
                {(activeTab === 'sso' || activeTab === 'minister') && (
                    <div className="flex justify-end my-4">
                        <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'table'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <List size={18} />
                                Table View
                            </button>
                            <button
                                onClick={() => setViewMode('bubble')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'bubble'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <LayoutGrid size={18} />
                                Bubble Mode
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                {activeTab === 'minister' ? (
                    viewMode === 'table' ? (
                        <MinisterTable
                            ministers={filteredMinisters}
                            isLoading={isMinisterLoading}
                            timelineCabinets={timelineCabinets}
                            ministerHistory={ministerHistory}
                            cabinetPMs={cabinetPMs}
                        />
                    ) : (
                        /* Minister Bubble Chart */
                        <div className="fixed inset-0 z-40 bg-slate-900 flex flex-col">
                            <div className="absolute top-4 right-4 z-50 flex gap-2">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full text-sm font-medium transition-all border border-white/20 shadow-lg"
                                >
                                    <List size={18} />
                                    Switch to Table View
                                </button>
                            </div>

                            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/70">Loading bubble view...</div>}>
                                <BubbleChart
                                    members={ministerStats}
                                    baseUrl={baseUrl}
                                    imageSubDir="images/ministers"
                                    onMemberClick={(member) => {
                                        // Construct a mock MemberStats for the modal if needed, or update Modal to handle minister data
                                        setSelectedMember(member as MemberStats);
                                    }}
                                />
                            </Suspense>
                        </div>
                    )
                ) : isSSOLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <div className="text-slate-500 font-prompt">กำลังโหลดข้อมูล...</div>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="space-y-4">


                        <MemberTable
                            members={statsData.members}
                            yearRange={statsData.yearRange}
                            selectedYear={selectedYear}
                            allYears={allYears}
                            dataMode={dataMode}
                            baseUrl={baseUrl}
                        />

                        {statsData.members.length === 0 && (
                            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                                <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                                ไม่พบรายชื่อที่ค้นหา หรือไม่มีกรรมการในปีที่เลือก
                            </div>
                        )}
                    </div>
                ) : (
                    /* Bubble Chart Mode - Full Screen */
                    <div className="fixed inset-0 z-40 bg-slate-900 flex flex-col">
                        <div className="absolute top-4 right-4 z-50 flex gap-2">
                            <button
                                onClick={() => setViewMode('table')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full text-sm font-medium transition-all border border-white/20 shadow-lg"
                            >
                                <List size={18} />
                                Switch to Table View
                            </button>
                        </div>

                        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/70">Loading bubble view...</div>}>
                            <BubbleChart
                                members={statsData.members}
                                baseUrl={baseUrl}
                                imageSubDir="images"
                                onMemberClick={(member) => setSelectedMember(member as MemberStats)}
                            />
                        </Suspense>
                    </div>
                )}

                <CTA baseUrl={baseUrl} activeTab={activeTab} />

                {/* Disclaimer Footer */}
                <footer className="mt-8 px-3 py-8 border-t border-slate-200 text-center">
                    <div className="max-w-3xl mx-auto space-y-4">
                        <p className="text-slate-500 text-sm">
                            <span className="font-semibold text-slate-700 block mb-1">Disclaimer:</span>
                            {activeTab === 'sso' && (
                                <>
                                    แหล่งที่มาของข้อมูล: <a
                                        href="https://www.sso.go.th/wpr/main/privilege/%E0%B8%A3%E0%B8%B2%E0%B8%A2%E0%B8%87%E0%B8%B2%E0%B8%99_sub_category_list-label_1_130_716"
                                        target="_blank" rel="noreferrer"
                                        className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">รายงานประจำปีของสำนักงานประกันสังคม</a>
                                    <br />
                                </>
                            )}
                            ข้อมูลที่แสดงผลใน Dashboard นี้รวบรวมเพื่อวัตถุประสงค์ในการศึกษาและวิเคราะห์ข้อมูลสาธารณะเท่านั้น ไม่ได้มีส่วนเกี่ยวข้องกับหน่วยงานราชการโดยตรง
                        </p>

                        <p className="text-slate-500 text-sm">
                            <span className="font-semibold text-slate-700 block mb-1">ข้อควรระวังและข้อจำกัดของข้อมูล</span>
                            การประมวลผล: ข้อมูลบางส่วนได้มาจากการประมวลผลด้วยระบบรู้จำตัวอักษร (OCR) หรือข้อมูลสาธารณะ อาจมีข้อผิดพลาดด้านการสะกดหรือรูปแบบข้อความ <br />
                            {activeTab === 'minister' ? (
                                <>ข้อมูลคณะรัฐมนตรี: ครอบคลุมคณะรัฐมนตรีชุดที่ 54 ถึงชุดที่ 65</>
                            ) : (
                                <>ข้อมูลคณะอนุกรรมการ: ปัจจุบันระบบแสดงข้อมูลได้เฉพาะบางวาระที่ทางผู้จัดทำสามารถเข้าถึงได้เท่านั้น ยังไม่ใช่ข้อมูลย้อนหลังทั้งหมด</>
                            )}
                        </p>

                        <p className="text-slate-500 text-sm">
                            <span className="font-semibold text-slate-700 block mb-1">ข้อเสนอแนะเพื่อการพัฒนา:</span>
                            ทางเราขอเรียกร้องให้หน่วยงานเปิดเผยข้อมูลในรูปแบบที่พร้อมนำไปประมวลผลต่อได้ (Machine-Readable) เพื่อให้ภาคประชาชนสามารถนำไปวิเคราะห์ ตรวจสอบ และร่วมกันพัฒนาการแสดงผลข้อมูลให้สมบูรณ์และเป็นประโยชน์ต่อสาธารณะยิ่งขึ้น
                        </p>

                        <button
                            onClick={handleDownloadJSON}
                            disabled={rawData.length === 0 && ministersData.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Download ข้อมูล{activeTab === 'minister' ? 'รัฐมนตรี' : 'บอร์ดสำนักงานประกันสังคม'} (JSON) ที่นำมาแสดงข้อมูล
                        </button>
                    </div>
                </footer>
            </div>

            <MemberDetailModal
                selectedMember={selectedMember}
                setSelectedMember={setSelectedMember}
                baseUrl={baseUrl}
                mode={activeTab}
                cabinetPMs={cabinetPMs}
            />
        </div>
    );
};

export default App;
