import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Users,
  BookOpen,
  Star,
  Award,
  Crown,
  Calendar,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Code
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

function GithubIcon({ size = 14, ...props }) {
  return (
    <svg height={size} width={size} viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch (e) {
    return dateStr
  }
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return ''
  }
}

function getLanguageColor(lang) {
  const colors = {
    'javascript': '#f1e05a',
    'typescript': '#3178c6',
    'python': '#3572A5',
    'html': '#e34c26',
    'css': '#563d7c',
    'c': '#555555',
    'c++': '#f34b7d',
    'go': '#00ADD8',
    'java': '#b07219',
    'ruby': '#701516',
    'rust': '#dee5ef',
    'php': '#4F5D95',
    'swift': '#F05138',
    'kotlin': '#A97BFF',
  }
  const key = String(lang || '').toLowerCase()
  return colors[key] || '#64748b'
}

function getLanguageBadge(lang) {
  if (!lang) return 'Unknown'
  const color = getLanguageColor(lang)
  return (
    <span className="lang-badge-container">
      <span className="lang-color-dot" style={{ backgroundColor: color }}></span>
      {lang}
    </span>
  )
}

function getBadgePill(badge, isMini = false) {
  if (!badge) return null
  const name = badge.name || 'Beginner'
  let iconColor = '#64748b'
  let icon = <Award size={isMini ? 12 : 14} />
  
  if (name === 'Beginner') {
    iconColor = '#10b981'
  } else if (name === 'Intermediate') {
    iconColor = '#3b82f6'
  } else if (name === 'Advanced') {
    iconColor = '#f59e0b'
  } else if (name === 'GitHub Star') {
    iconColor = '#8b5cf6'
    icon = <Crown size={isMini ? 12 : 14} />
  }

  return (
    <span className={`badge-pill ${isMini ? 'mini' : ''}`}>
      <span style={{ color: iconColor, display: 'inline-flex', alignItems: 'center' }}>
        {icon}
      </span>
      {name}
    </span>
  )
}

export default function App() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)

  const [compareUser1, setCompareUser1] = useState('')
  const [compareUser2, setCompareUser2] = useState('')
  const [compareData, setCompareData] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState(null)

  const canAnalyze = useMemo(() => username.trim().length > 0, [username])
  const canCompare = useMemo(() => compareUser1.trim().length > 0 && compareUser2.trim().length > 0, [compareUser1, compareUser2])

  async function refreshProfiles() {
    const res = await fetch(`${API_BASE_URL}/api/profiles`)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.message || `Failed to load profiles (${res.status})`)
    setProfiles(json?.data || [])
  }

  async function refreshStats() {
    const res = await fetch(`${API_BASE_URL}/api/stats`)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return
    setStats(json?.data || null)
  }

  async function analyze() {
    setError(null)
    setLoading(true)
    setSelectedProfile(null)
    setHistory([])

    try {
      const u = username.trim()

      const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(u)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.message || `Analyze failed (${res.status})`)
        return
      }

      await Promise.all([refreshProfiles(), refreshStats()])
      await loadOne(u)
    } catch (e) {
      setError(e?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile(u) {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(u)}/refresh`, {
        method: 'PUT',
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.message || `Refresh failed (${res.status})`)
        return
      }

      await Promise.all([refreshProfiles(), refreshStats()])
      await loadOne(u)
    } catch (e) {
      setError(e?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function loadOne(u) {
    setError(null)
    setSelectedProfile(null)
    setHistory([])

    try {
      const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(u)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.message || `Not found (${res.status})`)
        return
      }
      setSelectedProfile(json?.data || null)

      const histRes = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(u)}/history`)
      const histJson = await histRes.json().catch(() => ({}))
      if (histRes.ok) {
        setHistory(histJson?.data || [])
      }
    } catch (e) {
      setError(e?.message || 'Error loading profile details')
    }
  }

  async function compare() {
    setCompareError(null)
    setCompareData(null)
    setCompareLoading(true)

    try {
      const u1 = compareUser1.trim()
      const u2 = compareUser2.trim()

      const res = await fetch(`${API_BASE_URL}/api/compare/${encodeURIComponent(u1)}/${encodeURIComponent(u2)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCompareError(json?.message || `Compare failed (${res.status})`)
        return
      }
      setCompareData(json)
      await Promise.all([refreshProfiles(), refreshStats()])
    } catch (e) {
      setCompareError(e?.message || 'Unexpected error')
    } finally {
      setCompareLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([refreshProfiles(), refreshStats()]).catch(() => {})
  }, [])

  return (
    <div className="container">
      <header className="header">
        <h1>GitHub Profile Analyzer</h1>
        <p className="muted">Analyze a GitHub user, track metrics history, compare developers, and export data insights.</p>
      </header>

      <div className="mainLayout">
        <div className="leftCol">
          <section className="card">
            <h2>Analyze a profile</h2>
            <div className="formRow">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GitHub username (e.g., torvalds)"
              />
              <button className="btn-primary" disabled={!canAnalyze || loading} onClick={analyze}>
                {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                <span style={{ marginLeft: '6px' }}>{loading ? 'Analyzing...' : 'Analyze'}</span>
              </button>
            </div>
            {error ? <div className="error">{error}</div> : null}
          </section>

          <section className="card">
            <h2>Compare Profiles</h2>
            <div className="compareForm">
              <input
                value={compareUser1}
                onChange={(e) => setCompareUser1(e.target.value)}
                placeholder="User 1"
              />
              <span className="vs">VS</span>
              <input
                value={compareUser2}
                onChange={(e) => setCompareUser2(e.target.value)}
                placeholder="User 2"
              />
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={!canCompare || compareLoading}
              onClick={compare}
            >
              {compareLoading ? <RefreshCw size={14} className="spin" /> : <GitCompare size={14} />}
              {compareLoading ? 'Comparing...' : 'Compare'}
            </button>
            {compareError ? <div className="error">{compareError}</div> : null}

            {compareData && (
              <div className="compareResults">
                <h3>Comparison Result</h3>
                <table className="compareTable">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>@{compareData.user1.username}</th>
                      <th>@{compareData.user2.username}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Badge</td>
                      <td>
                        {getBadgePill(compareData.user1.developer_badge, true)}
                      </td>
                      <td>
                        {getBadgePill(compareData.user2.developer_badge, true)}
                      </td>
                    </tr>
                    {Object.keys(compareData.comparison).map((key) => {
                      const item = compareData.comparison[key];
                      return (
                        <tr key={key}>
                          <td>{item.label}</td>
                          <td className={item.winner === 'user1' ? 'winner' : ''}>
                            {item.user1Value.toLocaleString()} {item.winner === 'user1' ? '👑' : ''}
                          </td>
                          <td className={item.winner === 'user2' ? 'winner' : ''}>
                            {item.user2Value.toLocaleString()} {item.winner === 'user2' ? '👑' : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Stats</h2>
            {!stats ? (
              <div className="muted">Loading...</div>
            ) : (
              <ul className="list-stats">
                <li>
                  <Users size={16} className="stat-icon" />
                  <div>
                    <span className="stat-label">Total Analyzed</span>
                    <span className="stat-val">{stats.totalAnalyzedProfiles}</span>
                  </div>
                </li>
                <li>
                  <Users size={16} className="stat-icon" />
                  <div>
                    <span className="stat-label">Average Followers</span>
                    <span className="stat-val">{Math.round(stats.averageFollowers).toLocaleString()}</span>
                  </div>
                </li>
                <li>
                  <BookOpen size={16} className="stat-icon" />
                  <div>
                    <span className="stat-label">Average Repositories</span>
                    <span className="stat-val">{Math.round(stats.averageRepositories)}</span>
                  </div>
                </li>
                <li>
                  <Crown size={16} className="stat-icon" />
                  <div>
                    <span className="stat-label">Highest Score Profile</span>
                    <span className="stat-val">{stats.highestGitHubScoreProfile?.username || '—'}</span>
                  </div>
                </li>
              </ul>
            )}
          </section>
        </div>

        <div className="rightCol">
          <section className="card">
            <h2>Top Profiles Leaderboard</h2>
            {!profiles.length ? (
              <div className="muted">No analyzed profiles yet. Run an analysis.</div>
            ) : (
              <div className="profileList">
                {profiles.map((p, index) => (
                  <button
                    key={p.username}
                    className={`profileRow ${selectedProfile?.username === p.username ? 'active' : ''}`}
                    onClick={() => loadOne(p.username)}
                  >
                    <span className="rank">#{index + 1}</span>
                    <img className="avatar" src={p.avatar_url || p.avatarUrl} alt="" />
                    <div className="profileMeta">
                      <div className="profileTop">
                        <span className="username">@{p.username}</span>
                        <span className="score">{p.github_score ?? p.githubScore}</span>
                      </div>
                      <div className="profileBottom">
                        {getBadgePill(p.developer_badge, true)}
                        <span className="divider">•</span>
                        <span className="muted">
                          {(p.followers ?? 0).toLocaleString()} followers
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="card detailsCard">
        <h2>Profile Details</h2>
        {!selectedProfile ? (
          <div className="muted">Select a profile from the leaderboard.</div>
        ) : (
          <div className="details">
            <div className="detailsHeader">
              <img
                className="avatar large"
                src={selectedProfile.avatar_url || selectedProfile.avatarUrl}
                alt=""
              />
              <div className="detailsMetaHeader">
                <div className="detailsTitle">
                  <div className="nameBadge">
                    <span className="username">@{selectedProfile.username}</span>
                    {getBadgePill(selectedProfile.developer_badge)}
                  </div>
                  <span className="score big">{selectedProfile.github_score ?? selectedProfile.githubScore}</span>
                </div>
                <div className="realName">{selectedProfile.name || '—'}</div>
              </div>
            </div>

            <p className="bio">{selectedProfile.bio || 'This profile has no bio.'}</p>

            <div className="detailsGrid">
              <div>
                <span className="detail-label-icon"><BookOpen size={14} /> <b>Public repos</b></span>
                <span>{(selectedProfile.public_repos ?? selectedProfile.publicRepos)}</span>
              </div>
              <div>
                <span className="detail-label-icon"><Users size={14} /> <b>Followers</b></span>
                <span>{selectedProfile.followers.toLocaleString()}</span>
              </div>
              <div>
                <span className="detail-label-icon"><Users size={14} /> <b>Following</b></span>
                <span>{(selectedProfile.following_count ?? selectedProfile.followingCount)}</span>
              </div>
              <div>
                <span className="detail-label-icon"><Star size={14} /> <b>Total stars</b></span>
                <span>{(selectedProfile.total_stars ?? selectedProfile.totalStars).toLocaleString()}</span>
              </div>
              <div>
                <span className="detail-label-icon"><Code size={14} /> <b>Most used language</b></span>
                <span>{getLanguageBadge(selectedProfile.most_used_language ?? selectedProfile.mostUsedLanguage)}</span>
              </div>
              <div>
                <span className="detail-label-icon"><BookOpen size={14} /> <b>Top repository</b></span>
                <span className="repoName">{selectedProfile.top_repository ?? selectedProfile.topRepository ?? 'None'}</span>
              </div>
              <div>
                <span className="detail-label-icon"><Calendar size={14} /> <b>Account created</b></span>
                <span>{formatDate(selectedProfile.account_created_at ?? selectedProfile.accountCreatedAt)}</span>
              </div>
              <div>
                <span className="detail-label-icon"><Clock size={14} /> <b>Last analyzed</b></span>
                <span>{formatDate(selectedProfile.analyzed_at ?? selectedProfile.analyzedAt)} {formatTime(selectedProfile.analyzed_at ?? selectedProfile.analyzedAt)}</span>
              </div>
            </div>

            <div className="actionsRow">
              <a className="github-link-btn" target="_blank" rel="noreferrer" href={selectedProfile.profile_url || selectedProfile.profileUrl}>
                <GithubIcon size={14} style={{ marginRight: '6px' }} />
                GitHub Profile
              </a>
              
              <button className="refresh-btn-ui" disabled={loading} onClick={() => refreshProfile(selectedProfile.username)}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ marginRight: '6px' }} />
                Refresh Data
              </button>

              <div className="export-group">
                <a href={`${API_BASE_URL}/api/profiles/${selectedProfile.username}/export?format=csv`} className="export-btn-ui" download>
                  <FileSpreadsheet size={14} style={{ marginRight: '6px' }} />
                  Export CSV
                </a>
                <a href={`${API_BASE_URL}/api/profiles/${selectedProfile.username}/export?format=json`} className="export-btn-ui" download>
                  <FileJson size={14} style={{ marginRight: '6px' }} />
                  Export JSON
                </a>
              </div>
            </div>

            {history.length > 1 && (
              <div className="growthHistory">
                <h3>Growth History ({history.length} scans)</h3>
                <div className="timeline">
                  {history.map((h, i) => {
                    const nextOldest = history[i + 1]
                    let followersDiff = 0
                    let scoreDiff = 0
                    if (nextOldest) {
                      followersDiff = Number(h.followers) - Number(nextOldest.followers)
                      scoreDiff = Number(h.github_score) - Number(nextOldest.github_score)
                    }

                    return (
                      <div key={h.id} className="timeline-item">
                        <div className="timeline-marker">
                          <Clock size={10} style={{ color: 'var(--muted)' }} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-date">{formatDate(h.recorded_at)} {formatTime(h.recorded_at)}</span>
                            <span className="timeline-score">Score: {h.github_score}</span>
                          </div>
                          <div className="timeline-details">
                            <span>Followers: {h.followers.toLocaleString()} {followersDiff > 0 ? `(+${followersDiff})` : followersDiff < 0 ? `(${followersDiff})` : ''}</span>
                            <span>Stars: {h.total_stars.toLocaleString()}</span>
                            {scoreDiff !== 0 && (
                              <span className={`growth-indicator ${scoreDiff > 0 ? 'pos' : 'neg'}`}>
                                {scoreDiff > 0 ? <TrendingUp size={12} style={{ marginRight: '2px', display: 'inline' }} /> : <TrendingDown size={12} style={{ marginRight: '2px', display: 'inline' }} />}
                                {scoreDiff > 0 ? `+${scoreDiff} points` : `${scoreDiff} points`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
