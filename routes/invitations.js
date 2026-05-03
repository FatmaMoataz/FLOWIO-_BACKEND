const express = require('express');
const auth = require('../middleware/auth');
const invitationController = require('./invitations/invitation.controller');

const router = express.Router();

router.post('/', auth, invitationController.createInvitation);
router.post('/accept/:token', invitationController.handleInvitationResponse);
router.post('/reject/:token', invitationController.handleInvitationResponse);
router.get('/', auth, invitationController.getAllInvitations);
router.get('/token/:token', invitationController.getInvitationByToken);
router.get('/:id', auth, invitationController.getInvitationById);
router.put('/:id', auth, invitationController.updateInvitation);
router.delete('/:id', auth, invitationController.deleteInvitation);

module.exports = router;
