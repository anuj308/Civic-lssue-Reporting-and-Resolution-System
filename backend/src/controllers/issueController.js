const { validationResult } = require('express-validator');
const { Issue } = require('../models/Issue');
const { Department } = require('../models/Department');
const { processIssueImages } = require('../utils/cloudinaryService');

class IssueController {
  /**
   * Create a new issue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createIssue(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
        console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        title,
        description,
        category,
        subcategory,
        priority,
        location,
        media,
        tags,
        isPublic
      } = req.body;

      console.log('🔍 Creating issue with data:', {
        title,
        description,
        category,
        location: location?.address,
        mediaImages: media?.images?.length || 0
      });

      // Process images with Cloudinary if provided
      let processedMedia = { images: [], videos: [], audio: null };
      
      if (media?.images && media.images.length > 0) {
        console.log('📸 Processing images with Cloudinary...');
        console.log('Raw images received:', media.images.length);
        console.log('🔍 Image data analysis:');
        media.images.forEach((img, index) => {
          console.log(`  Image ${index}:`, {
            type: typeof img,
            length: img?.length,
            preview: typeof img === 'string' ? img.substring(0, 100) + '...' : img,
            startsWithFile: typeof img === 'string' ? img.startsWith('file://') : false,
            startsWithData: typeof img === 'string' ? img.startsWith('data:') : false,
          });
        });
        
        try {
          // Create a temporary issue ID for folder organization
          const tempIssueId = new Date().getTime().toString();
          
          // Upload images to Cloudinary
          const uploadedImages = await processIssueImages(media.images, tempIssueId);
          
          // Extract URLs for the database (keeping it simple as per schema)
          processedMedia.images = uploadedImages.map(img => img.url);
          
          console.log('✅ Images processed successfully:', uploadedImages.length, 'uploaded');
          console.log('📋 Image URLs:', processedMedia.images);
        } catch (imageError) {
          console.error('❌ Error processing images:', imageError);
          // Continue with issue creation but log the error
          // You might want to decide whether to fail the entire request or continue
          processedMedia.images = []; // Fallback to empty array
        }
      }

      // Copy other media types as-is
      if (media?.videos) processedMedia.videos = media.videos;
      if (media?.audio) processedMedia.audio = media.audio;

      // Process location coordinates - convert from object to array format for MongoDB 2dsphere
      const processedLocation = { ...location };
      if (location.coordinates && typeof location.coordinates === 'object' && !Array.isArray(location.coordinates)) {
        // Convert {latitude, longitude} to [longitude, latitude]
        const { latitude, longitude } = location.coordinates;
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          processedLocation.coordinates = [longitude, latitude];
          console.log('📍 Converted coordinates from object to array:', location.coordinates, '->', processedLocation.coordinates);
        } else {
          console.error('❌ Invalid coordinate format received:', location.coordinates);
          return res.status(400).json({
            success: false,
            message: 'Invalid coordinate format. Expected {latitude, longitude} with numeric values.'
          });
        }
      }

      // Create new issue
      const issue = new Issue({
        title,
        description,
        category,
        subcategory,
        priority: priority || 'medium',
        reportedBy: req.user._id, // Use req.user._id instead of req.user.userId
        location: processedLocation,
        media: processedMedia,
        tags: tags || [],
        isPublic: isPublic !== false, // Default to true
        metadata: {
          deviceInfo: req.headers['user-agent'],
          reportingMethod: 'mobile'
        }
      });

      // Calculate urgency score
      issue.urgencyScore = calculateUrgencyScore(issue);

      await issue.save();

      console.log('✅ Issue created successfully:', issue._id);

      // Update Cloudinary folder with actual issue ID
      if (processedMedia.images.length > 0) {
        console.log('📁 Updating Cloudinary folder organization for issue:', issue._id);
        // Note: In a production environment, you might want to rename the folder
        // For now, we'll keep the timestamp-based folder
      }

      await issue.save();

      console.log('✅ Issue created successfully:', issue._id);

      // Populate reporter info for response
      await issue.populate('reportedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Issue reported successfully!',
        data: {
          issue: {
            id: issue._id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            subcategory: issue.subcategory,
            priority: issue.priority,
            status: issue.status,
            statusDisplay: issue.statusDisplay,
            location: issue.location,
            media: issue.media,
            timeline: issue.timeline,
            reportedBy: issue.reportedBy,
            urgencyScore: issue.urgencyScore,
            voteScore: issue.voteScore,
            daysSinceReported: issue.daysSinceReported,
            tags: issue.tags,
            isPublic: issue.isPublic,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creating issue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating issue'
      });
    }
  }

  /**
   * Get user's issues
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMyIssues(req, res) {
    try {
      const { page = 1, limit = 10, status, category, sortBy = 'createdAt', order = 'desc' } = req.query;
      
      const filters = { reportedBy: req.user._id };
      
      // Add optional filters
      if (status) filters.status = status;
      if (category) filters.category = category;

      const sortOrder = order === 'desc' ? -1 : 1;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      console.log('🔍 Fetching issues for user:', req.user._id, 'with filters:', filters);

      const issues = await Issue.find(filters)
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('assignedDepartment', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const totalIssues = await Issue.countDocuments(filters);
      const totalPages = Math.ceil(totalIssues / parseInt(limit));

      console.log(`✅ Found ${issues.length} issues for user ${req.user._id}`);

      // Add user vote status to each issue
      const issuesWithUserVotes = issues.map(issue => {
        let userVote = null;
        const userId = req.user._id.toString();
        if (issue.votes?.upvotes?.some(id => id.toString() === userId)) {
          userVote = 'upvote';
        } else if (issue.votes?.downvotes?.some(id => id.toString() === userId)) {
          userVote = 'downvote';
        }

        return {
          id: issue._id,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          subcategory: issue.subcategory,
          priority: issue.priority,
          status: issue.status,
          statusDisplay: getStatusDisplay(issue.status),
          location: issue.location,
          media: issue.media,
          timeline: issue.timeline,
          reportedBy: issue.reportedBy,
          assignedTo: issue.assignedTo,
          assignedDepartment: issue.assignedDepartment,
          voteScore: (issue.votes?.upvotes?.length || 0) - (issue.votes?.downvotes?.length || 0),
          userVote: userVote,
          daysSinceReported: Math.floor((Date.now() - new Date(issue.timeline?.reported || issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          tags: issue.tags,
          isPublic: issue.isPublic,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        };
      });

      res.status(200).json({
        success: true,
        message: 'Issues retrieved successfully',
        data: {
          issues: issuesWithUserVotes,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalIssues,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching user issues:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching issues'
      });
    }
  }

  /**
   * Get all public issues (for public view)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getPublicIssues(req, res) {
    try {
      const { page = 1, limit = 10, status, category, priority, search, sortBy = 'createdAt', order = 'desc' } = req.query;
      
      const filters = { isPublic: true };
      
      // Add optional filters
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (priority) filters.priority = priority;
      
      // Add search filter if provided
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
        filters.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
      }

      const sortOrder = order === 'desc' ? -1 : 1;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const issues = await Issue.find(filters)
        .populate('reportedBy', 'name')
        .populate('assignedDepartment', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const totalIssues = await Issue.countDocuments(filters);
      const totalPages = Math.ceil(totalIssues / parseInt(limit));

      // Add user vote status to each issue (if user is authenticated)
      const issuesWithUserVotes = issues.map(issue => {
        let userVote = null;
        if (req.user) {
          const userId = req.user._id.toString();
          if (issue.votes?.upvotes?.some(id => id.toString() === userId)) {
            userVote = 'upvote';
          } else if (issue.votes?.downvotes?.some(id => id.toString() === userId)) {
            userVote = 'downvote';
          }
        }

        return {
          id: issue._id,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          subcategory: issue.subcategory,
          priority: issue.priority,
          status: issue.status,
          statusDisplay: getStatusDisplay(issue.status),
          location: {
            address: issue.location.address,
            city: issue.location.city,
            state: issue.location.state,
            pincode: issue.location.pincode,
            landmark: issue.location.landmark
            // Don't expose exact coordinates for privacy
          },
          media: issue.media,
          timeline: issue.timeline,
          reportedBy: issue.reportedBy ? { name: issue.reportedBy.name } : null,
          assignedDepartment: issue.assignedDepartment,
          voteScore: (issue.votes?.upvotes?.length || 0) - (issue.votes?.downvotes?.length || 0),
          userVote: userVote,
          daysSinceReported: Math.floor((Date.now() - new Date(issue.timeline?.reported || issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          tags: issue.tags,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        };
      });

      res.status(200).json({
        success: true,
        message: 'Public issues retrieved successfully',
        data: {
          issues: issuesWithUserVotes,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalIssues,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching public issues:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching public issues'
      });
    }
  }

  /**
   * Get nearby issues
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getNearbyIssues(req, res) {
    try {
      const { latitude, longitude, radius = 5000, page = 1, limit = 10 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const issues = await Issue.find({
        isPublic: true,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(radius)
          }
        }
      })
      .populate('reportedBy', 'name')
      .populate('assignedDepartment', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

      // Add user vote status to each issue (if user is authenticated)
      const issuesWithUserVotes = issues.map(issue => {
        let userVote = null;
        if (req.user) {
          const userId = req.user._id.toString();
          if (issue.votes?.upvotes?.some(id => id.toString() === userId)) {
            userVote = 'upvote';
          } else if (issue.votes?.downvotes?.some(id => id.toString() === userId)) {
            userVote = 'downvote';
          }
        }

        return {
          id: issue._id,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          priority: issue.priority,
          status: issue.status,
          statusDisplay: getStatusDisplay(issue.status),
          location: issue.location,
          media: issue.media,
          timeline: issue.timeline,
          reportedBy: issue.reportedBy ? { name: issue.reportedBy.name } : null,
          assignedDepartment: issue.assignedDepartment,
          voteScore: (issue.votes?.upvotes?.length || 0) - (issue.votes?.downvotes?.length || 0),
          userVote: userVote,
          daysSinceReported: Math.floor((Date.now() - new Date(issue.timeline?.reported || issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          tags: issue.tags,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        };
      });

      res.status(200).json({
        success: true,
        message: 'Nearby issues retrieved successfully',
        data: {
          issues: issuesWithUserVotes,
          searchParams: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            radius: parseInt(radius)
          },
          totalFound: issues.length
        }
      });

    } catch (error) {
      console.error('❌ Error fetching nearby issues:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching nearby issues'
      });
    }
  }

  /**
   * Get issue by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getIssueById(req, res) {
    try {
      const { issueId } = req.params;

      const issue = await Issue.findById(issueId)
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('assignedDepartment', 'name')
        .populate('comments.user', 'name')
        .lean();

      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Check if user has permission to view this issue
      if (!issue.isPublic && (!req.user || req.user._id.toString() !== issue.reportedBy._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this issue.'
        });
      }

      // Increment view count
      await Issue.findByIdAndUpdate(issueId, { $inc: { 'analytics.views': 1 } });

      // Determine user's vote status
      let userVote = null;
      if (req.user) {
        const userId = req.user._id.toString();
        if (issue.votes?.upvotes?.some(id => id.toString() === userId)) {
          userVote = 'upvote';
        } else if (issue.votes?.downvotes?.some(id => id.toString() === userId)) {
          userVote = 'downvote';
        }
      }

      res.status(200).json({
        success: true,
        message: 'Issue retrieved successfully',
        data: {
          issue: {
            id: issue._id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            subcategory: issue.subcategory,
            priority: issue.priority,
            status: issue.status,
            statusDisplay: getStatusDisplay(issue.status),
            location: issue.location,
            media: issue.media,
            timeline: issue.timeline,
            estimatedResolution: issue.estimatedResolution,
            actualResolution: issue.actualResolution,
            resolution: issue.resolution,
            feedback: issue.feedback,
            reportedBy: issue.reportedBy,
            assignedTo: issue.assignedTo,
            assignedDepartment: issue.assignedDepartment,
            votes: issue.votes,
            voteScore: (issue.votes?.upvotes?.length || 0) - (issue.votes?.downvotes?.length || 0),
            userVote: userVote, // Whether current user has voted and how
            comments: issue.comments,
            daysSinceReported: Math.floor((Date.now() - new Date(issue.timeline?.reported || issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
            resolutionTimeHours: issue.timeline?.resolved ? Math.round((new Date(issue.timeline.resolved).getTime() - new Date(issue.timeline.reported).getTime()) / (1000 * 60 * 60)) : null,
            tags: issue.tags,
            isPublic: issue.isPublic,
            urgencyScore: issue.urgencyScore,
            analytics: issue.analytics,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching issue by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching issue'
      });
    }
  }

  /**
   * Update issue status (for authorized users)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateIssueStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { issueId } = req.params;
      const { status, comment } = req.body;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Check if user has permission to update status
      if (req.user.role === 'citizen' && req.user._id.toString() !== issue.reportedBy.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own issues.'
        });
      }

      // Update status and timeline
      const oldStatus = issue.status;
      issue.status = status;

      // Update timeline based on status
      switch (status) {
        case 'acknowledged':
          if (!issue.timeline.acknowledged) {
            issue.timeline.acknowledged = new Date();
          }
          break;
        case 'in_progress':
          if (!issue.timeline.started) {
            issue.timeline.started = new Date();
          }
          break;
        case 'resolved':
          if (!issue.timeline.resolved) {
            issue.timeline.resolved = new Date();
            issue.actualResolution = new Date();
          }
          break;
        case 'closed':
          if (!issue.timeline.closed) {
            issue.timeline.closed = new Date();
          }
          break;
      }

      await issue.save();

      // Add status update comment
      if (comment) {
        issue.comments.push({
          user: req.user._id,
          message: comment,
          isOfficial: req.user.role !== 'citizen'
        });
        await issue.save();
      }

      console.log(`✅ Issue ${issueId} status updated from ${oldStatus} to ${status}`);

      res.status(200).json({
        success: true,
        message: 'Issue status updated successfully',
        data: {
          issueId: issue._id,
          oldStatus,
          newStatus: status,
          timeline: issue.timeline
        }
      });

    } catch (error) {
      console.error('❌ Error updating issue status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating issue status'
      });
    }
  }

  /**
   * Delete issue (only for reporters)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteIssue(req, res) {
    try {
      const { issueId } = req.params;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Only reporter can delete their own issue, and only if it's pending
      if (req.user._id.toString() !== issue.reportedBy.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own issues.'
        });
      }

      if (issue.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete issue that has been acknowledged or is in progress.'
        });
      }

      await Issue.findByIdAndDelete(issueId);

      console.log(`✅ Issue ${issueId} deleted by user ${req.user._id}`);

      res.status(200).json({
        success: true,
        message: 'Issue deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting issue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting issue'
      });
    }
  }

  /**
   * Get all public issues with coordinates for map display
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMapIssues(req, res) {
    try {
      const { status, category, priority } = req.query;
      
      const filters = { isPublic: true };
      
      // Add optional filters
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (priority) filters.priority = priority;

      const issues = await Issue.find(filters)
        .populate('reportedBy', 'name')
        .select('title category priority status location.coordinates location.address createdAt votes timeline')
        .lean();

      // Normalize coordinates: support both array [lng, lat] and object { latitude, longitude }
      const normalized = issues.map(issue => {
        const loc = issue.location || {};
        let latitude = null;
        let longitude = null;

        // If stored as array [lng, lat] (new format)
        if (Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
          const [lng, lat] = loc.coordinates;
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            latitude = lat;
            longitude = lng;
          }
        }
        // If stored as object { latitude, longitude } (legacy format)
        else if (loc.coordinates && typeof loc.coordinates === 'object' && !Array.isArray(loc.coordinates)) {
          const lat = loc.coordinates.latitude ?? loc.coordinates.lat ?? null;
          const lng = loc.coordinates.longitude ?? loc.coordinates.lng ?? null;
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            latitude = lat;
            longitude = lng;
          }
        }

        return {
          ...issue,
          _normalizedLocation: {
            latitude,
            longitude,
            address: loc.address || null
          }
        };
      });

      // Filter only those with valid numeric lat/lng
      const validIssues = normalized.filter(i => i._normalizedLocation &&
        typeof i._normalizedLocation.latitude === 'number' && typeof i._normalizedLocation.longitude === 'number');

      // Debug log
      console.log(`🔍 getMapIssues: Found ${issues.length} issues, ${validIssues.length} with valid coordinates`);

      // Add user vote status to each issue (if user is authenticated)
      const issuesWithUserVotes = validIssues.map(issue => {
        let userVote = null;
        if (req.user) {
          const userId = req.user._id.toString();
          if (issue.votes?.upvotes?.some(id => id.toString() === userId)) {
            userVote = 'upvote';
          } else if (issue.votes?.downvotes?.some(id => id.toString() === userId)) {
            userVote = 'downvote';
          }
        }

        return {
          id: issue._id,
          title: issue.title,
          category: issue.category,
          priority: issue.priority,
          status: issue.status,
          location: {
            latitude: issue._normalizedLocation.latitude,
            longitude: issue._normalizedLocation.longitude,
            address: issue._normalizedLocation.address
          },
          createdAt: issue.createdAt,
          reportedBy: issue.reportedBy ? { name: issue.reportedBy.name } : null,
          voteScore: (issue.votes?.upvotes?.length || 0) - (issue.votes?.downvotes?.length || 0),
          userVote: userVote,
          daysSinceReported: Math.floor((Date.now() - new Date(issue.timeline?.reported || issue.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        };
      });

      res.status(200).json({
        success: true,
        message: 'Map issues retrieved successfully',
        data: {
          issues: issuesWithUserVotes
        }
      });

    } catch (error) {
      console.error('❌ Error fetching map issues:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching map issues'
      });
    }
  }

  /**
   * Vote on an issue (upvote or downvote)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async voteIssue(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { issueId } = req.params;
      const { type } = req.body; // 'upvote' or 'downvote'
      const userId = req.user._id;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Check if user already voted
      const hasUpvoted = issue.votes.upvotes.some(id => id.toString() === userId.toString());
      const hasDownvoted = issue.votes.downvotes.some(id => id.toString() === userId.toString());

      // Remove existing votes first
      if (hasUpvoted) {
        issue.votes.upvotes = issue.votes.upvotes.filter(id => id.toString() !== userId.toString());
      }
      if (hasDownvoted) {
        issue.votes.downvotes = issue.votes.downvotes.filter(id => id.toString() !== userId.toString());
      }

      // Add new vote
      if (type === 'upvote') {
        issue.votes.upvotes.push(userId);
      } else if (type === 'downvote') {
        issue.votes.downvotes.push(userId);
      }

      await issue.save();

      const voteScore = issue.votes.upvotes.length - issue.votes.downvotes.length;

      console.log(`✅ User ${userId} ${type}d issue ${issueId}. New score: ${voteScore}`);

      res.status(200).json({
        success: true,
        message: `Issue ${type}d successfully`,
        data: {
          issueId: issue._id,
          voteScore,
          userVote: type
        }
      });

    } catch (error) {
      console.error('❌ Error voting on issue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while voting on issue'
      });
    }
  }

  /**
   * Remove vote from an issue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async removeVote(req, res) {
    try {
      const { issueId } = req.params;
      const userId = req.user._id;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Remove user's vote from both arrays
      const originalUpvoteCount = issue.votes.upvotes.length;
      const originalDownvoteCount = issue.votes.downvotes.length;

      issue.votes.upvotes = issue.votes.upvotes.filter(id => id.toString() !== userId.toString());
      issue.votes.downvotes = issue.votes.downvotes.filter(id => id.toString() !== userId.toString());

      // Only save if vote was actually removed
      if (issue.votes.upvotes.length !== originalUpvoteCount || issue.votes.downvotes.length !== originalDownvoteCount) {
        await issue.save();
      }

      const voteScore = issue.votes.upvotes.length - issue.votes.downvotes.length;

      console.log(`✅ User ${userId} removed vote from issue ${issueId}. New score: ${voteScore}`);

      res.status(200).json({
        success: true,
        message: 'Vote removed successfully',
        data: {
          issueId: issue._id,
          voteScore,
          userVote: null
        }
      });

    } catch (error) {
      console.error('❌ Error removing vote:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while removing vote'
      });
    }
  }

  /**
   * Add a comment to an issue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { issueId } = req.params;
      const { message } = req.body;
      const userId = req.user._id;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Check if user has permission to comment (public issues or own issues)
      if (!issue.isPublic && issue.reportedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to comment on this issue.'
        });
      }

      // Create new comment
      const newComment = {
        user: userId,
        message: message.trim(),
        timestamp: new Date(),
        isOfficial: req.user.role !== 'citizen' // Official if not a citizen
      };

      issue.comments.push(newComment);
      await issue.save();

      // Populate the user info for the response
      await issue.populate('comments.user', 'name');

      const addedComment = issue.comments[issue.comments.length - 1];

      console.log(`✅ User ${userId} added comment to issue ${issueId}`);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: {
          issueId: issue._id,
          comment: {
            id: addedComment._id,
            user: addedComment.user,
            message: addedComment.message,
            timestamp: addedComment.timestamp,
            isOfficial: addedComment.isOfficial
          }
        }
      });

    } catch (error) {
      console.error('❌ Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while adding comment'
      });
    }
  }

  /**
   * Delete a comment from an issue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteComment(req, res) {
    try {
      const { issueId, commentId } = req.params;
      const userId = req.user._id;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Find the comment
      const commentIndex = issue.comments.findIndex(comment => comment._id.toString() === commentId);
      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const comment = issue.comments[commentIndex];

      // Check if user can delete this comment (own comment or admin/official)
      const canDelete = comment.user.toString() === userId.toString() ||
                       req.user.role === 'admin' ||
                       req.user.role === 'official';

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own comments.'
        });
      }

      // Remove the comment
      issue.comments.splice(commentIndex, 1);
      await issue.save();

      console.log(`✅ Comment ${commentId} deleted from issue ${issueId} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
        data: {
          issueId: issue._id,
          commentId: commentId
        }
      });

    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting comment'
      });
    }
  }
}

/**
 * Calculate urgency score based on issue properties
 * @param {Object} issue - Issue object
 * @returns {number} Urgency score (0-100)
 */
function calculateUrgencyScore(issue) {
  let score = 0;

  // Priority weight (40% of score)
  const priorityWeights = {
    'low': 10,
    'medium': 25,
    'high': 35,
    'critical': 40
  };
  score += priorityWeights[issue.priority] || 25;

  // Category weight (30% of score)
  const categoryWeights = {
    'water_supply': 30,
    'sewerage': 25,
    'electrical': 20,
    'traffic': 20,
    'pothole': 15,
    'streetlight': 10,
    'garbage': 10,
    'other': 5
  };
  score += categoryWeights[issue.category] || 10;

  // Public visibility (20% of score)
  if (issue.isPublic) {
    score += 20;
  }

  // Time factor (10% of score) - issues get more urgent over time
  const hoursOld = (Date.now() - issue.timeline.reported.getTime()) / (1000 * 60 * 60);
  if (hoursOld > 72) score += 10; // More than 3 days
  else if (hoursOld > 24) score += 7; // More than 1 day
  else if (hoursOld > 12) score += 4; // More than 12 hours

  return Math.min(score, 100);
}

/**
 * Get display text for status
 * @param {string} status - Status value
 * @returns {string} Display text
 */
function getStatusDisplay(status) {
  const statusMap = {
    'pending': 'Reported',
    'acknowledged': 'Acknowledged',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'rejected': 'Rejected'
  };
  return statusMap[status] || status;
}

/**
 * Find department for a given category
 * @param {string} category - Category slug
 * @returns {Object} Department object or null
 */
async function findDepartmentForCategory(category) {
  if (!category) return null;
  // Pick any active department that handles this category
  return Department.findOne({ isActive: true, categories: category }).select('_id').lean();
}

exports.createIssue = async (req, res, next) => {
  try {
    const { title, description, category, location, media } = req.body;
    const dept = await findDepartmentForCategory(category);
    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      media,
      reportedBy: req.user._id, // per your convention
      department: dept?._id || undefined,
      status: 'pending',
    });
    res.status(201).json({
      success: true,
      message: 'Issue reported successfully!',
      data: {
        issue: {
          id: issue._id,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          subcategory: issue.subcategory,
          priority: issue.priority,
          status: issue.status,
          statusDisplay: issue.statusDisplay,
          location: issue.location,
          media: issue.media,
          timeline: issue.timeline,
          reportedBy: issue.reportedBy,
          urgencyScore: issue.urgencyScore,
          voteScore: issue.voteScore,
          daysSinceReported: issue.daysSinceReported,
          tags: issue.tags,
          isPublic: issue.isPublic,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        }
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { IssueController };