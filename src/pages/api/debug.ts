import type { APIRoute } from 'astro';
import { getAllData } from '../../lib/simple-storage';

export const GET: APIRoute = async () => {
  const allData = getAllData();
  
  return new Response(JSON.stringify({
    message: 'Debug info',
    storedData: allData,
    timestamp: new Date().toISOString()
  }, null, 2), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}; 