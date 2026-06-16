CREATE TABLE IF NOT EXISTS github_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    bio TEXT,
    public_repos INT,
    followers INT,
    following_count INT,
    total_stars INT,
    most_used_language VARCHAR(100),
    top_repository VARCHAR(255),
    github_score INT,
    profile_url VARCHAR(255),
    avatar_url VARCHAR(255),
    account_created_at DATETIME,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    followers INT,
    public_repos INT,
    total_stars INT,
    github_score INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (username)
);


