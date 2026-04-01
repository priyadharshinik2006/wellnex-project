import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All community routes are protected by authentication
router.use(authenticateToken);

router.get('/posts', communityController.getAllPosts);
router.post('/posts', communityController.createPost);
router.post('/posts/:id/like', communityController.likePost);
router.post('/posts/:postId/comments', communityController.createComment);

export default router;
