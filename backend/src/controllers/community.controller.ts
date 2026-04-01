import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

export const getAllPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = await (prisma as any).communityPost.findMany({
      include: {
        comments: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    // Format timeAgo on the backend or frontend? 
    // Frontend is already doing it, but let's make sure it's consistent.
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, content, authorAlias } = req.body;
    
    if (!content || !category || !authorAlias) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const post = await (prisma as any).communityPost.create({
      data: {
        category,
        content,
        authorAlias,
        timestamp: new Date()
      }
    });

    res.json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const post = await (prisma as any).communityPost.update({
      where: { id },
      data: {
        likes: { increment: 1 }
      }
    });

    res.json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { content, authorAlias } = req.body;

    if (!content || !authorAlias) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const comment = await (prisma as any).communityComment.create({
      data: {
        postId,
        content,
        authorAlias,
        timestamp: new Date()
      }
    });

    res.json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
