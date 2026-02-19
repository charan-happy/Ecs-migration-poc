-- Add user profiles functionality
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);

-- Insert sample data for demo visibility
INSERT INTO user_profiles (user_id, first_name, last_name, phone, address) VALUES
(1, 'John', 'Doe', '+1-555-0123', '123 Main St, Anytown, USA'),
(2, 'Jane', 'Smith', '+1-555-0124', '456 Oak Ave, Somewhere, USA');