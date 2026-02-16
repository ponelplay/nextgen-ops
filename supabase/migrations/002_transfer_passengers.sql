-- Add passengers array to transfers for shared rides
-- Migrate existing team_name data into passengers array

-- Add the new column
ALTER TABLE transfers ADD COLUMN passengers TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing data: if team_name is non-empty, put it in passengers
UPDATE transfers SET passengers = ARRAY[team_name] WHERE team_name != '';

-- Keep team_id and team_name for backward compatibility (won't be used by new code)
