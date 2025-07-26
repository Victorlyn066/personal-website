import type { APIRoute } from 'astro';

// Simple in-memory storage for demo (you can replace with Vercel KV later)
let commentsStore: Record<string, any[]> = {};

export const GET: APIRoute = async ({ url }) => {
  const postSlug = url.searchParams.get('postSlug');
  
  if (!postSlug) {
    return new Response(JSON.stringify({ error: 'postSlug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const comments = commentsStore[postSlug] || [];
  
  return new Response(JSON.stringify({ comments }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { postSlug, comment } = body;

    if (!postSlug || !comment) {
      return new Response(JSON.stringify({ error: 'postSlug and comment are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize comments array for this post if it doesn't exist
    if (!commentsStore[postSlug]) {
      commentsStore[postSlug] = [];
    }

    // Add the new comment
    const newComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      replies: comment.replies || []
    };

    commentsStore[postSlug].unshift(newComment);

    return new Response(JSON.stringify({ 
      success: true, 
      comment: newComment,
      total: commentsStore[postSlug].length 
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}; 