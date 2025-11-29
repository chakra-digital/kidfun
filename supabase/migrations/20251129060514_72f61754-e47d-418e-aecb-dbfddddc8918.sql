-- Add connection point fields to parent_profiles
ALTER TABLE parent_profiles 
ADD COLUMN school_name text,
ADD COLUMN neighborhood text,
ADD COLUMN referral_code text UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8);

-- Create parent connections table for social graph
CREATE TABLE parent_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  connected_parent_id uuid NOT NULL,
  connection_type text CHECK (connection_type IN ('school', 'neighborhood', 'activity', 'referral', 'manual')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, connected_parent_id)
);

-- Create social groups table
CREATE TABLE social_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  group_type text NOT NULL CHECK (group_type IN ('school', 'neighborhood', 'activity', 'custom')),
  created_by uuid NOT NULL,
  privacy_level text NOT NULL DEFAULT 'private' CHECK (privacy_level IN ('public', 'private', 'invite_only')),
  location text,
  school_name text,
  neighborhood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create group memberships table
CREATE TABLE group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, parent_id)
);

-- Create group activities table for coordinated events
CREATE TABLE group_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  provider_id uuid,
  activity_name text NOT NULL,
  activity_type text,
  description text,
  scheduled_date timestamptz,
  location text,
  max_participants integer,
  current_participants integer DEFAULT 0,
  cost_per_child numeric(10,2),
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'open', 'full', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create activity participants table
CREATE TABLE activity_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES group_activities(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'cancelled')),
  notes text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(activity_id, parent_id, child_id)
);

-- Create activity shares table for recommendations
CREATE TABLE activity_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid,
  shared_by uuid NOT NULL,
  shared_with uuid,
  group_id uuid REFERENCES social_groups(id) ON DELETE CASCADE,
  activity_name text NOT NULL,
  provider_name text,
  recommendation_note text,
  rating numeric(2,1) CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_parent_connections_parent ON parent_connections(parent_id);
CREATE INDEX idx_parent_connections_connected ON parent_connections(connected_parent_id);
CREATE INDEX idx_parent_connections_status ON parent_connections(status);
CREATE INDEX idx_group_memberships_group ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_parent ON group_memberships(parent_id);
CREATE INDEX idx_group_activities_group ON group_activities(group_id);
CREATE INDEX idx_group_activities_date ON group_activities(scheduled_date);
CREATE INDEX idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX idx_activity_participants_parent ON activity_participants(parent_id);
CREATE INDEX idx_activity_shares_shared_by ON activity_shares(shared_by);
CREATE INDEX idx_activity_shares_shared_with ON activity_shares(shared_with);
CREATE INDEX idx_parent_profiles_school ON parent_profiles(school_name);
CREATE INDEX idx_parent_profiles_neighborhood ON parent_profiles(neighborhood);

-- Enable RLS on all new tables
ALTER TABLE parent_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_connections
CREATE POLICY "Parents can view their own connections"
  ON parent_connections FOR SELECT
  USING (auth.uid() = parent_id OR auth.uid() = connected_parent_id);

CREATE POLICY "Parents can create connection requests"
  ON parent_connections FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their connection status"
  ON parent_connections FOR UPDATE
  USING (auth.uid() = connected_parent_id AND status = 'pending');

-- RLS Policies for social_groups
CREATE POLICY "Anyone can view public groups"
  ON social_groups FOR SELECT
  USING (privacy_level = 'public');

CREATE POLICY "Members can view their groups"
  ON social_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = social_groups.id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create groups"
  ON social_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
  ON social_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = social_groups.id 
        AND parent_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for group_memberships
CREATE POLICY "Members can view their group memberships"
  ON group_memberships FOR SELECT
  USING (
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_memberships.group_id AND gm.parent_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can add members"
  ON group_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = group_memberships.group_id 
        AND parent_id = auth.uid()
        AND role IN ('admin', 'moderator')
    ) OR
    auth.uid() = parent_id
  );

-- RLS Policies for group_activities
CREATE POLICY "Group members can view activities"
  ON group_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = group_activities.group_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create activities"
  ON group_activities FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = group_activities.group_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Activity creators can update activities"
  ON group_activities FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for activity_participants
CREATE POLICY "Parents can view activity participants"
  ON activity_participants FOR SELECT
  USING (
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_activities ga
      JOIN group_memberships gm ON ga.group_id = gm.group_id
      WHERE ga.id = activity_participants.activity_id 
        AND gm.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can join activities"
  ON activity_participants FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their participation"
  ON activity_participants FOR UPDATE
  USING (auth.uid() = parent_id);

-- RLS Policies for activity_shares
CREATE POLICY "Parents can view shares directed to them"
  ON activity_shares FOR SELECT
  USING (
    auth.uid() = shared_with OR
    auth.uid() = shared_by OR
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = activity_shares.group_id AND parent_id = auth.uid()
    ))
  );

CREATE POLICY "Parents can share activities"
  ON activity_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

-- Create triggers for updated_at
CREATE TRIGGER update_parent_connections_updated_at
  BEFORE UPDATE ON parent_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_groups_updated_at
  BEFORE UPDATE ON social_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_activities_updated_at
  BEFORE UPDATE ON group_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();