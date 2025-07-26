// Vercel Function for comments API
// This works with static Astro builds

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// File-based storage that persists across function invocations
const STORAGE_FILE = '/tmp/comments.json';

function loadCommentsStore() {
  try {
    if (existsSync(STORAGE_FILE)) {
      console.log('📁 Loading existing comments from storage file');
      const data = readFileSync(STORAGE_FILE, 'utf8');
      const store = JSON.parse(data);
      console.log('📊 Loaded store with posts:', Object.keys(store));
      return store;
    } else {
      console.log('📁 No storage file exists, starting with empty store');
    }
  } catch (error) {
    console.error('❌ Error loading comments store:', error);
  }
  return {};
}

function saveCommentsStore(store) {
  try {
    writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2));
    console.log('💾 Comments store saved successfully');
    console.log('📊 Saved store with posts:', Object.keys(store));
    const totalComments = Object.values(store).reduce((sum, comments) => sum + comments.length, 0);
    console.log('📈 Total comments across all posts:', totalComments);
  } catch (error) {
    console.error('❌ Error saving comments store:', error);
  }
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
    console.log('=== GET /api/comments START ===');
    const { postSlug } = req.query;
    console.log('postSlug:', postSlug);

    if (!postSlug) {
      return res.status(400).json({ error: 'postSlug is required' });
    }

    const commentsStore = loadCommentsStore();
    const comments = commentsStore[postSlug] || [];
    console.log('Loaded comments from storage:', comments.length);
    console.log('Storage file exists:', existsSync(STORAGE_FILE));

    return res.status(200).json({ comments });
  }

  if (req.method === 'POST') {
    console.log('=== POST /api/comments START ===');
    try {
      console.log('1. Parsing request body...');
      const { postSlug, comment, parentCommentId, reply, action } = req.body;
      console.log('2. Request body parsed:', { postSlug, comment, parentCommentId, reply, action });

      if (!postSlug) {
        console.log('3. ERROR - Missing postSlug');
        return res.status(400).json({ error: 'postSlug is required' });
      }

      // Load current storage
      const commentsStore = loadCommentsStore();
      
      // Initialize storage for this post if needed
      if (!commentsStore[postSlug]) {
        commentsStore[postSlug] = [];
      }

      // Handle reply submission
      if (action === 'reply' && parentCommentId && reply) {
        console.log('3. Adding reply to comment...');
        
        // Find the parent comment and add reply
        function addReplyToComment(comments, parentId, newReply) {
          for (let comment of comments) {
            if (comment.id === parentId) {
              if (!comment.replies) comment.replies = [];
              comment.replies.push(newReply);
              return true;
            }
            // Check nested replies
            if (comment.replies && addReplyToComment(comment.replies, parentId, newReply)) {
              return true;
            }
          }
          return false;
        }

        const newReply = {
          ...reply,
          id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: new Date().toISOString(),
          replies: []
        };

        const replyAdded = addReplyToComment(commentsStore[postSlug], parentCommentId, newReply);

        if (replyAdded) {
          console.log('4. Reply added successfully:', newReply);
          console.log('5. Saving updated comments to storage...');
          saveCommentsStore(commentsStore);
          
          return res.status(201).json({
            success: true,
            reply: newReply,
            action: 'reply'
          });
        } else {
          console.log('4. ERROR - Parent comment not found');
          return res.status(404).json({ error: 'Parent comment not found' });
        }
      }

      // Handle regular comment submission
      if (comment) {
        console.log('3. Adding comment to storage...');

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
        console.log('6. Saving updated comments to storage...');
        saveCommentsStore(commentsStore);

        return res.status(201).json({
          success: true,
          comment: newComment,
          total: commentsStore[postSlug].length,
          action: 'comment'
        });
      }

      return res.status(400).json({ error: 'Invalid request: missing comment or reply data' });

    } catch (error) {
      console.error('=== POST /api/comments ERROR ===');
      console.error('Error details:', error);
      return res.status(500).json({
        error: 'Server error',
        details: String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 