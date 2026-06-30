/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CivicIssue, LeaderboardEntry, PredictiveInsight, IssueStatus, IssueCategory, SeverityLevel } from './types';
import InteractiveMap from './components/InteractiveMap';
import ReportingForm from './components/ReportingForm';
import IssuesFeed from './components/IssuesFeed';
import ImpactDashboard from './components/ImpactDashboard';
import GamificationCenter from './components/GamificationCenter';
import PredictiveInsights from './components/PredictiveInsights';
import { Map, ShieldAlert, Award, TrendingUp, Clock, Brain, Landmark, AlertTriangle, User, RefreshCw, ThumbsUp, Calendar, Settings, ArrowRight, Activity, MapPin, X } from 'lucide-react';

export default function App() {
  // Application Data States
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  
  // Navigation & Interactive States
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'bulletins' | 'dashboard' | 'leaderboard' | 'insights'>('home');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedNewCoords, setSelectedNewCoords] = useState<{ lat: number; lng: number; address: string; neighborhood: string } | null>(null);
  
  // Filters (shared across map & feed)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');

  // Gamified User Session Setup
  const [currentUsername, setCurrentUsername] = useState<string>('Suyash Kolhe');
  const [inspectorNotes, setInspectorNotes] = useState<string>('');

  // Interactive Live Clock
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());

  // Error & loading metrics
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize and load database on mount
  useEffect(() => {
    fetchInitialData();

    // Clock ticker
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [resIssues, resLeaderboard, resInsights] = await Promise.all([
        fetch('/api/issues'),
        fetch('/api/leaderboard'),
        fetch('/api/insights')
      ]);

      if (!resIssues.ok || !resLeaderboard.ok || !resInsights.ok) {
        throw new Error('Failed to retrieve core database stores.');
      }

      const issuesData = await resIssues.json();
      const leaderboardData = await resLeaderboard.json();
      const insightsData = await resInsights.json();

      setIssues(issuesData);
      setLeaderboard(leaderboardData);
      setInsights(insightsData);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Local server connections timed out. Showing fallback local indicators.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. SELECT COORDINATES FROM DROPPED PIN ON MAP
  const handleSelectCoordinates = (lat: number, lng: number, address: string, neighborhood: string) => {
    setSelectedNewCoords({ lat, lng, address, neighborhood });
    setSelectedIssueId(null); // Deselect active issue card
  };

  // 2. FILE REPORT FORM SUBMISSION (TRIGGERED AFTER GEMINI RUNS)
  const handleFormSubmit = async (data: {
    title: string;
    description: string;
    category: IssueCategory;
    severity: SeverityLevel;
    location: { lat: number; lng: number; address: string; neighborhood: string };
    imageUrl: string;
  }) => {
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          reportedBy: currentUsername
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register incident with Municipal Server.');
      }

      const result = await response.json();
      
      // Update local states reactively
      setIssues(prev => [result.issue, ...prev]);
      setLeaderboard(result.leaderboard);
      
      // Clear reporting state
      setSelectedNewCoords(null);
      
      // Recalculate predictive insights
      const resInsights = await fetch('/api/insights');
      if (resInsights.ok) {
        const insightsData = await resInsights.json();
        setInsights(insightsData);
      }
    } catch (err) {
      console.error(err);
      alert('Could not submit report. Check server logs.');
    }
  };

  // 3. UPVOTE / VERIFY INCIDENT PIN
  const handleVerifyIssue = async (issueId: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to register upvote');
      }

      const result = await response.json();
      
      // Update target issue
      setIssues(prev => prev.map(i => i.id === issueId ? result.issue : i));
      setLeaderboard(result.leaderboard);

      // Recalculate insights
      const resInsights = await fetch('/api/insights');
      if (resInsights.ok) {
        const insightsData = await resInsights.json();
        setInsights(insightsData);
      }
    } catch (err: any) {
      alert(err.message || 'Verification failure');
    }
  };

  // 4. MANUAL STATUS PROGRESSION (SIMULATOR FOR THE WORKFLOW)
  const handleUpdateStatus = async (issueId: string, status: IssueStatus, notes: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, updatedBy: currentUsername })
      });

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }

      const updatedIssue = await response.json();
      
      // Sync local issues state
      setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));

      // Re-fetch insights
      const resInsights = await fetch('/api/insights');
      if (resInsights.ok) {
        const insightsData = await resInsights.json();
        setInsights(insightsData);
      }
    } catch (err) {
      console.error(err);
      alert('Status modification failure');
    }
  };

  // 5. UPDATE CURRENT DEMO PROFILE USERNAME
  const handleUpdateUsername = (newName: string) => {
    setCurrentUsername(newName);
    // Find or create in leaderboard
    const userExists = leaderboard.some(u => u.username === newName);
    if (!userExists) {
      setLeaderboard(prev => [
        ...prev,
        {
          username: newName,
          points: 0,
          reportsCount: 0,
          verificationsCount: 0,
          badges: []
        }
      ].sort((a, b) => b.points - a.points));
    }
  };

  const getStatusBadgeStyles = (status: IssueStatus) => {
    switch (status) {
      case 'Reported':
        return 'border border-[#e5e5e5] bg-[#ffffff] text-[#7b7a7c]';
      case 'Verified':
        return 'border border-[#e5e5e5] bg-[#ffffff] text-[#161616] font-semibold';
      case 'Assigned':
        return 'border border-[#e5e5e5] bg-[#ffffff] text-[#161616] font-semibold';
      case 'In Progress':
        return 'border border-[#ff6436]/30 bg-[#ff6436]/10 text-[#ff6436]';
      case 'Resolved':
        return 'border border-[#ff4c24]/40 bg-[#ff4c24]/10 text-[#ff4c24]';
    }
  };

  const getSeverityBadgeStyles = (severity: string) => {
    switch (severity) {
      case 'Low':
        return 'bg-[#ffffff] border border-[#e5e5e5] text-[#7b7a7c]';
      case 'Medium':
        return 'bg-[#ffffff] border border-[#e5e5e5] text-[#161616] font-semibold';
      case 'High':
        return 'bg-[#ff6436]/10 border border-[#ff6436]/20 text-[#ff6436]';
      case 'Critical':
        return 'bg-[#ff4c24]/10 border border-[#ff4c24]/30 text-[#ff4c24] font-semibold animate-pulse';
      default:
        return 'bg-[#ffffff] border border-[#e5e5e5] text-[#7b7a7c]';
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative text-[#161616]">
      
      {/* Sticky Pill Navigation styled to fit Dylanbrouwer Monolithic design */}
      <header className="sticky top-4 z-50 bg-[#ffffff]/90 backdrop-blur-md border border-[#e5e5e5] rounded-[14.4px] px-6 py-4 flex flex-wrap items-center justify-between gap-4 mb-12 transition-all shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ffffff] text-[#161616] rounded-[14.4px] border border-[#e5e5e5]">
            <Landmark className="w-4 h-4 text-[#ff4c24]" />
          </div>
          <div className="flex flex-col">
            <span className="font-gravity font-normal text-sm tracking-tight text-[#161616] uppercase flex items-center gap-1.5">
              CIVIC RADAR <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff4c24] animate-ping"></span>
            </span>
            <span className="font-mono text-[9px] text-[#7b7a7c] uppercase tracking-widest">MUMBAI • GN & H-WEST WARDS</span>
          </div>
        </div>

        {/* Tab Links inside Nav */}
        <nav className="flex flex-wrap items-center gap-1 bg-[#ffffff] p-1 rounded-[14.4px] border border-[#e5e5e5]">
          <button
            onClick={() => { setActiveTab('home'); setSelectedIssueId(null); setSelectedNewCoords(null); }}
            className={`px-3 py-1.5 rounded-[14.4px] text-xs font-mono transition cursor-pointer ${
              activeTab === 'home'
                ? 'bg-[#161616] text-white font-semibold'
                : 'text-[#7b7a7c] hover:text-[#161616]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => { setActiveTab('map'); setSelectedIssueId(null); setSelectedNewCoords(null); }}
            className={`px-3 py-1.5 rounded-[14.4px] text-xs font-mono transition cursor-pointer ${
              activeTab === 'map'
                ? 'bg-[#161616] text-white font-semibold'
                : 'text-[#7b7a7c] hover:text-[#161616]'
            }`}
          >
            Map Radar
          </button>
          <button
            onClick={() => { setActiveTab('bulletins'); setSelectedIssueId(null); setSelectedNewCoords(null); }}
            className={`px-3 py-1.5 rounded-[14.4px] text-xs font-mono transition cursor-pointer ${
              activeTab === 'bulletins'
                ? 'bg-[#161616] text-white font-semibold'
                : 'text-[#7b7a7c] hover:text-[#161616]'
            }`}
          >
            Bulletins
          </button>
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedIssueId(null); setSelectedNewCoords(null); }}
            className={`px-3 py-1.5 rounded-[14.4px] text-xs font-mono transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#161616] text-white font-semibold'
                : 'text-[#7b7a7c] hover:text-[#161616]'
            }`}
          >
            Impact
          </button>
          <button
            onClick={() => { setActiveTab('leaderboard'); setSelectedIssueId(null); setSelectedNewCoords(null); }}
            className={`px-3 py-1.5 rounded-[14.4px] text-xs font-mono transition cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#161616] text-white font-semibold'
                : 'text-[#7b7a7c] hover:text-[#161616]'
            }`}
          >
            Heroes
          </button>
          <button
            onClick={() => { setActiveTab('insights'); setSelectedIssueId(null); setSelectedNewCoords(null); }}
            className={`px-3 py-1.5 rounded-[14.4px] text-xs font-mono transition cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-[#161616] text-white font-semibold'
                : 'text-[#7b7a7c] hover:text-[#161616]'
            }`}
          >
            Predictive AI
          </button>
        </nav>

        {/* Spectator Active Metadata on the right */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex flex-col text-right font-mono text-[9px] text-[#7b7a7c]">
            <span className="flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4c24]"></span>
              API GRID: <span className="text-[#161616] font-semibold">ONLINE</span>
            </span>
            <span>CITIZEN: <span className="text-[#161616] font-semibold underline">{currentUsername}</span></span>
          </div>
          <button
            onClick={fetchInitialData}
            className="p-1.5 border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] hover:bg-[#f6f6f6] transition cursor-pointer text-[#161616]"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#7b7a7c] hover:text-[#161616]" />
          </button>
        </div>
      </header>

      {/* Main Container Views */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] shadow-sm">
            <div className="w-10 h-10 border-2 border-[#e5e5e5] border-t-[#ff4c24] rounded-full animate-spin"></div>
            <p className="font-mono text-[10px] text-[#7b7a7c] mt-4 uppercase tracking-widest font-bold">
              Connecting to Mumbai Ward Servers...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="bg-[#ffffff] border border-red-500/30 p-6 rounded-[14.4px] text-red-600 mb-6 flex items-start gap-4 shadow-sm">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="font-mono text-[10px] tracking-wide uppercase text-red-600">// CONNECTION DELAYED</p>
              <p className="text-xs mt-1 text-[#7b7a7c]">{errorMessage}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* VIEW 0: DYLANBROUWER CINEMATIC LANDING PAGE */}
            {activeTab === 'home' && (
              <div className="space-y-16">
                {/* Monolithic Chrome Hero Section emerging from fog */}
                <div className="relative py-20 md:py-32 text-center select-none overflow-hidden rounded-[14.4px] bg-gradient-to-b from-[#faf9f8] via-[#f3f2f0] to-[#e8e7e3] border border-[#e5e5e5] shadow-sm">
                  {/* Subtle Fog background effects */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_70%)] pointer-events-none"></div>
                  
                  <div className="inline-block text-left max-w-4xl px-6 relative z-10">
                    <span className="font-mono text-xs text-[#7b7a7c] uppercase tracking-[0.2em] block mb-6">
                      MUMBAI MUNICIPAL VERIFICATION GRID
                    </span>
                    <h1 className="text-6xl sm:text-8xl md:text-9xl font-gravity tracking-tighter uppercase leading-[0.85] text-[#161616]">
                      I BUILD <br />
                      <span className="text-[#ff4c24]">CIVIC</span> <br />
                      THINGS
                    </h1>
                    <p className="mt-8 text-xs sm:text-sm font-mono text-[#7b7a7c] max-w-xl tracking-tight uppercase leading-[1.6]">
                      // DYLANBROUWER DESIGN PATTERN FOR CIVIC RADAR.
                      A high-precision incident response network operating with confident negative space and dramatic monolithic jumps.
                    </p>
                  </div>
                </div>

                {/* About & Live Status Grid — Pivot into high contrast bright white sections */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  {/* Bio Card in clean bright white container */}
                  <div className="md:col-span-8 bg-white border border-[#eae9e8] rounded-[14.4px] p-8 flex flex-col justify-between text-black shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.01] hover:border-neutral-400">
                    <div className="space-y-4">
                      <span className="font-mono text-xs text-[#7b7a7c] uppercase tracking-wider">// DESIGN INTEGRITY & PUBLIC RESPONSIBILITY</span>
                      <p className="text-xl sm:text-3xl text-black font-gravity tracking-tight leading-tight">
                        Hi, we are building highly resilient, community-verified municipal systems. This dashboard operates as a civic darkroom—exposing infrastructure needs across Dadar, Bandra, Juhu, and Colaba for immediate public action.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-8">
                      <button 
                        onClick={() => setActiveTab('map')}
                        className="px-6 py-3 bg-black text-white font-mono text-xs rounded-[14.4px] hover:bg-opacity-90 transition uppercase tracking-wider cursor-pointer font-semibold"
                      >
                        Launch Map Radar
                      </button>
                      <button 
                        onClick={() => setActiveTab('bulletins')}
                        className="px-6 py-3 bg-white text-black border border-black font-mono text-xs rounded-[14.4px] hover:bg-[#f6f6f6] transition uppercase tracking-wider cursor-pointer font-semibold"
                      >
                        Browse Incident Bulletins
                      </button>
                    </div>
                  </div>

                  {/* Live Status Card - Pure white */}
                  <div className="md:col-span-4 bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-8 flex flex-col justify-between text-[#161616] shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.01] hover:border-neutral-400">
                    <div className="space-y-2">
                      <span className="font-mono text-xs text-[#7b7a7c] uppercase tracking-wider">// LATEST STATUS</span>
                      <h3 className="text-lg text-[#161616] font-gravity uppercase tracking-tight leading-none pt-1">
                        MCGM Integration
                      </h3>
                      <p className="text-xs text-[#555555] leading-relaxed font-grotesk">
                        Consolidated BMC database pipelines connected for instant telemetry on public repairs and active service crews.
                      </p>
                    </div>

                    <div className="mt-6">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#ff4c24]/10 rounded-[14.4px] border border-[#ff4c24]/20 select-none">
                        <span className="w-2 h-2 rounded-full bg-[#ff4c24] animate-pulse"></span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#ff4c24] font-semibold">
                          DISPATCH: ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applications Showcase */}
                <div className="space-y-6">
                  <div className="border-b border-[#e5e5e5] pb-3">
                    <h2 className="font-mono text-xs text-[#7b7a7c] uppercase tracking-widest">// CIVIC SERVICE CONTROL ROOMS</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Map Radar */}
                    <div 
                      onClick={() => setActiveTab('map')}
                      className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-6 hover:border-[#ff4c24] cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.03] flex flex-col justify-between h-52 group shadow-sm"
                    >
                      <div>
                        <span className="font-mono text-xs text-[#7b7a7c]">01 // APP</span>
                        <h3 className="text-lg text-[#161616] font-gravity mt-2 uppercase font-semibold">Map Radar</h3>
                        <p className="text-xs text-[#7b7a7c] mt-1 line-clamp-2 leading-relaxed">High-precision map coordinates tracker with reverse geocoding.</p>
                      </div>
                      <span className="text-xs font-mono text-[#161616] font-semibold uppercase tracking-wider mt-4">Launch App →</span>
                    </div>

                    {/* Card 2: Incident Bulletins */}
                    <div 
                      onClick={() => setActiveTab('bulletins')}
                      className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-6 hover:border-[#ff4c24] cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.03] flex flex-col justify-between h-52 group shadow-sm"
                    >
                      <div>
                        <span className="font-mono text-xs text-[#7b7a7c]">02 // APP</span>
                        <h3 className="text-lg text-[#161616] font-gravity mt-2 uppercase font-semibold">Bulletins Feed</h3>
                        <p className="text-xs text-[#7b7a7c] mt-1 line-clamp-2 leading-relaxed">Real-time public incident stream, timeline milestones, and verification logs.</p>
                      </div>
                      <span className="text-xs font-mono text-[#161616] font-semibold uppercase tracking-wider mt-4">Launch App →</span>
                    </div>

                    {/* Card 3: Impact Analytics */}
                    <div 
                      onClick={() => setActiveTab('dashboard')}
                      className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-6 hover:border-[#ff4c24] cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.03] flex flex-col justify-between h-52 group shadow-sm"
                    >
                      <div>
                        <span className="font-mono text-xs text-[#7b7a7c]">03 // APP</span>
                        <h3 className="text-lg text-[#161616] font-gravity mt-2 uppercase font-semibold">Impact Analytics</h3>
                        <p className="text-xs text-[#7b7a7c] mt-1 line-clamp-2 leading-relaxed">Grayscale bento-grid charts indicating municipal progress indices.</p>
                      </div>
                      <span className="text-xs font-mono text-[#161616] font-semibold uppercase tracking-wider mt-4">Launch App →</span>
                    </div>

                    {/* Card 4: Predictive AI */}
                    <div 
                      onClick={() => setActiveTab('insights')}
                      className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-6 hover:border-[#ff4c24] cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.03] flex flex-col justify-between h-52 group shadow-sm"
                    >
                      <div>
                        <span className="font-mono text-xs text-[#7b7a7c]">04 // APP</span>
                        <h3 className="text-lg text-[#161616] font-gravity mt-2 uppercase font-semibold">Predictive AI</h3>
                        <p className="text-xs text-[#7b7a7c] mt-1 line-clamp-2 leading-relaxed">Incident density projections, safety hotspots, and risk matrix curves.</p>
                      </div>
                      <span className="text-xs font-mono text-[#161616] font-semibold uppercase tracking-wider mt-4">Launch App →</span>
                    </div>
                  </div>
                </div>

                {/* Live Activity Wire */}
                <div className="space-y-6">
                  <div className="border-b border-[#e5e5e5] pb-3 flex items-center justify-between">
                    <h2 className="font-mono text-xs text-[#7b7a7c] uppercase tracking-widest">// ACTIVE INCIDENTS TELEMETRY</h2>
                    <span 
                      onClick={() => setActiveTab('bulletins')}
                      className="text-xs font-mono text-[#161616] font-semibold hover:underline cursor-pointer"
                    >
                      View All Bulletins →
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {issues.slice(0, 4).map((issue) => (
                      <div 
                        key={issue.id}
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setActiveTab('map');
                        }}
                        className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-6 hover:border-[#ff4c24] cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] flex flex-col justify-between space-y-4 shadow-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-[#7b7a7c]">
                            <span className="border border-[#e5e5e5] bg-[#ffffff] px-2.5 py-0.5 rounded-[14.4px] uppercase">
                              {issue.category}
                            </span>
                            <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <h4 className="text-base text-[#161616] font-gravity uppercase font-semibold">{issue.title}</h4>
                            <p className="text-xs text-[#7b7a7c] mt-1 line-clamp-2 leading-relaxed font-grotesk">{issue.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#e5e5e5]">
                          <span className="text-[#ff6436] font-semibold">★ {issue.status.toUpperCase()}</span>
                          <span className="text-[#161616] font-semibold">Focus Map →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 1: MAP AND INCIDENT BULLETINS BOARD */}
            {activeTab === 'map' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Side: Dynamic Map View */}
                <div className="lg:col-span-7 h-full">
                  <InteractiveMap
                    issues={issues}
                    selectedIssueId={selectedIssueId}
                    onSelectIssue={(id) => {
                      setSelectedIssueId(id);
                      setSelectedNewCoords(null);
                    }}
                    onSelectCoordinates={handleSelectCoordinates}
                    selectedNewCoords={selectedNewCoords}
                    activeCategoryFilter={activeCategoryFilter}
                    activeStatusFilter={activeStatusFilter}
                  />
                </div>

                {/* Right Side: Double state (Report Form OR Focused Card Inspector) */}
                <div className="lg:col-span-5 flex flex-col h-[540px]">
                  {selectedNewCoords ? (
                    <div className="h-full relative">
                      <ReportingForm
                        selectedCoords={selectedNewCoords}
                        onSubmitReport={handleFormSubmit}
                        currentUsername={currentUsername}
                      />
                      {/* Floating Cancel button */}
                      <button
                        onClick={() => setSelectedNewCoords(null)}
                        className="absolute top-[52px] right-4 text-xs font-mono text-[#7b7a7c] hover:text-[#161616] underline cursor-pointer transition z-10"
                      >
                        [ CANCEL ]
                      </button>
                    </div>
                  ) : selectedIssueId && issues.find(i => i.id === selectedIssueId) ? (
                    (() => {
                      const selectedIssue = issues.find(i => i.id === selectedIssueId)!;
                      return (
                        <div className="h-full flex flex-col bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-6 overflow-y-auto text-[#161616] shadow-md">
                          <div className="border-b border-[#e5e5e5] pb-3 mb-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#ff4c24] animate-pulse"></span>
                              <h2 className="font-gravity uppercase text-[#161616] font-semibold text-sm">
                                Incident Inspector
                              </h2>
                            </div>
                            <button
                              onClick={() => setSelectedIssueId(null)}
                              className="text-xs font-mono text-[#7b7a7c] hover:text-[#161616] underline cursor-pointer transition"
                            >
                              [ CLOSE ]
                            </button>
                          </div>

                          <div className="flex-1 space-y-4 pr-1">
                            {/* Card Header Info */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                <span className="font-mono text-[10px] text-[#7b7a7c] uppercase tracking-wider border border-[#e5e5e5] px-2.5 py-0.5 rounded-[14.4px]">
                                  {selectedIssue.category}
                                </span>
                                <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded-[14.4px] uppercase tracking-wider ${getStatusBadgeStyles(selectedIssue.status)}`}>
                                  ★ {selectedIssue.status.toUpperCase()}
                                </span>
                                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-[14.4px] uppercase tracking-wider ${getSeverityBadgeStyles(selectedIssue.severity)}`}>
                                  {selectedIssue.severity}
                                </span>
                              </div>
                              <h3 className="font-gravity text-lg text-[#161616] font-semibold leading-tight uppercase">
                                {selectedIssue.title}
                              </h3>
                              <p className="text-[10px] font-mono text-[#7b7a7c]">
                                Reported: {new Date(selectedIssue.reportedAt).toLocaleDateString()} at {new Date(selectedIssue.reportedAt).toLocaleTimeString()}
                              </p>
                            </div>

                            {/* Image */}
                            {selectedIssue.imageUrl && (
                              <div className="w-full h-32 rounded-[14.4px] border border-[#e5e5e5] overflow-hidden">
                                <img src={selectedIssue.imageUrl} alt={selectedIssue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}

                            {/* Details & Location */}
                            <div className="space-y-3 bg-[#ffffff] p-4 rounded-[14.4px] border border-[#e5e5e5] shadow-sm">
                              <p className="text-[#555555] text-xs leading-relaxed font-grotesk">
                                {selectedIssue.description}
                              </p>
                              <div className="pt-2 border-t border-[#e5e5e5] flex items-start gap-2 text-xs text-[#161616]">
                                <MapPin className="w-3.5 h-3.5 text-[#ff4c24] shrink-0 mt-0.5" />
                                <div className="font-grotesk">
                                  <p className="leading-normal text-[#161616] font-semibold">{selectedIssue.location.address}</p>
                                  <p className="text-[10px] text-[#7b7a7c] font-mono mt-0.5">
                                    District: {selectedIssue.location.neighborhood} • Coord: {selectedIssue.location.lat.toFixed(4)}, {selectedIssue.location.lng.toFixed(4)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* AI Assessment if analyzed */}
                            {selectedIssue.aiAnalyzed && (
                              <div className="bg-[#ff4c24]/5 border border-[#ff4c24]/10 rounded-[14.4px] p-4 text-xs font-grotesk space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[#ff4c24] uppercase tracking-wider text-[10px] font-mono">
                                  <Award className="w-3.5 h-3.5 text-[#ff4c24]" />
                                  <span>MUNICIPAL AI ENGINEER ASSESSMENT</span>
                                </div>
                                <p className="text-xs text-[#161616] leading-relaxed">
                                  <span className="text-[#7b7a7c] uppercase tracking-wide text-[10px] font-mono block">RECOMMENDED DISPATCH:</span>{" "}
                                  <span className="italic text-[#161616] font-semibold">{selectedIssue.suggestedAction || 'Inspection scheduled.'}</span>
                                </p>
                              </div>
                            )}

                            {/* Verification Upvote Button */}
                            <div className="flex items-center justify-between gap-3 border-t border-b border-[#e5e5e5] py-3 bg-[#ffffff] px-3 rounded-[14.4px] shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono text-[#7b7a7c] uppercase tracking-wide">Consensus</span>
                                <span className="text-xs font-mono text-[#161616] font-semibold">{selectedIssue.upvotes} / 3 Votes</span>
                              </div>
                              <button
                                onClick={() => handleVerifyIssue(selectedIssue.id)}
                                disabled={selectedIssue.upvotedBy.includes(currentUsername) || selectedIssue.status === 'Resolved'}
                                className={`px-4 py-2 rounded-[14.4px] font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                  selectedIssue.upvotedBy.includes(currentUsername)
                                    ? 'bg-[#ffffff] text-[#7b7a7c] border border-[#e5e5e5] cursor-not-allowed'
                                    : selectedIssue.status === 'Resolved'
                                    ? 'bg-[#ffffff] text-[#7b7a7c] border border-[#e5e5e5] cursor-not-allowed'
                                    : 'bg-[#161616] text-white hover:bg-opacity-90 shadow-sm'
                                }`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>{selectedIssue.upvotedBy.includes(currentUsername) ? 'VERIFIED' : 'VERIFY INCIDENT'}</span>
                              </button>
                            </div>

                            {/* Timeline & Progress */}
                            <div className="space-y-3">
                              <h4 className="font-mono text-xs text-[#7b7a7c] uppercase tracking-wider">
                                Incident Dispatch Timeline
                              </h4>
                              <div className="relative border-l border-[#e5e5e5] pl-4 ml-2 space-y-4">
                                {selectedIssue.timeline.map((entry, index) => (
                                  <div key={index} className="relative">
                                    <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border bg-white border-[#ff4c24]"></span>
                                    <div className="text-xs">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[#161616] font-semibold uppercase tracking-wide text-[10px] bg-[#ffffff] border border-[#e5e5e5] px-2 py-0.5 rounded-[14.4px]">
                                          {entry.status}
                                        </span>
                                        <span className="text-[#7b7a7c] font-mono text-[10px]">
                                          {new Date(entry.timestamp).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <p className="text-[#555555] mt-1 leading-relaxed font-grotesk">{entry.notes}</p>
                                      <div className="flex items-center gap-1 text-[#7b7a7c] text-[10px] mt-1 font-mono">
                                        <User className="w-3 h-3" />
                                        <span>By: <span className="underline">{entry.updatedBy}</span></span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Simulator for the workflow */}
                            <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-4 space-y-3 shadow-sm">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7b7a7c] uppercase tracking-wider">
                                <Settings className="w-3.5 h-3.5 text-[#ff4c24] animate-spin" />
                                <span>Live Dispatch Simulator</span>
                              </div>
                              <p className="text-[11px] text-[#7b7a7c] font-grotesk leading-relaxed">
                                Advance lifecycle manually to simulate public works crew actions:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  disabled={selectedIssue.status === 'Assigned'}
                                  onClick={() => handleUpdateStatus(selectedIssue.id, 'Assigned', inspectorNotes || 'Assigned to specialized BMC maintenance dispatch unit.')}
                                  className="px-3 py-1.5 text-[10px] font-mono border bg-[#ffffff] border-[#e5e5e5] hover:border-[#161616] rounded-[14.4px] text-[#161616] cursor-pointer transition disabled:opacity-40 shadow-sm"
                                >
                                  ASSIGN
                                </button>
                                <button
                                  disabled={selectedIssue.status === 'In Progress'}
                                  onClick={() => handleUpdateStatus(selectedIssue.id, 'In Progress', inspectorNotes || 'Service truck dispatched. Repairs actively underway on site.')}
                                  className="px-3 py-1.5 text-[10px] font-mono border bg-[#ffffff] border-[#e5e5e5] hover:border-[#161616] rounded-[14.4px] text-[#161616] cursor-pointer transition disabled:opacity-40 shadow-sm"
                                >
                                  ACTIVE
                                </button>
                                <button
                                  disabled={selectedIssue.status === 'Resolved'}
                                  onClick={() => handleUpdateStatus(selectedIssue.id, 'Resolved', inspectorNotes || 'Repair successfully completed. Site inspected, photographed, and approved.')}
                                  className="px-3 py-1.5 text-[10px] font-mono border bg-[#ffffff] border-[#e5e5e5] hover:border-[#161616] rounded-[14.4px] text-[#161616] cursor-pointer transition disabled:opacity-40 shadow-sm"
                                >
                                  RESOLVE
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Inspector note (optional)..."
                                value={inspectorNotes}
                                onChange={(e) => setInspectorNotes(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] text-[#161616] placeholder-[#7b7a7c] focus:outline-none focus:border-[#161616] font-grotesk transition"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* Dynamic unselected control view - High-Contrast white section to contrast the dark map */
                    <div className="h-full flex flex-col justify-between bg-white border border-[#eae9e8] rounded-[14.4px] p-6 text-black shadow-lg">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#eae9e8] pb-3">
                          <div className="p-1.5 bg-black text-white rounded-[14.4px]">
                            <Activity className="w-4 h-4 text-[#ff4c24]" />
                          </div>
                          <div>
                            <h2 className="font-gravity uppercase text-black text-sm">
                              MCGM Control Centre
                            </h2>
                            <p className="text-[10px] text-[#7b7a7c] font-mono tracking-wide mt-0.5">
                              MUNICIPAL DISPATCH TELEMETRY
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-gravity text-black text-xs uppercase">
                            Ready to report or inspect?
                          </h3>
                          
                          <div className="space-y-2.5 text-xs text-[#7b7a7c] leading-relaxed font-grotesk">
                            <div className="flex gap-2 items-start">
                              <span className="font-mono text-[10px] text-[#ff4c24] font-bold shrink-0">01 //</span>
                              <p>
                                <span className="font-semibold text-black">REPORT NEW INCIDENT:</span> Click anywhere on the high-precision Mumbai map to drop an instant locator pin. The reverse geolocator will lock and load immediately.
                              </p>
                            </div>
                            
                            <div className="flex gap-2 items-start">
                              <span className="font-mono text-[10px] text-black font-bold shrink-0">02 //</span>
                              <p>
                                <span className="font-semibold text-black">INSPECT INCIDENTS:</span> Click any existing category-colored marker on the map to open the live inspector for that complaint.
                              </p>
                            </div>

                            <div className="flex gap-2 items-start">
                              <span className="font-mono text-[10px] text-[#ff4c24] font-bold shrink-0">03 //</span>
                              <p>
                                <span className="font-semibold text-black">AI ASSESSMENT:</span> Submitting a report triggers live Gemini API auto-categorization and suggested dispatch recommendations.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#eae9e8] pt-4">
                        <button
                          onClick={() => setActiveTab('bulletins')}
                          className="w-full py-2.5 bg-black hover:bg-opacity-95 text-white font-mono text-xs uppercase tracking-wider rounded-[14.4px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Browse All Incident Bulletins
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: DEDICATED SEPARATE INCIDENT BULLETINS VIEW */}
            {activeTab === 'bulletins' && (
              <div className="space-y-6">
                <div className="bg-white border border-[#eae9e8] rounded-[14.4px] p-6 text-black shadow-lg">
                  <div className="border-b border-[#eae9e8] pb-4 mb-6">
                    <h2 className="font-gravity text-black text-xl uppercase flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#ff4c24] animate-pulse" />
                      Public Civic Register & Dispatch Bulletins
                    </h2>
                    <p className="text-xs text-[#7b7a7c] font-grotesk mt-1 max-w-4xl">
                      Browse, filter, and verify community-sourced reports from Dadar, Bandra, Juhu, Andheri, and Colaba. Double-click on any map pin to focus on the map or expand a bulletin below to manually advance the dispatch lifecycle using our interactive simulators.
                    </p>
                  </div>

                  <IssuesFeed
                    issues={issues}
                    selectedIssueId={selectedIssueId}
                    onSelectIssue={(id) => {
                      setSelectedIssueId(id);
                      setActiveTab('map');
                    }}
                    onVerifyIssue={handleVerifyIssue}
                    onUpdateStatus={handleUpdateStatus}
                    currentUsername={currentUsername}
                    activeCategoryFilter={activeCategoryFilter}
                    setActiveCategoryFilter={setActiveCategoryFilter}
                    activeStatusFilter={activeStatusFilter}
                    setActiveStatusFilter={setActiveStatusFilter}
                  />
                </div>
              </div>
            )}

            {/* VIEW 3: PERFORMANCE IMPACT DASHBOARD */}
            {activeTab === 'dashboard' && (
              <ImpactDashboard issues={issues} />
            )}

            {/* VIEW 4: GAMIFIED LEADERBOARDS & PROFILES */}
            {activeTab === 'leaderboard' && (
              <GamificationCenter
                leaderboard={leaderboard}
                currentUsername={currentUsername}
                onUpdateUsername={handleUpdateUsername}
                issues={issues}
              />
            )}

            {/* VIEW 5: PREDICTIVE PATTERNS / INSIGHTS */}
            {activeTab === 'insights' && (
              <PredictiveInsights insights={insights} />
            )}
          </div>
        )}
      </main>

      {/* Styled Government Seal footer - Dylanbrouwer grayscale */}
      <footer className="mt-16 border-t border-[#e5e5e5] pt-8 text-center text-xs font-mono text-[#7b7a7c] space-y-1.5 pb-8">
        <p className="font-bold text-[#161616] uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-1.5">
          <span className="text-[#ff4c24]">★</span> MCGM CIVIC INITIATIVE VERIFICATION BOARD <span className="text-[#ff4c24]">★</span>
        </p>
        <p className="max-w-2xl mx-auto font-grotesk text-xs">
          Mumbai Suburban District Public Disclosures Registry Code: BOM-HW-400050. Powered by community consensus & Gemini-driven auto-categorizations.
        </p>
        <p className="text-[10px] text-[#7b7a7c]">
          Designed in accordance with the Monolithic Grayscale Design System. All rights reserved 2026.
        </p>
      </footer>
    </div>
  );
}
