import express from 'express';
// إضافة امتداد .js للملفات والـ Middlewares المحلية إجباري
import auth from '../../middleware/auth.js';
import * as teamController from './team.controller.js';
import * as teamMemberController from './teamMember.controller.js';

const router = express.Router();

router.use(auth);

// ── Team Routes ────────────────────────────────────────────────────────────────
//
// POST   /api/teams                          → create a team
// GET    /api/teams/company/:companyId       → get all teams in a company
// GET    /api/teams/:id                      → get a single team
// PUT    /api/teams/:id                      → update a team
// DELETE /api/teams/:id                      → delete a team

router.post('/',                        teamController.createTeam);
router.get('/company/:companyId',       teamController.getAllTeamsByCompany);
router.get('/:id',                      teamController.getTeamById);
router.put('/:id',                      teamController.updateTeam);
router.delete('/:id',                   teamController.deleteTeam);

// ── TeamMember Routes (nested under team) ─────────────────────────────────────
//
// POST   /api/teams/:teamId/members          → add member to team
// GET    /api/teams/:teamId/members          → get all members of a team
// PUT    /api/teams/:teamId/members/:memberId  → update member role
// DELETE /api/teams/:teamId/members/:memberId  → remove member from team

router.post('/:teamId/members',                     teamMemberController.addTeamMember);
router.get('/:teamId/members',                      teamMemberController.getMembersByTeam);
router.put('/:teamId/members/:memberId',            teamMemberController.updateTeamMemberRole);
router.delete('/:teamId/members/:memberId',         teamMemberController.removeTeamMember);

export default router;