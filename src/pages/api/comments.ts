import type { APIRoute } from 'astro';
import { getComments, addComment } from '../../lib/simple-storage';

export const GET: APIRoute = async ({ url }) => {
  try {
    const postSlug = url.searchParams.get('postSlug');
    
    if (!postSlug) {
      return new Response(JSON.stringify({ error: 'postSlug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const comments = getComments(postSlug);
    
    return new Response(JSON.stringify({ comments }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('GET /api/comments error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
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
    // Add the new comment using shared storage
    const newComment = addComment(postSlug, comment);
    console.log('4. Comment added successfully:', newComment);

    const allComments = getComments(postSlug);
    const totalComments = allComments.length;

    return new Response(JSON.stringify({ 
      success: true, 
      comment: newComment,
      total: totalComments
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