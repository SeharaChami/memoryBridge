-- Single user profile (only one row ever exists)
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preferred_name TEXT NOT NULL,
  setup_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Life memories entered by caregiver
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_text TEXT NOT NULL,
  category TEXT DEFAULT 'other', -- career, family, hobby, place, relationship, other
  emotional_weight TEXT DEFAULT 'positive', -- positive, neutral, sensitive
  created_at TIMESTAMP DEFAULT now()
);

-- Conversation history logs
CREATE TABLE conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message TEXT,
  mia_response TEXT,
  timestamp TIMESTAMP DEFAULT now()
);
