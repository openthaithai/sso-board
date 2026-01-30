import { useState, useMemo, useEffect } from 'react';
import { type MinisterRecord } from '../../components/MinisterTable';

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const useMinisterData = (baseUrl: string = '/', activeTab: 'sso' | 'minister') => {
    const [ministersData, setMinistersData] = useState<MinisterRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const parseThaiDate = (dateStr: string): string | null => {
        if (!dateStr || !dateStr.trim()) return null;
        const parts = dateStr.trim().split(' ');
        if (parts.length < 3) return null;

        const day = parts[0];
        const monthStr = parts[1];
        const yearBE = parseInt(parts[2]);

        const monthIndex = THAI_MONTHS.indexOf(monthStr);
        if (monthIndex === -1 || isNaN(yearBE)) return null;

        const yearAD = yearBE - 543;
        const monthAD = (monthIndex + 1).toString().padStart(2, '0');
        const dayAD = day.padStart(2, '0');

        return `${yearAD}-${monthAD}-${dayAD}`;
    };

    const parseMinisterCSV = (csvText: string): MinisterRecord[] => {
        const lines = csvText.trim().split('\n');
        const records: MinisterRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(',').map(c => c.trim());
            if (cols.length < 6) continue;

            const cabinet = cols[0];
            const fullName = cols[2];
            const rawRole = cols[3];
            const startDate = parseThaiDate(cols[4]) || '';
            const endDate = cols[5] ? parseThaiDate(cols[5]) : null;
            const party = cols[6] || 'ไม่สังกัดพรรค';

            let position = "รัฐมนตรีว่าการ";
            let ministry = rawRole;

            if (rawRole === "นายกรัฐมนตรี") {
                position = "นายกรัฐมนตรี";
                ministry = "สำนักนายกรัฐมนตรี";
            } else if (rawRole === "รองนายกรัฐมนตรี") {
                position = "รองนายกรัฐมนตรี";
                ministry = "สำนักนายกรัฐมนตรี";
            } else if (rawRole === "สำนักนายกรัฐมนตรี") {
                position = "รัฐมนตรีประจำ";
                ministry = "สำนักนายกรัฐมนตรี";
            } else if (rawRole.startsWith("กระทรวง")) {
                position = "รัฐมนตรีว่าการ";
                ministry = rawRole;
            } else {
                ministry = rawRole;
            }

            records.push({
                cabinet,
                full_name: fullName,
                position,
                ministry,
                party,
                start_date: startDate,
                end_date: endDate
            });
        }
        return records;
    };

    useEffect(() => {
        const fetchMinisters = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${baseUrl}/data/ministers.csv`);
                if (!response.ok) throw new Error('Failed to fetch ministers');
                const text = await response.text();
                const data = parseMinisterCSV(text);
                setMinistersData(data);
            } catch (error) {
                console.error("Error loading ministers:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeTab === 'minister' && ministersData.length === 0) {
            fetchMinisters();
        }
    }, [activeTab, baseUrl, ministersData.length]);

    const ministries = useMemo(() => {
        return Array.from(new Set(ministersData.map(m => m.ministry))).sort();
    }, [ministersData]);

    const cabinets = useMemo(() => {
        return Array.from(new Set(ministersData.map(m => m.cabinet))).sort((a, b) => Number(b) - Number(a));
    }, [ministersData]);

    const timelineCabinets = useMemo(() => {
        return Array.from(new Set(ministersData.map(m => m.cabinet))).sort((a, b) => Number(a) - Number(b));
    }, [ministersData]);

    const ministerHistory = useMemo(() => {
        const history: Record<string, string[]> = {};
        ministersData.forEach(m => {
            if (!history[m.full_name]) history[m.full_name] = [];
            if (!history[m.full_name].includes(m.cabinet)) {
                history[m.full_name].push(m.cabinet);
            }
        });
        return history;
    }, [ministersData]);

    const getFilteredMinisters = (selectedMinistry: string, selectedCabinet: string, searchQuery: string, sortBy: 'total' | 'consecutive') => {
        const filtered = ministersData.filter(m => {
            const matchesMinistry = selectedMinistry === 'All' || m.ministry === selectedMinistry;
            const matchesCabinet = selectedCabinet === 'All' || m.cabinet === selectedCabinet;
            const q = searchQuery.toLowerCase();
            const matchesSearch = q === '' ||
                m.full_name.toLowerCase().includes(q) ||
                m.position.toLowerCase().includes(q) ||
                m.ministry.toLowerCase().includes(q) ||
                m.cabinet.includes(q);
            return matchesMinistry && matchesCabinet && matchesSearch;
        });

        const stats = new Map<string, { total: number, maxConsecutive: number }>();
        const personCabinets = new Map<string, Set<number>>();

        filtered.forEach(m => {
            if (!personCabinets.has(m.full_name)) {
                personCabinets.set(m.full_name, new Set());
            }
            const cabNum = parseInt(m.cabinet);
            if (!isNaN(cabNum)) {
                personCabinets.get(m.full_name)!.add(cabNum);
            }
        });

        personCabinets.forEach((cabs, name) => {
            const sortedCabs = Array.from(cabs).sort((a, b) => a - b);
            const total = sortedCabs.length;
            let maxCon = 0;
            let currentCon = 0;
            let prevCab = -1;

            for (const c of sortedCabs) {
                if (prevCab === -1 || c === prevCab + 1) {
                    currentCon++;
                } else {
                    maxCon = Math.max(maxCon, currentCon);
                    currentCon = 1;
                }
                prevCab = c;
            }
            maxCon = Math.max(maxCon, currentCon);
            stats.set(name, { total, maxConsecutive: maxCon });
        });

        const sorted = [...filtered].sort((a, b) => {
            const statsA = stats.get(a.full_name) || { total: 0, maxConsecutive: 0 };
            const statsB = stats.get(b.full_name) || { total: 0, maxConsecutive: 0 };

            if (sortBy === 'total') {
                if (statsB.total !== statsA.total) return statsB.total - statsA.total;
            } else if (sortBy === 'consecutive') {
                if (statsB.maxConsecutive !== statsA.maxConsecutive) return statsB.maxConsecutive - statsA.maxConsecutive;
            }
            return new Date(b.start_date || '').getTime() - new Date(a.start_date || '').getTime();
        });

        const uniqueCount = new Set(sorted.map(m => m.full_name)).size;

        return { filteredMinisters: sorted, uniqueMinisterCount: uniqueCount };
    };

    return {
        ministersData,
        isLoading,
        ministries,
        cabinets,
        timelineCabinets,
        ministerHistory,
        getFilteredMinisters
    };
};
