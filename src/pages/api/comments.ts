import type { APIRoute } from 'astro';
import { getComments, addComment } from '../../lib/storage';

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
  try {
    console.log('POST /api/comments called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { postSlug, comment } = body;

    if (!postSlug || !comment) {
      console.log('Missing postSlug or comment');
      return new Response(JSON.stringify({ error: 'postSlug and comment are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add the new comment using shared storage
    const newComment = addComment(postSlug, comment);
    console.log('Comment added:', newComment);

    const totalComments = getComments(postSlug).length;

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
    console.error('POST /api/comments error:', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON or server error' }), {
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