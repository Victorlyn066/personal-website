// Debug endpoint to check comment storage
import { readFileSync, writeFileSync, existsSync } from 'fs';

const STORAGE_FILE = '/tmp/comments.json';

function loadCommentsStore() {
  try {
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading comments store:', error);
  }
  return {};
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const store = loadCommentsStore();
    
    return res.status(200).json({
      debug: true,
      timestamp: new Date().toISOString(),
      storageFileExists: existsSync(STORAGE_FILE),
      storageFilePath: STORAGE_FILE,
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
    const store = loadCommentsStore();
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
    
    try {
      writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2));
      return res.status(200).json({
        success: true,
        message: 'Test comment added',
        testComment,
        totalComments: store[postSlug].length
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to save test comment',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 