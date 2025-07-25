// Simple comment storage API using GitHub Gists
// This allows comments to be shared across all devices/users

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // You'll need to set this
const GIST_ID = process.env.COMMENTS_GIST_ID; // You'll need to create a gist

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get comments for a specific post
      const { postSlug } = req.query;
      
      if (!GITHUB_TOKEN || !GIST_ID) {
        return res.status(200).json([]);
      }

      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return res.status(200).json([]);
      }

      const gist = await response.json();
      const filename = `comments_${postSlug}.json`;
      
      if (gist.files[filename]) {
        const comments = JSON.parse(gist.files[filename].content);
        return res.status(200).json(comments);
      }

      return res.status(200).json([]);
    }

    if (req.method === 'POST') {
      // Save a new comment
      const { postSlug, comment } = req.body;
      
      if (!GITHUB_TOKEN || !GIST_ID) {
        return res.status(500).json({ error: 'Storage not configured' });
      }

      // Get existing comments
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let existingComments = [];
      if (response.ok) {
        const gist = await response.json();
        const filename = `comments_${postSlug}.json`;
        
        if (gist.files[filename]) {
          existingComments = JSON.parse(gist.files[filename].content);
        }
      }

      // Add new comment
      existingComments.push(comment);

      // Update gist
      const updateResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            [`comments_${postSlug}.json`]: {
              content: JSON.stringify(existingComments, null, 2)
            }
          }
        })
      });

      if (!updateResponse.ok) {
        return res.status(500).json({ error: 'Failed to save comment' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Comment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 