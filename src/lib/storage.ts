// Shared in-memory storage for comments
// In production, this would be replaced with a persistent database like Vercel KV

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  userPicture?: string;
  replies: Comment[];
}

export interface CommentsStore {
  [postSlug: string]: Comment[];
}

// Global storage object
export const commentsStore: CommentsStore = {};

export function getComments(postSlug: string): Comment[] {
  return commentsStore[postSlug] || [];
}

export function addComment(postSlug: string, comment: Omit<Comment, 'id' | 'date'>): Comment {
  if (!commentsStore[postSlug]) {
    commentsStore[postSlug] = [];
  }

  const newComment: Comment = {
    ...comment,
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    replies: comment.replies || []
  };

  commentsStore[postSlug].unshift(newComment);
  return newComment;
}

export function addReply(postSlug: string, parentCommentId: string, reply: Omit<Comment, 'id' | 'date'>): Comment | null {
  const comments = commentsStore[postSlug] || [];

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

  const newReply: Comment = {
    ...reply,
    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    replies: []
  };

  const success = addReplyToComment(comments, parentCommentId, newReply);
  return success ? newReply : null;
} 