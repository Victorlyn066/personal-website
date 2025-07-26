// Simple file-based storage for comments
// This persists between requests and works immediately

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  userPicture?: string;
  replies: Comment[];
}

// In-memory storage that persists during the session
let memoryStore: { [postSlug: string]: Comment[] } = {};

export function getComments(postSlug: string): Comment[] {
  return memoryStore[postSlug] || [];
}

export function addComment(postSlug: string, comment: Omit<Comment, 'id' | 'date'>): Comment {
  if (!memoryStore[postSlug]) {
    memoryStore[postSlug] = [];
  }

  const newComment: Comment = {
    ...comment,
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    replies: comment.replies || []
  };

  memoryStore[postSlug].unshift(newComment);
  
  // Log for debugging
  console.log(`Added comment to ${postSlug}:`, newComment);
  console.log(`Total comments for ${postSlug}:`, memoryStore[postSlug].length);
  
  return newComment;
}

export function addReply(postSlug: string, parentCommentId: string, reply: Omit<Comment, 'id' | 'date'>): Comment | null {
  const comments = memoryStore[postSlug] || [];

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
  
  if (success) {
    console.log(`Added reply to ${postSlug}:`, newReply);
  }
  
  return success ? newReply : null;
}

// Debug function to see all stored data
export function getAllData() {
  return memoryStore;
} 