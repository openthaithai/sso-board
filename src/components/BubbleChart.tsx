import React, { useEffect, useRef, useState } from 'react';
import { max } from 'd3-array';
import { drag } from 'd3-drag';
import {
    forceCenter,
    forceCollide,
    forceManyBody,
    forceSimulation,
    forceX,
    forceY,
    type SimulationNodeDatum
} from 'd3-force';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';

export interface MemberStats {
    name: string;
    totalYears: number;
    maxConsecutive: number;
    years: number[];
    history: { [year: number]: string };
    typeHistory?: { [year: number]: string };
    types?: string[];
    committeeHistory?: { [year: number]: string[] };
    committees?: string[];
    uniqueRoles?: string[];
}

interface BubbleChartProps {
    members: MemberStats[];
    onMemberClick: (member: MemberStats) => void;
    baseUrl: string;
    imageSubDir?: string; // Optional prop for image subdirectory
}

interface BubbleNode extends SimulationNodeDatum {
    id: string;
    r: number;
    data: MemberStats;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
}

const BubbleChart: React.FC<BubbleChartProps> = ({ members, onMemberClick, baseUrl, imageSubDir = 'images' }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle Resize with ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // D3 Logic
    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0 || members.length === 0) return;

        const svg = select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const width = dimensions.width;
        const height = dimensions.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // --- Scale Logic ---
        const minRadius = 30; // Increased base size slightly for visibility
        const maxRadius = 160; // Significantly larger max for contrast
        const maxYears = max(members, d => d.totalYears) || 1;

        // Linear radius scale = Quadratic area scale (Exaggerated visual difference)
        // Matches user request: Radius = years * factor
        const radiusScale = scaleLinear()
            .domain([0, maxYears])
            .range([minRadius, maxRadius]);

        // --- Data Preparation ---
        // Initialize position at center
        const nodes: BubbleNode[] = members.map(m => ({
            id: m.name,
            r: radiusScale(m.totalYears),
            data: m,
            x: centerX + (Math.random() - 0.5) * 50,
            y: centerY + (Math.random() - 0.5) * 50
        }));

        // --- Container Group with Zoom Support ---
        const g = svg.append('g');

        // --- Simulation Setup ---
        const simulation = forceSimulation<BubbleNode>(nodes)
            .force('charge', forceManyBody().strength(10)) // Weak attraction/repulsion
            .force('collide', forceCollide<BubbleNode>().radius(d => d.r + 2).strength(0.8).iterations(5)) // Stronger collision, more space
            .force('center', forceCenter(centerX, centerY).strength(0.8)) // Reduced slightly from 1
            .force('x', forceX(centerX).strength((d) => 0.05 + 0.6 * Math.pow((d as BubbleNode).r / maxRadius, 2)))
            .force('y', forceY(centerY).strength((d) => 0.05 + 0.6 * Math.pow((d as BubbleNode).r / maxRadius, 2)))
            .stop(); // Stop immediately to pre-calculate

        // --- Pre-tick for Initial Layout ---
        // Run simulation for enough ticks to settle structure
        for (let i = 0; i < 200; ++i) simulation.tick();

        // --- Auto-Zoom to Fit ---
        const padding = 40;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            if (node.x - node.r < minX) minX = node.x - node.r;
            if (node.x + node.r > maxX) maxX = node.x + node.r;
            if (node.y - node.r < minY) minY = node.y - node.r;
            if (node.y + node.r > maxY) maxY = node.y + node.r;
        });

        const bboxWidth = maxX - minX;
        const bboxHeight = maxY - minY;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        const scale = Math.min(
            (width - padding * 2) / bboxWidth,
            (height - padding * 2) / bboxHeight
        );

        // Apply initial transform
        // We want to center the [midX, midY] at [width/2, height/2] with scale 'scale'
        // transform: translate(width/2 - midX*scale, height/2 - midY*scale) scale(scale)
        const initialTransform = zoomIdentity
            .translate(width / 2 - midX * scale, height / 2 - midY * scale)
            .scale(scale);


        // --- Zoom Behavior ---
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoomBehavior)
            .call(zoomBehavior.transform, initialTransform);

        // --- Restart Simulation for "Life" ---
        // We want constant subtle movement.
        // alphaTarget > 0 prevents it from cooling down completely.
        simulation
            .alpha(0.3) // Start slightly warm
            .alphaTarget(0.05) // Keep moving slightly
            .velocityDecay(0.6) // Dampen speed
            .restart();


        // --- Drag Behavior ---
        const dragBehavior = drag<SVGGElement, BubbleNode>()
            .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.05); // Return to subtle movement
                d.fx = null;
                d.fy = null;
            });

        // --- Render Nodes ---
        const node = g.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node cursor-grab active:cursor-grabbing')
            .call(dragBehavior)
            .on('click', (event, d) => {
                event.stopPropagation();
                onMemberClick(d.data);
            });

        // 1. ClipPath
        node.append('clipPath')
            .attr('id', (d, i) => `clip-${i}-${d.id.replace(/[^\w-]/g, '')}`) // Strict sanitization
            .append('circle')
            .attr('r', d => d.r);

        // 2. Image
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        node.append('image')
            .attr('xlink:href', (d) => `${cleanBaseUrl}/${imageSubDir}/thumbs/${d.data.name}.webp`) // Prefer lightweight thumbs
            .attr('data-fallbacks', (d) => JSON.stringify([
                `${cleanBaseUrl}/${imageSubDir}/${d.data.name}.jpg`,
                `${cleanBaseUrl}/${imageSubDir}/${d.data.name}.jpeg`,
                `${cleanBaseUrl}/${imageSubDir}/${d.data.name}.png`,
                `${cleanBaseUrl}/${imageSubDir}/${d.data.name}.webp`,
                `${cleanBaseUrl}/${imageSubDir}/${d.data.name}.svg`
            ]))
            .attr('data-fallback-index', '0')
            .attr('x', d => -d.r)
            .attr('y', d => -d.r)
            .attr('width', d => d.r * 2)
            .attr('height', d => d.r * 2)
            .attr('clip-path', (d, i) => `url(#clip-${i}-${d.id.replace(/[^\w-]/g, '')})`)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .on('error', function () { // Removed 'd'
                const self = select(this);
                const fallbackRaw = self.attr('data-fallbacks');
                const indexRaw = self.attr('data-fallback-index') || '0';
                const index = Number(indexRaw);
                if (fallbackRaw) {
                    const fallbacks = JSON.parse(fallbackRaw) as string[];
                    if (index < fallbacks.length) {
                        self.attr('xlink:href', fallbacks[index]);
                        self.attr('data-fallback-index', String(index + 1));
                        return;
                    }
                }
                self.attr('xlink:href', `${cleanBaseUrl}/images/placeholder.jpg`);
            });



        // 4. Name
        node.append('text')
            .attr('dy', d => d.r * 0.5) // Move to lower half
            .attr('text-anchor', 'middle')
            .text(d => d.data.name)
            .attr('fill', 'white')
            .attr('font-size', d => Math.max(12, d.r / 3.5))
            .attr('font-weight', '600')
            .attr('font-family', 'Prompt, sans-serif')
            .style('pointer-events', 'none')
            // Add shadow for better readability against image
            .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)');

        // 5. Position (Latest)
        node.append('text')
            .attr('dy', d => d.r * 0.7) // Move below name
            .attr('text-anchor', 'middle')
            .text(d => {
                const latestYear = Math.max(...d.data.years);
                return d.data.history[latestYear] || '';
            })
            .attr('fill', 'rgba(255, 255, 255, 0.8)')
            .attr('font-size', d => Math.max(10, d.r / 5))
            .attr('font-family', 'Prompt, sans-serif')
            .style('pointer-events', 'none')
            .each(function () { // Removed 'd'
                const self = select(this);
                let text = self.text();
                // Check if truncation is needed logic could go here more precisely with getComputedTextLength
                // For now, heuristic limit
                if (text.length > 20) {
                    self.text(text.substring(0, 18) + '...');
                }
            });

        // --- Tick ---
        simulation.on('tick', () => {
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        const handleVisibility = () => {
            if (document.hidden) {
                simulation.alphaTarget(0);
            } else {
                simulation.alphaTarget(0.05).restart();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            simulation.stop();
        };

    }, [members, dimensions, baseUrl, imageSubDir]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden rounded-lg">
            <svg
                ref={svgRef}
                className="w-full h-full block"
            ></svg>
            <div className="absolute top-4 left-4 text-white/50 text-xs pointer-events-none select-none z-10 font-sans">
                Bubble Mode: Drag to move, Scroll to Zoom
            </div>
        </div>
    );
};

export default BubbleChart;
