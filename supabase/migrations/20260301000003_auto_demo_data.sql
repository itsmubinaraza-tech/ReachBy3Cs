-- =====================================================
-- AUTO DEMO DATA: Triggered when new organization is created
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_demo_data_for_org()
RETURNS TRIGGER AS $$
DECLARE
    v_platform_reddit UUID := '11111111-1111-1111-1111-111111111111';
    v_platform_twitter UUID := '22222222-2222-2222-2222-222222222222';
    v_post_id1 UUID;
    v_post_id2 UUID;
    v_post_id3 UUID;
    v_signal_id1 UUID;
    v_signal_id2 UUID;
    v_signal_id3 UUID;
    v_response_id1 UUID;
    v_response_id2 UUID;
    v_response_id3 UUID;
BEGIN
    -- Skip for seed org
    IF NEW.id = 'aaaa1111-1111-1111-1111-111111111111' THEN
        RETURN NEW;
    END IF;

    -- Link platforms to new organization
    INSERT INTO organization_platforms (organization_id, platform_id, is_enabled)
    VALUES
        (NEW.id, v_platform_reddit, true),
        (NEW.id, v_platform_twitter, true)
    ON CONFLICT (organization_id, platform_id) DO NOTHING;

    -- Create demo posts
    v_post_id1 := gen_random_uuid();
    v_post_id2 := gen_random_uuid();
    v_post_id3 := gen_random_uuid();

    INSERT INTO posts (id, organization_id, platform_id, external_id, external_url, content, author_handle, detected_at) VALUES
    (v_post_id1, NEW.id, v_platform_reddit, 'demo_reddit_001', 'https://reddit.com/r/relationships/demo1',
     'My partner and I keep having the same argument over and over. We can''t seem to communicate effectively. Any advice on how to break this cycle?',
     'demo_user1', NOW() - INTERVAL '2 hours'),
    (v_post_id2, NEW.id, v_platform_twitter, 'demo_twitter_001', 'https://twitter.com/demo/status/123',
     'Feeling so disconnected from my spouse lately. We used to talk for hours, now we barely say anything. Anyone else going through this?',
     'demo_user2', NOW() - INTERVAL '4 hours'),
    (v_post_id3, NEW.id, v_platform_reddit, 'demo_reddit_002', 'https://reddit.com/r/selfimprovement/demo2',
     'Looking for ways to be more emotionally available for my family. Any resources or apps that helped you?',
     'demo_user3', NOW() - INTERVAL '1 day');

    -- Create signals
    v_signal_id1 := gen_random_uuid();
    v_signal_id2 := gen_random_uuid();
    v_signal_id3 := gen_random_uuid();

    INSERT INTO signals (id, post_id, emotional_intensity, keywords, engagement_potential) VALUES
    (v_signal_id1, v_post_id1, 0.8, ARRAY['communication', 'partner', 'argument'], 0.85),
    (v_signal_id2, v_post_id2, 0.9, ARRAY['disconnected', 'spouse', 'lonely'], 0.75),
    (v_signal_id3, v_post_id3, 0.6, ARRAY['emotionally available', 'family'], 0.88);

    -- Create risk scores
    INSERT INTO risk_scores (signal_id, risk_level, risk_score, context_flags) VALUES
    (v_signal_id1, 'low', 0.2, ARRAY['seeking_advice', 'open_to_help']),
    (v_signal_id2, 'medium', 0.5, ARRAY['emotional_distress']),
    (v_signal_id3, 'low', 0.15, ARRAY['self_improvement']);

    -- Create AI responses
    v_response_id1 := gen_random_uuid();
    v_response_id2 := gen_random_uuid();
    v_response_id3 := gen_random_uuid();

    INSERT INTO responses (id, signal_id, value_first_response, soft_cta_response, contextual_response, selected_response, selected_type, cta_level, cts_score, can_auto_post, status) VALUES
    (v_response_id1, v_signal_id1,
     'Communication patterns in relationships can be tricky. One technique that helps many couples is the "pause and reflect" method - when you feel an argument starting, take 10 minutes apart to cool down.',
     'The cycle of repetitive arguments often stems from unmet emotional needs. Tools like emotion tracking apps can help both partners recognize and articulate feelings better.',
     'Breaking argument cycles requires understanding your triggers. Many couples find that keeping an "argument journal" helps identify patterns.',
     'Communication patterns in relationships can be tricky. One technique that helps many couples is the "pause and reflect" method - when you feel an argument starting, take 10 minutes apart to cool down.',
     'value_first', 1, 0.85, true, 'pending'),
    (v_response_id2, v_signal_id2,
     'That feeling of disconnection is more common than you might think. Sometimes scheduling dedicated "talk time" - even 15 minutes daily without distractions - can make a huge difference.',
     'Emotional disconnection often builds gradually. Understanding each other''s emotional languages helps rebuild connection.',
     'Rebuilding connection takes intentional effort. Consider starting with small gestures - a morning check-in, sharing appreciation daily.',
     'That feeling of disconnection is more common than you might think. Sometimes scheduling dedicated "talk time" - even 15 minutes daily without distractions - can make a huge difference.',
     'value_first', 1, 0.78, false, 'pending'),
    (v_response_id3, v_signal_id3,
     'Being emotionally available is such an important goal. Start with active listening - really hearing what family members say without planning your response.',
     'Emotional availability starts with self-awareness. Understanding your own emotional patterns helps you be more present for others.',
     'Love that you''re prioritizing emotional availability! Daily one-on-one time with each family member creates strong bonds.',
     'Being emotionally available is such an important goal. Start with active listening - really hearing what family members say without planning your response.',
     'value_first', 1, 0.88, true, 'pending');

    -- Add to engagement queue
    INSERT INTO engagement_queue (organization_id, response_id, status, priority) VALUES
    (NEW.id, v_response_id1, 'queued', 85),
    (NEW.id, v_response_id2, 'queued', 75),
    (NEW.id, v_response_id3, 'queued', 88);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on organization insert
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.create_demo_data_for_org();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_demo_data_for_org() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_demo_data_for_org() TO service_role;
