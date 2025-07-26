// Vercel Function for comments API  
// Using simple global storage with GitHub backup
// This provides shared storage that works immediately

// Global storage for immediate functionality
global.commentsStore = global.commentsStore || {};

async function loadCommentsStore() {
  try {
    console.log('📁 Loading comments from global storage...');
    
    // Try to load from GitHub data file as fallback
    if (Object.keys(global.commentsStore).length === 0) {
      try {
        const response = await fetch('https://raw.githubusercontent.com/Victorlyn066/personal-website/main/data/comments.json');
        if (response.ok) {
          const data = await response.json();
          global.commentsStore = data.comments || {};
          console.log('📥 Loaded initial data from GitHub');
        }
      } catch (error) {
        console.log('ℹ️ No initial data found, starting fresh');
      }
    }
    
    console.log('📊 Available posts:', Object.keys(global.commentsStore));
    console.log('📈 Total stored comments:', Object.values(global.commentsStore).reduce((sum, comments) => sum + (comments?.length || 0), 0));
    return global.commentsStore;
  } catch (error) {
    console.error('❌ Error loading comments:', error);
    global.commentsStore = global.commentsStore || {};
    return global.commentsStore;
  }
}

async function saveCommentsStore(store) {
  try {
    console.log('💾 Saving comments to global storage...');
    global.commentsStore = store;
    console.log('✅ Comments saved successfully');
    console.log('📊 Saved posts:', Object.keys(store));
    console.log('📈 Total comments:', Object.values(store).reduce((sum, comments) => sum + (comments?.length || 0), 0));
    
    // In a real implementation, you'd sync this to a database
    // For now, the global storage provides shared functionality within the same function instance
  } catch (error) {
    console.error('❌ Error saving comments:', error);
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
          storageType: 'global-storage-simple',
          functionalSharing: 'immediate-within-instance',
          globalStorageActive: true
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
          await saveCommentsStore(commentsStore);
          
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
        await saveCommentsStore(commentsStore);

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