-- EcoTrace Database Schema Design
-- Target: PostgreSQL 14+
-- Supports User profiles, Parent-Child Carbon Logs, Goals, Recommendations, and Achievements.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- Table: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    total_points INT DEFAULT 0 CHECK (total_points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------
-- Table: categories
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------
-- Table: activity_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    logged_date DATE NOT NULL,
    total_emissions_co2e NUMERIC(10, 2) NOT NULL CHECK (total_emissions_co2e >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------
-- Table: transportation_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS transportation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_log_id UUID UNIQUE NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(50),
    distance_km NUMERIC(8, 2) NOT NULL CHECK (distance_km > 0),
    passenger_count INT DEFAULT 1 CHECK (passenger_count >= 1),
    emissions_co2e NUMERIC(8, 2) NOT NULL CHECK (emissions_co2e >= 0)
);

-- -----------------------------------------------------
-- Table: energy_consumption_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS energy_consumption_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_log_id UUID UNIQUE NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
    utility_type VARCHAR(50) NOT NULL,
    consumption_kwh NUMERIC(8, 2) NOT NULL CHECK (consumption_kwh > 0),
    grid_mix_factor NUMERIC(6, 4) NOT NULL,
    emissions_co2e NUMERIC(8, 2) NOT NULL CHECK (emissions_co2e >= 0)
);

-- -----------------------------------------------------
-- Table: waste_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS waste_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_log_id UUID UNIQUE NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
    waste_type VARCHAR(50) NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg > 0),
    disposal_method VARCHAR(50) NOT NULL,
    emissions_co2e NUMERIC(8, 2) NOT NULL CHECK (emissions_co2e >= 0)
);

-- -----------------------------------------------------
-- Table: food_consumption_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS food_consumption_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_log_id UUID UNIQUE NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
    diet_type VARCHAR(50) NOT NULL,
    duration_days INT DEFAULT 1 NOT NULL CHECK (duration_days >= 1),
    emissions_co2e NUMERIC(8, 2) NOT NULL CHECK (emissions_co2e >= 0)
);

-- -----------------------------------------------------
-- Table: goals
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_reduction_percentage NUMERIC(5, 2) CHECK (target_reduction_percentage > 0 AND target_reduction_percentage <= 100),
    target_emissions_limit NUMERIC(8, 2) CHECK (target_emissions_limit >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_goal_dates CHECK (start_date <= end_date)
);

-- -----------------------------------------------------
-- Table: rewards
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    badge_image_url VARCHAR(255) NOT NULL,
    points_required INT NOT NULL CHECK (points_required >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------
-- Table: user_rewards
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_badge UNIQUE (user_id, reward_id)
);

-- -----------------------------------------------------
-- Table: recommendations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    potential_saving_co2e NUMERIC(8, 2) NOT NULL CHECK (potential_saving_co2e >= 0),
    action_url VARCHAR(255),
    is_dismissed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------
-- Indexes & Performance Tuning
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs (user_id, logged_date) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals (user_id, start_date, end_date) WHERE deleted_at IS NULL AND is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs (category_id);

-- -----------------------------------------------------
-- Trigger: Automatic Update Fields
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER trigger_update_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER trigger_update_activity_logs
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER trigger_update_goals
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER trigger_update_rewards
    BEFORE UPDATE ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER trigger_update_recommendations
    BEFORE UPDATE ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
