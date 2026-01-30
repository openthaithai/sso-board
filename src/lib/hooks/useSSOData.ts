import { useState, useMemo, useEffect } from 'react';

export interface BoardRecord {
    year: number;
    name: string;
    position: string;
    type: string;
    committee: string;
}

export interface MemberStats {
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
    ministerHistoryDetails?: { [cabinet: string]: any }; // Optional: Full MinisterRecord details for each cabinet
}

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

export const useSSOData = (baseUrl: string = '/') => {
    const [rawData, setRawData] = useState<BoardRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dataMode, setDataMode] = useState<'sample' | 'full' | 'simulated'>('sample');

    const parseCSV = (csvText: string) => {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];
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
                    type: row[typeIdx]?.trim() || '',
                    committee: row[commIdx]?.trim() || 'ไม่ระบุ',
                });
            }
        }
        return parsed;
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
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
                setRawData(parseCSV(PRELOADED_CSV));
                setDataMode('sample');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [baseUrl]);

    const allYears = useMemo(() => {
        return Array.from(new Set(rawData.map(d => d.year))).sort((a, b) => b - a);
    }, [rawData]);

    const committees = useMemo(() => {
        const comms = new Set(rawData.map(d => d.committee));
        const sortedComms = Array.from(comms).sort();

        const priority = "คณะกรรมการประกันสังคม";
        const hasPriority = sortedComms.includes(priority);
        const others = sortedComms.filter(c => c !== priority);

        return ['All', ...(hasPriority ? [priority] : []), ...others];
    }, [rawData]);

    const getStats = (selectedCommittee: string, searchQuery: string, sortBy: 'total' | 'consecutive' | 'name', selectedYear: number | 'All') => {
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
                    typeHistory: {},
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
                member.typeHistory[record.year] = record.type;
                member.committeeHistory[record.year] = [record.committee];
            } else {
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

        const yearRange: number[] = [];
        if (minYear !== 3000) {
            for (let y = minYear; y <= maxYear; y++) {
                yearRange.push(y);
            }
        }

        return { members, minYear, maxYear, yearRange };
    };

    return { rawData, isLoading, dataMode, allYears, committees, getStats };
};
