// Migration script to update comment post_slug values from old file-based IDs to new custom slugs
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping from old file-based IDs to new custom slugs
const slugMigrationMap = {
  'first-post': 'communicating-privacy-australian-law',
  'second-post': 'generative-ai-ip-challenges', 
  'third-post': 'regulating-deepfakes',
  'markdown-style-guide': 'cybersecurity-regulation-ai-systems',
  'using-mdx': 'algorithmic-bias-discrimination'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting comment migration...');
    
    // Get all comments to check current post_slug values
    const { data: allComments, error: fetchError } = await supabase
      .from('comments')
      .select('*');
      
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 Found ${allComments.length} total comments`);
    
    let migratedCount = 0;
    const migrationResults = [];
    
    // Process each comment
    for (const comment of allComments) {
      const oldSlug = comment.post_slug;
      const newSlug = slugMigrationMap[oldSlug];
      
      if (newSlug && newSlug !== oldSlug) {
        console.log(`🔄 Migrating comment ${comment.id}: "${oldSlug}" → "${newSlug}"`);
        
        // Update the comment with new post_slug
        const { error: updateError } = await supabase
          .from('comments')
          .update({ post_slug: newSlug })
          .eq('id', comment.id);
          
        if (updateError) {
          console.error(`❌ Failed to migrate comment ${comment.id}:`, updateError);
          migrationResults.push({
            commentId: comment.id,
            oldSlug,
            newSlug,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`✅ Successfully migrated comment ${comment.id}`);
          migratedCount++;
          migrationResults.push({
            commentId: comment.id,
            oldSlug,
            newSlug,
            success: true
          });
        }
      } else if (oldSlug) {
        console.log(`ℹ️ Comment ${comment.id} already uses correct slug: "${oldSlug}"`);
        migrationResults.push({
          commentId: comment.id,
          oldSlug,
          newSlug: oldSlug,
          success: true,
          alreadyCorrect: true
        });
      }
    }
    
    console.log(`🎉 Migration complete! Updated ${migratedCount} comments`);
    
    res.status(200).json({
      success: true,
      message: `Migration completed successfully`,
      totalComments: allComments.length,
      migratedCount,
      results: migrationResults
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
} 