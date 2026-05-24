import express from 'express';
import auth from '../middleware/auth.js';
import invitationController from './invitations/invitation.controller.js';

const router = express.Router();

router.post('/', auth, invitationController.createInvitation);
router.post('/accept/:token', invitationController.handleInvitationResponse);
router.post('/reject/:token', invitationController.handleInvitationResponse);
router.get('/', auth, invitationController.getAllInvitations);
router.get('/my', auth, invitationController.getMyInvitations);
router.get('/token/:token', invitationController.getInvitationByToken);
router.get('/:id', auth, invitationController.getInvitationById);
router.put('/:id', auth, invitationController.updateInvitation);
router.delete('/:id', auth, invitationController.deleteInvitation);

export default router;