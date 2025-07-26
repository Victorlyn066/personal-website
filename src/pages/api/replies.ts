import type { APIRoute } from 'astro';
import { addReply } from '../../lib/storage';

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

    // Add the reply using shared storage
    const newReply = addReply(postSlug, parentCommentId, reply);

    if (!newReply) {
      return new Response(JSON.stringify({ error: 'Parent comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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