const { pool } = require('../config/db');

function attachDeveloperBadge(profile) {
  if (!profile) return null;
  const score = profile.github_score ?? profile.githubScore ?? 0;
  let name = 'Beginner';
  let emoji = '🌱';
  if (score >= 50 && score < 500) {
    name = 'Intermediate';
    emoji = '🚀';
  } else if (score >= 500 && score < 5000) {
    name = 'Advanced';
    emoji = '⚡';
  } else if (score >= 5000) {
    name = 'GitHub Star';
    emoji = '🏆';
  }
  profile.developer_badge = { name, emoji };
  profile.developerBadge = { name, emoji };
  return profile;
}

async function insertHistoryRecord(profile) {
  const sql = `
    INSERT INTO profile_history (
      username, followers, public_repos, total_stars, github_score
    ) VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    profile.username,
    profile.followers,
    profile.publicRepos ?? profile.public_repos,
    profile.totalStars ?? profile.total_stars,
    profile.githubScore ?? profile.github_score,
  ];
  await pool.execute(sql, values);
}

async function upsertProfile(profile) {
  const sql = `
    INSERT INTO github_profiles (
      username, name, bio, public_repos, followers, following_count,
      total_stars, most_used_language, top_repository, github_score,
      profile_url, avatar_url, account_created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      bio = VALUES(bio),
      public_repos = VALUES(public_repos),
      followers = VALUES(followers),
      following_count = VALUES(following_count),
      total_stars = VALUES(total_stars),
      most_used_language = VALUES(most_used_language),
      top_repository = VALUES(top_repository),
      github_score = VALUES(github_score),
      profile_url = VALUES(profile_url),
      avatar_url = VALUES(avatar_url),
      account_created_at = VALUES(account_created_at),
      analyzed_at = CURRENT_TIMESTAMP
  `;

  const values = [
    profile.username,
    profile.name,
    profile.bio,
    profile.publicRepos ?? profile.public_repos,
    profile.followers,
    profile.followingCount ?? profile.following_count,
    profile.totalStars ?? profile.total_stars,
    profile.mostUsedLanguage ?? profile.most_used_language,
    profile.topRepository ?? profile.top_repository,
    profile.githubScore ?? profile.github_score,
    profile.profileUrl ?? profile.profile_url,
    profile.avatarUrl ?? profile.avatar_url,
    profile.accountCreatedAt ?? profile.account_created_at,
  ];

  const [result] = await pool.execute(sql, values);
  await insertHistoryRecord(profile);
  return result;
}

async function getAllProfiles() {
  const sql = `
    SELECT *
    FROM github_profiles
    ORDER BY github_score DESC, analyzed_at DESC
  `;
  const [rows] = await pool.query(sql);
  return rows.map(attachDeveloperBadge);
}

async function getProfileByUsername(username) {
  const sql = `
    SELECT *
    FROM github_profiles
    WHERE username = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [username]);
  return rows[0] ? attachDeveloperBadge(rows[0]) : null;
}

async function getProfileHistory(username) {
  const sql = `
    SELECT *
    FROM profile_history
    WHERE username = ?
    ORDER BY recorded_at DESC
  `;
  const [rows] = await pool.query(sql, [username]);
  return rows;
}

async function getStats() {
  const sql = `
    SELECT
      COUNT(*) AS total_analyzed,
      AVG(followers) AS avg_followers,
      AVG(public_repos) AS avg_repositories,
      (SELECT username
        FROM github_profiles
        ORDER BY github_score DESC, analyzed_at DESC
        LIMIT 1
      ) AS highest_score_username
    FROM github_profiles
  `;
  const [rows] = await pool.query(sql);

  const highest = await getProfileByUsername(rows[0]?.highest_score_username);

  return {
    totalAnalyzedProfiles: Number(rows[0]?.total_analyzed || 0),
    averageFollowers: Number(rows[0]?.avg_followers || 0),
    averageRepositories: Number(rows[0]?.avg_repositories || 0),
    highestGitHubScoreProfile: highest || null,
  };
}

module.exports = {
  upsertProfile,
  getAllProfiles,
  getProfileByUsername,
  getProfileHistory,
  getStats,
};

