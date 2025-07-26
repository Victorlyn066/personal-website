// Debug endpoint to check comment storage - SUPABASE VERSION
// Using Supabase for permanent database storage - matches main API
// Force deploy: 2025-01-25

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Debug: Supabase client initialized');
} else {
  console.log('⚠️ Debug: Supabase not configured, using fallback storage');
}

// Fallback global storage if Supabase not available
global.commentsStore = global.commentsStore || {};

async function loadCommentsStore() {
  try {
    if (supabase) {
      console.log('📁 Debug: Loading comments from Supabase database...');
      
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Convert database rows to our comment structure
      const store = {};
      data.forEach(row => {
        if (!store[row.post_slug]) {
          store[row.post_slug] = [];
        }
        
        const comment = {
          id: row.id,
          author: row.author,
          content: row.content,
          date: row.created_at,
          userPicture: row.user_picture,
          replies: row.replies || []
        };
        
        store[row.post_slug].push(comment);
      });
      
      console.log('📊 Debug: Available posts:', Object.keys(store));
      return store;
      
    } else {
      console.log('📁 Debug: Using fallback storage...');
      return global.commentsStore;
    }
  } catch (error) {
    console.error('❌ Debug: Error loading from Supabase:', error);
    console.log('📁 Debug: Falling back to global storage...');
    return global.commentsStore;
  }
}

async function saveTestComment(postSlug, comment) {
  try {
    if (supabase) {
      console.log('💾 Debug: Saving test comment to Supabase database...');
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_slug: postSlug,
          author: comment.author,
          content: comment.content,
          user_picture: comment.userPicture,
          replies: comment.replies || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Debug: Test comment saved to database permanently');
      return {
        id: data.id,
        author: data.author,
        content: data.content,
        date: data.created_at,
        userPicture: data.user_picture,
        replies: data.replies || []
      };
      
    } else {
      console.log('💾 Debug: Saving to fallback storage...');
      if (!global.commentsStore[postSlug]) {
        global.commentsStore[postSlug] = [];
      }
      const newComment = {
        ...comment,
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString()
      };
      global.commentsStore[postSlug].unshift(newComment);
      return newComment;
    }
  } catch (error) {
    console.error('❌ Debug: Error saving test comment:', error);
    throw error;
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
      storageType: supabase ? 'supabase-permanent-database' : 'fallback-temporary',
      permanentStorage: !!supabase,
      supabaseConfigured: !!(supabaseUrl && supabaseKey),
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
    // Test endpoint to add a dummy comment to Supabase
    const testComment = {
      author: 'Test User',
      content: 'This is a test comment from debug endpoint',
      userPicture: 'https://ui-avatars.com/api/?name=Test&background=4285f4&color=fff&size=40',
      replies: []
    };
    
    const postSlug = req.body?.postSlug || 'using-mdx';
    
    try {
      const savedComment = await saveTestComment(postSlug, testComment);
      
      return res.status(200).json({
        success: true,
        message: 'Test comment added to Supabase',
        testComment: savedComment,
        storage: supabase ? 'supabase-permanent' : 'fallback-temporary'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save test comment',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 