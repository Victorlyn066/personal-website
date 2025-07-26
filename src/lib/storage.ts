// Persistent storage using Vercel KV (Redis)
// FREE tier: 30k requests/month, 256MB storage

import { kv } from '@vercel/kv';

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  userPicture?: string;
  replies: Comment[];
}

// Fallback in-memory storage for development/testing
let fallbackStore: { [postSlug: string]: Comment[] } = {};

// Check if we have KV credentials (production)
const hasKV = !!process.env.KV_REST_API_URL;

export async function getComments(postSlug: string): Promise<Comment[]> {
  try {
    if (hasKV) {
      const comments = await kv.get<Comment[]>(`comments:${postSlug}`);
      return comments || [];
    } else {
      // Fallback to in-memory for development
      console.log('Using fallback storage (development mode)');
      return fallbackStore[postSlug] || [];
    }
  } catch (error) {
    console.error('Error getting comments:', error);
    return fallbackStore[postSlug] || [];
  }
}

export async function addComment(postSlug: string, comment: Omit<Comment, 'id' | 'date'>): Promise<Comment> {
  const newComment: Comment = {
    ...comment,
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    replies: comment.replies || []
  };

  try {
    if (hasKV) {
      const existingComments = await getComments(postSlug);
      const updatedComments = [newComment, ...existingComments];
      await kv.set(`comments:${postSlug}`, updatedComments);
    } else {
      // Fallback to in-memory for development
      if (!fallbackStore[postSlug]) {
        fallbackStore[postSlug] = [];
      }
      fallbackStore[postSlug].unshift(newComment);
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    // Still return the comment even if storage fails
  }

  return newComment;
}

export async function addReply(postSlug: string, parentCommentId: string, reply: Omit<Comment, 'id' | 'date'>): Promise<Comment | null> {
  const newReply: Comment = {
    ...reply,
    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    replies: []
  };

  try {
    const comments = await getComments(postSlug);

    const addReplyToComment = (comments: Comment[], parentId: string, newReply: Comment): boolean => {
      for (let comment of comments) {
        if (comment.id === parentId) {
          if (!comment.replies) comment.replies = [];
          comment.replies.push(newReply);
          return true;
        }
        if (comment.replies && addReplyToComment(comment.replies, parentId, newReply)) {
          return true;
        }
      }
      return false;
    };

    const success = addReplyToComment(comments, parentCommentId, newReply);
    
    if (success) {
      if (hasKV) {
        await kv.set(`comments:${postSlug}`, comments);
      } else {
        fallbackStore[postSlug] = comments;
      }
      return newReply;
    }
  } catch (error) {
    console.error('Error adding reply:', error);
  }
  
  return null;
} 