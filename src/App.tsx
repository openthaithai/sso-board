import {useState, useMemo, useEffect} from 'react';
import {
    Calendar,
    Filter,
    BarChart3,
    FileText,
    ExternalLink,
    Search, AlertCircle, Download
} from 'lucide-react';

// --- Data from "SSO Report - Board.csv" (Head & Tail only available to AI) ---
const PRELOADED_CSV = `ปี,ชื่อ-นามสกุล,ตำแหน่ง,ประเภทกรรมการ,คณะกรรมการ
2566,นายบุญสงค์ ทัพชัยยุทธ์,เลขาธิการสำนักงานประกันสังคม,ผู้บริหาร,ผู้บริหารสำนักงานประกันสังคม
2566,นางสาวนันทินี ทรัพย์ศิริ,ที่ปรึกษาด้านประสิทธิภาพ สำนักงานประกันสังคม,ผู้บริหาร,ผู้บริหารสำนักงานประกันสังคม
2566,นางสาวณัฐชนน วัฒนญาณนนท์,รองเลขาธิการ สำนักงานประกันสังคม,ผู้บริหาร,ผู้บริหารสำนักงานประกันสังคม
2566,นางสาววีระกา บุญรัตน์,รองเลขาธิการ สำนักงานประกันสังคม,ผู้บริหาร,ผู้บริหารสำนักงานประกันสังคม
2566,นายสุรสิทธิ์ ศรีแก้ว,รองเลขาธิการ สำนักงานประกันสังคม,ผู้บริหาร,ผู้บริหารสำนักงานประกันสังคม
2566,นางสาวอำพันธ์ ธุววิทย์,รองเลขาธิการ สำนักงานประกันสังคม,ผู้บริหาร,ผู้บริหารสำนักงานประกันสังคม
2566,นายสุทธิ สุโกศล,ที่ปรึกษา,ผู้บริหาร,ผู้บริหารสำนักงานประกันสังคม
2566,ปลัดกระทรวงแรงงาน,ประธานกรรมการ,ฝ่ายรัฐบาล,คณะกรรมการประกันสังคม
2566,ผู้แทนกระทรวงการคลัง,กรรมการ,ฝ่ายรัฐบาล,คณะกรรมการประกันสังคม
2550,ศ.ดร.อรุณ เภาสวัสดิ์,ประธานกรรมการ,ประธาน,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,นพ.เกียรติ รักรุ่งธรรม,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,นพ.เจษฎา โชคดำรงสุข,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,นพ.เฉลิม หาญพาณิชย์,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,นพ.ชาตรี บัญชุญ,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,พล.ต.ท. ธวัชชัย สาศิพรม,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,รศ.ดร.ปิยะ เนตรวิเชียร,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,พ.อ.ดร.ประชากิจ บุญจิตรพิมล,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,ศ.ดร. พินิจ กุลลวนิช,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม
2550,นพ.พีระ เลิศกาญจนวังไล,กรรมการ,กรรมการ,คณะกรรมการการแพทย์กองทุนประกันสังคม`;

// --- Types ---
interface BoardRecord {
    year: number;
    name: string;
    position: string;
    type: string;
    committee: string;
}

interface MemberStats {
    name: string;
    totalYears: number;
    maxConsecutive: number;
    years: number[];
    history: { [year: number]: string }; // Map year to position
    typeHistory: { [year: number]: string };
    types: string[]; // Store unique types for this member
    committeeHistory: { [year: number]: string[] };
    committees: string[];
    uniqueRoles: string[]; // "Type (Committee)"
}

interface AppProps {
    baseUrl?: string;
}

const App = ({baseUrl = '/'}: AppProps) => {
    const [rawData, setRawData] = useState<BoardRecord[]>([]);
    const [selectedCommittee, setSelectedCommittee] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<'total' | 'consecutive' | 'name'>('total');
    const [dataMode, setDataMode] = useState<'sample' | 'full' | 'simulated'>('sample');

    // --- Robust CSV Parsing Logic ---
    const parseCSV = (csvText: string) => {
        const lines = csvText.trim().split('\n');
        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => h.trim());

        const yearIdx = headers.findIndex(h => h.includes('ปี'));
        const nameIdx = headers.findIndex(h => h.includes('ชื่อ'));
        const posIdx = headers.findIndex(h => h.includes('ตำแหน่ง'));
        const typeIdx = headers.findIndex(h => h.includes('ประเภท'));
        const commIdx = headers.findIndex(h => h.includes('คณะกรรมการ'));

        const parsed: BoardRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const row = line.split(',');

            if (!row[yearIdx] || !row[nameIdx]) continue;

            const yearVal = parseInt(row[yearIdx]?.trim() || '0', 10);
            const nameVal = row[nameIdx]?.trim().replace(/^"|"$/g, '') || '';

            if (yearVal > 0 && nameVal && !nameVal.toLowerCase().includes('notebook')) {
                parsed.push({
                    year: yearVal,
                    name: nameVal,
                    position: row[posIdx]?.trim() || 'กรรมการ',
                    type: row[typeIdx]?.trim() || '', // ดึงข้อมูลประเภทกรรมการ
                    committee: row[commIdx]?.trim() || 'ไม่ระบุ',
                });
            }
        }
        return parsed;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${baseUrl}/sso_board.csv?t=${Date.now()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch CSV');
                }
                const text = await response.text();
                const parsed = parseCSV(text);
                setRawData(parsed);
                setDataMode('full');
            } catch (error) {
                console.error("Error loading CSV:", error);
                // Fallback to sample data if fetch fails
                setRawData(parseCSV(PRELOADED_CSV));
                setDataMode('sample');
            }
        };

        fetchData();
    }, []);

    // --- Calculate All Years & Set Default to Latest ---
    const allYears = useMemo(() => {
        const years = Array.from(new Set(rawData.map(d => d.year))).sort((a, b) => b - a);
        return years;
    }, [rawData]);

    useEffect(() => {
        if (allYears.length > 0) {
            setSelectedYear(allYears[0]);
        } else {
            setSelectedYear('All');
        }
    }, [allYears]);

    const handleDownloadJSON = () => {
        if (rawData.length === 0) return;
        const dataStr = JSON.stringify(rawData, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "sso_board_data.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Statistics Calculation ---
    const committees = useMemo(() => {
        const comms = new Set(rawData.map(d => d.committee));
        const sortedComms = Array.from(comms).sort();

        const priority = "คณะกรรมการประกันสังคม";
        const hasPriority = sortedComms.includes(priority);
        const others = sortedComms.filter(c => c !== priority);

        return ['All', ...(hasPriority ? [priority] : []), ...others];
    }, [rawData]);

    const statsData = useMemo(() => {
        const filtered = rawData.filter(d => {
            const matchesCommittee = selectedCommittee === 'All' || d.committee === selectedCommittee;
            const matchesSearch = searchQuery === '' || d.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCommittee && matchesSearch;
        });

        const memberMap = new Map<string, MemberStats>();
        let minYear = 3000;
        let maxYear = 0;

        filtered.forEach(record => {
            if (record.year < minYear) minYear = record.year;
            if (record.year > maxYear) maxYear = record.year;

            if (!memberMap.has(record.name)) {
                memberMap.set(record.name, {
                    name: record.name,
                    totalYears: 0,
                    maxConsecutive: 0,
                    years: [],
                    history: {},
                    typeHistory: {}, // Initialize type history
                    types: [],
                    committeeHistory: {},
                    committees: [],
                    uniqueRoles: []
                });
            }
            const member = memberMap.get(record.name)!;

            if (!member.years.includes(record.year)) {
                member.years.push(record.year);
                member.totalYears++;
                member.history[record.year] = record.position;
                member.typeHistory[record.year] = record.type; // Store type for specific year
                member.committeeHistory[record.year] = [record.committee];
            } else {
                // Year exists, add committee if new
                if (member.committeeHistory[record.year] && !member.committeeHistory[record.year].includes(record.committee)) {
                    member.committeeHistory[record.year].push(record.committee);
                }
            }

            if (record.type && !member.types.includes(record.type)) {
                member.types.push(record.type);
            }
            if (record.committee && !member.committees.includes(record.committee)) {
                member.committees.push(record.committee);
            }

            const roleKey = `${record.year} ${record.type} (${record.committee})`;
            if (!member.uniqueRoles.includes(roleKey)) {
                member.uniqueRoles.push(roleKey);
            }
        });

        let members = Array.from(memberMap.values());

        // Sort uniqueRoles for each member (Newest year first)
        members.forEach(m => {
            m.uniqueRoles.sort((a, b) => b.localeCompare(a));
        });

        if (selectedYear !== 'All') {
            members = members.filter(m => m.years.includes(selectedYear));
        }

        members = members.map(m => {
            m.years.sort((a, b) => a - b);
            let maxCon = 0;
            let currentCon = 0;
            let prevYear = -1;
            for (const y of m.years) {
                if (prevYear === -1 || y === prevYear + 1) {
                    currentCon++;
                } else {
                    maxCon = Math.max(maxCon, currentCon);
                    currentCon = 1;
                }
                prevYear = y;
            }
            m.maxConsecutive = Math.max(maxCon, currentCon);
            return m;
        });

        members.sort((a, b) => {
            if (sortBy === 'total') return b.totalYears - a.totalYears;
            if (sortBy === 'consecutive') return b.maxConsecutive - a.maxConsecutive;
            return a.name.localeCompare(b.name, 'th');
        });

        return {members, minYear, maxYear};
    }, [rawData, selectedCommittee, sortBy, searchQuery, selectedYear]);

    const yearRange = useMemo(() => {
        if (statsData.minYear === 3000) return [];
        const range = [];
        for (let y = statsData.minYear; y <= statsData.maxYear; y++) {
            range.push(y);
        }
        return range;
    }, [statsData.minYear, statsData.maxYear]);


    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900 flex flex-col">
            <div className="grid grid-cols-1 relative">
                <img
                    src={`${baseUrl}/header_chair.png`}
                    alt="Header Background"
                    className="col-start-1 row-start-1 w-full h-[calc(105vh)] object-cover object-bottom"
                />
                <div
                    className="col-start-1 row-start-1 relative z-10 flex flex-col items-center justify-between h-full pt-24 md:pt-32 pb-8 px-4 text-center">
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-6"
                            style={{lineHeight: '1.2'}}>ผ่านมากี่ปี<br/>เก้าอี้ก็ยังเป็นของคนเดิม</h1>
                        <p className="text-xl md:text-2xl text-gray-200 mb-8">ส่องข้อมูลตำแหน่งเดิมที่ยาวนาน...<br/>จนกลายเป็นตำนานองค์กร
                        </p>
                    </div>
                    <button onClick={() => document.getElementById('table')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center gap-2 text-white hover:text-gray-200 transition-colors cursor-pointer animate-bounce" aria-label="Scroll down">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="lucide lucide-chevron-down w-12 h-12" aria-hidden="true">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="relative w-full min-h-[500px] flex items-center overflow-hidden" style={{
                backgroundColor: 'rgb(10, 53, 87)',
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
            }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[5%] left-[5%] text-7xl opacity-20 animate-bounce"
                         style={{animationDelay: '0s', animationDuration: '3s', transform: 'rotate(-25deg)'}}>🪑
                    </div>
                    <div className="absolute top-[8%] right-[8%] text-6xl opacity-20 animate-bounce"
                         style={{animationDelay: '0.5s', animationDuration: '3.5s', transform: 'rotate(35deg)'}}>🪑
                    </div>
                    <div className="absolute top-[50%] left-[3%] text-6xl opacity-20 animate-bounce"
                         style={{animationDelay: '1.5s', animationDuration: '4.5s', transform: 'rotate(15deg)'}}>🪑
                    </div>
                    <div className="absolute top-[48%] right-[5%] text-5xl opacity-20 animate-bounce"
                         style={{animationDelay: '0.8s', animationDuration: '3.8s', transform: 'rotate(-30deg)'}}>🪑
                    </div>
                    <div className="absolute bottom-[8%] left-[10%] text-6xl opacity-20 animate-bounce"
                         style={{animationDelay: '1s', animationDuration: '4s', transform: 'rotate(-15deg)'}}>🪑
                    </div>
                    <div className="absolute bottom-[10%] right-[12%] text-7xl opacity-20 animate-bounce"
                         style={{animationDelay: '2s', animationDuration: '3.2s', transform: 'rotate(40deg)'}}>🪑
                    </div>
                    <div className="absolute top-[25%] left-[50%] text-6xl opacity-20 animate-bounce" style={{
                        animationDelay: '1.2s',
                        animationDuration: '3.7s',
                        transform: 'translate(-50%, 0px) rotate(-10deg)'
                    }}>🪑
                    </div>
                    <div className="absolute top-[70%] left-[50%] text-5xl opacity-20 animate-bounce" style={{
                        animationDelay: '0.3s',
                        animationDuration: '4.3s',
                        transform: 'translate(-50%, 0px) rotate(25deg)'
                    }}>🪑
                    </div>
                </div>
                <div className="relative z-10 w-full max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        <div
                            className="relative flex items-center justify-center py-16 md:py-24 border-r-0 md:border-r-2 border-white/30">
                            <div className="text-center px-8">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl text-white" style={{lineHeight: '1.4'}}>บอร์ดประกันสังคม</h2>
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-16 md:py-24">
                            <div className="text-center px-8">
                                <p className="text-4xl md:text-5xl lg:text-6xl text-white font-bold"
                                   style={{lineHeight: '1.4'}}>อยู่ตำแหน่งเดิม<br/>นานแค่ไหน?</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto space-y-6 flex-grow w-full p-4 md:p-8">


                <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-900 flex flex-col">
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
                        body, .font-sans { font-family: 'Prompt', sans-serif !important; }
                    `}</style>

                    <div className="max-w-7xl mx-auto space-y-6 flex-grow w-full">

                        {/* Controls Grid */}
                        <div id='table' className="grid grid-cols-1 md:grid-cols-5 gap-4">

                            <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                    <Calendar size={16}/> เลือกปีที่ดำรงตำแหน่ง
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

                            <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                    <Filter size={16}/> เลือกคณะกรรมการ
                                </label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={selectedCommittee}
                                    onChange={(e) => setSelectedCommittee(e.target.value)}
                                >
                                    {committees.map(c => (
                                        <option key={c}
                                                value={c}>{c === 'All' ? 'แสดงทั้งหมด (All Committees)' : c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                    <Search size={16}/> ค้นหาชื่อ
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-prompt"
                                    placeholder="พิมพ์ชื่อกรรมการ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                    <BarChart3 size={16}/> เรียงลำดับตาม
                                </label>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button onClick={() => setSortBy('total')}
                                            className={`flex-1 py-1 text-xs md:text-sm rounded-md ${sortBy === 'total' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}>อยู่นานสุด
                                    </button>
                                    <button onClick={() => setSortBy('consecutive')}
                                            className={`flex-1 py-1 text-xs md:text-sm rounded-md ${sortBy === 'consecutive' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}>ต่อเนื่องสุด
                                    </button>
                                </div>
                            </div>

                            <div
                                className="md:col-span-1 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center gap-2 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-sm text-blue-600 font-medium">พบข้อมูล (ท่าน)</div>
                                    <div className="text-3xl font-bold text-slate-800">{statsData.members.length}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {selectedYear !== 'All' ? `เฉพาะปี ${selectedYear}` : `${statsData.minYear === 3000 ? '-' : statsData.minYear} - ${statsData.maxYear === 0 ? '-' : statsData.maxYear}`}
                                    </div>
                                </div>
                                <FileText
                                    className="absolute right-2 bottom-2 text-blue-100 w-16 h-16 pointer-events-none"/>
                            </div>
                        </div>

                        {/* Main Visualization: Timeline Matrix */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div
                                className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Calendar size={18}/> Timeline การดำรงตำแหน่ง
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1"><span
                                        className="text-base">🪑</span> มีตำแหน่ง
                                    </div>
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
                                        <div
                                            className="w-64 flex-shrink-0 font-semibold text-slate-600 text-sm">รายชื่อกรรมการ
                                        </div>
                                        <div
                                            className="w-24 flex-shrink-0 text-center text-xs font-semibold text-slate-500">ระยะเวลา
                                            (ปี)
                                        </div>
                                        <div
                                            className="w-24 flex-shrink-0 text-center text-xs font-semibold text-slate-500 border-r border-slate-200 mr-2">ต่อเนื่อง
                                            (ปี)
                                        </div>
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
                                        {statsData.members.map((member, idx) => (
                                            <div key={idx}
                                                 className="flex items-center hover:bg-slate-50 transition-colors py-2 border-b border-slate-50 last:border-0 group">
                                                <div className="w-64 flex-shrink-0 pr-4 pl-2">
                                                    <div className="text-sm font-medium text-slate-700 truncate"
                                                         title={member.name}>{member.name}</div>
                                                    <div className="text-xs text-slate-400 truncate"
                                                         title={Object.values(member.history)[0]}>{Object.values(member.history)[0]}</div>

                                                    {/* NEW: Committee Type Display */}
                                                    <div className="text-[10px] text-indigo-500 font-medium mt-0.5">
                                                        {member.uniqueRoles.map((role, i) => (
                                                            <div key={i}>{role}</div>
                                                        ))}
                                                        {member.uniqueRoles.length === 0 && '-'}
                                                    </div>
                                                </div>

                                                <div className="w-24 flex-shrink-0 text-center">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${member.totalYears > 5 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {member.totalYears} ปี
                                                    </span>
                                                </div>
                                                <div
                                                    className="w-24 flex-shrink-0 text-center border-r border-slate-200 mr-2">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${member.maxConsecutive > 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {member.maxConsecutive}
                                                    </span>
                                                </div>

                                                {/* Timeline Grid */}
                                                <div className="flex-1 flex gap-1 h-8">
                                                    {yearRange.map(year => {
                                                        const hasPosition = member.years.includes(year);
                                                        const positionName = member.history[year];
                                                        const typeName = member.typeHistory[year]; // New Type History Access
                                                        const isMissingGap = dataMode === 'sample' && year > 2550 && year < 2566;
                                                        const isSimulated = dataMode === 'simulated' && year > 2550 && year < 2566;
                                                        const isSelectedYear = selectedYear === year;

                                                        const yearsServedSoFar = member.years.filter(y => y <= year).length;
                                                        const dynamicSize = Math.min(28, 12 + (yearsServedSoFar * 1.5));

                                                        return (
                                                            <div
                                                                key={year}
                                                                className={`flex-1 min-w-[30px] rounded-sm relative group/cell transition-all border border-transparent flex items-center justify-center
                              ${hasPosition
                                                                    ? 'cursor-pointer hover:bg-slate-100'
                                                                    : isMissingGap
                                                                        ? 'bg-slate-50 opacity-50'
                                                                        : 'bg-slate-50'
                                                                }
                              ${isSelectedYear && !hasPosition ? 'bg-slate-100' : ''}
                              ${isSelectedYear && hasPosition ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                            `}
                                                            >
                                                                {hasPosition && (
                                                                    <>
                                                                        <span
                                                                            className={`leading-none select-none filter transition-all ${isSimulated ? 'opacity-50 grayscale' : ''}`}
                                                                            style={{fontSize: `${dynamicSize}px`}}
                                                                        >
                                                                            🪑
                                                                        </span>
                                                                        <div
                                                                            className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/cell:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg pointer-events-none font-sans z-50">
                                                                            <div
                                                                                className="font-bold text-blue-200">ปี {year} {isSimulated ? '(จำลอง)' : ''}</div>
                                                                            <div
                                                                                className="mb-1 text-white">{positionName}</div>
                                                                            {/* Updated Tooltip with Type Info */}
                                                                            <div
                                                                                className="text-slate-300 mb-1 border-t border-slate-700 pt-1">
                                                                                <span
                                                                                    className="font-semibold text-blue-300">ประเภท:</span> {typeName || '-'}
                                                                            </div>
                                                                            <div
                                                                                className="text-slate-300 mb-1">
                                                                                <span
                                                                                    className="font-semibold text-blue-300">คณะ:</span> {member.committeeHistory[year]?.join(', ') || '-'}
                                                                            </div>
                                                                            <div
                                                                                className="text-slate-400">อยู่ในตำแหน่งมา: {yearsServedSoFar} ปี
                                                                            </div>
                                                                            <div
                                                                                className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {statsData.members.length === 0 && (
                                            <div
                                                className="text-center py-12 text-slate-400 flex flex-col items-center">
                                                <AlertCircle className="w-10 h-10 mb-2 opacity-50"/>
                                                ไม่พบรายชื่อที่ค้นหา หรือไม่มีกรรมการในปีที่เลือก
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="relative min-h-[400px] flex items-center justify-center text-center bg-[#07253C]">
                {/* Background image as overlay */}
                <div
                    className="absolute inset-0 bg-center bg-contain bg-no-repeat opacity-30"
                    style={{backgroundImage: `url(${baseUrl}/vote.png)`}}
                />

                {/* Text content */}
                <div className="relative space-y-6 max-w-4xl mx-auto z-10 px-4">
                    <h1 className="text-5xl md:text-6xl lg:text-5xl text-white mb-5" style={{lineHeight: '1.5'}}>
                        ยังอยู่ที่เดิม... <br/> หรือจะเปลี่ยนให้ดีขึ้น?
                    </h1>
                    <p className="text-md md:text-xl bg-white text-[#07253C] py-3 px-10 inline-block rounded">
                        เลือกตั้งประกันสังคม <span className="text-blue-600">เสียงของคุณมีความหมาย </span>
                    </p>
                </div>
            </div>


            {/* Disclaimer Footer */}
            <footer className="mt-8 px-3 py-8 border-t border-slate-200 text-center">
                <div className="max-w-3xl mx-auto space-y-4">
                    <p className="text-slate-500 text-sm">
                        <span className="font-semibold text-slate-700 block mb-1">Disclaimer:</span>
                        แหล่งที่มาของข้อมูล: <a
                        href="https://www.sso.go.th/wpr/main/privilege/%E0%B8%A3%E0%B8%B2%E0%B8%A2%E0%B8%87%E0%B8%B2%E0%B8%99_sub_category_list-label_1_130_716"
                        target="_blank" rel="noreferrer"
                        className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">รายงานประจำปีของสำนักงานประกันสังคม <ExternalLink
                        size={12}/></a> <br/>
                        ข้อมูลที่แสดงผลใน Dashboard นี้รวบรวมเพื่อวัตถุประสงค์ในการศึกษาและวิเคราะห์ข้อมูลสาธารณะเท่านั้น <br/>
                        ไม่ได้มีส่วนเกี่ยวข้องกับหน่วยงานราชการโดยตรง
                    </p>

                    <p className="text-slate-500 text-sm">
                        ทั้งนี้ ข้อมูลบางส่วนได้มาจากการประมวลผลด้วยระบบรู้จำตัวอักษร (OCR) <br/>
                        อาจมีข้อผิดพลาดด้านการสะกดหรือรูปแบบข้อความ <br/>
                        ผู้ใช้ควรตรวจสอบความถูกต้องจากเอกสารต้นฉบับของสำนักงานประกันสังคมอีกครั้งก่อนนำไปอ้างอิงหรือใช้ในการตัดสินใจ
                    </p>

                    <button
                        onClick={handleDownloadJSON}
                        disabled={rawData.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={14}/>
                        Download ข้อมูลบอร์ดสำนักงานประกันสังคม (JSON) ที่นำมาแสดงข้อมูล
                    </button>
                </div>
            </footer>
            {/* Disclaimer Footer */}
        </div>
    );
};

export default App;