/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PredictiveInsight } from '../types';
import { ShieldAlert, MapPin, Brain, Calendar, Info, AlertTriangle } from 'lucide-react';

interface PredictiveInsightsProps {
  insights: PredictiveInsight[];
}

export default function PredictiveInsights({ insights }: PredictiveInsightsProps) {
  
  const getSeverityStyle = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return 'border-[#ff4c24] bg-[#ffffff] text-[#161616]';
      case 'warning':
        return 'border-[#ff6436] bg-[#ffffff] text-[#161616]';
      case 'info':
        return 'border-[#e5e5e5] bg-[#ffffff] text-[#161616]';
    }
  };

  const getSeverityIcon = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="w-4 h-4 text-[#ff4c24] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#ff6436] shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-[#7b7a7c] shrink-0" />;
    }
  };

  return (
    <div id="predictive-insights-panel" className="space-y-6 text-[#161616]">
      {/* Overview Block */}
      <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm p-6 rounded-[14.4px] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.005]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#161616] font-mono text-[10px] uppercase tracking-widest">
            <Brain className="w-4 h-4 text-[#ff4c24] animate-pulse" />
            <span>MUNICIPAL AI PATTERN RADAR</span>
          </div>
          <h2 className="font-gravity text-xl text-[#161616] tracking-tight">
            Pre-emptive Infrastructure Diagnostics
          </h2>
          <p className="text-[#555555] text-xs font-grotesk max-w-xl leading-relaxed">
            This module applies statistical clustering models on reported community issues to forecast repeating structural failures before they impact wider neighborhoods.
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm px-4 py-3 rounded-[14.4px] text-center shrink-0 transition-all duration-300 ease-in-out hover:shadow hover:border-neutral-400 hover:scale-[1.03]">
          <span className="font-mono text-[9px] text-[#7b7a7c] uppercase tracking-wider block">
            RADAR COVERAGE
          </span>
          <span className="font-mono text-base text-[#161616] block mt-0.5">
            100% SCAN RATE
          </span>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`border shadow-sm rounded-[14.4px] p-5 flex flex-col justify-between space-y-4 transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] ${getSeverityStyle(
              insight.severity
            )}`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-[#e5e5e5] pb-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                  {getSeverityIcon(insight.severity)}
                  <span className="text-[#161616]">{insight.type.toUpperCase()} SIGNAL</span>
                </div>

                <span className="font-mono text-[9px] bg-[#ffffff] px-2 py-0.5 rounded-[14.4px] border border-[#e5e5e5] text-[#555555]">
                  CONFID: {insight.confidence}%
                </span>
              </div>

              <div>
                <span className="font-mono text-[9px] text-[#7b7a7c] uppercase tracking-wider block">
                  AFFECTED AREA
                </span>
                <span className="font-grotesk text-xs flex items-center gap-1.5 mt-1 text-[#161616]">
                  <MapPin className="w-3.5 h-3.5 text-[#7b7a7c]" /> {insight.locationName}
                </span>
              </div>

              <p className="text-xs text-[#555555] leading-relaxed font-grotesk">
                {insight.message}
              </p>
            </div>

            <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-3 text-[10px] font-grotesk flex items-center gap-1.5 text-[#555555]">
              <span>
                <span className="font-mono text-[#161616] uppercase tracking-wider block mb-0.5">Recommended Prevention:</span> Re-allocated municipal patrol priority in current budget cycle.
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actionable Preventative Policy Log */}
      <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.005]">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#161616]" />
            <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">
              Automated Preventive Policy Actions
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#7b7a7c]">
            Next scheduled scan: Tomorrow 04:00 AM
          </span>
        </div>

        <div className="space-y-3 font-grotesk text-xs text-[#161616]">
          <div className="flex items-start gap-3 p-4 bg-[#ffffff] border border-[#e5e5e5] border-l-2 border-l-[#ff4c24] rounded-[14.4px] shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow hover:border-neutral-400">
            <span className="px-2.5 py-0.5 bg-[#ff4c24]/10 border border-[#ff4c24]/20 text-[#ff4c24] rounded-[14.4px] font-mono text-[8px] font-bold uppercase shrink-0 mt-0.5">
              CRITICAL
            </span>
            <div>
              <span className="font-grotesk text-[#161616] font-semibold block">Deploying Subgrade Asphalt Patching on Gokhale Road, Dadar West:</span>
              <p className="text-[#555555] text-[11px] mt-1 leading-relaxed">
                Due to 3 separate potholes reported within 30 days, the road has been flagged for rapid diagnostic milling. Scheduled for July 2nd, 2026.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#ffffff] border border-[#e5e5e5] border-l-2 border-l-[#ff6436] rounded-[14.4px] shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow hover:border-neutral-400">
            <span className="px-2.5 py-0.5 bg-[#ff6436]/10 border border-[#ff6436]/20 text-[#ff6436] rounded-[14.4px] font-mono text-[8px] font-bold uppercase shrink-0 mt-0.5">
              ADVISORY
            </span>
            <div>
              <span className="font-grotesk text-[#161616] font-semibold block">Park Refuse Bin Scheduling Adjustment:</span>
              <p className="text-[#555555] text-[11px] mt-1 leading-relaxed">
                Analysis indicates a Saturday waste spill spike. Sanitation Team 4 has received work-orders to perform weekend evening sweeps starting this Saturday.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
