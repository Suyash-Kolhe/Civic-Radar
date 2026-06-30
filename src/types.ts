/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory =
  | 'Roads & Potholes'
  | 'Water Leakage'
  | 'Electrical/Streetlights'
  | 'Waste Management'
  | 'Public Safety/Infrastructure';

export type IssueStatus =
  | 'Reported'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface StatusTimelineEntry {
  status: IssueStatus;
  timestamp: string; // ISO string
  notes: string;
  updatedBy: string;
}

export interface CivicIssue {
  id: string;
  category: IssueCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    neighborhood: string;
  };
  imageUrl?: string;
  videoUrl?: string;
  status: IssueStatus;
  reportedBy: string; // Username
  reportedAt: string; // ISO string
  upvotes: number;
  upvotedBy: string[]; // List of user emails/names
  timeline: StatusTimelineEntry[];
  suggestedAction?: string;
  aiAnalyzed: boolean;
  resolutionTimeHours?: number;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  reportsCount: number;
  verificationsCount: number;
  badges: string[];
}

export interface PredictiveInsight {
  id: string;
  type: 'hotspot' | 'trend' | 'spike';
  category: IssueCategory;
  locationName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number; // 0-100
}

export interface UserStats {
  username: string;
  points: number;
  reportsCount: number;
  verificationsCount: number;
  badges: {
    id: string;
    name: string;
    description: string;
    iconName: string;
    unlockedAt?: string;
  }[];
}
