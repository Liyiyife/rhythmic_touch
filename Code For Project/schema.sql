PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    participant_number INTEGER NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trials (
    trial_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    block_id TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    sub_block_order INTEGER,
    pattern_order INTEGER,
    trial_number INTEGER NOT NULL,
    repetition_number INTEGER NOT NULL,
    pattern_id TEXT NOT NULL,
    rhythmic_complexity TEXT NOT NULL,
    input_action_type TEXT NOT NULL,
    feedback_modality TEXT NOT NULL,
    target_action_sequence TEXT NOT NULL,
    target_rhythm_intervals TEXT NOT NULL,
    task_success INTEGER NOT NULL DEFAULT 0,
    trial_start_time INTEGER NOT NULL,
    trial_end_time INTEGER
);

CREATE TABLE IF NOT EXISTS attempts (
    attempt_id TEXT PRIMARY KEY,
    trial_id TEXT NOT NULL REFERENCES trials(trial_id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    similarity_score REAL,
    attempt_success INTEGER NOT NULL DEFAULT 0,
    action_count_correct INTEGER,
    action_type_correct INTEGER,
    action_order_correct INTEGER,
    overall_action_correct INTEGER,
    preview_end_time INTEGER,
    attempt_start_time INTEGER NOT NULL,
    attempt_end_time INTEGER
);

CREATE TABLE IF NOT EXISTS actions (
    action_id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id) ON DELETE CASCADE,
    action_index INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    UNIQUE(attempt_id, action_index)
);

CREATE TABLE IF NOT EXISTS survey_responses (
    survey_response_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    survey_type TEXT NOT NULL,
    block_id TEXT,
    block_number INTEGER,
    responses TEXT NOT NULL,
    submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trials_user ON trials(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_trial ON attempts(trial_id);
CREATE INDEX IF NOT EXISTS idx_actions_attempt ON actions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_surveys_user ON survey_responses(user_id);
