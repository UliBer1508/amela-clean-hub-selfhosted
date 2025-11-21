-- Fix notification_preferences duplicates and add unique constraint

-- Step 1: Delete duplicate entries for 'Amela', keeping only the newest one
DELETE FROM notification_preferences
WHERE user_name = 'Amela'
  AND id NOT IN (
    SELECT id 
    FROM notification_preferences 
    WHERE user_name = 'Amela' 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- Step 2: Check for and delete other duplicates (keeping newest entry for each user)
DELETE FROM notification_preferences
WHERE id NOT IN (
  SELECT DISTINCT ON (user_name) id
  FROM notification_preferences
  ORDER BY user_name, created_at DESC
);

-- Step 3: Add UNIQUE constraint to prevent future duplicates
ALTER TABLE notification_preferences
ADD CONSTRAINT unique_user_name UNIQUE (user_name);

-- Step 4: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_name 
ON notification_preferences(user_name);