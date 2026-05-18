const express = require('express');
const auth = require('../../middleware/auth');
const projectMemberController = require('./projectMember.controller');

// mergeParams: true → allows access to :projectId from the parent route
const router = express.Router({ mergeParams: true });

router.use(auth);

// ── Nested under /api/projects/:projectId/members ──────────────────────────────
//
// POST   /api/projects/:projectId/members              → add a member
// GET    /api/projects/:projectId/members              → get all members of a project
// PUT    /api/projects/:projectId/members/:memberId    → update member role
// DELETE /api/projects/:projectId/members/:memberId    → remove member

router.post('/',                    projectMemberController.addMember);
router.get('/',                     projectMemberController.getMembersByProject);
router.put('/:memberId',            projectMemberController.updateMemberRole);
router.delete('/:memberId',         projectMemberController.removeMember);

// ── Standalone: get all projects a specific user belongs to ───────────────────
// GET    /api/project-members/user/:userId

router.get('/user/:userId',         projectMemberController.getProjectsByUser);

module.exports = router;