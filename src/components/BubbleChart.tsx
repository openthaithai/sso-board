import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface MemberStats {
    name: string;
    totalYears: number;
    maxConsecutive: number;
    years: number[];
    history: { [year: number]: string };
    typeHistory: { [year: number]: string };
    types: string[];
    committeeHistory: { [year: number]: string[] };
    committees: string[];
    uniqueRoles: string[];
}

interface BubbleChartProps {
    members: MemberStats[];
    onMemberClick: (member: MemberStats) => void;
    baseUrl: string;
}

interface BubbleNode extends d3.SimulationNodeDatum {
    id: string;
    r: number;
    data: MemberStats;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
}

const BubbleChart: React.FC<BubbleChartProps> = ({ members, onMemberClick, baseUrl }) => {
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

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const width = dimensions.width;
        const height = dimensions.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // --- Scale Logic ---
        const minRadius = 30; // Increased base size slightly for visibility
        const maxRadius = 160; // Significantly larger max for contrast
        const maxYears = d3.max(members, d => d.totalYears) || 1;

        // Linear radius scale = Quadratic area scale (Exaggerated visual difference)
        // Matches user request: Radius = years * factor
        const radiusScale = d3.scaleLinear()
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
        const simulation = d3.forceSimulation<BubbleNode>(nodes)
            .force('charge', d3.forceManyBody().strength(10)) // Weak attraction/repulsion
            .force('collide', d3.forceCollide<BubbleNode>().radius(d => d.r + 0.5).iterations(3)) // Tight gap
            .force('center', d3.forceCenter(centerX, centerY).strength(1)) // Pull to center
            .force('x', d3.forceX(centerX).strength(0.05))
            .force('y', d3.forceY(centerY).strength(0.05))
            .stop(); // Stop immediately to pre-calculate

        // --- Pre-tick for Initial Layout ---
        // Run simulation for enough ticks to settle structure
        for (let i = 0; i < 300; ++i) simulation.tick();

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
        const initialTransform = d3.zoomIdentity
            .translate(width / 2 - midX * scale, height / 2 - midY * scale)
            .scale(scale);


        // --- Zoom Behavior ---
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom)
            .call(zoom.transform, initialTransform);

        // --- Restart Simulation for "Life" ---
        // We want constant subtle movement.
        // alphaTarget > 0 prevents it from cooling down completely.
        simulation
            .alpha(0.3) // Start slightly warm
            .alphaTarget(0.05) // Keep moving slightly
            .velocityDecay(0.6) // Dampen speed
            .restart();


        // --- Drag Behavior ---
        const drag = d3.drag<SVGGElement, BubbleNode>()
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
            .call(drag)
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
        node.append('image')
            .attr('xlink:href', (d) => `${baseUrl}/images/${d.data.name}.jpg`)
            .attr('x', d => -d.r)
            .attr('y', d => -d.r)
            .attr('width', d => d.r * 2)
            .attr('height', d => d.r * 2)
            .attr('clip-path', (d, i) => `url(#clip-${i}-${d.id.replace(/[^\w-]/g, '')})`)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .on('error', function () { // Removed 'd'
                d3.select(this).attr('xlink:href', `${baseUrl}/images/placeholder.jpg`);
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
                const self = d3.select(this);
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

        return () => {
            simulation.stop();
        };

    }, [members, dimensions, baseUrl]);

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
