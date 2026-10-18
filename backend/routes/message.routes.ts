import express from 'express';
import {
  getMessages,
  sendMessage,
  getconversations,
  lastmessage,
  groupids,
} from '../controllers/messagecontroller';
import { isauthenticateuser } from '../middleware/auth';

const router = express.Router();

router.route('/getmessages/:conversationId').get(isauthenticateuser, getMessages);
router.route('/sendmessage/:id').post(isauthenticateuser, sendMessage);
router.route('/sendmessage').post(isauthenticateuser, sendMessage);
router.route('/conversations/:id').get(isauthenticateuser, getconversations);
router.route('/lastmessage/:conversationId').get(isauthenticateuser, lastmessage);
router.route('/recieverId/:conversationId').get(isauthenticateuser, groupids);

export default router;
