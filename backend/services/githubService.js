const axios = require('axios');
const { GITHUB_USER_AGENT, GITHUB_API_BASE_URL } = process.env;

const githubBaseUrl = GITHUB_API_BASE_URL || 'https://api.github.com';

function githubHeaders() {
  const headers = {
    'User-Agent': GITHUB_USER_AGENT || 'github-profile-analyzer-api',
    Accept: 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function analyzeRepositories(repos) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

  const languageCounts = new Map();
  for (const repo of repos) {
    const lang = repo.language || 'Unknown';
    languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
  }

  let mostUsedLanguage = 'Unknown';
  let bestCount = -1;
  for (const [lang, count] of languageCounts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      mostUsedLanguage = lang;
    }
  }

  let topRepository = null;
  let topStars = -1;
  for (const repo of repos) {
    const stars = repo.stargazers_count || 0;
    if (stars > topStars) {
      topStars = stars;
      topRepository = repo.full_name;
    }
  }

  return {
    totalStars,
    mostUsedLanguage,
    topRepository: topRepository || null,
  };
}

async function fetchUser(username) {
  try {
    const url = `${githubBaseUrl}/users/${encodeURIComponent(username)}`;
    const resp = await axios.get(url, { headers: githubHeaders() });
    return resp.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        const err = new Error(`GitHub user '${username}' not found`);
        err.statusCode = 404;
        throw err;
      }
      if (
        error.response.status === 403 &&
        error.response.headers['x-ratelimit-remaining'] === '0'
      ) {
        const err = new Error(
          'GitHub API rate limit exceeded. Please try again later or configure a GITHUB_TOKEN.'
        );
        err.statusCode = 429;
        throw err;
      }
      const err = new Error(
        error.response.data?.message || 'Error fetching profile from GitHub'
      );
      err.statusCode = error.response.status;
      throw err;
    }
    throw error;
  }
}

async function fetchRepos(username) {
  let page = 1;
  const perPage = 100;
  const repos = [];

  while (true) {
    try {
      const url = `${githubBaseUrl}/users/${encodeURIComponent(username)}/repos`;
      const resp = await axios.get(url, {
        headers: githubHeaders(),
        params: {
          per_page: perPage,
          page,
          sort: 'created',
        },
      });

      if (!Array.isArray(resp.data) || resp.data.length === 0) break;
      repos.push(...resp.data);

      if (resp.data.length < perPage) break;
      page += 1;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          const err = new Error(`GitHub user '${username}' repositories not found`);
          err.statusCode = 404;
          throw err;
        }
        if (
          error.response.status === 403 &&
          error.response.headers['x-ratelimit-remaining'] === '0'
        ) {
          const err = new Error(
            'GitHub API rate limit exceeded. Please try again later or configure a GITHUB_TOKEN.'
          );
          err.statusCode = 429;
          throw err;
        }
        const err = new Error(
          error.response.data?.message || 'Error fetching repositories from GitHub'
        );
        err.statusCode = error.response.status;
        throw err;
      }
      throw error;
    }
  }

  return repos;
}

function computeGitHubScore({ publicRepos, followers, totalStars }) {
  return (Number(publicRepos) * 2) + Number(followers) + Number(totalStars);
}

function getDeveloperBadge(score) {
  if (score < 50) return { name: 'Beginner', emoji: '🌱' };
  if (score < 500) return { name: 'Intermediate', emoji: '🚀' };
  if (score < 5000) return { name: 'Advanced', emoji: '⚡' };
  return { name: 'GitHub Star', emoji: '🏆' };
}

async function analyzeAndBuildProfile({ username }) {
  const [user, repos] = await Promise.all([
    fetchUser(username),
    fetchRepos(username),
  ]);

  const { totalStars, mostUsedLanguage, topRepository } = analyzeRepositories(repos);

  const githubScore = computeGitHubScore({
    publicRepos: user.public_repos || 0,
    followers: user.followers || 0,
    totalStars,
  });

  const badge = getDeveloperBadge(githubScore);

  return {
    username: user.login,
    name: user.name || null,
    bio: user.bio || null,
    publicRepos: user.public_repos || 0,
    followers: user.followers || 0,
    followingCount: user.following || 0,
    totalStars,
    mostUsedLanguage,
    topRepository,
    githubScore,
    developerBadge: badge,
    developer_badge: badge,
    profileUrl: user.html_url,
    avatarUrl: user.avatar_url,
    accountCreatedAt: user.created_at ? new Date(user.created_at) : null,
  };
}

module.exports = {
  analyzeAndBuildProfile,
  getDeveloperBadge,
};

