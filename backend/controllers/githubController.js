const profileModel = require('../models/profileModel');
const { analyzeAndBuildProfile } = require('../services/githubService');

async function analyzeAndUpsertProfile(req, res, next) {
  try {
    const { username } = req.params;

    const profile = await analyzeAndBuildProfile({ username });
    await profileModel.upsertProfile(profile);

    return res.status(200).json({
      message: 'Profile analyzed and stored',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

async function getAllProfiles(_req, res, next) {
  try {
    const profiles = await profileModel.getAllProfiles();
    return res.json({ data: profiles });
  } catch (err) {
    next(err);
  }
}

async function getProfileByUsername(req, res, next) {
  try {
    const { username } = req.params;

    const profile = await profileModel.getProfileByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function getStats(_req, res, next) {
  try {
    const stats = await profileModel.getStats();
    return res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

async function refreshProfile(req, res, next) {
  try {
    const { username } = req.params;
    const profile = await analyzeAndBuildProfile({ username });
    await profileModel.upsertProfile(profile);
    const updated = await profileModel.getProfileByUsername(username);

    return res.status(200).json({
      message: 'Profile refreshed and updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const { username } = req.params;
    const history = await profileModel.getProfileHistory(username);
    return res.json({ data: history });
  } catch (err) {
    next(err);
  }
}

async function exportProfile(req, res, next) {
  try {
    const { username } = req.params;
    const format = (req.query.format || 'csv').toLowerCase();

    const profile = await profileModel.getProfileByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found in database. Please analyze it first.' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=github_profile_${username}.json`);
      return res.json(profile);
    }

    const headers = [
      'username', 'name', 'bio', 'public_repos', 'followers', 'following_count',
      'total_stars', 'most_used_language', 'top_repository', 'github_score',
      'developer_badge_name', 'developer_badge_emoji', 'profile_url', 'avatar_url',
      'account_created_at', 'analyzed_at'
    ];

    const values = [
      profile.username,
      profile.name || '',
      profile.bio || '',
      profile.public_repos,
      profile.followers,
      profile.following_count,
      profile.total_stars,
      profile.most_used_language || 'Unknown',
      profile.top_repository || '',
      profile.github_score,
      profile.developer_badge?.name || 'Beginner',
      profile.developer_badge?.emoji || '🌱',
      profile.profile_url,
      profile.avatar_url,
      profile.account_created_at,
      profile.analyzed_at
    ];

    const csvContent = [
      headers.join(','),
      values.map(v => {
        const strVal = String(v ?? '');
        if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(',')
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=github_profile_${username}.csv`);
    return res.send(csvContent);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  analyzeAndUpsertProfile,
  getAllProfiles,
  getProfileByUsername,
  getStats,
  refreshProfile,
  getHistory,
  exportProfile,
};

