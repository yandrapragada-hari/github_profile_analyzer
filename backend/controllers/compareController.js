const profileModel = require('../models/profileModel');
const { analyzeAndBuildProfile } = require('../services/githubService');

async function compareProfiles(req, res, next) {
  try {
    const { user1, user2 } = req.params;

    if (!user1 || !user2) {
      return res.status(400).json({ message: 'Both user1 and user2 parameters are required' });
    }

    async function getOrAnalyze(username) {
      let profile = await profileModel.getProfileByUsername(username);
      if (!profile) {
        const analyzed = await analyzeAndBuildProfile({ username });
        await profileModel.upsertProfile(analyzed);
        profile = await profileModel.getProfileByUsername(username);
      }
      return profile;
    }

    const [profile1, profile2] = await Promise.all([
      getOrAnalyze(user1),
      getOrAnalyze(user2),
    ]);

    const metrics = [
      { key: 'followers', label: 'Followers' },
      { key: 'public_repos', label: 'Public Repositories' },
      { key: 'total_stars', label: 'Total Stars' },
      { key: 'github_score', label: 'GitHub Score' },
    ];

    const comparison = {};
    metrics.forEach(({ key, label }) => {
      const val1 = Number(profile1[key] ?? 0);
      const val2 = Number(profile2[key] ?? 0);
      
      let winner = 'draw';
      if (val1 > val2) winner = 'user1';
      else if (val2 > val1) winner = 'user2';

      comparison[key] = {
        label,
        user1Value: val1,
        user2Value: val2,
        winner,
      };
    });

    return res.status(200).json({
      user1: profile1,
      user2: profile2,
      comparison,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  compareProfiles,
};
