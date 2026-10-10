import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Activity, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export interface RangeSample {
  timeS: number;
  frontRangeM: number;
}

interface FrontRangeChartProps {
  currentRangeM: number;
  simTimeS: number;
  timeWindowSeconds?: number;
}

export const FrontRangeChart: React.FC<FrontRangeChartProps> = ({
  currentRangeM,
  simTimeS,
  timeWindowSeconds = 10,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dataRef = useRef<RangeSample[]>([]);
  const lastTimeRef = useRef<number>(-1);
  const [sampleCount, setSampleCount] = useState<number>(0);
  const [minVal, setMinVal] = useState<number>(0);
  const [maxVal, setMaxVal] = useState<number>(5);

  // Accumulate and maintain 10s sliding window data
  useEffect(() => {
    // Only push if time progressed or initial point
    if (simTimeS !== lastTimeRef.current) {
      lastTimeRef.current = simTimeS;

      // Add sample
      dataRef.current.push({
        timeS: simTimeS,
        frontRangeM: Math.max(0, currentRangeM),
      });

      // Filter to keep only the last timeWindowSeconds
      const cutoff = simTimeS - timeWindowSeconds;
      dataRef.current = dataRef.current.filter(d => d.timeS >= cutoff);

      // Keep summary metrics up to date
      if (dataRef.current.length > 0) {
        setSampleCount(dataRef.current.length);
        const ranges = dataRef.current.map(d => d.frontRangeM);
        setMinVal(Math.min(...ranges));
        setMaxVal(Math.max(...ranges));
      }
    }
  }, [simTimeS, currentRangeM, timeWindowSeconds]);

  // Render D3 Line Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const data = dataRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const bounds = containerRef.current.getBoundingClientRect();
    const width = Math.max(bounds.width || 320, 280);
    const height = 150;
    const margin = { top: 18, right: 28, bottom: 26, left: 38 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Define Scales
    const currentTime = data.length > 0 ? data[data.length - 1].timeS : simTimeS;
    const minTime = currentTime - timeWindowSeconds;
    const maxTime = currentTime;

    const xScale = d3
      .scaleLinear()
      .domain([minTime, maxTime])
      .range([0, innerWidth]);

    const maxRangeValue = data.length > 0 ? Math.max(5.0, d3.max(data, d => d.frontRangeM) || 5.0) : 5.0;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxRangeValue * 1.15 * 2) / 2])
      .nice()
      .range([innerHeight, 0]);

    // Gridlines
    const yGrid = d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#E2E8F0')
      .attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();

    // Critical obstacle danger zone (< 0.5m)
    const dangerHeight = innerHeight - yScale(0.5);
    if (dangerHeight > 0) {
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(0.5))
        .attr('width', innerWidth)
        .attr('height', dangerHeight)
        .attr('fill', '#EF4444')
        .attr('opacity', 0.08);

      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(0.5))
        .attr('y2', yScale(0.5))
        .attr('stroke', '#EF4444')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1.2);

      g.append('text')
        .attr('x', innerWidth - 4)
        .attr('y', yScale(0.5) - 3)
        .attr('text-anchor', 'end')
        .attr('fill', '#EF4444')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', '600')
        .text('Cảnh báo va chạm (0.5m)');
    }

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => `${Number(d).toFixed(1)}s`);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat(d => `${Number(d).toFixed(1)}m`);

    const gx = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    gx.selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#64748B');
    gx.selectAll('line').attr('stroke', '#CBD5E1');
    gx.select('.domain').attr('stroke', '#CBD5E1');

    const gy = g.append('g').call(yAxis);
    gy.selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#64748B');
    gy.selectAll('line').attr('stroke', '#CBD5E1');
    gy.select('.domain').attr('stroke', '#CBD5E1');

    // Gradient for line fill area
    const gradientId = 'frontRangeGradient';
    const defs = svg.append('defs');
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#0284C7')
      .attr('stop-opacity', 0.28);

    linearGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0284C7')
      .attr('stop-opacity', 0.0);

    // Area generator
    const areaGen = d3
      .area<RangeSample>()
      .defined(d => !isNaN(d.frontRangeM))
      .x(d => xScale(d.timeS))
      .y0(innerHeight)
      .y1(d => yScale(d.frontRangeM))
      .curve(d3.curveMonotoneX);

    // Line generator
    const lineGen = d3
      .line<RangeSample>()
      .defined(d => !isNaN(d.frontRangeM))
      .x(d => xScale(d.timeS))
      .y(d => yScale(d.frontRangeM))
      .curve(d3.curveMonotoneX);

    if (data.length > 0) {
      // Area path
      g.append('path')
        .datum(data)
        .attr('fill', `url(#${gradientId})`)
        .attr('d', areaGen);

      // Line path
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#0284C7')
        .attr('stroke-width', 2.2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', lineGen);

      // Current Value Point indicator
      const latest = data[data.length - 1];
      const curX = xScale(latest.timeS);
      const curY = yScale(latest.frontRangeM);

      // Pulse circle
      g.append('circle')
        .attr('cx', curX)
        .attr('cy', curY)
        .attr('r', 6)
        .attr('fill', latest.frontRangeM < 0.5 ? '#EF4444' : '#0284C7')
        .attr('opacity', 0.35);

      // Main point
      g.append('circle')
        .attr('cx', curX)
        .attr('cy', curY)
        .attr('r', 3.5)
        .attr('fill', latest.frontRangeM < 0.5 ? '#EF4444' : '#0284C7')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5);

      // Current value callout
      g.append('text')
        .attr('x', Math.min(innerWidth - 6, curX + 6))
        .attr('y', Math.max(10, curY - 5))
        .attr('fill', latest.frontRangeM < 0.5 ? '#DC2626' : '#0369A1')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', '700')
        .text(`${latest.frontRangeM.toFixed(2)}m`);
    } else {
      // Empty state text
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94A3B8')
        .attr('font-size', '11px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text('Đang thu thập dữ liệu khoảng cách...');
    }
  }, [simTimeS, currentRangeM, timeWindowSeconds]);

  const isDanger = currentRangeM < 0.5;

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200/90 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-xs font-bold text-slate-800">
            Biểu Đồ Khoảng Cách Trước Mặt (frontRangeM - 10s)
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-500">
            Hiện tại:{' '}
            <strong className={isDanger ? 'text-red-600 font-bold' : 'text-sky-700 font-bold'}>
              {currentRangeM.toFixed(2)}m
            </strong>
          </span>
          {isDanger && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              GẦN VẬT CẢN
            </span>
          )}
        </div>
      </div>

      {/* D3 SVG Container */}
      <div ref={containerRef} className="w-full h-[150px] overflow-hidden bg-white rounded border border-slate-200/80">
        <svg ref={svgRef} className="w-full h-full block" />
      </div>

      {/* Metric details footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
        <span>Min (10s): {minVal.toFixed(2)}m</span>
        <span>Max (10s): {maxVal.toFixed(2)}m</span>
        <span>Mẫu quan trắc: {sampleCount} điểm</span>
        <span>Cửa sổ trượt: {timeWindowSeconds}s</span>
      </div>
    </div>
  );
};
