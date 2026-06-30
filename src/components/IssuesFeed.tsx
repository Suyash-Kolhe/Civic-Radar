/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CivicIssue, IssueCategory, IssueStatus } from '../types';
import { ThumbsUp, Calendar, MapPin, Eye, Clock, CheckCircle2, AlertTriangle, ArrowRight, Shield, Award, Settings, User } from 'lucide-react';
import { motion } from 'motion/react';

interface IssuesFeedProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  onVerifyIssue: (issueId: string) => Promise<void>;
  onUpdateStatus: (issueId: string, status: IssueStatus, notes: string) => Promise<void>;
  currentUsername: string;
  activeCategoryFilter: string;
  setActiveCategoryFilter: (cat: string) => void;
  activeStatusFilter: string;
  setActiveStatusFilter: (status: string) => void;
}

export default function IssuesFeed({
  issues,
  selectedIssueId,
  onSelectIssue,
  onVerifyIssue,
  onUpdateStatus,
  currentUsername,
  activeCategoryFilter,
  setActiveCategoryFilter,
  activeStatusFilter,
  setActiveStatusFilter
}: IssuesFeedProps) {
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');

  const categories: string[] = [
    'All',
    'Roads & Potholes',
    'Water Leakage',
    'Electrical/Streetlights',
    'Waste Management',
    'Public Safety/Infrastructure'
  ];

  const statuses: string[] = ['All', 'Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

  const getStatusBadgeStyles = (status: IssueStatus) => {
    switch (status) {
      case 'Reported':
        return 'border border-[#e5e5e5] text-[#555555] bg-[#ffffff]';
      case 'Verified':
        return 'border border-[#ff4c24] bg-[#ff4c24]/5 text-[#ff4c24]';
      case 'Assigned':
        return 'border border-[#e5e5e5] text-[#161616] bg-[#ffffff]';
      case 'In Progress':
        return 'border border-[#ff6436] text-[#ff6436] bg-[#ff6436]/5 animate-pulse';
      case 'Resolved':
        return 'border border-[#e5e5e5] text-[#7b7a7c] bg-[#ffffff]';
    }
  };

  const getSeverityBadgeStyles = (severity: string) => {
    switch (severity) {
      case 'Low':
        return 'border border-[#e5e5e5] text-[#7b7a7c]';
      case 'Medium':
        return 'border border-[#e5e5e5] text-[#555555]';
      case 'High':
        return 'border border-[#ff4c24] text-[#ff4c24]';
      case 'Critical':
        return 'border border-[#ff4c24] bg-[#ff4c24]/10 text-[#ff4c24] animate-pulse';
      default:
        return 'border border-[#e5e5e5] text-[#555555]';
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = activeCategoryFilter === 'All' || issue.category === activeCategoryFilter;
    const matchesStatus = activeStatusFilter === 'All' || issue.status === activeStatusFilter;
    return matchesCategory && matchesStatus;
  });

  const handleStatusChangeSim = async (issueId: string, nextStatus: IssueStatus) => {
    const defaultNotes: Record<IssueStatus, string> = {
      Reported: 'Incident logged in system database.',
      Verified: 'Cross-referenced with community sensors and logs.',
      Assigned: `Assigned to specialized BMC maintenance dispatch unit.`,
      'In Progress': 'Service truck dispatched. Repairs actively underway on site.',
      Resolved: `Repair successfully completed. Site inspected, photographed, and approved.`
    };
    await onUpdateStatus(issueId, nextStatus, adminNotes || defaultNotes[nextStatus]);
    setAdminNotes('');
  };

  return (
    <div id="issues-feed-container" className="space-y-4 text-[#161616]">
      {/* Category Selection Rail */}
      <div className="flex flex-col gap-4 bg-[#ffffff] p-6 rounded-[14.4px] border border-[#e5e5e5]">
        <div>
          <span className="font-mono text-xs text-[#555555] tracking-wider block uppercase mb-2">
            01 // Filter Incident Category
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs rounded-[14.4px] border transition-all cursor-pointer font-grotesk tracking-wide ${
                  activeCategoryFilter === cat
                    ? 'bg-[#161616] text-white border-black font-semibold'
                    : 'bg-[#ffffff] text-[#555555] border-[#e5e5e5] hover:border-[#ff4c24] hover:text-[#161616]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="font-mono text-xs text-[#555555] tracking-wider block uppercase mb-2">
            02 // Filter Dispatch Status
          </span>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setActiveStatusFilter(st)}
                className={`px-3 py-1.5 text-xs rounded-[14.4px] border transition-all cursor-pointer font-grotesk tracking-wide ${
                  activeStatusFilter === st
                    ? 'bg-[#161616] text-white border-black font-semibold'
                    : 'bg-[#ffffff] text-[#555555] border-[#e5e5e5] hover:border-[#ff4c24] hover:text-[#161616]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center p-8 bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px]">
            <p className="font-grotesk text-[#161616] text-sm">No reported issues found for the selected filter.</p>
            <p className="text-xs text-[#555555] mt-1 font-grotesk">Try resetting the filters above or add a new report.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isSelected = selectedIssueId === issue.id;
            const isExpanded = expandedIssueId === issue.id;
            const hasUpvoted = issue.upvotedBy.includes(currentUsername);

            return (
              <div
                key={issue.id}
                id={`issue-card-${issue.id}`}
                className={`bg-[#ffffff] border p-6 transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.015] flex flex-col space-y-4 rounded-[14.4px] text-[#161616] ${
                  isSelected ? 'border-[#ff4c24] shadow-md' : 'border-[#e5e5e5] shadow-sm hover:border-neutral-400'
                }`}
              >
                {/* Card Top: Category and Status Stamps */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e5e5] pb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider border border-[#e5e5e5] px-2.5 py-0.5 rounded-[14.4px]">
                      {issue.category}
                    </span>
                    <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded-[14.4px] uppercase tracking-wider ${getStatusBadgeStyles(issue.status)}`}>
                      ★ {issue.status.toUpperCase()}
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-[14.4px] uppercase tracking-wider ${getSeverityBadgeStyles(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#7b7a7c]">
                    <Calendar className="w-3.5 h-3.5 text-[#7b7a7c]" />
                    <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Card Main details */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {issue.imageUrl && (
                    <div className="w-full sm:w-32 h-24 rounded-[14.4px] border border-[#e5e5e5] overflow-hidden shrink-0">
                      <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <h3 className="font-gravity text-[20px] text-[#161616] leading-[1.2] tracking-tight">
                      {issue.title}
                    </h3>
                    <p className="text-[#555555] text-sm font-grotesk leading-relaxed">
                      {issue.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-grotesk text-[#161616] pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#7b7a7c] shrink-0" />
                      <span className="text-[#555555]">{issue.location.address}</span>
                      <span className="text-[#e5e5e5]">•</span>
                      <span className="underline decoration-[#e5e5e5] text-[#555555]">{issue.location.neighborhood}</span>
                    </div>
                  </div>
                </div>

                {/* AI assessment container if analyzed */}
                {issue.aiAnalyzed && (
                  <div className="bg-[#ffffff] border border-[#e5e5e5] border-l-2 border-l-[#ff4c24] rounded-[14.4px] p-4 text-xs font-grotesk space-y-2">
                    <div className="flex items-center gap-1.5 text-[#ff4c24] font-mono uppercase tracking-wider text-[10px]">
                      <Award className="w-3.5 h-3.5 text-[#ff4c24]" />
                      <span className="text-[#161616]">MUNICIPAL AI ENGINEER ASSESSMENT</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-[#161616] leading-relaxed">
                      <div>
                        <span className="text-[#7b7a7c] block text-[10px] uppercase tracking-wide">Structural Summary:</span>
                        <p className="text-[#555555] mt-0.5">{issue.title}: {issue.description.substring(0, 100)}...</p>
                      </div>
                      <div>
                        <span className="text-[#7b7a7c] block text-[10px] uppercase tracking-wide">Recommended Dispatch Action:</span>
                        <p className="italic text-[#161616] font-medium mt-0.5">{issue.suggestedAction || 'Inspection scheduled.'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Action footer bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e5e5] pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectIssue(issue.id)}
                      className="px-4 py-2 bg-[#ffffff] hover:border-[#ff4c24] text-[#161616] rounded-[14.4px] border border-[#e5e5e5] flex items-center gap-1.5 cursor-pointer transition text-xs font-grotesk"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#7b7a7c]" />
                      <span>FOCUS MAP</span>
                    </button>

                    <button
                      onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                      className="px-4 py-2 bg-[#ffffff] hover:border-[#ff4c24] text-[#161616] rounded-[14.4px] border border-[#e5e5e5] flex items-center gap-1.5 cursor-pointer transition text-xs font-grotesk"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#7b7a7c]" />
                      <span>{isExpanded ? 'HIDE HISTORY' : 'VIEW TIMELINE'}</span>
                    </button>
                  </div>

                  {/* Verification upvote trigger */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#7b7a7c]">
                      {issue.upvotes} / 3 Verifications
                    </span>
                    <button
                      onClick={() => onVerifyIssue(issue.id)}
                      disabled={hasUpvoted || issue.status === 'Resolved'}
                      className={`px-4 py-2 rounded-[14.4px] font-mono text-xs uppercase transition-all border flex items-center gap-1.5 cursor-pointer ${
                        hasUpvoted
                          ? 'bg-[#ffffff] border-[#e5e5e5] text-[#7b7a7c] cursor-not-allowed'
                          : issue.status === 'Resolved'
                          ? 'bg-[#ffffff] border-[#e5e5e5] text-[#7b7a7c] cursor-not-allowed'
                          : 'bg-[#161616] text-white border-black hover:bg-[#222222]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{hasUpvoted ? 'VERIFIED' : 'VERIFY'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Section (Active Timeline + Admin Simulations) */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-[#e5e5e5] pt-4 mt-2 space-y-4"
                  >
                    {/* Status History Timeline */}
                    <div>
                      <h4 className="font-mono text-xs text-[#7b7a7c] uppercase tracking-wider mb-3">
                        Incident Dispatch Timeline
                      </h4>
                      <div className="relative border-l border-[#e5e5e5] pl-4 ml-2 space-y-4">
                        {issue.timeline.map((entry, index) => (
                          <div key={index} className="relative">
                            {/* Bullet icon representing node */}
                            <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border bg-[#ffffff] border-[#161616]"></span>
                            <div className="text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[#161616] uppercase tracking-wide text-[10px] bg-[#ffffff] border border-[#e5e5e5] px-2 py-0.5 rounded-[14.4px]">
                                  {entry.status}
                                </span>
                                <span className="text-[#7b7a7c] font-mono text-[10px]">
                                  {new Date(entry.timestamp).toLocaleTimeString()} • {new Date(entry.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[#555555] mt-1 leading-relaxed">{entry.notes}</p>
                              <div className="flex items-center gap-1 text-[#7b7a7c] text-[10px] mt-1 font-mono">
                                <User className="w-3 h-3 text-[#7b7a7c]" />
                                <span>Updated By: <span className="underline">{entry.updatedBy}</span></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Developer/User simulator to advance stages */}
                    <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-4 space-y-3 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.005]">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#555555] uppercase tracking-wider">
                        <Settings className="w-3.5 h-3.5 text-[#7b7a7c] animate-spin" />
                        <span>Interactive Dispatch Simulator (Developer Access)</span>
                      </div>
                      
                      <p className="text-[11px] text-[#555555] font-grotesk leading-relaxed">
                        Advance the incident life-cycle manually to simulate public works actions and recalculate analytics immediately:
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          disabled={issue.status === 'Assigned'}
                          onClick={() => handleStatusChangeSim(issue.id, 'Assigned')}
                          className="px-3 py-1.5 text-[10px] font-mono border bg-[#ffffff] border-[#e5e5e5] hover:border-[#ff4c24] rounded-[14.4px] text-[#161616] cursor-pointer transition disabled:opacity-40"
                        >
                          ASSIGN WORK
                        </button>
                        <button
                          disabled={issue.status === 'In Progress'}
                          onClick={() => handleStatusChangeSim(issue.id, 'In Progress')}
                          className="px-3 py-1.5 text-[10px] font-mono border bg-[#ffffff] border-[#e5e5e5] hover:border-[#ff4c24] rounded-[14.4px] text-[#161616] cursor-pointer transition disabled:opacity-40"
                        >
                          MARK ACTIVE
                        </button>
                        <button
                          disabled={issue.status === 'Resolved'}
                          onClick={() => handleStatusChangeSim(issue.id, 'Resolved')}
                          className="px-3 py-1.5 text-[10px] font-mono border bg-[#ffffff] border-[#e5e5e5] hover:border-[#ff4c24] rounded-[14.4px] text-[#161616] cursor-pointer transition disabled:opacity-40"
                        >
                          RESOLVE ISSUE
                        </button>
                      </div>

                      {/* Custom timeline comment input */}
                      <input
                        type="text"
                        placeholder="Add specific inspector notes (optional)..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full mt-2 px-3 py-2 text-xs border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] text-[#161616] placeholder-[#7b7a7c] focus:outline-none focus:border-[#ff4c24] font-grotesk transition"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
