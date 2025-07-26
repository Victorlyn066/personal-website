import type { APIRoute } from 'astro';

// Simple in-memory storage directly in this file
let commentsStore: Record<string, any[]> = {};

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('=== GET /api/comments START ===');
    const postSlug = url.searchParams.get('postSlug');
    console.log('postSlug:', postSlug);
    
    if (!postSlug) {
      return new Response(JSON.stringify({ error: 'postSlug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const comments = commentsStore[postSlug] || [];
    console.log('Found comments:', comments.length);
    
    return new Response(JSON.stringify({ comments }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('GET /api/comments error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  console.log('=== POST /api/comments START ===');
  try {
    console.log('1. Parsing request body...');
    const body = await request.json();
    console.log('2. Request body parsed:', body);
    
    const { postSlug, comment } = body;

    if (!postSlug || !comment) {
      console.log('3. ERROR - Missing postSlug or comment');
      return new Response(JSON.stringify({ error: 'postSlug and comment are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('3. Adding comment to storage...');
    
    // Initialize storage for this post if needed
    if (!commentsStore[postSlug]) {
      commentsStore[postSlug] = [];
    }
    
    // Create new comment
    const newComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      replies: comment.replies || []
    };
    
    // Add to storage
    commentsStore[postSlug].unshift(newComment);
    
    console.log('4. Comment added successfully:', newComment);
    console.log('5. Total comments now:', commentsStore[postSlug].length);

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
    console.error('=== POST /api/comments ERROR ===');
    console.error('Error details:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', String(error));
    return new Response(JSON.stringify({ 
      error: 'Server error', 
      details: String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
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