-- Grant permissions for authenticated users to work with share_of_voice tables
GRANT ALL ON share_of_voice_reports TO authenticated;
GRANT ALL ON share_of_voice_competitors TO authenticated;
GRANT ALL ON share_of_voice_keywords TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure anon users can at least select (for public APIs if needed)
GRANT SELECT ON share_of_voice_reports TO anon;
GRANT SELECT ON share_of_voice_competitors TO anon;
GRANT SELECT ON share_of_voice_keywords TO anon;

-- Also grant permissions to service_role for server-side operations
GRANT ALL ON share_of_voice_reports TO service_role;
GRANT ALL ON share_of_voice_competitors TO service_role;
GRANT ALL ON share_of_voice_keywords TO service_role;