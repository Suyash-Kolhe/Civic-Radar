/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import { Award, Trophy, User, Check, ShieldAlert, Star, Shield } from 'lucide-react';

interface GamificationCenterProps {
  leaderboard: LeaderboardEntry[];
  currentUsername: string;
  onUpdateUsername: (newName: string) => void;
  issues: any[];
}

const ALL_BADGES = [
  {
    id: 'first-rep',
    name: 'First Report',
    description: 'Logged your very first community incident pin.',
    icon: Trophy,
    color: 'text-[#ff4c24] bg-[#ffffff] border-[#e5e5e5]'
  },
  {
    id: 'verify',
    name: 'Verifier Badge',
    description: 'Voted/verified another citizen reported incident.',
    icon: Star,
    color: 'text-[#161616] bg-[#ffffff] border-[#e5e5e5]'
  },
  {
    id: 'active-rep',
    name: 'Active Reporter',
    description: 'Submitted 3 or more incident reports.',
    icon: ShieldAlert,
    color: 'text-[#ff6436] bg-[#ffffff] border-[#e5e5e5]'
  },
  {
    id: 'civic-guard',
    name: 'Civic Guard',
    description: 'Completed 5 or more community upvotes.',
    icon: Shield,
    color: 'text-[#161616] bg-[#ffffff] border-[#e5e5e5]'
  },
  {
    id: 'hyperlocal-hero',
    name: 'Hyperlocal Hero',
    description: 'Ultimate civic status. Unlocked with 5 reports + 10 verifications.',
    icon: Award,
    color: 'text-[#ff4c24] bg-[#ffffff] border-[#e5e5e5]'
  }
];

export default function GamificationCenter({
  leaderboard,
  currentUsername,
  onUpdateUsername,
  issues
}: GamificationCenterProps) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentUsername);

  // Retrieve active stats for the currently selected user from leaderboard
  const currentUserStats = leaderboard.find(entry => entry.username === currentUsername) || {
    username: currentUsername,
    points: 0,
    reportsCount: 0,
    verificationsCount: 0,
    badges: []
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateUsername(tempName.trim());
      setEditingName(false);
    }
  };

  return (
    <div id="gamification-center" className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[#161616]">
      
      {/* Col 1: Active User Profile Card */}
      <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex flex-col justify-between space-y-6 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.01]">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider">
              YOUR CIVIC PROFILE
            </span>
            <span className="font-mono text-[9px] text-[#ff4c24] bg-[#ff4c24]/10 border border-[#ff4c24]/20 px-2 py-0.5 rounded-[14.4px] font-medium uppercase tracking-widest">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#ffffff] border border-[#e5e5e5] flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-[#161616]" />
            </div>

            <div className="flex-1 min-w-0">
              {editingName ? (
                <form onSubmit={handleSaveName} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#e5e5e5] bg-[#ffffff] text-[#161616] rounded-[14.4px] focus:outline-none focus:border-[#ff4c24] font-grotesk"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#161616] text-white rounded-[14.4px] cursor-pointer transition hover:bg-opacity-90 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-gravity text-[#161616] text-base truncate">
                    {currentUsername}
                  </h3>
                  <button
                    onClick={() => {
                      setTempName(currentUsername);
                      setEditingName(true);
                    }}
                    className="text-[10px] font-mono text-[#7b7a7c] underline hover:text-[#161616] cursor-pointer"
                  >
                    EDIT
                  </button>
                </div>
              )}
              <p className="font-mono text-[10px] text-[#7b7a7c] mt-0.5">
                CIVIC ID: #{(currentUsername.charCodeAt(0) || 1) * 999}
              </p>
            </div>
          </div>

          {/* Active Points metrics */}
          <div className="grid grid-cols-3 gap-2 bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-4 text-center transition-all duration-300 ease-in-out hover:shadow hover:border-neutral-400 hover:scale-[1.015]">
            <div>
              <span className="font-mono text-lg font-semibold text-[#161616] block">
                {currentUserStats.points}
              </span>
              <span className="text-[9px] text-[#7b7a7c] uppercase tracking-wider block font-mono">
                XP Points
              </span>
            </div>
            <div>
              <span className="font-mono text-lg font-semibold text-[#161616] block">
                {currentUserStats.reportsCount}
              </span>
              <span className="text-[9px] text-[#7b7a7c] uppercase tracking-wider block font-mono">
                Reports
              </span>
            </div>
            <div>
              <span className="font-mono text-lg font-semibold text-[#161616] block">
                {currentUserStats.verificationsCount}
              </span>
              <span className="text-[9px] text-[#7b7a7c] uppercase tracking-wider block font-mono">
                Upvotes
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-4 text-[11px] text-[#555555] leading-relaxed space-y-1.5 transition-all duration-300 ease-in-out hover:shadow hover:border-neutral-400 hover:scale-[1.015]">
          <span className="font-mono text-xs text-[#161616] uppercase tracking-wider block mb-1">XP Points Breakdown:</span>
          <ul className="list-disc pl-4 space-y-1 text-[#555555] font-grotesk">
            <li>File an Incident report: <span className="font-mono text-[#161616] font-semibold">+50 XP</span></li>
            <li>Verify another user's report: <span className="font-mono text-[#161616] font-semibold">+15 XP</span></li>
            <li>Issue transitions to "Resolved": <span className="font-mono text-[#161616] font-semibold">+100 XP</span></li>
          </ul>
        </div>
      </div>

      {/* Col 2: Badges Checklist */}
      <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 space-y-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.01]">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
          <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider">
            CIVIC MERITS / BADGES
          </span>
          <span className="font-mono text-[10px] text-[#7b7a7c]">
            {currentUserStats.badges.length} / 5 Unlocked
          </span>
        </div>

        <div className="space-y-3">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = currentUserStats.badges.includes(badge.name);
            const IconComp = badge.icon;

            return (
              <div
                key={badge.id}
                className={`flex items-start gap-3 p-3 rounded-[14.4px] border shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow ${
                  isUnlocked
                    ? 'bg-[#ffffff] border-[#e5e5e5] opacity-100 hover:border-neutral-400'
                    : 'bg-transparent border-[#e5e5e5]/30 opacity-50 hover:border-neutral-400'
                }`}
              >
                <div className={`p-1.5 border rounded-[14.4px] shrink-0 ${badge.color}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-grotesk text-xs text-[#161616] font-semibold">
                      {badge.name}
                    </h4>
                    {isUnlocked ? (
                      <span className="text-[8px] bg-[#ff4c24]/10 border border-[#ff4c24]/20 text-[#ff4c24] px-1.5 py-0.5 rounded-full font-mono font-medium uppercase tracking-wider">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[8px] bg-[#ffffff] text-[#7b7a7c] border border-[#e5e5e5] px-1.5 py-0.5 rounded-full font-mono font-medium uppercase">
                        LOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#7b7a7c] font-grotesk mt-0.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Col 3: Leaderboard */}
      <div className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] p-6 flex flex-col h-full space-y-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.01]">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
          <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider">
            LEADERBOARD STANDINGS
          </span>
          <Trophy className="w-4 h-4 text-[#161616] shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.username === currentUsername;
            
            return (
              <div
                key={entry.username}
                className={`flex items-center justify-between p-3 border rounded-[14.4px] shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow ${
                  isCurrentUser
                    ? 'border-[#ff4c24] bg-[#ffffff] shadow-md'
                    : 'border-[#e5e5e5] hover:border-neutral-400 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="font-mono text-[#7b7a7c] text-[10px] w-4 shrink-0 text-center">
                    {index + 1}
                  </div>
                  <div className="w-8 h-8 rounded-[14.4px] bg-[#ffffff] border border-[#e5e5e5] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#7b7a7c]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-grotesk text-[#161616] font-semibold truncate text-xs">
                      {entry.username} {isCurrentUser && '(You)'}
                    </p>
                    <p className="text-[9px] font-mono text-[#7b7a7c] mt-0.5">
                      {entry.reportsCount} reps • {entry.verificationsCount} upvotes
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono text-xs text-[#161616] font-semibold">
                    {entry.points} XP
                  </span>
                  <div className="flex gap-0.5 mt-0.5">
                    {entry.badges.slice(0, 2).map((b, i) => (
                      <span
                        key={i}
                        title={b}
                        className="w-1.5 h-1.5 rounded-full bg-[#161616] inline-block"
                      ></span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
