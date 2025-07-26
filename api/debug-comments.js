// Debug endpoint to check comment storage
// Using Vercel KV for persistent storage

import { kv } from '@vercel/kv';

const COMMENTS_KEY = 'blog_comments_store';

async function loadCommentsStore() {
  try {
    const store = await kv.get(COMMENTS_KEY) || {};
    return store;
  } catch (error) {
    console.error('Error loading from KV:', error);
    global.commentsStore = global.commentsStore || {};
    return global.commentsStore;
  }
}

async function saveCommentsStore(store) {
  try {
    await kv.set(COMMENTS_KEY, store);
    global.commentsStore = store;
  } catch (error) {
    console.error('Error saving to KV:', error);
    global.commentsStore = store;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const store = await loadCommentsStore();
    
    return res.status(200).json({
      debug: true,
      timestamp: new Date().toISOString(),
      globalStorageExists: !!global.commentsStore,
      storageType: 'global-variable',
      totalPosts: Object.keys(store).length,
      allData: store,
      posts: Object.keys(store).map(postSlug => ({
        postSlug,
        commentCount: store[postSlug]?.length || 0,
        comments: store[postSlug] || []
      }))
    });
  }

  if (req.method === 'POST') {
    // Test endpoint to add a dummy comment
    const store = await loadCommentsStore();
    const testComment = {
      id: `test_${Date.now()}`,
      author: 'Test User',
      content: 'This is a test comment from debug endpoint',
      date: new Date().toISOString(),
      userPicture: 'https://ui-avatars.com/api/?name=Test&background=4285f4&color=fff&size=40',
      replies: []
    };
    
    const postSlug = req.body?.postSlug || 'test-post';
    if (!store[postSlug]) {
      store[postSlug] = [];
    }
    store[postSlug].unshift(testComment);
    
    await saveCommentsStore(store);
    return res.status(200).json({
      success: true,
      message: 'Test comment added',
      testComment,
      totalComments: store[postSlug].length
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 