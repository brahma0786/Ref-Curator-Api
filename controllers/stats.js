import Comment from '../models/Comment.js';
import User from '../models/User.js';

export const getGeneralStats = async (req, res) => {
  try {
    const [
      totalComments,
      totalUsers,
      totalSubComments,
      categoryStats,
      priorityStats,
      statusStats,
      recentActivity
    ] = await Promise.all([
      Comment.countDocuments(),
      User.countDocuments(),
      Comment.aggregate([{
        $group: {
          _id: null,
          total: { $sum: { $size: "$subComments" } }
        }
      }]),
      getCategoryStats(),
      getPriorityStats(),
      getStatusStats(),
      getRecentActivity()
    ]);

    res.json({
      overview: {
        totalComments,
        totalUsers,
        totalSubComments: totalSubComments[0]?.total || 0,
        averageSubCommentsPerPost: totalComments ? 
          (totalSubComments[0]?.total || 0) / totalComments : 0
      },
      categoryStats,
      priorityStats,
      statusStats,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const stats = await Comment.aggregate([
      {
        $group: {
          _id: "$userId",
          totalComments: { $sum: 1 },
          totalSubComments: { $sum: { $size: "$subComments" } },
          categories: { $addToSet: "$category" },
          averagePriority: { 
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "LOW"] }, then: 1 },
                  { case: { $eq: ["$priority", "MEDIUM"] }, then: 2 },
                  { case: { $eq: ["$priority", "HIGH"] }, then: 3 },
                  { case: { $eq: ["$priority", "CRITICAL"] }, then: 4 }
                ],
                default: 1
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 1,
          totalComments: 1,
          totalSubComments: 1,
          categoriesCount: { $size: "$categories" },
          averagePriority: 1,
          userName: "$userDetails.name",
          userEmail: "$userDetails.email"
        }
      },
      { $sort: { totalComments: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTimeBasedStats = async (req, res) => {
  try {
    const { period } = req.query; // 'daily', 'weekly', 'monthly'
    const timeStats = await getActivityOverTime(period);
    res.json(timeStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
async function getCategoryStats() {
  return Comment.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        subCommentsCount: { $sum: { $size: "$subComments" } },
        averagePriority: { 
          $avg: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", "LOW"] }, then: 1 },
                { case: { $eq: ["$priority", "MEDIUM"] }, then: 2 },
                { case: { $eq: ["$priority", "HIGH"] }, then: 3 },
                { case: { $eq: ["$priority", "CRITICAL"] }, then: 4 }
              ],
              default: 1
            }
          }
        }
      }
    },
    {
      $project: {
        category: "$_id",
        count: 1,
        subCommentsCount: 1,
        averagePriority: 1,
        percentage: {
          $multiply: [
            { $divide: ["$count", { $sum: "$count" }] },
            100
          ]
        }
      }
    }
  ]);
}

async function getPriorityStats() {
  return Comment.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
        averageSubComments: { $avg: { $size: "$subComments" } },
        categories: { $addToSet: "$category" }
      }
    },
    {
      $project: {
        priority: "$_id",
        count: 1,
        averageSubComments: 1,
        uniqueCategories: { $size: "$categories" }
      }
    }
  ]);
}

async function getStatusStats() {
  return Comment.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        averageSubComments: { $avg: { $size: "$subComments" } },
        priorityDistribution: {
          $push: "$priority"
        }
      }
    },
    {
      $project: {
        status: "$_id",
        count: 1,
        averageSubComments: 1,
        priorityDistribution: {
          $arrayToObject: {
            $map: {
              input: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              as: "priority",
              in: {
                k: "$$priority",
                v: {
                  $size: {
                    $filter: {
                      input: "$priorityDistribution",
                      cond: { $eq: ["$$this", "$$priority"] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ]);
}

async function getRecentActivity() {
  return Comment.aggregate([
    {
      $sort: { updatedAt: -1 }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $project: {
        title: 1,
        category: 1,
        status: 1,
        priority: 1,
        updatedAt: 1,
        userName: "$user.name",
        subCommentsCount: { $size: "$subComments" }
      }
    }
  ]);
}

async function getActivityOverTime(period = 'daily') {
  const now = new Date();
  const periods = {
    daily: {
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
    },
    weekly: {
      $dateToString: { format: "%Y-W%V", date: "$createdAt" }
    },
    monthly: {
      $dateToString: { format: "%Y-%m", date: "$createdAt" }
    }
  };

  return Comment.aggregate([
    {
      $group: {
        _id: periods[period],
        comments: { $sum: 1 },
        subComments: { $sum: { $size: "$subComments" } },
        uniqueUsers: { $addToSet: "$userId" },
        categories: { $addToSet: "$category" }
      }
    },
    {
      $project: {
        period: "$_id",
        comments: 1,
        subComments: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
        uniqueCategories: { $size: "$categories" }
      }
    },
    { $sort: { period: 1 } }
  ]);
}
