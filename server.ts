/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { CivicIssue, IssueCategory, IssueStatus, SeverityLevel, LeaderboardEntry, PredictiveInsight, UserStats } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits for base64 uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Lazy init Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

// Memory database
let issues: CivicIssue[] = [
  {
    id: 'iss-001',
    category: 'Roads & Potholes',
    severity: 'High',
    title: 'Severe Pothole Cluster on Gokhale Road, Dadar West',
    description: 'A deep cluster of four severe monsoon potholes has opened up right near Dadar Station junction on Gokhale Road. The craters are filled with muddy rainwater, forcing auto-rickshaws and BEST buses to swerve dangerously, causing massive gridlocks and a high safety hazard for two-wheelers.',
    location: {
      lat: 19.0182,
      lng: 72.8430,
      address: 'Gokhale Road, near Dadar Station, Dadar West, Mumbai',
      neighborhood: 'Dadar West'
    },
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    status: 'Reported',
    reportedBy: 'Suyash Kolhe',
    reportedAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
    upvotes: 2,
    upvotedBy: ['Priya Sharma', 'Rajesh Kumar'],
    aiAnalyzed: true,
    suggestedAction: 'Cordon off the lane immediately. Dispatch BMC Ward GN-Dadar cold-mix asphalt patch team within 12 hours.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        notes: 'Issue reported with photo upload. Flagged high priority due to heavy Dadar local market traffic risk.',
        updatedBy: 'Suyash Kolhe'
      }
    ]
  },
  {
    id: 'iss-002',
    category: 'Water Leakage',
    severity: 'Critical',
    title: 'BMC Primary Water Main Pipe Burst Flooding Bandra West',
    description: 'A major underground 1800mm drinking water supply trunk pipe has burst beneath the pavement. High-pressure drinking water is actively bubbling up, flooding the local street, undermining road concrete, and completely dropping water pressure across Bandra West.',
    location: {
      lat: 19.0520,
      lng: 72.8315,
      address: 'Hill Road, near Bandra Police Station, Bandra West, Mumbai',
      neighborhood: 'Bandra West'
    },
    imageUrl: 'https://images.unsplash.com/photo-1485134532658-d720895a3b5e?auto=format&fit=crop&w=600&q=80',
    status: 'Verified',
    reportedBy: 'Amit Patel',
    reportedAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
    upvotes: 4,
    upvotedBy: ['Suyash Kolhe', 'Ananya Rao', 'Sneha Iyer', 'Rajesh Kumar'],
    aiAnalyzed: true,
    suggestedAction: 'Notify BMC Hydraulic Engineer Department immediately. Shut off the main water valve at SV Road junction and dispatch the emergency pipeline welding team.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
        notes: 'Water reported gushing through sidewalk paving slabs.',
        updatedBy: 'Amit Patel'
      },
      {
        status: 'Verified',
        timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
        notes: 'Verified by local Ward H-West citizens. Status automatically escalated to Critical.',
        updatedBy: 'System Engine'
      }
    ]
  },
  {
    id: 'iss-003',
    category: 'Electrical/Streetlights',
    severity: 'Medium',
    title: 'Flickering BEST Streetlight on Marine Drive Promenade',
    description: 'The decorative streetlamp pole right on the Marine Drive Promenade has a faulty automatic photocell sensor and is flickering constantly, leaving a major portion of the seafront pedestrian path dark and unsafe for evening walkers.',
    location: {
      lat: 18.9430,
      lng: 72.8235,
      address: 'Marine Drive Promenade, Netaji Subhash Chandra Bose Road, Colaba, Mumbai',
      neighborhood: 'Colaba'
    },
    imageUrl: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=600&q=80',
    status: 'Resolved',
    reportedBy: 'Priya Sharma',
    reportedAt: new Date(Date.now() - 48 * 3600000).toISOString(), // 2 days ago
    upvotes: 5,
    upvotedBy: ['Amit Patel', 'Sneha Iyer', 'Ananya Rao', 'Rajesh Kumar', 'Suyash Kolhe'],
    aiAnalyzed: true,
    suggestedAction: 'Assign BEST Undertaking streetlight division maintenance crew to replace the faulty LED driver and clean the optical sensor.',
    resolutionTimeHours: 18,
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
        notes: 'Logged streetlamp malfunctioning opposite the promenade seating.',
        updatedBy: 'Priya Sharma'
      },
      {
        status: 'Verified',
        timestamp: new Date(Date.now() - 46 * 3600000).toISOString(),
        notes: 'Verified by Marine Drive residents upvote group.',
        updatedBy: 'System Engine'
      },
      {
        status: 'Assigned',
        timestamp: new Date(Date.now() - 42 * 3600000).toISOString(),
        notes: 'Assigned to BEST Electricity Department, South Mumbai Division.',
        updatedBy: 'Admin Dispatcher'
      },
      {
        status: 'In Progress',
        timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
        notes: 'Utility crew on site installing replacement LED light elements.',
        updatedBy: 'BEST Crew 1A'
      },
      {
        status: 'Resolved',
        timestamp: new Date(Date.now() - 30 * 3600000).toISOString(),
        notes: 'Light tested and verified active. Restored complete illumination on promenade walkway.',
        updatedBy: 'BEST Crew 1A'
      }
    ]
  },
  {
    id: 'iss-004',
    category: 'Waste Management',
    severity: 'Medium',
    title: 'Overflowing Trash & Garbage Dump on SV Road, Andheri West',
    description: 'A large pile of unattended plastic refuse, rotten food waste, and commercial cardboard dumped on the roadside. It is blocking the sidewalk, creating an intolerable smell, and attracting stray animals near the busy Andheri West station entrance.',
    location: {
      lat: 19.1195,
      lng: 72.8460,
      address: 'S.V. Road, near Andheri Station Entrance, Andheri West, Mumbai',
      neighborhood: 'Andheri West'
    },
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    status: 'In Progress',
    reportedBy: 'Sneha Iyer',
    reportedAt: new Date(Date.now() - 24 * 3600000).toISOString(), // 24 hours ago
    upvotes: 3,
    upvotedBy: ['Priya Sharma', 'Ananya Rao', 'Suyash Kolhe'],
    aiAnalyzed: true,
    suggestedAction: 'Alert BMC Solid Waste Management (SWM) collection dumper. Clear the heap, treat the pavement with disinfectant powder, and monitor for commercial dumping.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        notes: 'Logged illegal garbage heap on busy S.V. Road shopping stretch.',
        updatedBy: 'Sneha Iyer'
      },
      {
        status: 'Verified',
        timestamp: new Date(Date.now() - 22 * 3600000).toISOString(),
        notes: 'Verified by local shopkeeper upvotes.',
        updatedBy: 'System Engine'
      },
      {
        status: 'Assigned',
        timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
        notes: 'Assigned to Ward K-West SWM cleanup division.',
        updatedBy: 'BMC SWM Dispatch'
      },
      {
        status: 'In Progress',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        notes: 'BMC sanitation sweepers on site actively clearing refuse bags.',
        updatedBy: 'BMC SWM Crew'
      }
    ]
  },
  {
    id: 'iss-005',
    category: 'Public Safety/Infrastructure',
    severity: 'High',
    title: 'Broken Footpath Cover and Exposed Storm Drain near Juhu Beach',
    description: 'Multiple concrete footpath covers have broken apart on Juhu Tara Road, leaving an open stormwater drain cavity that is 4 feet deep. At night, it is completely invisible to tourists visiting Juhu beach and is a critical safety risk.',
    location: {
      lat: 19.0980,
      lng: 72.8275,
      address: 'Juhu Tara Road, opposite Juhu Hotel, Juhu, Mumbai',
      neighborhood: 'Juhu'
    },
    imageUrl: 'https://images.unsplash.com/photo-1590086782957-93c06ef21604?auto=format&fit=crop&w=600&q=80',
    status: 'Assigned',
    reportedBy: 'Ananya Rao',
    reportedAt: new Date(Date.now() - 30 * 3600000).toISOString(), // 30 hours ago
    upvotes: 4,
    upvotedBy: ['Suyash Kolhe', 'Amit Patel', 'Sneha Iyer', 'Rajesh Kumar'],
    aiAnalyzed: true,
    suggestedAction: 'Deploy high-visibility BMC caution barriers immediately. Dispatch MCGM maintenance contractor to install replacement concrete slabs.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 30 * 3600000).toISOString(),
        notes: 'Broken footpath slab exposing dangerous underground storm drain reported near beach entry.',
        updatedBy: 'Ananya Rao'
      },
      {
        status: 'Verified',
        timestamp: new Date(Date.now() - 28 * 3600000).toISOString(),
        notes: 'Verified by local civic volunteers.',
        updatedBy: 'System Engine'
      },
      {
        status: 'Assigned',
        timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
        notes: 'Assigned to MCGM Ward K-West Civil Engineering contractor.',
        updatedBy: 'BMC Civil Supervisor'
      }
    ]
  },
  // Extra seed data to simulate historical patterns for the dashboard and predictive insights panel!
  {
    id: 'iss-h1',
    category: 'Roads & Potholes',
    severity: 'Medium',
    title: 'Minor pothole forming near Bandra Reclamation',
    description: 'Small cracks widening near the sea link connector toll plaza.',
    location: {
      lat: 19.0480,
      lng: 72.8290,
      address: 'Bandra Reclamation, Bandra West, Mumbai',
      neighborhood: 'Bandra West'
    },
    status: 'Resolved',
    reportedBy: 'Suyash Kolhe',
    reportedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), // 30 days ago
    upvotes: 3,
    upvotedBy: ['Ananya Rao', 'Priya Sharma', 'Sneha Iyer'],
    aiAnalyzed: false,
    resolutionTimeHours: 24,
    timeline: [{ status: 'Resolved', timestamp: new Date().toISOString(), notes: 'Fixed with quick-drying asphalt mix', updatedBy: 'BMC Road Crew' }]
  },
  {
    id: 'iss-h2',
    category: 'Roads & Potholes',
    severity: 'Low',
    title: 'Minor road wearing near Portuguese Church, Dadar',
    description: 'Road gravel scattering around the storm manhole on Gokhale Road.',
    location: {
      lat: 19.0225,
      lng: 72.8415,
      address: 'Gokhale Road, near Portuguese Church, Dadar West, Mumbai',
      neighborhood: 'Dadar West'
    },
    status: 'Resolved',
    reportedBy: 'Priya Sharma',
    reportedAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(), // 15 days ago
    upvotes: 3,
    upvotedBy: ['Suyash Kolhe', 'Sneha Iyer', 'Amit Patel'],
    aiAnalyzed: false,
    resolutionTimeHours: 12,
    timeline: [{ status: 'Resolved', timestamp: new Date().toISOString(), notes: 'Asphalt patched', updatedBy: 'BMC Road Crew' }]
  },
  {
    id: 'iss-h3',
    category: 'Waste Management',
    severity: 'Low',
    title: 'Overflowing garbage bin near Juhu Chowpatty Promenade',
    description: 'Secondary garbage bin overflowing with plastics on Sunday evening.',
    location: {
      lat: 19.0990,
      lng: 72.8260,
      address: 'Juhu Beach Front, Juhu, Mumbai',
      neighborhood: 'Juhu'
    },
    status: 'Resolved',
    reportedBy: 'Amit Patel',
    reportedAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString(), // 8 days ago
    upvotes: 3,
    upvotedBy: ['Sneha Iyer', 'Priya Sharma', 'Suyash Kolhe'],
    aiAnalyzed: false,
    resolutionTimeHours: 6,
    timeline: [{ status: 'Resolved', timestamp: new Date().toISOString(), notes: 'Cleared by SWM beach clean truck', updatedBy: 'BMC Beach Cleanup' }]
  },
  {
    id: 'iss-h4',
    category: 'Waste Management',
    severity: 'Medium',
    title: 'Plastic litter choking storm drains in Colaba',
    description: 'Debris blocking stormwater gutter inlets along Colaba Causeway during pre-monsoon high tide.',
    location: {
      lat: 18.9180,
      lng: 72.8280,
      address: 'Colaba Causeway Road, Colaba, Mumbai',
      neighborhood: 'Colaba'
    },
    status: 'Resolved',
    reportedBy: 'Sneha Iyer',
    reportedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(), // 1 day ago
    upvotes: 3,
    upvotedBy: ['Ananya Rao', 'Amit Patel', 'Suyash Kolhe'],
    aiAnalyzed: false,
    resolutionTimeHours: 8,
    timeline: [{ status: 'Resolved', timestamp: new Date().toISOString(), notes: 'Silt removed and drain cleared', updatedBy: 'BMC G-South Ward SWM' }]
  }
];

// Leaderboard and user session statistics (in-memory state)
let leaderboard: LeaderboardEntry[] = [
  { username: 'Suyash Kolhe', points: 480, reportsCount: 5, verificationsCount: 12, badges: ['First Report', 'Verifier', 'Civic Pillar'] },
  { username: 'Priya Sharma', points: 385, reportsCount: 4, verificationsCount: 9, badges: ['First Report', 'Verifier'] },
  { username: 'Amit Patel', points: 340, reportsCount: 4, verificationsCount: 8, badges: ['First Report', 'Verifier', 'Water Watcher'] },
  { username: 'Sneha Iyer', points: 260, reportsCount: 2, verificationsCount: 8, badges: ['First Report', 'Verifier'] },
  { username: 'Ananya Rao', points: 195, reportsCount: 2, verificationsCount: 5, badges: ['First Report'] },
];

// Helper to calculate badges & points
function getBadgesForStats(reports: number, verifications: number): string[] {
  const badges = [];
  if (reports > 0) badges.push('First Report');
  if (verifications > 0) badges.push('Verifier');
  if (reports >= 3) badges.push('Active Reporter');
  if (verifications >= 5) badges.push('Civic Guard');
  if (reports >= 5 && verifications >= 10) badges.push('Hyperlocal Hero');
  return badges;
}

// REST API endpoints

// Get all issues
app.get('/api/issues', (req, res) => {
  res.json(issues);
});

// Update an issue status (for interactive demo timeline progression!)
app.post('/api/issues/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes, updatedBy } = req.body;

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const oldStatus = issue.status;
  issue.status = status as IssueStatus;

  // If status moved to Resolved, calculate duration
  if (status === 'Resolved' && oldStatus !== 'Resolved') {
    const elapsedMs = Date.now() - new Date(issue.reportedAt).getTime();
    issue.resolutionTimeHours = Math.round(elapsedMs / 3600000);
  }

  issue.timeline.push({
    status: status as IssueStatus,
    timestamp: new Date().toISOString(),
    notes: notes || `Status updated from ${oldStatus} to ${status}.`,
    updatedBy: updatedBy || 'Municipal Official'
  });

  res.json(issue);
});

// Verify/Upvote an issue
app.post('/api/issues/:id/verify', (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required to upvote' });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  if (issue.upvotedBy.includes(username)) {
    return res.status(400).json({ error: 'You have already verified this issue' });
  }

  issue.upvotes += 1;
  issue.upvotedBy.push(username);

  // Update leaderboard points for the voting user
  const userEntry = leaderboard.find(u => u.username === username);
  if (userEntry) {
    userEntry.verificationsCount += 1;
    userEntry.points += 15; // 15 points per verification
    userEntry.badges = getBadgesForStats(userEntry.reportsCount, userEntry.verificationsCount);
  } else {
    // Create new leaderboard entry
    leaderboard.push({
      username,
      points: 15,
      reportsCount: 0,
      verificationsCount: 1,
      badges: getBadgesForStats(0, 1)
    });
  }

  // Auto-advance check: If 'Reported' and crosses threshold (>= 3 upvotes)
  if (issue.status === 'Reported' && issue.upvotes >= 3) {
    issue.status = 'Verified';
    issue.timeline.push({
      status: 'Verified',
      timestamp: new Date().toISOString(),
      notes: 'System automatically upgraded status to Verified after crossing community upvote threshold (3+).',
      updatedBy: 'System Engine'
    });
  }

  // Sort leaderboard
  leaderboard.sort((a, b) => b.points - a.points);

  res.json({ issue, leaderboard });
});

// Create new issue with optional Gemini analysis
app.post('/api/issues', async (req, res) => {
  const { title, description, category, severity, location, imageUrl, reportedBy } = req.body;

  if (!title || !description || !location || !reportedBy) {
    return res.status(400).json({ error: 'Missing required report fields' });
  }

  const newId = `iss-${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();

  let finalCategory: IssueCategory = category || 'Roads & Potholes';
  let finalSeverity: SeverityLevel = severity || 'Medium';
  let finalSummary = description;
  let suggestedAction = 'Inspection scheduled.';
  let isAiAnalyzed = false;

  const gemini = getGeminiClient();

  if (imageUrl && gemini) {
    try {
      // Parse data-url
      const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];

        const promptText = `
          You are an expert civic engineering inspector reviewing a community-reported incident.
          Review the reported title: "${title}"
          And description: "${description}"
          
          Based on the image provided and details:
          1. Classify the issue into EXACTLY ONE of these categories: 
             'Roads & Potholes', 'Water Leakage', 'Electrical/Streetlights', 'Waste Management', 'Public Safety/Infrastructure'.
          2. Determine its severity level: 'Low', 'Medium', 'High', 'Critical'.
          3. Write a clean, professional, objective engineering summary of the problem (2-3 sentences), identifying the danger and potential impact.
          4. Suggest a clear, concise, actionable recommended resolution step.

          Return the result in JSON format matching this schema exactly:
          {
            "category": "Roads & Potholes" | "Water Leakage" | "Electrical/Streetlights" | "Waste Management" | "Public Safety/Infrastructure",
            "severity": "Low" | "Medium" | "High" | "Critical",
            "summary": "Engineering assessment of the issue...",
            "suggestedAction": "Suggested dispatch action step..."
          }
        `;

        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json',
          }
        });

        const textResponse = response.text;
        if (textResponse) {
          const parsed = JSON.parse(textResponse.trim());
          if (parsed.category) finalCategory = parsed.category;
          if (parsed.severity) finalSeverity = parsed.severity;
          if (parsed.summary) finalSummary = parsed.summary;
          if (parsed.suggestedAction) suggestedAction = parsed.suggestedAction;
          isAiAnalyzed = true;
        }
      }
    } catch (e) {
      console.error('Gemini content analysis failed, falling back to local processing:', e);
    }
  }

  // Fallback Rule-based local analysis if Gemini didn't run
  if (!isAiAnalyzed) {
    const textToScan = `${title} ${description}`.toLowerCase();
    
    // Simple category matching
    if (textToScan.includes('water') || textToScan.includes('leak') || textToScan.includes('pipe') || textToScan.includes('gush') || textToScan.includes('burst')) {
      finalCategory = 'Water Leakage';
    } else if (textToScan.includes('light') || textToScan.includes('lamp') || textToScan.includes('electricity') || textToScan.includes('flicker') || textToScan.includes('wire')) {
      finalCategory = 'Electrical/Streetlights';
    } else if (textToScan.includes('trash') || textToScan.includes('garbage') || textToScan.includes('dump') || textToScan.includes('waste') || textToScan.includes('litter') || textToScan.includes('overflow')) {
      finalCategory = 'Waste Management';
    } else if (textToScan.includes('safety') || textToScan.includes('bridge') || textToScan.includes('railing') || textToScan.includes('danger') || textToScan.includes('sign') || textToScan.includes('sidewalk')) {
      finalCategory = 'Public Safety/Infrastructure';
    } else if (textToScan.includes('pothole') || textToScan.includes('road') || textToScan.includes('cracks') || textToScan.includes('asphalt') || textToScan.includes('street')) {
      finalCategory = 'Roads & Potholes';
    }

    // Simple severity matching
    if (textToScan.includes('urgent') || textToScan.includes('danger') || textToScan.includes('gushing') || textToScan.includes('flooding') || textToScan.includes('immediate') || textToScan.includes('critical')) {
      finalSeverity = 'Critical';
    } else if (textToScan.includes('severe') || textToScan.includes('high') || textToScan.includes('deep') || textToScan.includes('broken') || textToScan.includes('crash')) {
      finalSeverity = 'High';
    } else if (textToScan.includes('flicker') || textToScan.includes('litter') || textToScan.includes('overflow') || textToScan.includes('medium')) {
      finalSeverity = 'Medium';
    } else {
      finalSeverity = 'Low';
    }

    // Standard local engineering summary structure
    finalSummary = `Citizen-reported ${finalCategory.toLowerCase()} issue at ${location.address || 'Mumbai Ward Office'}. Ref: "${title}". Description details: ${description}`;
    suggestedAction = `Schedule diagnostic field visit by the ${finalCategory === 'Water Leakage' ? 'BMC Hydraulic Engineer Dept' : finalCategory === 'Electrical/Streetlights' ? 'BEST Streetlight Division' : finalCategory === 'Waste Management' ? 'BMC Solid Waste Management (SWM)' : finalCategory === 'Roads & Potholes' ? 'BMC Road Engineering Cell' : 'MCGM Ward Citizen Committee'} to verify details.`;
  }

  const newIssue: CivicIssue = {
    id: newId,
    category: finalCategory,
    severity: finalSeverity,
    title,
    description,
    location: {
      lat: Number(location.lat) || 19.0176,
      lng: Number(location.lng) || 72.8461,
      address: location.address || 'Address registered on Mumbai Map',
      neighborhood: location.neighborhood || 'Dadar West'
    },
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=600&q=80',
    status: 'Reported',
    reportedBy,
    reportedAt: timestamp,
    upvotes: 0,
    upvotedBy: [],
    aiAnalyzed: isAiAnalyzed || (process.env.GEMINI_API_KEY ? false : true), // Mark as analyzed or mock-analyzed
    suggestedAction,
    timeline: [
      {
        status: 'Reported',
        timestamp,
        notes: `Issue reported and ${isAiAnalyzed ? 'Gemini AI' : 'Local Civic engine'} generated classification and engineering action items.`,
        updatedBy: reportedBy
      }
    ]
  };

  issues.unshift(newIssue);

  // Update leaderboard points for reporting
  const userEntry = leaderboard.find(u => u.username === reportedBy);
  if (userEntry) {
    userEntry.reportsCount += 1;
    userEntry.points += 50; // 50 points per report
    userEntry.badges = getBadgesForStats(userEntry.reportsCount, userEntry.verificationsCount);
  } else {
    leaderboard.push({
      username: reportedBy,
      points: 50,
      reportsCount: 1,
      verificationsCount: 0,
      badges: getBadgesForStats(1, 0)
    });
  }

  // Sort leaderboard
  leaderboard.sort((a, b) => b.points - a.points);

  res.status(201).json({ issue: newIssue, leaderboard });
});

// Get dynamic predictive insights from current database
app.get('/api/insights', (req, res) => {
  const insights: PredictiveInsight[] = [];
  
  // Algorithm 1: Scan for Pothole/Road clusters in Dadar West
  const roadIssues = issues.filter(i => i.category === 'Roads & Potholes' && i.location.neighborhood.includes('Dadar'));
  if (roadIssues.length >= 2) {
    insights.push({
      id: 'ins-1',
      type: 'hotspot',
      category: 'Roads & Potholes',
      locationName: 'Gokhale Road, Dadar West',
      message: `Dadar Station and Gokhale Road sectors have registered ${roadIssues.length} active pothole complaints. Heavy monsoonal rainfall combined with dense city bus traffic is causing progressive asphalt peeling. Complete milling is advised.`,
      severity: 'critical',
      confidence: 96
    });
  } else {
    insights.push({
      id: 'ins-1',
      type: 'trend',
      category: 'Roads & Potholes',
      locationName: 'Gokhale Road, Dadar West',
      message: 'Subgrade moisture sensor alerts show slight wearing of road-top under Gokhale Road. Recommending micro-surfacing prior to severe high tide monsoon surges.',
      severity: 'info',
      confidence: 84
    });
  }

  // Algorithm 2: Scan for Waste Management spikes on weekends near Bandra
  const wasteIssues = issues.filter(i => i.category === 'Waste Management');
  const weekendWasteCount = wasteIssues.filter(i => {
    const day = new Date(i.reportedAt).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }).length;

  if (weekendWasteCount >= 1) {
    insights.push({
      id: 'ins-2',
      type: 'spike',
      category: 'Waste Management',
      locationName: 'Hill Road / Linking Road Area, Bandra',
      message: 'Roadside commercial waste complaints surge by 65% near Bandra West shopping lanes on weekends. Recommending BMC Solid Waste Management (SWM) loaders shift sweep schedules to late Saturday evenings.',
      severity: 'warning',
      confidence: 88
    });
  }

  // Algorithm 3: Water pipeline health in Bandra West
  const waterIssues = issues.filter(i => i.category === 'Water Leakage' && i.severity === 'Critical');
  if (waterIssues.length > 0) {
    insights.push({
      id: 'ins-3',
      type: 'trend',
      category: 'Water Leakage',
      locationName: 'Hill Road Sector, Bandra West',
      message: 'Critical underground hydraulic pressure drops detected near Bandra Police Station. Persistent wet patches on sidewalks indicate a possible joint fracture in the 1800mm BMC water main trunk.',
      severity: 'critical',
      confidence: 90
    });
  } else {
    // Fallback info insight
    insights.push({
      id: 'ins-3-fb',
      type: 'trend',
      category: 'Water Leakage',
      locationName: 'Mumbai West Sector',
      message: 'Municipal water distribution grid telemetry indicates stable pressure across H-West and K-West wards. No pipe joint structural risks forecasted.',
      severity: 'info',
      confidence: 70
    });
  }

  res.json(insights);
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

// Setup Vite & Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Civic Issue Reporting Hub server running on port ${PORT}`);
  });
}

startServer();
