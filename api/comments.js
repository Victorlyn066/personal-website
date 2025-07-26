// Vercel Function for comments API
// This works with static Astro builds

// Simple in-memory storage (resets on deployment)
let commentsStore = {};

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

    const comments = commentsStore[postSlug] || [];
    console.log('Found comments:', comments.length);

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