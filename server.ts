import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MasterDatabaseService } from './src/services/masterDatabaseService';
import { GoogleAppsScriptModularGenerator } from './src/services/gasCodeModules';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // -------------------------------------------------------------
  // PHASE 1: MASTER PLAYER DATABASE & SECURITY API
  // -------------------------------------------------------------

  // 1. Get Master Database Overview & Stats
  // 1. Get Master Database Overview & Stats
  app.get('/api/database/overview', (req, res) => {
    try {
      const overview = MasterDatabaseService.getDatabaseOverview();
      const attendance = MasterDatabaseService.getAttendanceRecords();
      const logs = MasterDatabaseService.getAuditLogs();
      const settings = MasterDatabaseService.getSystemSettings();

      res.json({
        success: true,
        ...overview,
        stats: {
          masterPlayersCount: overview.totalPlayers,
          distinctTeamsCount: overview.distinctTeams.length,
          coachesCount: overview.totalCoaches,
          assignmentsCount: overview.totalAssignments,
          sessionsCount: overview.totalWeeklySessions,
          attendanceRecordsCount: attendance.length,
          auditLogsCount: logs.length,
          settingsCount: settings.length
        },
        masterColumns: [
          'Player ID',
          'الفريق',
          'مواليد الفريق',
          'النوع',
          'اسم اللاعب رباعي',
          'الاسم',
          'رقم التليفون',
          'تاريخ الميلاد',
          'النادي',
          'مواليد',
          'Rank'
        ]
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Query All Master Players (Read-Only)
  app.get('/api/master/players', (req, res) => {
    try {
      const players = MasterDatabaseService.getAllMasterPlayers();
      const standardized = MasterDatabaseService.getAllPlayers();
      res.json({ success: true, count: players.length, players, standardized });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2.1 Query Available Teams From Master Players
  app.get('/api/master/teams', (req, res) => {
    try {
      const teams = MasterDatabaseService.getAvailableTeamsFromPlayers();
      res.json({ success: true, count: teams.length, teams });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2.2 Admin Master Player Database Debugger (Admin Only)
  app.get('/api/master/debug', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const result = MasterDatabaseService.debugMasterPlayerDatabase(userEmail);
      if (!result.success) {
        return res.status(403).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2.3 PHASE 12: Admin Comprehensive Club Analytics API (Admin Only)
  app.get('/api/admin/club-analytics', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || '');
      const filters = {
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
        teamName: req.query.teamName ? String(req.query.teamName) : undefined,
        birthYear: req.query.birthYear ? String(req.query.birthYear) : undefined,
        gender: req.query.gender ? String(req.query.gender) : undefined,
        sortBy: (req.query.sortBy as any) || 'attendance',
        sortOrder: (req.query.sortOrder as any) || 'desc'
      };

      const result = MasterDatabaseService.getClubAnalytics(userEmail, filters);
      if (!result.success) {
        return res.status(403).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // 3. Query Master Players by Exact Team Name (e.g. "براعم 2015 بنات") with Coach Authorization Guard
  app.get('/api/master/players/by-team', (req, res) => {
    try {
      const teamName = String(req.query.teamName || req.query.team || '').trim();
      if (!teamName) {
        return res.status(400).json({ success: false, error: 'Query parameter "teamName" or "team" is required.' });
      }

      // Security Authorization Check for Coach Requests
      const userEmail = String(req.headers['x-user-email'] || req.headers['x-admin-email'] || req.query.userEmail || req.query.email || '').trim();
      if (userEmail) {
        const authRes = MasterDatabaseService.getAuthorizedPlayersForCoach(userEmail, teamName);
        if (!authRes.authorized) {
          return res.status(403).json({
            success: false,
            errorCode: authRes.errorCode || 'UNAUTHORIZED_TEAM_ACCESS',
            error: authRes.error || `Coach is not authorized to access players for team "${teamName}".`,
            authorizedTeams: MasterDatabaseService.getCurrentUser(userEmail).authorizedTeams || []
          });
        }
        return res.json({
          success: true,
          teamName,
          count: authRes.count,
          players: authRes.normalizedPlayers,
          standardized: authRes.players
        });
      }

      // Default query (Admin or Internal)
      const players = MasterDatabaseService.getPlayersByTeam(teamName);
      const standardized = MasterDatabaseService.getStandardizedPlayersByTeam(teamName);
      res.json({ success: true, teamName, count: players.length, players, standardized });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3.1 Live Synchronization with Google Sheet
  app.all('/api/master/sync-google-sheet', async (req, res) => {
    try {
      const spreadsheetId = req.query.spreadsheetId || req.body?.spreadsheetId;
      const syncResult = await MasterDatabaseService.syncFromGoogleSheet(spreadsheetId ? String(spreadsheetId) : undefined);
      res.json(syncResult);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Query Master Player by Unique Primary Key "Player ID" (e.g. "M-G150101954")
  app.get('/api/master/players/by-id/:playerId', (req, res) => {
    try {
      const playerId = req.params.playerId;
      const player = MasterDatabaseService.getPlayerById(playerId);
      if (!player) {
        return res.status(404).json({ success: false, error: `Player with ID '${playerId}' not found in master database.` });
      }
      res.json({ success: true, player });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });



  // 4.2 Official Clubs Endpoint
  app.get('/api/clubs', (req, res) => {
    try {
      const clubs = MasterDatabaseService.getOfficialClubs();
      res.json({ success: true, count: clubs.length, clubs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4.3 Official Training Venues Endpoint (الصالة المغطاه، الملعب الجديد، ملعب التنس الرئيسي، ملعب التنس الفرعي)
  app.get('/api/venues', (req, res) => {
    try {
      const venues = MasterDatabaseService.getOfficialTrainingVenues();
      res.json({ success: true, count: venues.length, venues });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4.4 Official 20 Teams Definition across Clubs
  app.get('/api/teams/official', (req, res) => {
    try {
      const club = req.query.club ? String(req.query.club) : undefined;
      const teams = club ? MasterDatabaseService.getOfficialTeamsByClub(club) : MasterDatabaseService.getOfficial20Teams();
      res.json({ success: true, count: teams.length, teams });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Query Specific System Table Records
  app.get('/api/database/table/:name', (req, res) => {
    try {
      const tableName = req.params.name.toUpperCase();
      let records: any[] = [];

      switch (tableName) {
        case 'PLAYERS_MASTER':
        case 'PLAYERS':
          records = MasterDatabaseService.getAllMasterPlayers().map(p => p.raw);
          break;
        case 'COACHES':
          records = MasterDatabaseService.getAllCoaches();
          break;
        case 'COACH_TEAMS':
          records = MasterDatabaseService.getAllCoachAssignments();
          break;
        case 'TRAINING_SESSIONS':
          records = MasterDatabaseService.getTrainingSessions();
          break;
        case 'ATTENDANCE':
          records = MasterDatabaseService.getAttendanceRecords();
          break;
        case 'AUDIT_LOG':
          records = MasterDatabaseService.getAuditLogs();
          break;
        case 'SYSTEM_SETTINGS':
          records = MasterDatabaseService.getSystemSettings();
          break;
        default:
          return res.status(404).json({ success: false, error: `Table '${tableName}' not found.` });
      }

      res.json({
        success: true,
        tableName,
        count: records.length,
        records
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 2: AUTHENTICATION & AUTHORIZATION API ENDPOINTS
  // -------------------------------------------------------------

  // 6. Get Current User Session (Session.getActiveUser() Simulation)
  app.get('/api/auth/me', (req, res) => {
    try {
      const email = String(req.query.email || 'admin@volleyball.club').trim();
      const session = MasterDatabaseService.getCurrentUser(email);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. List All Registered System Users (Admin Directory)
  app.get('/api/auth/users', (req, res) => {
    try {
      const users = MasterDatabaseService.listAllRegisteredUsers();
      res.json({ success: true, count: users.length, users });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Enforce Team Authorization Gate (requireAuthorizedTeam)
  app.post('/api/auth/require-team', (req, res) => {
    try {
      const { email, teamName } = req.body;
      const guard = MasterDatabaseService.requireAuthorizedTeam(email, teamName);
      if (!guard.allowed) {
        return res.status(guard.statusCode).json({
          success: false,
          guard
        });
      }
      res.json({ success: true, guard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Enforce Admin Privilege Gate (requireAdmin)
  app.post('/api/auth/require-admin', (req, res) => {
    try {
      const { email } = req.body;
      const guard = MasterDatabaseService.requireAdmin(email);
      if (!guard.allowed) {
        return res.status(guard.statusCode).json({
          success: false,
          guard
        });
      }
      res.json({ success: true, guard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Enforce Specific Role Gate (requireRole)
  app.post('/api/auth/require-role', (req, res) => {
    try {
      const { email, allowedRoles } = req.body;
      const guard = MasterDatabaseService.requireRole(email, allowedRoles || ['ADMIN']);
      if (!guard.allowed) {
        return res.status(guard.statusCode).json({
          success: false,
          guard
        });
      }
      res.json({ success: true, guard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Security Audit Logs Query (Admin Protected with Multi-Criteria Filters)
  app.get('/api/audit-logs', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const adminGuard = MasterDatabaseService.requireAdmin(userEmail);
      if (!adminGuard.allowed) {
        return res.status(403).json({ success: false, error: adminGuard.reason });
      }

      const filters = {
        userEmail: req.query.email ? String(req.query.email) : undefined,
        userRole: req.query.role ? String(req.query.role) : undefined,
        action: req.query.action ? String(req.query.action) : undefined,
        entityType: req.query.entityType ? String(req.query.entityType) : undefined,
        entityID: req.query.entityID ? String(req.query.entityID) : undefined,
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
        search: req.query.search ? String(req.query.search) : undefined
      };

      const logs = MasterDatabaseService.getAuditLogs(filters);
      res.json({ success: true, count: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11.1 Security & Audit KPI Statistics
  app.get('/api/audit-logs/stats', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const adminGuard = MasterDatabaseService.requireAdmin(userEmail);
      if (!adminGuard.allowed) {
        return res.status(403).json({ success: false, error: adminGuard.reason });
      }

      const stats = MasterDatabaseService.getAuditStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Legacy compatibility
  app.get('/api/auth/audit-logs', (req, res) => {
    try {
      const logs = MasterDatabaseService.getAuditLogs();
      res.json({ success: true, count: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 12. Test Authorization Access Gateway (Legacy Compatibility)
  app.post('/api/auth/verify-access', (req, res) => {
    try {
      const { email, teamName } = req.body;
      const result = MasterDatabaseService.verifyTeamAccess(email, teamName);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 13. Secure Protected Player Roster Endpoint (Guarded by Backend Gate)
  app.post('/api/auth/authorized-players', (req, res) => {
    try {
      const { email, teamName } = req.body;
      const guard = MasterDatabaseService.requireAuthorizedTeam(email, teamName);
      if (!guard.allowed) {
        return res.status(guard.statusCode).json({
          success: false,
          error: guard.reason,
          authDetails: guard
        });
      }
      const players = MasterDatabaseService.getPlayersByTeam(teamName);
      res.json({
        success: true,
        authDetails: guard,
        count: players.length,
        players
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 14. Run Full Automated Diagnostic Test Suite
  app.all('/api/diagnostics/run', (req, res) => {
    try {
      const report = MasterDatabaseService.runDiagnostics();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 15. Get Google Apps Script Modular Code (10 files)
  app.get('/api/gas/modules', (req, res) => {
    try {
      const modules = GoogleAppsScriptModularGenerator.getAllModules();
      res.json({ success: true, count: modules.length, modules });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 4: ADMIN MANAGEMENT SYSTEM API
  // -------------------------------------------------------------

  // 15.1 Official Coaches Google Sheet API
  app.get('/api/coaches', (req, res) => {
    try {
      const coaches = MasterDatabaseService.getAllCoaches();
      res.json({ success: true, count: coaches.length, coaches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/coaches/assignments', (req, res) => {
    try {
      const coachEmail = req.query.coachEmail || req.query.email;
      const coachId = req.query.coachId;
      const target = coachEmail ? String(coachEmail) : (coachId ? String(coachId) : undefined);
      let assignments = MasterDatabaseService.getAllCoachAssignments();
      if (target) {
        const coach = MasterDatabaseService.getCoachByEmail(target) || MasterDatabaseService.getCoachById(target);
        if (coach) {
          assignments = MasterDatabaseService.getAssignmentsForCoach(coach.CoachID);
        } else {
          assignments = assignments.filter(a => a.CoachID.toLowerCase() === target.toLowerCase() || (a.CoachEmail && a.CoachEmail.toLowerCase() === target.toLowerCase()));
        }
      }
      res.json({ success: true, count: assignments.length, assignments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/coaches/schedules', (req, res) => {
    try {
      const coachId = req.query.coachId ? String(req.query.coachId) : undefined;
      const teamName = req.query.teamName || req.query.team ? String(req.query.teamName || req.query.team) : undefined;
      const day = req.query.day ? String(req.query.day) : undefined;
      const sessions = MasterDatabaseService.getWeeklyTrainingSessions({ coachId, teamName, day });
      res.json({ success: true, count: sessions.length, sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/coaches/by-id/:id', (req, res) => {
    try {
      const coach = MasterDatabaseService.getCoachById(req.params.id) || MasterDatabaseService.getCoachByEmail(req.params.id);
      if (!coach) {
        return res.status(404).json({ success: false, error: `Coach '${req.params.id}' not found.` });
      }
      const assignments = MasterDatabaseService.getAssignmentsForCoach(coach.CoachID);
      const schedules = MasterDatabaseService.getWeeklyTrainingSessions({ coachId: coach.CoachID });
      res.json({ success: true, coach, assignments, schedules });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.all('/api/coaches/sync-google-sheet', async (req, res) => {
    try {
      const spreadsheetId = req.query.spreadsheetId || req.body?.spreadsheetId;
      const result = await MasterDatabaseService.syncCoachesFromGoogleSheet(spreadsheetId ? String(spreadsheetId) : undefined);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/training-sessions', (req, res) => {
    try {
      const coachId = req.query.coachId ? String(req.query.coachId) : undefined;
      const teamName = req.query.teamName ? String(req.query.teamName) : undefined;
      const day = req.query.day ? String(req.query.day) : undefined;
      const sessions = MasterDatabaseService.getWeeklyTrainingSessions({ coachId, teamName, day });
      res.json({ success: true, count: sessions.length, sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Coach Team Schedule Queries
  app.get('/api/coaches/schedules', (req, res) => {
    try {
      const coachId = req.query.coachId ? String(req.query.coachId) : undefined;
      const teamName = req.query.teamName ? String(req.query.teamName) : undefined;
      const day = req.query.day ? String(req.query.day) : undefined;
      const sessions = MasterDatabaseService.getWeeklyTrainingSessions({ coachId, teamName, day });
      res.json({ success: true, count: sessions.length, sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Coach Control: Get Team Weekly Recurring Schedule Slots
  app.get('/api/coaches/team-schedule', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const teamName = req.query.teamName ? String(req.query.teamName) : '';
      if (!teamName) {
        return res.status(400).json({ success: false, error: 'Team name is required.' });
      }

      const result = MasterDatabaseService.getTeamWeeklySchedule(userEmail, teamName);
      if (!result.success) {
        return res.status(403).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Coach Control: Configure & Save Team Weekly Recurring Schedule (Days, Times, Courts)
  app.post('/api/coaches/team-schedule', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.body.userEmail || 'admin@volleyball.club');
      const { teamName, slots } = req.body;
      if (!teamName) {
        return res.status(400).json({ success: false, error: 'Team name is required.' });
      }

      const result = MasterDatabaseService.saveTeamWeeklySchedule(userEmail, teamName, slots || []);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Coach & Admin Control: Get Monthly Team Training Units and Tracking Summary
  app.get('/api/coaches/monthly-tracking', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const teamName = req.query.teamName ? String(req.query.teamName) : '';
      const month = req.query.month ? parseInt(String(req.query.month), 10) : (new Date().getMonth() + 1);
      const year = req.query.year ? parseInt(String(req.query.year), 10) : new Date().getFullYear();

      if (!teamName) {
        return res.status(400).json({ success: false, error: 'Team name is required.' });
      }

      const summary = MasterDatabaseService.getMonthlyTeamTrackingSummary(userEmail, teamName, month, year);
      if (!summary.success) {
        return res.status(403).json(summary);
      }
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Coach & Admin Control: Automatically Generate Training Unit Dates for Entire Month
  app.post('/api/coaches/generate-monthly-schedule', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.body.userEmail || 'admin@volleyball.club');
      const { teamName, month, year, slots } = req.body;

      if (!teamName) {
        return res.status(400).json({ success: false, error: 'Team name is required.' });
      }

      const result = MasterDatabaseService.generateMonthlyTrainingSchedule(
        userEmail,
        teamName,
        month ? parseInt(String(month), 10) : (new Date().getMonth() + 1),
        year ? parseInt(String(year), 10) : new Date().getFullYear(),
        slots || []
      );

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 16. Admin Coach Management: List All Coaches
  app.get('/api/admin/coaches', (req, res) => {
    try {
      const coaches = MasterDatabaseService.getAllCoaches();
      res.json({ success: true, count: coaches.length, coaches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17. Admin Coach Management: Add Coach
  app.post('/api/admin/coaches', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const { FullName, Email, Phone, Role, AccountStatus } = req.body;
      const result = MasterDatabaseService.addCoach(adminEmail, {
        FullName,
        Email,
        Phone,
        Role,
        AccountStatus
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 18. Admin Coach Management: Update Coach
  app.put('/api/admin/coaches/:id', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const coachId = req.params.id;
      const { FullName, Email, Phone, Role, AccountStatus } = req.body;
      const result = MasterDatabaseService.updateCoach(adminEmail, coachId, {
        FullName,
        Email,
        Phone,
        Role,
        AccountStatus
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 19. Admin Coach Management: Toggle/Set Coach Status
  app.patch('/api/admin/coaches/:id/status', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const coachId = req.params.id;
      const { AccountStatus } = req.body;
      const result = MasterDatabaseService.setCoachStatus(adminEmail, coachId, AccountStatus);

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 20. Admin Team Assignments: List All Assignments
  app.get('/api/admin/coach-teams', (req, res) => {
    try {
      const assignments = MasterDatabaseService.getAllCoachAssignments();
      res.json({ success: true, count: assignments.length, assignments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 21. Admin Team Assignments: Add Assignment
  app.post('/api/admin/coach-teams', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const { CoachID, TeamName, PermissionLevel, Active } = req.body;
      const result = MasterDatabaseService.addCoachTeamAssignment(adminEmail, {
        CoachID,
        TeamName,
        PermissionLevel,
        Active
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 22. Admin Team Assignments: Update Assignment
  app.put('/api/admin/coach-teams/:id', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const assignmentId = req.params.id;
      const { PermissionLevel, Active, TeamName } = req.body;
      const result = MasterDatabaseService.updateCoachTeamAssignment(adminEmail, assignmentId, {
        PermissionLevel,
        Active,
        TeamName
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 23. Admin Team Assignments: Toggle Status
  app.patch('/api/admin/coach-teams/:id/status', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const assignmentId = req.params.id;
      const { Active } = req.body;
      const result = MasterDatabaseService.setCoachTeamAssignmentStatus(adminEmail, assignmentId, Boolean(Active));

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 24. Admin Team Assignments: Delete Assignment
  app.delete('/api/admin/coach-teams/:id', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const assignmentId = req.params.id;
      const result = MasterDatabaseService.deleteCoachTeamAssignment(adminEmail, assignmentId);

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 5: TRAINING SESSION MANAGEMENT API
  // -------------------------------------------------------------

  // 25. List Training Sessions (filtered by user role & authorization)
  app.get('/api/sessions', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const teamName = req.query.team ? String(req.query.team) : undefined;
      const date = req.query.date ? String(req.query.date) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;

      const result = MasterDatabaseService.getSessionsForUser(userEmail, { teamName, date, status });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 26. Get Single Training Session by ID
  app.get('/api/sessions/:id', (req, res) => {
    try {
      const session = MasterDatabaseService.getSessionById(req.params.id);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 27. Pre-flight Duplicate Session Check
  app.post('/api/sessions/check-duplicate', (req, res) => {
    try {
      const { teamName, trainingDate, startTime, endTime, excludeSessionId } = req.body;
      const check = MasterDatabaseService.checkDuplicateSession(
        teamName,
        trainingDate,
        startTime,
        endTime,
        excludeSessionId
      );
      res.json({ success: true, ...check });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 28. Create Training Session
  app.post('/api/sessions', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.body.userEmail || '');
      if (!userEmail) {
        return res.status(401).json({ success: false, error: 'User email header or body required for authorization' });
      }

      const { TeamName, TrainingDate, StartTime, EndTime, Location, Status, Notes } = req.body;
      const result = MasterDatabaseService.createTrainingSession(userEmail, {
        TeamName,
        TrainingDate,
        StartTime,
        EndTime,
        Location,
        Status,
        Notes
      });

      if (!result.success) {
        const statusCode = result.isDuplicate ? 409 : (result.guard && !result.guard.allowed ? result.guard.statusCode || 403 : 400);
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 29. Update Training Session
  app.put('/api/sessions/:id', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.userEmail || req.body.email || '');
      if (!userEmail) {
        return res.status(401).json({ success: false, error: 'User email required' });
      }

      const sessionId = req.params.id;
      const { TrainingDate, StartTime, EndTime, Location, Status, Notes } = req.body;
      const result = MasterDatabaseService.updateTrainingSession(userEmail, sessionId, {
        TrainingDate,
        StartTime,
        EndTime,
        Location,
        Status,
        Notes
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 30. Cancel Training Session (Safe cancellation preserving attendance data)
  app.patch('/api/sessions/:id/cancel', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.userEmail || req.body.email || '');
      if (!userEmail) {
        return res.status(401).json({ success: false, error: 'User email required' });
      }

      const sessionId = req.params.id;
      const { reason } = req.body;
      const result = MasterDatabaseService.cancelTrainingSession(userEmail, sessionId, reason);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 31. Delete Training Session (Guarded against historical attendance)
  app.delete('/api/sessions/:id', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.userEmail || req.body.email || '');
      if (!userEmail) {
        return res.status(401).json({ success: false, error: 'User email required' });
      }

      const sessionId = req.params.id;
      const result = MasterDatabaseService.deleteTrainingSession(userEmail, sessionId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 6: CORE ATTENDANCE API ENDPOINTS
  // -------------------------------------------------------------

  // 32. Get Attendance Records for a Specific Session
  app.get('/api/sessions/:id/attendance', (req, res) => {
    try {
      const sessionId = req.params.id;
      const records = MasterDatabaseService.getSessionAttendance(sessionId);
      res.json({
        success: true,
        sessionId,
        count: records.length,
        records
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 33. Save Session Attendance (Multi-layer guarded batch recording with Phase 7 integrity engine)
  app.post('/api/sessions/:id/attendance', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.userEmail || req.body.email || '');
      if (!userEmail) {
        return res.status(401).json({ success: false, errorCode: 'USER_AUTH_REQUIRED', error: 'User email required for authentication' });
      }

      const sessionId = req.params.id;
      const { items } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, errorCode: 'INVALID_PAYLOAD', error: 'items array is required' });
      }

      const result = MasterDatabaseService.saveSessionAttendance(userEmail, sessionId, items);
      if (!result.success) {
        let statusCode = 400;
        if (result.errorCode === 'UNAUTHORIZED_TEAM_ACCESS' || result.errorCode === 'ACCOUNT_INACTIVE') {
          statusCode = 403;
        } else if (result.errorCode === 'SESSION_NOT_FOUND' || result.errorCode === 'USER_NOT_FOUND') {
          statusCode = 404;
        }
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 34. Phase 7: Attendance Validation Pre-flight Check
  app.post('/api/attendance/validate', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.userEmail || req.body.email || '');
      const { sessionId, items } = req.body;
      const validation = MasterDatabaseService.validateAttendanceSubmission(userEmail, sessionId, items);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errorCode: validation.errorCode,
          error: validation.error
        });
      }
      res.json({
        success: true,
        message: 'بيانات الحضور متوافقة ومطابقة لكافة قواعد السلامة (Attendance payload is valid and passes all Phase 7 integrity checks)'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 35. Phase 7: Automated Data Integrity Diagnostic Suite
  app.get('/api/diagnostics/phase7', (req, res) => {
    try {
      const report = MasterDatabaseService.runPhase7Diagnostics();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 36. Query Attendance Records (with optional team, session, or date filtering)
  app.get('/api/attendance', (req, res) => {
    try {
      const { team, session, date } = req.query;
      let records = MasterDatabaseService.getAttendanceRecords();

      if (team) {
        records = records.filter(r => r.TeamName === team);
      }
      if (session) {
        records = records.filter(r => r.SessionID === session);
      }
      if (date) {
        records = records.filter(r => r.TrainingDate === date);
      }

      res.json({
        success: true,
        count: records.length,
        records
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 37. Phase 8: Coach Dashboard & Team Statistics (Scoped by Backend Authorization)
  app.get('/api/coach/dashboard', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.query.userEmail || '');
      const team = req.query.team ? String(req.query.team) : undefined;

      const result = MasterDatabaseService.getCoachDashboardSummary(userEmail, team);

      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_TEAM_ACCESS' ? 403 :
          result.errorCode === 'ACCOUNT_INACTIVE' ? 403 :
          result.errorCode === 'USER_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 38. Phase 8: Automated Coach Dashboard & Statistics Diagnostic Suite
  app.get('/api/diagnostics/phase8', (req, res) => {
    try {
      const report = MasterDatabaseService.runPhase8Diagnostics();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 9: ATTENDANCE HISTORY & AUDITED RECORD MANAGEMENT API
  // -------------------------------------------------------------

  // 39. Query Attendance History with Multi-criteria Filters & Authorization Gate
  app.get('/api/attendance/history', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.query.userEmail || '');
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          errorCode: 'USER_AUTH_REQUIRED',
          error: 'User email is required for authentication in header [x-user-email] or query'
        });
      }

      const filters: any = {
        quickDate: req.query.quickDate ? String(req.query.quickDate) : undefined,
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
        team: req.query.team ? String(req.query.team) : undefined,
        playerId: req.query.playerId ? String(req.query.playerId) : undefined,
        coachId: req.query.coachId ? String(req.query.coachId) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
        offset: req.query.offset ? parseInt(String(req.query.offset), 10) : undefined
      };

      const result = MasterDatabaseService.queryAttendanceHistory(userEmail, filters);

      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_TEAM_ACCESS' ? 403 :
          result.errorCode === 'ACCOUNT_INACTIVE' ? 403 :
          result.errorCode === 'USER_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 40. Authorized Single Attendance Record Edit (Role-Guarded + Audited)
  app.put('/api/attendance/record/:id', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.body.userEmail || '');
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          errorCode: 'USER_AUTH_REQUIRED',
          error: 'User email required for authentication'
        });
      }

      const attendanceId = req.params.id;
      const { attendanceStatus, arrivalTime, lateMinutes, excuseType, notes } = req.body;

      const result = MasterDatabaseService.updateSingleAttendanceRecord(userEmail, attendanceId, {
        attendanceStatus,
        arrivalTime,
        lateMinutes,
        excuseType,
        notes
      });

      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_RECORD_EDIT' ? 403 :
          result.errorCode === 'RECORD_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 41. Phase 9: Automated Attendance History & Record Auditing Diagnostic Suite
  app.get('/api/diagnostics/phase9', (req, res) => {
    try {
      const report = MasterDatabaseService.runPhase9Diagnostics();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 10: PLAYER ATTENDANCE PROFILE API ENDPOINTS
  // -------------------------------------------------------------

  // 42. Get Detailed Player Attendance Profile (with Coach Team Authorization Gate)
  app.get('/api/players/profile/:id', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.query.userEmail || '');
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          errorCode: 'USER_AUTH_REQUIRED',
          error: 'User email is required for authentication in header [x-user-email] or query'
        });
      }

      const playerId = req.params.id;
      const result = MasterDatabaseService.getPlayerAttendanceProfile(userEmail, playerId);

      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_PLAYER_ACCESS' ? 403 :
          result.errorCode === 'ACCOUNT_INACTIVE' ? 403 :
          result.errorCode === 'PLAYER_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 43. List Player Profiles with Summaries (Filtered by Coach Squad Isolation)
  app.get('/api/players/profiles', (req, res) => {
    try {
      const userEmail = String(req.headers['x-user-email'] || req.query.userEmail || '');
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          errorCode: 'USER_AUTH_REQUIRED',
          error: 'User email is required for authentication'
        });
      }

      const team = req.query.team ? String(req.query.team) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = MasterDatabaseService.getPlayerProfilesList(userEmail, team, search);

      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_TEAM_ACCESS' ? 403 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 44. Phase 10: Automated Player Attendance Profile Diagnostic Suite
  app.get('/api/diagnostics/phase10', (req, res) => {
    try {
      const report = MasterDatabaseService.runPhase10Diagnostics();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 11: PLAYER DISCIPLINE SCORE API
  // -------------------------------------------------------------

  // 45. Get Current Discipline Score Settings
  app.get('/api/settings/discipline', (req, res) => {
    try {
      const settings = MasterDatabaseService.getDisciplineSettings();
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 46. Update Discipline Score Settings (Admin Only)
  app.put('/api/settings/discipline', (req, res) => {
    try {
      const adminEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const { startingPoints, unexcusedAbsencePenalty, excusedAbsencePenalty, latePenalty } = req.body;

      const result = MasterDatabaseService.updateDisciplineSettings(adminEmail, {
        startingPoints: startingPoints !== undefined ? Number(startingPoints) : undefined,
        unexcusedAbsencePenalty: unexcusedAbsencePenalty !== undefined ? Number(unexcusedAbsencePenalty) : undefined,
        excusedAbsencePenalty: excusedAbsencePenalty !== undefined ? Number(excusedAbsencePenalty) : undefined,
        latePenalty: latePenalty !== undefined ? Number(latePenalty) : undefined
      });

      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_ADMIN_ONLY' ? 403 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 47. Phase 11: Automated Player Discipline Score Diagnostic Suite
  app.get('/api/diagnostics/phase11', (req, res) => {
    try {
      const report = MasterDatabaseService.runPhase11Diagnostics();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 11.5: DATABASE SELECTION & CONFIGURATION API ENDPOINTS
  // -------------------------------------------------------------

  // 48. Get All Database Profiles (Admin Only)
  app.get('/api/database/profiles', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const result = MasterDatabaseService.getAllDatabaseProfiles(userEmail);
      if (!result.success) {
        return res.status(403).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 49. Get Active Database Profile
  app.get('/api/database/active', (req, res) => {
    try {
      const active = MasterDatabaseService.getActiveDatabase();
      res.json({ success: true, activeProfile: active });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 50. Test Google Spreadsheet Connection & Sheet Discovery (Admin Only)
  app.post('/api/database/test-connection', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const { urlOrId } = req.body;
      const result = MasterDatabaseService.testSpreadsheetConnection(userEmail, urlOrId);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 51. Validate Database Profile (Admin Only)
  app.post('/api/database/validate', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const profile = req.body.profile || req.body;
      const result = MasterDatabaseService.validateDatabaseProfile(userEmail, profile);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 52. Create New Database Profile (Admin Only)
  app.post('/api/database/profiles', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const profileData = req.body.profile || req.body;
      const result = MasterDatabaseService.createDatabaseProfile(userEmail, profileData);
      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_ADMIN_ONLY' ? 403 : 400;
        return res.status(statusCode).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 53. Update Database Profile (Admin Only)
  app.put('/api/database/profiles/:id', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const profileId = req.params.id;
      const profileData = req.body.profile || req.body;
      const result = MasterDatabaseService.updateDatabaseProfile(userEmail, profileId, profileData);
      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_ADMIN_ONLY' ? 403 : 400;
        return res.status(statusCode).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 54. Safely Activate Database Profile (Admin Only)
  app.post('/api/database/profiles/:id/activate', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body.adminEmail || 'admin@volleyball.club');
      const profileId = req.params.id;
      const result = MasterDatabaseService.switchActiveDatabaseProfile(userEmail, profileId);
      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_ADMIN_ONLY' ? 403 : 400;
        return res.status(statusCode).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 55. Delete Inactive Database Profile (Admin Only)
  app.delete('/api/database/profiles/:id', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const profileId = req.params.id;
      const result = MasterDatabaseService.deleteDatabaseProfile(userEmail, profileId);
      if (!result.success) {
        const statusCode = result.errorCode === 'UNAUTHORIZED_ADMIN_ONLY' ? 403 : 400;
        return res.status(statusCode).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 56. Phase 11.5: Automated Database Selection & Configuration Diagnostic Suite
  app.get('/api/diagnostics/phase11-5', (req, res) => {
    try {
      const report = MasterDatabaseService.runPhase11_5Diagnostics();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 57. Phase 11.6: Automated Master Player Database & Record Integration Diagnostic Suite
  app.get('/api/diagnostics/phase11-6', (req, res) => {
    try {
      const report = MasterDatabaseService.runPhase11_6Diagnostics();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 58. Phase 12: Admin Dashboard and Club Analytics API (Admin Only)
  app.get('/api/analytics/admin-dashboard', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const { startDate, endDate, teamName, teamBirthYear, gender, sortBy } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = String(startDate);
      if (endDate) filters.endDate = String(endDate);
      if (teamName) filters.teamName = String(teamName);
      if (teamBirthYear) filters.teamBirthYear = String(teamBirthYear);
      if (gender) filters.gender = String(gender);
      if (sortBy) filters.sortBy = String(sortBy) as any;

      const result = MasterDatabaseService.getAdminClubAnalytics(userEmail, filters);
      if (!result.success) {
        return res.status(403).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 13: SMART ATTENDANCE ALERT SYSTEM API
  // -------------------------------------------------------------

  // 59. Get Alerts Report / List
  app.get('/api/alerts', (req, res) => {
    try {
      const { status, type, severity, entityId, teamName, search } = req.query;
      const filters: any = {};
      if (status) filters.status = String(status);
      if (type) filters.type = String(type);
      if (severity) filters.severity = String(severity);
      if (entityId) filters.entityId = String(entityId);
      if (teamName) filters.teamName = String(teamName);
      if (search) filters.search = String(search);

      const report = MasterDatabaseService.getAlertsReport(filters);
      res.json({ success: true, ...report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 60. Generate / Evaluate Alerts Engine
  app.post('/api/alerts/generate', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body?.userEmail || 'admin@volleyball.club');
      const result = MasterDatabaseService.generateAlerts(userEmail);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 61. Get Alert Thresholds
  app.get('/api/alerts/thresholds', (req, res) => {
    try {
      const thresholds = MasterDatabaseService.getAlertThresholds();
      res.json({ success: true, thresholds });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 62. Update Alert Thresholds (Admin only)
  app.put('/api/alerts/thresholds', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body?.userEmail || 'admin@volleyball.club');
      const thresholds = req.body?.thresholds || req.body;
      const result = MasterDatabaseService.updateAlertThresholds(userEmail, thresholds);
      if (!result.success) {
        return res.status(403).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 63. Update Alert Status (RESOLVED / DISMISSED)
  app.patch('/api/alerts/:alertId/status', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.body?.userEmail || 'admin@volleyball.club');
      const { alertId } = req.params;
      const { status } = req.body;

      if (status !== 'RESOLVED' && status !== 'DISMISSED') {
        return res.status(400).json({ success: false, error: 'Status must be either RESOLVED or DISMISSED.' });
      }

      const result = MasterDatabaseService.updateAlertStatus(alertId, status, userEmail);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 64. Get Alert Stats
  app.get('/api/alerts/stats', (req, res) => {
    try {
      const stats = MasterDatabaseService.getAlertStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PHASE 14: PROFESSIONAL REPORTING SYSTEM API
  // -------------------------------------------------------------

  // 65. Get Report Filter Options (Role-Scoped)
  app.get('/api/reports/filter-options', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const options = MasterDatabaseService.getReportFilterOptions(userEmail);
      res.json({ success: true, options });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 66. Generate Custom Attendance Report (RBAC Protected)
  app.get('/api/reports/generate', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const {
        reportType,
        startDate,
        endDate,
        teamName,
        playerId,
        coachId,
        teamBirthYear,
        gender,
        sortBy,
        sortOrder
      } = req.query;

      const filters: any = {};
      if (reportType) filters.reportType = String(reportType) as any;
      if (startDate) filters.startDate = String(startDate);
      if (endDate) filters.endDate = String(endDate);
      if (teamName) filters.teamName = String(teamName);
      if (playerId) filters.playerId = String(playerId);
      if (coachId) filters.coachId = String(coachId);
      if (teamBirthYear) filters.teamBirthYear = String(teamBirthYear);
      if (gender) filters.gender = String(gender);
      if (sortBy) filters.sortBy = String(sortBy);
      if (sortOrder) filters.sortOrder = String(sortOrder) as any;

      const result = MasterDatabaseService.generateReport(userEmail, filters);
      if (!result.success) {
        return res.status(403).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 67. Download Exported Report File (CSV or Excel) (RBAC Protected)
  app.get('/api/reports/export', (req, res) => {
    try {
      const userEmail = String(req.headers['x-admin-email'] || req.headers['x-user-email'] || req.query.userEmail || 'admin@volleyball.club');
      const {
        format = 'csv',
        reportType,
        startDate,
        endDate,
        teamName,
        playerId,
        coachId,
        teamBirthYear,
        gender
      } = req.query;

      const filters: any = {};
      if (reportType) filters.reportType = String(reportType) as any;
      if (startDate) filters.startDate = String(startDate);
      if (endDate) filters.endDate = String(endDate);
      if (teamName) filters.teamName = String(teamName);
      if (playerId) filters.playerId = String(playerId);
      if (coachId) filters.coachId = String(coachId);
      if (teamBirthYear) filters.teamBirthYear = String(teamBirthYear);
      if (gender) filters.gender = String(gender);

      const exportRes = MasterDatabaseService.generateReportExportFile(userEmail, filters, format === 'excel' ? 'excel' : 'csv');
      if (!exportRes.success) {
        return res.status(403).json(exportRes);
      }

      const content = exportRes.content || '';
      const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
      const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content;
      const bodyBuffer = Buffer.from(cleanContent, 'utf-8');
      const finalBuffer = Buffer.concat([bomBuffer, bodyBuffer]);

      res.setHeader('Content-Type', exportRes.mimeType || 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(exportRes.filename || 'report.csv')}"`);
      res.send(finalBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });






  // -------------------------------------------------------------
  // VITE & STATIC SERVING
  // -------------------------------------------------------------
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
    console.log(`🏐 Volleyball Attendance Server running on port ${PORT}`);
  });
}

startServer();
