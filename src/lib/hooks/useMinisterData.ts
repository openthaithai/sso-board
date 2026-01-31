import { useState, useMemo, useEffect } from 'react';
import { type MinisterRecord } from '../../components/MinisterTable';

export const useMinisterData = (baseUrl: string = '/', activeTab: 'sso' | 'minister') => {
    const [ministersData, setMinistersData] = useState<MinisterRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const parseMinisterCSV = (csvText: string): MinisterRecord[] => {
        const lines = csvText.trim().split('\n');
        const records: MinisterRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(',').map(c => c.trim());

            // New structure: 
            // 0: Cabinet, 1: PM, 2: Position, 3: Name, 4: Ministry, 5: Party, 6: Start, 7: End
            if (cols.length < 7) continue;

            const cabinet = cols[0];
            const pmName = cols[1];
            const position = cols[2];
            const fullName = cols[3];
            const ministry = cols[4];
            const party = cols[5] || 'ไม่สังกัดพรรค';
            const startDate = cols[6];
            const endDate = cols[7] ? cols[7] : null;

            records.push({
                cabinet,
                pm: pmName,
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

        const ministerStats: any[] = []; // Use any to bypass strict type check against MemberStats for now, or define a compatible interface

        personCabinets.forEach((cabs, name) => {
            const sortedCabs = Array.from(cabs).sort((a, b) => a - b);
            const total = sortedCabs.length;
            let maxCon = 0;
            let currentCon = 0;
            let prevCab = -1;

            const history: Record<number, string> = {};
            const ministerHistoryDetails: Record<number, any> = {};

            // Find latest position for each cabinet
            const personRecords = filtered.filter(m => m.full_name === name);
            sortedCabs.forEach(cab => {
                const record = personRecords.find(r => parseInt(r.cabinet) === cab);
                if (record) {
                    history[cab] = record.position;
                    ministerHistoryDetails[cab] = record;
                }
            });

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

            ministerStats.push({
                name: name,
                totalYears: total,
                maxConsecutive: maxCon,
                years: sortedCabs,
                history: history,
                // Optional fields
                typeHistory: {},
                types: [],
                committeeHistory: {},
                committees: [],
                uniqueRoles: [],
                ministerHistoryDetails: ministerHistoryDetails
            });
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

        return { filteredMinisters: sorted, uniqueMinisterCount: uniqueCount, ministerStats };
    };

    const cabinetPMs = useMemo(() => {
        const pmMap: Record<string, string> = {};
        ministersData.forEach(m => {
            if (m.pm) {
                pmMap[m.cabinet] = m.pm;
            }
        });
        return pmMap;
    }, [ministersData]);

    return {
        ministersData,
        isLoading,
        ministries,
        cabinets,
        timelineCabinets,
        ministerHistory,
        cabinetPMs,
        getFilteredMinisters
    };
};
