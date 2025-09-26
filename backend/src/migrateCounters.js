const mongoose = require('mongoose');
const { Issue } = require('./models/Issue');
require('dotenv').config();

/**
 * Migration script to populate counter fields for existing issues
 * Run this once after adding upvotesCount, downvotesCount, and commentsCount fields
 */
async function migrateIssueCounters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all issues
    const issues = await Issue.find({});
    console.log(`Found ${issues.length} issues to migrate`);

    let updatedCount = 0;

    for (const issue of issues) {
      const upvotesCount = issue.votes.upvotes ? issue.votes.upvotes.length : 0;
      const downvotesCount = issue.votes.downvotes ? issue.votes.downvotes.length : 0;
      const commentsCount = issue.comments ? issue.comments.length : 0;

      // Update the issue with counter values
      await Issue.updateOne(
        { _id: issue._id },
        {
          $set: {
            'votes.upvotesCount': upvotesCount,
            'votes.downvotesCount': downvotesCount,
            commentsCount: commentsCount
          }
        }
      );

      updatedCount++;
      if (updatedCount % 100 === 0) {
        console.log(`Updated ${updatedCount} issues...`);
      }
    }

    console.log(`Migration completed! Updated ${updatedCount} issues`);

    // Verify a few random issues
    const sampleIssues = await Issue.find({}).limit(3).select('votes.upvotesCount votes.downvotesCount commentsCount votes.upvotes votes.downvotes comments');
    console.log('\nSample verification:');
    sampleIssues.forEach((issue, index) => {
      console.log(`Issue ${index + 1}:`);
      console.log(`  upvotesCount: ${issue.votes.upvotesCount} (actual: ${issue.votes.upvotes?.length || 0})`);
      console.log(`  downvotesCount: ${issue.votes.downvotesCount} (actual: ${issue.votes.downvotes?.length || 0})`);
      console.log(`  commentsCount: ${issue.commentsCount} (actual: ${issue.comments?.length || 0})`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateIssueCounters();
}

module.exports = { migrateIssueCounters };