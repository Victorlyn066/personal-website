// Vercel Function for comments API  
// Using Supabase for permanent database storage
// Comments persist forever across all cold starts and deployments
// Force deploy: 2025-01-25 - RETRY POST LIMIT

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} else {
  console.log('⚠️ Supabase not configured, using fallback storage');
}

// Fallback global storage if Supabase not available
global.commentsStore = global.commentsStore || {};

// Migration mapping from old file-based IDs to new custom slugs
const slugMigrationMap = {
  'first-post': 'communicating-privacy-australian-law',
  'second-post': 'generative-ai-ip-challenges', 
  'third-post': 'regulating-deepfakes',
  'markdown-style-guide': 'cybersecurity-regulation-ai-systems',
  'using-mdx': 'algorithmic-bias-discrimination'
};

// Global flag to ensure migration only runs once per deployment
global.commentsMigrationCompleted = global.commentsMigrationCompleted || false;

async function migrateOldSlugs() {
  if (!supabase || global.commentsMigrationCompleted) {
    return;
  }
  
  try {
    console.log('🔄 Checking for comments that need slug migration...');
    
    for (const [oldSlug, newSlug] of Object.entries(slugMigrationMap)) {
      const { data: oldComments, error } = await supabase
        .from('comments')
        .select('id')
        .eq('post_slug', oldSlug);
        
      if (error) {
        console.error(`❌ Error checking for ${oldSlug}:`, error);
        continue;
      }
      
      if (oldComments && oldComments.length > 0) {
        console.log(`🔄 Migrating ${oldComments.length} comments from "${oldSlug}" to "${newSlug}"`);
        
        const { error: updateError } = await supabase
          .from('comments')
          .update({ post_slug: newSlug })
          .eq('post_slug', oldSlug);
          
        if (updateError) {
          console.error(`❌ Failed to migrate ${oldSlug}:`, updateError);
        } else {
          console.log(`✅ Successfully migrated comments for ${oldSlug}`);
        }
      }
    }
    
    global.commentsMigrationCompleted = true;
    console.log('✅ Comment migration check completed');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

async function loadCommentsStore() {
  try {
    if (supabase) {
      // Run migration check first
      await migrateOldSlugs();
      
      console.log('📁 Loading comments from Supabase database...');
      
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
      
      console.log('📊 Available posts:', Object.keys(store));
      console.log('📈 Total stored comments:', Object.values(store).reduce((sum, comments) => sum + (comments?.length || 0), 0));
      return store;
      
    } else {
      console.log('📁 Using fallback storage...');
      return global.commentsStore;
    }
  } catch (error) {
    console.error('❌ Error loading from Supabase:', error);
    console.log('📁 Falling back to global storage...');
    return global.commentsStore;
  }
}

async function saveCommentsStore(store) {
  // We don't use this function with Supabase - we save individual comments instead
  global.commentsStore = store;
}

async function saveComment(postSlug, comment) {
  try {
    if (supabase) {
      console.log('💾 Saving comment to Supabase database...');
      
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
        console.error('❌ Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Comment saved to database permanently');
      console.log('📊 Saved data:', JSON.stringify(data, null, 2));
      return {
        id: data.id,
        author: data.author,
        content: data.content,
        date: data.created_at,
        userPicture: data.user_picture,
        replies: data.replies || []
      };
      
    } else {
      console.log('💾 Saving to fallback storage...');
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
    console.error('❌ Error saving comment:', error);
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
    console.log('=== GET /api/comments START ===');
    const { postSlug } = req.query;
    console.log('postSlug:', postSlug);

    if (!postSlug) {
      return res.status(400).json({ error: 'postSlug is required' });
    }

    try {
      const commentsStore = await loadCommentsStore();
      const comments = commentsStore[postSlug] || [];
      
      console.log('🔍 DEBUG INFO:');
      console.log('  - Requested postSlug:', postSlug);
      console.log('  - Available posts in storage:', Object.keys(commentsStore));
      console.log('  - Comments for this post:', comments.length);
      console.log('  - Full storage data:', JSON.stringify(commentsStore, null, 2));

      return res.status(200).json({ 
        comments,
        debug: {
          requestedPostSlug: postSlug,
          availablePosts: Object.keys(commentsStore),
          totalPosts: Object.keys(commentsStore).length,
          storageType: supabase ? 'supabase-permanent-database' : 'fallback-temporary',
          permanentStorage: !!supabase,
          supabaseConfigured: !!(supabaseUrl && supabaseKey)
        }
      });
    } catch (error) {
      console.error('❌ Error in GET /api/comments:', error);
      return res.status(500).json({ error: 'Failed to load comments', details: error.message });
    }
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
      const commentsStore = await loadCommentsStore();
      
      // Initialize storage for this post if needed
      if (!commentsStore[postSlug]) {
        commentsStore[postSlug] = [];
      }

      // Handle reply submission
      if (action === 'reply' && parentCommentId && reply) {
        console.log('3. Adding reply to comment...');
        
        const newReply = {
          ...reply,
          id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: new Date().toISOString(),
          replies: []
        };

        try {
          if (supabase) {
            console.log('💾 Adding reply to Supabase database...');
            
            // Get all comments for this post to update parent's replies array
            const { data: allComments, error: fetchError } = await supabase
              .from('comments')
              .select('*')
              .eq('post_slug', postSlug)
              .order('created_at', { ascending: false });
            
            if (fetchError) {
              throw fetchError;
            }
            
            // Function to find and update the target comment/reply recursively
            function addReplyToTarget(comments, targetId, newReply) {
              for (let comment of comments) {
                // Check if this is the target comment
                if (comment.id == targetId) {
                  const updatedReplies = [...(comment.replies || []), newReply];
                  return { comment, updatedReplies };
                }
                
                // Check nested replies recursively
                if (comment.replies && comment.replies.length > 0) {
                  const result = addReplyToNestedReplies(comment.replies, targetId, newReply);
                  if (result) {
                    return { comment, updatedReplies: comment.replies };
                  }
                }
              }
              return null;
            }
            
            // Function to handle nested replies
            function addReplyToNestedReplies(replies, targetId, newReply) {
              for (let i = 0; i < replies.length; i++) {
                if (replies[i].id === targetId) {
                  if (!replies[i].replies) replies[i].replies = [];
                  replies[i].replies.push(newReply);
                  return true;
                }
                
                // Check deeper nesting
                if (replies[i].replies && replies[i].replies.length > 0) {
                  if (addReplyToNestedReplies(replies[i].replies, targetId, newReply)) {
                    return true;
                  }
                }
              }
              return false;
            }
            
            const result = addReplyToTarget(allComments, parentCommentId, newReply);
            
            if (!result) {
              console.log('4. ERROR - Parent comment/reply not found in database');
              return res.status(404).json({ error: 'Parent comment or reply not found' });
            }
            
            // Update the top-level comment with the modified replies structure
            const { data, error: updateError } = await supabase
              .from('comments')
              .update({ replies: result.updatedReplies })
              .eq('id', result.comment.id)
              .select()
              .single();
            
            if (updateError) {
              throw updateError;
            }
            
            console.log('✅ Reply added to parent comment replies array only');
            
            return res.status(201).json({
              success: true,
              reply: newReply,
              action: 'reply',
              storage: 'supabase-permanent'
            });
            
          } else {
            console.log('💾 Adding reply to fallback storage...');
            
            // Fallback: Find the parent comment and add reply
            function addReplyToComment(comments, parentId, newReply) {
              for (let comment of comments) {
                if (comment.id == parentId) {
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

            const replyAdded = addReplyToComment(commentsStore[postSlug], parentCommentId, newReply);

            if (replyAdded) {
              console.log('4. Reply added successfully to fallback storage');
              
              return res.status(201).json({
                success: true,
                reply: newReply,
                action: 'reply',
                storage: 'fallback-temporary'
              });
            } else {
              console.log('4. ERROR - Parent comment not found in fallback');
              return res.status(404).json({ error: 'Parent comment not found' });
            }
          }
        } catch (error) {
          console.error('❌ Error adding reply:', error);
          return res.status(500).json({ 
            error: 'Failed to save reply', 
            details: error.message 
          });
        }
      }

      // Handle regular comment submission
      if (comment) {
        console.log('3. Adding comment to database...');

        const savedComment = await saveComment(postSlug, comment);

        console.log('4. Comment saved permanently:', savedComment);

        return res.status(201).json({
          success: true,
          comment: savedComment,
          action: 'comment',
          storage: supabase ? 'supabase-permanent' : 'fallback-temporary'
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