import type { APIRoute } from 'astro';

// Simple in-memory storage for demo (you can replace with Vercel KV later)
let commentsStore: Record<string, any[]> = {};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { postSlug, parentCommentId, reply } = body;

    if (!postSlug || !parentCommentId || !reply) {
      return new Response(JSON.stringify({ error: 'postSlug, parentCommentId, and reply are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get comments for this post
    const comments = commentsStore[postSlug] || [];

    // Find the parent comment and add the reply
    const addReplyToComment = (comments: any[], parentId: string, newReply: any): boolean => {
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

    const newReply = {
      ...reply,
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      replies: []
    };

    const success = addReplyToComment(comments, parentCommentId, newReply);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Parent comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the store
    commentsStore[postSlug] = comments;

    return new Response(JSON.stringify({ 
      success: true, 
      reply: newReply
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}; 