/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CivicIssue, IssueCategory } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ShieldAlert, CheckCircle2, Clock, Zap } from 'lucide-react';

interface ImpactDashboardProps {
  issues: CivicIssue[];
}

export default function ImpactDashboard({ issues }: ImpactDashboardProps) {
  // 1. Calculate Aggregate Metrics
  const totalFiled = issues.length;
  const totalResolved = issues.filter(i => i.status === 'Resolved').length;
  const resolutionRate = totalFiled > 0 ? Math.round((totalResolved / totalFiled) * 100) : 0;

  // Average resolution time
  const resolvedIssuesWithTimes = issues.filter(i => i.status === 'Resolved' && i.resolutionTimeHours !== undefined);
  const averageResolutionTime = resolvedIssuesWithTimes.length > 0
    ? Math.round(resolvedIssuesWithTimes.reduce((acc, curr) => acc + (curr.resolutionTimeHours || 0), 0) / resolvedIssuesWithTimes.length)
    : 16; // Default/Mock avg

  const totalUpvotes = issues.reduce((acc, curr) => acc + curr.upvotes, 0);

  // 2. Compile Category Breakdown Data
  const categories: IssueCategory[] = [
    'Roads & Potholes',
    'Water Leakage',
    'Electrical/Streetlights',
    'Waste Management',
    'Public Safety/Infrastructure'
  ];

  const categoryColors = {
    'Roads & Potholes': '#161616', // Deep charcoal
    'Water Leakage': '#555555', // Slate
    'Electrical/Streetlights': '#888888', // Ash
    'Waste Management': '#bbbbbb', // Mist
    'Public Safety/Infrastructure': '#ff4c24' // Ember
  };

  const categoryBreakdownData = categories.map(cat => {
    const count = issues.filter(i => i.category === cat).length;
    return {
      name: cat,
      value: count,
      color: categoryColors[cat]
    };
  }).filter(item => item.value > 0);

  // 3. Compile Status Chart Data (Filed vs Resolved by Category)
  const statusChartData = categories.map(cat => {
    const categoryIssues = issues.filter(i => i.category === cat);
    const filed = categoryIssues.length;
    const resolved = categoryIssues.filter(i => i.status === 'Resolved').length;
    return {
      category: cat.split(' ')[0], // Short name (e.g. Roads)
      Reported: filed,
      Resolved: resolved
    };
  });

  // 4. Compile Neighborhood Heatmap count
  const neighborhoods = ['Dadar West', 'Bandra West', 'Juhu', 'Andheri West', 'Colaba'];
  const neighborhoodData = neighborhoods.map(n => {
    const count = issues.filter(i => i.location.neighborhood === n).length;
    return { name: n, count };
  }).sort((a, b) => b.count - a.count);

  return (
    <div id="impact-dashboard" className="space-y-6 text-[#161616]">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.02]">
          <div className="p-2.5 bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] text-[#161616] shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#7b7a7c]" />
          </div>
          <div>
            <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider block">
              TOTAL INCIDENTS
            </span>
            <span className="font-gravity text-2xl text-[#161616] font-semibold block mt-1 tracking-tight">
              {totalFiled}
            </span>
            <span className="text-[10px] text-[#7b7a7c] block mt-1 font-mono uppercase">
              // REGISTERED
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.02]">
          <div className="p-2.5 bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] text-[#ff4c24] shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#ff4c24]" />
          </div>
          <div>
            <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider block">
              RESOLVED ISSUES
            </span>
            <span className="font-gravity text-2xl text-[#161616] font-semibold block mt-1 tracking-tight">
              {totalResolved}
            </span>
            <span className="text-[10px] text-[#ff4c24] block mt-1 font-mono uppercase">
              {resolutionRate}% COMPLETE
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.02]">
          <div className="p-2.5 bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] text-[#161616] shrink-0">
            <Clock className="w-5 h-5 text-[#7b7a7c]" />
          </div>
          <div>
            <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider block">
              AVG RESOLUTION
            </span>
            <span className="font-gravity text-2xl text-[#161616] font-semibold block mt-1 tracking-tight">
              {averageResolutionTime}h
            </span>
            <span className="text-[10px] text-[#7b7a7c] block mt-1 font-mono uppercase">
              // RESPONSE TIME
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.02]">
          <div className="p-2.5 bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] text-[#ff4c24] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider block">
              CIVIC ENGAGEMENT
            </span>
            <span className="font-gravity text-2xl text-[#161616] font-semibold block mt-1 tracking-tight">
              {totalUpvotes}
            </span>
            <span className="text-[10px] text-[#7b7a7c] block mt-1 font-mono uppercase">
              // COMMUNITY VOTES
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Filed vs Resolved */}
        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex flex-col h-[340px] transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.01]">
          <div className="border-b border-[#e5e5e5] pb-3 mb-4">
            <h3 className="font-gravity text-[#161616] text-sm uppercase tracking-tight">
              District Incidents Filed vs. Resolved
            </h3>
            <p className="text-[10px] text-[#555555] font-grotesk">
              Summary comparison of community reports and successfully resolved jobs by department.
            </p>
          </div>

          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="category" stroke="#7b7a7c" fontSize={9} fontWeight={500} />
                <YAxis stroke="#7b7a7c" fontSize={9} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '14.4px', color: '#161616' }}
                  labelStyle={{ fontWeight: 'normal', fontFamily: 'sans-serif' }}
                  itemStyle={{ color: '#161616' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 10, color: '#7b7a7c' }} />
                <Bar dataKey="Reported" fill="#161616" name="Filed Reports" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resolved" fill="#ff4c24" name="Completed Works" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Pie Breakdown */}
        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex flex-col h-[340px] transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.01]">
          <div className="border-b border-[#e5e5e5] pb-3 mb-4">
            <h3 className="font-gravity text-[#161616] text-sm uppercase tracking-tight">
              Incident Category Distribution
            </h3>
            <p className="text-[10px] text-[#555555] font-grotesk">
              Proportionate split of all filed incidents logged in database.
            </p>
          </div>

          {categoryBreakdownData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-[#7b7a7c]">
              No Data Available
            </div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4 text-xs">
              <div className="w-[180px] h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '14.4px', color: '#161616' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="space-y-1.5 shrink-0">
                {categoryBreakdownData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                    <span className="font-grotesk text-[11px] text-[#161616] font-medium">
                      {item.name} (<span className="font-mono">{item.value}</span>)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Neighborhood Heat list */}
      <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.005]">
        <h3 className="font-gravity text-[#161616] text-sm uppercase tracking-tight mb-4">
          Neighborhood Incident Frequency Radar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          {neighborhoodData.map((n, i) => (
            <div key={i} className="border border-[#e5e5e5] bg-[#ffffff] p-4 rounded-[14.4px] text-center relative overflow-hidden flex flex-col justify-between shadow-sm transition-all duration-300 ease-in-out hover:shadow hover:border-neutral-400 hover:scale-[1.03]">
              <div className="absolute top-2 left-2.5 font-mono text-[8px] text-[#7b7a7c] font-medium tracking-wider">
                RANK #0{i + 1}
              </div>
              <p className="font-grotesk text-[#161616] text-xs mt-3 truncate">{n.name}</p>
              <div className="mt-2.5">
                <span className="font-grotesk text-xl text-[#161616] font-semibold">{n.count}</span>
                <span className="text-[10px] text-[#7b7a7c] font-medium ml-1">Reports</span>
              </div>
              {/* Simple progress pill */}
              <div className="w-full bg-[#ffffff] h-1.5 rounded-full mt-2.5 overflow-hidden border border-[#e5e5e5]">
                <div
                  className="bg-[#ff4c24] h-full rounded-full"
                  style={{ width: `${totalFiled > 0 ? (n.count / totalFiled) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
