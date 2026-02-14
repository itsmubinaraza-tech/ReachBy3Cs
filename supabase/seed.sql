-- Seed Data for Needs-Matched Engagement Platform
-- This file populates the database with test data for development

-- =====================================================
-- PLATFORMS (System-wide, not tenant-specific)
-- =====================================================

INSERT INTO platforms (id, name, slug, icon_url, config, rate_limits, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Reddit', 'reddit', '/icons/reddit.svg',
   '{"api_version": "v1", "base_url": "https://oauth.reddit.com"}',
   '{"requests_per_minute": 60, "posts_per_day": 100}', true),
  ('22222222-2222-2222-2222-222222222222', 'Twitter/X', 'twitter', '/icons/twitter.svg',
   '{"api_version": "v2", "base_url": "https://api.twitter.com"}',
   '{"requests_per_minute": 50, "posts_per_day": 50}', true),
  ('33333333-3333-3333-3333-333333333333', 'Quora', 'quora', '/icons/quora.svg',
   '{"scraping_enabled": true}',
   '{"requests_per_minute": 20, "posts_per_day": 30}', true),
  ('44444444-4444-4444-4444-444444444444', 'LinkedIn', 'linkedin', '/icons/linkedin.svg',
   '{"api_version": "v2", "base_url": "https://api.linkedin.com"}',
   '{"requests_per_minute": 30, "posts_per_day": 20}', true),
  ('55555555-5555-5555-5555-555555555555', 'Google Search', 'google', '/icons/google.svg',
   '{"serp_api_enabled": true}',
   '{"requests_per_minute": 100, "posts_per_day": 1000}', true);

-- =====================================================
-- ORGANIZATIONS (Tenants)
-- =====================================================

INSERT INTO organizations (id, name, slug, settings) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'WeAttuned', 'weattuned',
   '{"theme": "default", "auto_post_enabled": true, "daily_post_limit": 50, "review_required_risk_levels": ["medium", "high", "blocked"]}'),
  ('bbbb2222-2222-2222-2222-222222222222', 'Demo Company', 'demo-company',
   '{"theme": "default", "auto_post_enabled": false, "daily_post_limit": 20, "review_required_risk_levels": ["low", "medium", "high", "blocked"]}');

-- =====================================================
-- PROBLEM CATEGORIES
-- =====================================================

-- WeAttuned Problem Categories (Relationship/Communication focused)
INSERT INTO problem_categories (id, organization_id, name, parent_id, keywords, description, is_ai_generated) VALUES
  -- Root categories
  ('cat11111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   'Relationship Communication', NULL,
   ARRAY['relationship', 'partner', 'spouse', 'communicate', 'talk', 'conversation'],
   'Issues related to communication within romantic relationships', false),
  ('cat22222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111',
   'Conflict Resolution', NULL,
   ARRAY['conflict', 'argument', 'fight', 'disagreement', 'resolve'],
   'Managing and resolving conflicts in relationships', false),
  ('cat33333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111',
   'Emotional Connection', NULL,
   ARRAY['emotional', 'connection', 'intimacy', 'closeness', 'distant', 'disconnected'],
   'Building and maintaining emotional bonds', false),
  ('cat44444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111',
   'Trust Issues', NULL,
   ARRAY['trust', 'betrayal', 'honesty', 'cheating', 'faithful', 'suspicious'],
   'Trust-related concerns in relationships', false),

  -- Sub-categories under Relationship Communication
  ('cat11111-2222-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   'Financial Discussions', 'cat11111-1111-1111-1111-111111111111',
   ARRAY['money', 'finances', 'budget', 'spending', 'debt', 'financial'],
   'Communicating about money matters', false),
  ('cat11111-3333-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   'Parenting Alignment', 'cat11111-1111-1111-1111-111111111111',
   ARRAY['parenting', 'children', 'kids', 'discipline', 'raising'],
   'Aligning on parenting approaches', false),

  -- Sub-categories under Conflict Resolution
  ('cat22222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111',
   'Recurring Arguments', 'cat22222-2222-2222-2222-222222222222',
   ARRAY['same argument', 'always fighting', 'never resolves', 'stuck'],
   'Breaking patterns of recurring conflicts', false);

-- Demo Company Problem Categories (Generic)
INSERT INTO problem_categories (id, organization_id, name, parent_id, keywords, description, is_ai_generated) VALUES
  ('catdemo1-1111-1111-1111-111111111111', 'bbbb2222-2222-2222-2222-222222222222',
   'Product Issues', NULL,
   ARRAY['product', 'issue', 'problem', 'broken', 'not working'],
   'Issues with products or services', false),
  ('catdemo2-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222',
   'Customer Support', NULL,
   ARRAY['support', 'help', 'assistance', 'customer service'],
   'Customer support inquiries', false);

-- =====================================================
-- ORGANIZATION PLATFORMS (Which platforms each org uses)
-- =====================================================

INSERT INTO organization_platforms (organization_id, platform_id, is_enabled, credentials, search_config) VALUES
  -- WeAttuned uses all platforms
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true,
   '{"encrypted": true}',
   '{"subreddits": ["relationships", "relationship_advice", "Marriage", "dating_advice"], "keywords": ["partner", "spouse", "communicate"]}'),
  ('aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', true,
   '{"encrypted": true}',
   '{"keywords": ["relationship advice", "marriage help", "communication tips"]}'),
  ('aaaa1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', true,
   '{"encrypted": true}',
   '{"spaces": ["Relationships", "Marriage & Relationships"], "keywords": ["how to communicate with partner"]}'),
  ('aaaa1111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', true,
   '{"encrypted": true}',
   '{"queries": ["relationship communication problems site:reddit.com", "how to talk to partner about"]}'),

  -- Demo Company uses Reddit and Twitter only
  ('bbbb2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', true,
   '{"encrypted": true}',
   '{"subreddits": ["customerservice", "techsupport"], "keywords": ["demo company", "product help"]}'),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', true,
   '{"encrypted": true}',
   '{"keywords": ["@democompany", "demo company support"]}');

-- =====================================================
-- COMMUNITY CLUSTERS
-- =====================================================

INSERT INTO clusters (id, organization_id, name, description, problem_category_id, keywords, member_count, engagement_count, avg_emotional_intensity, ai_summary, trending_topics) VALUES
  ('clust111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   'Financial Communication Struggles',
   'People struggling to discuss money matters with their partners',
   'cat11111-2222-1111-1111-111111111111',
   ARRAY['money', 'finances', 'budget', 'arguing about money', 'financial stress'],
   142, 89, 0.72,
   'This cluster represents individuals facing challenges when discussing financial topics with their romantic partners. Common themes include differing spending habits, debt disclosure, and budgeting disagreements.',
   '{"topics": ["joint accounts", "spending habits", "debt conversations"], "growth_rate": 0.15}'),

  ('clust222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111',
   'Feeling Emotionally Distant',
   'Partners feeling disconnected or emotionally distant from each other',
   'cat33333-3333-3333-3333-333333333333',
   ARRAY['distant', 'disconnected', 'roommates', 'lost spark', 'emotional intimacy'],
   98, 67, 0.81,
   'Individuals who feel their relationship has lost emotional intimacy. Many describe feeling like roommates rather than romantic partners.',
   '{"topics": ["rekindling romance", "quality time", "emotional availability"], "growth_rate": 0.22}'),

  ('clust333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111',
   'Recurring Argument Patterns',
   'Couples stuck in cycles of the same arguments',
   'cat22222-2222-2222-2222-222222222222',
   ARRAY['same fight', 'never resolves', 'going in circles', 'always arguing'],
   76, 52, 0.68,
   'Couples who find themselves having the same arguments repeatedly without resolution. Often relates to underlying unmet needs.',
   '{"topics": ["breaking patterns", "underlying issues", "communication styles"], "growth_rate": 0.08}');

-- =====================================================
-- SAMPLE POSTS (Detected from platforms)
-- =====================================================

INSERT INTO posts (id, organization_id, platform_id, external_id, external_url, content, content_type, author_handle, author_display_name, platform_metadata, external_created_at, detected_at) VALUES
  -- Reddit posts
  ('post1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'reddit_abc123', 'https://reddit.com/r/relationships/comments/abc123',
   'I''ve been struggling to communicate with my partner about finances. Every time I bring it up, it turns into an argument. We''ve been together for 5 years and married for 2, but this is becoming a real issue. I make more money than they do, and whenever I suggest budgeting or saving more, they get defensive and say I''m controlling. I''m not trying to control anything, I just want us to be on the same page. Has anyone dealt with something similar? How do you even start these conversations without it blowing up?',
   'post', 'throwaway_finances', 'Anonymous User',
   '{"upvotes": 234, "comments": 89, "subreddit": "relationships", "flair": "Need Advice"}',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),

  ('post2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'reddit_def456', 'https://reddit.com/r/relationship_advice/comments/def456',
   'My wife and I have been together for 10 years, and lately I feel like we''re just roommates. We barely talk about anything meaningful anymore. She comes home from work, I come home from work, we eat dinner in front of the TV, and then go to bed. I miss the connection we used to have. I''ve tried suggesting date nights but she always says she''s too tired. I don''t know how to bring up that I''m feeling disconnected without making her feel like I''m blaming her.',
   'post', 'lonely_husband_2026', 'Feeling Lost',
   '{"upvotes": 567, "comments": 203, "subreddit": "relationship_advice", "flair": "Relationships"}',
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours'),

  ('post3333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'twitter_xyz789', 'https://twitter.com/user123/status/xyz789',
   'Does anyone else have the same argument with their partner over and over? It''s always about household chores and it never gets resolved. I''m exhausted. #relationships #marriageproblems',
   'post', '@frustratedwife', 'Sarah M.',
   '{"likes": 45, "retweets": 12, "replies": 28}',
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours'),

  ('post4444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
   'quora_question_001', 'https://quora.com/How-can-I-improve-communication-with-my-partner',
   'How can I improve communication with my partner when they shut down during difficult conversations? Every time I try to discuss something important, they either get angry or completely withdraw. I feel like I''m walking on eggshells. We love each other but this pattern is destroying our relationship.',
   'post', 'Anonymous User', 'Anonymous',
   '{"views": 1200, "upvotes": 34, "answers": 15, "space": "Relationships"}',
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '10 hours'),

  -- A high-risk post that should be blocked (crisis indicators)
  ('post5555-5555-5555-5555-555555555555', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'reddit_crisis_001', 'https://reddit.com/r/relationships/comments/crisis001',
   'I can''t take this anymore. My relationship is falling apart and I feel completely hopeless. I don''t see any point in trying anymore. Everything feels dark and I just want it all to end.',
   'post', 'desperate_user', 'Hurting',
   '{"upvotes": 45, "comments": 102, "subreddit": "relationships", "flair": "Crisis"}',
   NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes');

-- =====================================================
-- SAMPLE SIGNALS (AI Analysis Results)
-- =====================================================

INSERT INTO signals (id, post_id, problem_category_id, emotional_intensity, keywords, confidence_score, raw_llm_response, raw_analysis, prompt_version, model_used, processing_started_at, processing_completed_at) VALUES
  ('sig11111-1111-1111-1111-111111111111', 'post1111-1111-1111-1111-111111111111', 'cat11111-2222-1111-1111-111111111111',
   0.72, ARRAY['finances', 'argument', 'controlling', 'budgeting', 'defensive', 'partner'],
   0.91,
   'Analysis complete. This post discusses financial communication challenges in a marriage. The user expresses frustration about recurring arguments when discussing money matters. Key emotional indicators suggest moderate-high distress (0.72) due to feeling misunderstood. The defensive reaction from the partner suggests underlying insecurities about income disparity.',
   '{"primary_emotion": "frustration", "secondary_emotions": ["concern", "confusion"], "relationship_stage": "married", "duration": "5 years together, 2 years married", "core_issue": "financial_communication", "partner_reaction": "defensive", "income_disparity": true}',
   'signal_v1.2', 'llama-3.1-70b',
   NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '54 minutes'),

  ('sig22222-2222-2222-2222-222222222222', 'post2222-2222-2222-2222-222222222222', 'cat33333-3333-3333-3333-333333333333',
   0.81, ARRAY['roommates', 'disconnected', 'connection', 'date nights', 'tired', 'meaningful'],
   0.88,
   'Analysis complete. This post describes emotional disconnection in a long-term marriage. The user feels they have become "roommates" rather than romantic partners. High emotional intensity (0.81) indicates significant distress. The partner''s tiredness may indicate burnout or avoidance.',
   '{"primary_emotion": "loneliness", "secondary_emotions": ["sadness", "longing"], "relationship_stage": "married", "duration": "10 years", "core_issue": "emotional_disconnection", "attempted_solutions": ["date nights"], "partner_response": "too tired"}',
   'signal_v1.2', 'llama-3.1-70b',
   NOW() - INTERVAL '2 hours 55 minutes', NOW() - INTERVAL '2 hours 54 minutes'),

  ('sig33333-3333-3333-3333-333333333333', 'post3333-3333-3333-3333-333333333333', 'cat22222-2222-2222-2222-222222222222',
   0.68, ARRAY['argument', 'chores', 'exhausted', 'never resolves', 'same'],
   0.85,
   'Analysis complete. This post describes a recurring conflict pattern around household chores. Moderate emotional intensity (0.68) with signs of exhaustion and frustration. The repetitive nature suggests unaddressed underlying dynamics.',
   '{"primary_emotion": "exhaustion", "secondary_emotions": ["frustration", "resignation"], "core_issue": "recurring_conflict", "conflict_topic": "household_chores", "pattern": "unresolved_cycle"}',
   'signal_v1.2', 'llama-3.1-70b',
   NOW() - INTERVAL '4 hours 55 minutes', NOW() - INTERVAL '4 hours 54 minutes'),

  ('sig44444-4444-4444-4444-444444444444', 'post4444-4444-4444-4444-444444444444', 'cat11111-1111-1111-1111-111111111111',
   0.75, ARRAY['communication', 'shut down', 'withdraw', 'angry', 'eggshells', 'difficult conversations'],
   0.89,
   'Analysis complete. This post describes a stonewalling pattern in communication. One partner withdraws or becomes angry during difficult conversations. High emotional intensity (0.75) due to walking on eggshells. This indicates a potentially avoidant attachment style in the partner.',
   '{"primary_emotion": "anxiety", "secondary_emotions": ["frustration", "fear"], "core_issue": "stonewalling", "partner_pattern": "withdrawal_or_anger", "user_feeling": "walking_on_eggshells", "potential_attachment_style": "avoidant"}',
   'signal_v1.2', 'llama-3.1-70b',
   NOW() - INTERVAL '9 hours 55 minutes', NOW() - INTERVAL '9 hours 54 minutes'),

  ('sig55555-5555-5555-5555-555555555555', 'post5555-5555-5555-5555-555555555555', 'cat33333-3333-3333-3333-333333333333',
   0.98, ARRAY['hopeless', 'can''t take it', 'end', 'dark', 'desperate'],
   0.95,
   'CRISIS DETECTED. This post contains crisis language indicating potential self-harm ideation. Keywords: "can''t take this anymore", "hopeless", "want it all to end", "everything feels dark". IMMEDIATE FLAGGING REQUIRED. Do not engage with marketing content.',
   '{"primary_emotion": "despair", "crisis_indicators": ["hopelessness", "wanting_to_end", "darkness"], "risk_assessment": "HIGH", "recommended_action": "DO_NOT_ENGAGE", "crisis_resources_needed": true}',
   'signal_v1.2', 'llama-3.1-70b',
   NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '24 minutes');

-- =====================================================
-- SAMPLE RISK SCORES
-- =====================================================

INSERT INTO risk_scores (id, signal_id, risk_level, risk_score, context_flags, risk_factors, recommended_action, raw_llm_response, raw_analysis, prompt_version, model_used, processing_started_at, processing_completed_at) VALUES
  ('risk1111-1111-1111-1111-111111111111', 'sig11111-1111-1111-1111-111111111111',
   'low', 0.22,
   ARRAY['financial_topic'],
   '{"factors": [{"name": "emotional_intensity", "score": 0.72, "weight": 0.3}, {"name": "sensitive_topic", "score": 0.3, "weight": 0.3}, {"name": "crisis_language", "score": 0.0, "weight": 0.4}], "overall_assessment": "Standard relationship advice request about finances. No crisis indicators."}',
   'Eligible for engagement. Recommend value-first response about financial communication strategies.',
   'Risk assessment complete. Low risk (0.22). Financial discussions in relationships are common and this user is seeking constructive advice. No crisis language detected.',
   '{"crisis_language_detected": false, "sensitive_topics": ["finances"], "vulnerability_indicators": [], "engagement_safe": true}',
   'risk_v1.1', 'llama-3.1-70b',
   NOW() - INTERVAL '53 minutes', NOW() - INTERVAL '52 minutes'),

  ('risk2222-2222-2222-2222-222222222222', 'sig22222-2222-2222-2222-222222222222',
   'low', 0.28,
   ARRAY['emotional_disconnection'],
   '{"factors": [{"name": "emotional_intensity", "score": 0.81, "weight": 0.3}, {"name": "sensitive_topic", "score": 0.2, "weight": 0.3}, {"name": "crisis_language", "score": 0.0, "weight": 0.4}], "overall_assessment": "Emotional disconnection is distressing but user is seeking reconnection strategies."}',
   'Eligible for engagement. Recommend empathetic response acknowledging the pain of disconnection.',
   'Risk assessment complete. Low risk (0.28). While emotional intensity is high, the user is solution-seeking and shows no crisis indicators.',
   '{"crisis_language_detected": false, "sensitive_topics": ["intimacy"], "vulnerability_indicators": ["loneliness"], "engagement_safe": true}',
   'risk_v1.1', 'llama-3.1-70b',
   NOW() - INTERVAL '2 hours 53 minutes', NOW() - INTERVAL '2 hours 52 minutes'),

  ('risk3333-3333-3333-3333-333333333333', 'sig33333-3333-3333-3333-333333333333',
   'low', 0.18,
   ARRAY[],
   '{"factors": [{"name": "emotional_intensity", "score": 0.68, "weight": 0.3}, {"name": "sensitive_topic", "score": 0.1, "weight": 0.3}, {"name": "crisis_language", "score": 0.0, "weight": 0.4}], "overall_assessment": "Common household conflict pattern. Low risk."}',
   'Eligible for engagement. Respond with conflict resolution strategies.',
   'Risk assessment complete. Low risk (0.18). Household chore conflicts are extremely common and this is a safe topic for engagement.',
   '{"crisis_language_detected": false, "sensitive_topics": [], "vulnerability_indicators": ["exhaustion"], "engagement_safe": true}',
   'risk_v1.1', 'llama-3.1-70b',
   NOW() - INTERVAL '4 hours 53 minutes', NOW() - INTERVAL '4 hours 52 minutes'),

  ('risk4444-4444-4444-4444-444444444444', 'sig44444-4444-4444-4444-444444444444',
   'medium', 0.45,
   ARRAY['emotional_volatility', 'stonewalling_pattern'],
   '{"factors": [{"name": "emotional_intensity", "score": 0.75, "weight": 0.3}, {"name": "sensitive_topic", "score": 0.4, "weight": 0.3}, {"name": "crisis_language", "score": 0.1, "weight": 0.4}], "overall_assessment": "Walking on eggshells language suggests potential unhealthy relationship dynamics. Requires careful response."}',
   'Requires human review before engagement. Potential for escalation.',
   'Risk assessment complete. Medium risk (0.45). The "walking on eggshells" description may indicate more serious relationship dynamics. Response should be carefully crafted.',
   '{"crisis_language_detected": false, "sensitive_topics": ["emotional_volatility", "potential_unhealthy_dynamics"], "vulnerability_indicators": ["anxiety", "fear"], "engagement_safe": true, "review_recommended": true}',
   'risk_v1.1', 'llama-3.1-70b',
   NOW() - INTERVAL '9 hours 53 minutes', NOW() - INTERVAL '9 hours 52 minutes'),

  ('risk5555-5555-5555-5555-555555555555', 'sig55555-5555-5555-5555-555555555555',
   'blocked', 0.98,
   ARRAY['crisis_language', 'self_harm_indicators', 'hopelessness'],
   '{"factors": [{"name": "emotional_intensity", "score": 0.98, "weight": 0.3}, {"name": "sensitive_topic", "score": 1.0, "weight": 0.3}, {"name": "crisis_language", "score": 1.0, "weight": 0.4}], "overall_assessment": "CRISIS. Contains explicit indicators of despair and potential self-harm ideation."}',
   'DO NOT ENGAGE. Flag for crisis resources only. No marketing response appropriate.',
   'BLOCKED. This post contains crisis language: "can''t take this anymore", "hopeless", "want it all to end". Marketing engagement is inappropriate and potentially harmful.',
   '{"crisis_language_detected": true, "sensitive_topics": ["self_harm_ideation", "despair"], "vulnerability_indicators": ["hopelessness", "darkness", "ending"], "engagement_safe": false, "crisis_intervention_needed": true}',
   'risk_v1.1', 'llama-3.1-70b',
   NOW() - INTERVAL '23 minutes', NOW() - INTERVAL '22 minutes');

-- =====================================================
-- SAMPLE RESPONSES (Generated by AI)
-- =====================================================

INSERT INTO responses (id, signal_id, cluster_id, value_first_response, soft_cta_response, contextual_response, selected_response, selected_type, cta_level, cta_analysis, cts_score, cts_breakdown, can_auto_post, auto_post_reason, status, raw_llm_response, raw_analysis, prompt_version, model_used, generation_started_at, generation_completed_at) VALUES
  ('resp1111-1111-1111-1111-111111111111', 'sig11111-1111-1111-1111-111111111111', 'clust111-1111-1111-1111-111111111111',
   'Financial conversations in relationships are genuinely challenging, and you''re definitely not alone in this. One thing that helped me was framing it as "our goals" rather than "what you should do" - it shifts the dynamic from criticism to collaboration. Starting with something like "I''d love for us to dream together about where we want to be in 5 years" can open the door without triggering defensiveness. The income disparity you mentioned is actually really common, and sometimes the partner earning less feels like discussions about money are actually discussions about their worth. Acknowledging that can help.',
   'Financial conversations in relationships are genuinely challenging. One approach that many couples find helpful is framing it as shared goals rather than individual spending habits. Starting with dreams for the future ("Where do we want to be in 5 years?") can open the door more gently. The income disparity dynamic you mentioned is really common - there are some great tools out there that help couples navigate these conversations with built-in frameworks.',
   'I hear you - 5 years together, 2 married, and the money conversations still turn into arguments. That''s exhausting. The fact that they get defensive suggests they might be hearing criticism even when you''re not intending it. Sometimes partners with lower income internalize money talks as judgment on their contribution. What if you started the conversation with appreciation for what they DO bring, then moved into the practical stuff? "I love our life together, and I want us to build toward [specific shared goal]. Can we figure this out as a team?"',
   'Financial conversations in relationships are genuinely challenging, and you''re definitely not alone in this. One thing that helped me was framing it as "our goals" rather than "what you should do" - it shifts the dynamic from criticism to collaboration. Starting with something like "I''d love for us to dream together about where we want to be in 5 years" can open the door without triggering defensiveness. The income disparity you mentioned is actually really common, and sometimes the partner earning less feels like discussions about money are actually discussions about their worth. Acknowledging that can help.',
   'value_first', 0,
   '{"level": 0, "reasoning": "Pure value response with no mention of products, services, or external resources. Focuses entirely on actionable advice."}',
   0.87,
   '{"signal_component": 0.91, "risk_component": 0.78, "cta_component": 1.0, "calculation": "(0.91 * 0.4) + (0.78 * 0.3) + (1.0 * 0.3) = 0.87"}',
   true, 'CTS >= 0.7, risk_level = low, cta_level = 0',
   'pending',
   'Generated three response variants. Value-first selected for auto-post eligibility due to zero CTA. All responses provide genuine advice about financial communication in relationships.',
   '{"tone": "empathetic", "approach": "reframing", "key_advice": ["shared_goals", "acknowledge_disparity", "appreciation_first"], "estimated_helpfulness": 0.85}',
   'response_v1.3', 'llama-3.1-70b',
   NOW() - INTERVAL '51 minutes', NOW() - INTERVAL '50 minutes'),

  ('resp2222-2222-2222-2222-222222222222', 'sig22222-2222-2222-2222-222222222222', 'clust222-2222-2222-2222-222222222222',
   'Ten years is a long time, and what you''re describing - feeling like roommates - is one of the most common things couples face, especially after the initial excitement fades. It doesn''t mean the love is gone; it often means life has just gotten comfortable (sometimes too comfortable). The tiredness your wife mentions might be real exhaustion, but it could also be her feeling disconnected and not knowing how to bridge the gap. Instead of suggesting activities, you might try reconnecting emotionally first. Simple things like asking about her day and really listening, or sharing something vulnerable about how YOU''RE feeling (without making it about blame). Sometimes we have to rebuild the friendship before we can reignite the romance.',
   'Ten years is a long time, and feeling like roommates is incredibly common. The tiredness your wife mentions could be real exhaustion OR a symptom of the disconnection itself. Before jumping to date nights, rebuilding the emotional friendship might help - asking about her day with genuine curiosity, sharing something vulnerable about yourself. Many couples find that structured conversation starters help here since sometimes we forget how to talk about things that matter.',
   'That "roommates" feeling after 10 years... I hear you. And I notice you said "I''ve tried suggesting date nights" - which shows you''re the one initiating. That alone can be exhausting. Here''s the thing: when she says she''s "too tired," she might mean too tired for yet another thing on the calendar, but maybe not too tired for connection in the moments you already have. What if instead of adding activities, you deepened existing ones? Turning off the TV during dinner (even just once a week), or sitting together after instead of immediately separating. Small moments of presence can rebuild the foundation.',
   'Ten years is a long time, and what you''re describing - feeling like roommates - is one of the most common things couples face, especially after the initial excitement fades. It doesn''t mean the love is gone; it often means life has just gotten comfortable (sometimes too comfortable). The tiredness your wife mentions might be real exhaustion, but it could also be her feeling disconnected and not knowing how to bridge the gap. Instead of suggesting activities, you might try reconnecting emotionally first. Simple things like asking about her day and really listening, or sharing something vulnerable about how YOU''RE feeling (without making it about blame). Sometimes we have to rebuild the friendship before we can reignite the romance.',
   'value_first', 0,
   '{"level": 0, "reasoning": "Value-only response focused on emotional reconnection strategies. No product mentions."}',
   0.85,
   '{"signal_component": 0.88, "risk_component": 0.72, "cta_component": 1.0, "calculation": "(0.88 * 0.4) + (0.72 * 0.3) + (1.0 * 0.3) = 0.85"}',
   true, 'CTS >= 0.7, risk_level = low, cta_level = 0',
   'pending',
   'Generated three response variants for emotional disconnection scenario. All provide empathetic, actionable advice.',
   '{"tone": "warm_understanding", "approach": "reframe_tiredness", "key_advice": ["rebuild_friendship", "small_moments", "genuine_presence"], "estimated_helpfulness": 0.88}',
   'response_v1.3', 'llama-3.1-70b',
   NOW() - INTERVAL '2 hours 51 minutes', NOW() - INTERVAL '2 hours 50 minutes'),

  ('resp3333-3333-3333-3333-333333333333', 'sig33333-3333-3333-3333-333333333333', 'clust333-3333-3333-3333-333333333333',
   'The fact that you have the same argument repeatedly is actually a huge clue - it''s not really about the chores. Those recurring fights usually point to something deeper: feeling unappreciated, unequal division of mental load, different cleanliness standards, or just different ways of showing care. What if you tried approaching it not as "let''s divide chores fairly" but "help me understand what household stuff stresses you out most, and I''ll share mine"? Getting to the feelings underneath often breaks the cycle better than any chore chart.',
   'Recurring arguments about the same thing are exhausting - but they''re also a signal that the surface issue (chores) isn''t really the issue. Usually it''s about feeling unappreciated or unequal. Some couples find it helps to dig into the emotions rather than the logistics: "What about this situation makes you feel stressed/unseen?" Having those conversations is hard, and there are some structured approaches that can help.',
   'Same argument, over and over, about chores. Exhausting is right. Here''s something that might help: those recurring fights aren''t really about who does the dishes - they''re usually about feeling unseen or unvalued. Next time you feel the argument starting, try pausing and asking your partner: "What does this really mean to you? What are you feeling underneath the frustration?" It might feel weird, but getting to the emotions breaks the pattern faster than any chore schedule will.',
   'The fact that you have the same argument repeatedly is actually a huge clue - it''s not really about the chores. Those recurring fights usually point to something deeper: feeling unappreciated, unequal division of mental load, different cleanliness standards, or just different ways of showing care. What if you tried approaching it not as "let''s divide chores fairly" but "help me understand what household stuff stresses you out most, and I''ll share mine"? Getting to the feelings underneath often breaks the cycle better than any chore chart.',
   'value_first', 0,
   '{"level": 0, "reasoning": "Focuses entirely on understanding recurring conflict patterns. No external resources mentioned."}',
   0.89,
   '{"signal_component": 0.85, "risk_component": 0.82, "cta_component": 1.0, "calculation": "(0.85 * 0.4) + (0.82 * 0.3) + (1.0 * 0.3) = 0.89"}',
   true, 'CTS >= 0.7, risk_level = low, cta_level = 0',
   'approved',
   'Generated responses for recurring chore arguments. Value-first selected with zero CTA.',
   '{"tone": "direct_helpful", "approach": "look_beneath_surface", "key_advice": ["underlying_emotions", "pause_and_ask", "feelings_over_logistics"], "estimated_helpfulness": 0.82}',
   'response_v1.3', 'llama-3.1-70b',
   NOW() - INTERVAL '4 hours 51 minutes', NOW() - INTERVAL '4 hours 50 minutes'),

  ('resp4444-4444-4444-4444-444444444444', 'sig44444-4444-4444-4444-444444444444', NULL,
   'Walking on eggshells is exhausting, and I''m sorry you''re dealing with this. When a partner shuts down or gets angry during hard conversations, it often stems from feeling overwhelmed or threatened - not necessarily by you, but by the emotions the conversation brings up. That doesn''t make it okay, but it can help explain the pattern. Something that sometimes works: giving them a heads-up that you want to discuss something, and letting them choose when (within a day or two). It gives them time to regulate before the conversation even starts. And during the talk, keeping statements focused on your feelings ("I feel worried when...") rather than their behavior ("You always...") can reduce defensiveness.',
   'Walking on eggshells is really hard. Partners who shut down or get angry during difficult conversations often feel overwhelmed, not by you but by the intensity of emotions. Giving advance notice of wanting to talk and using "I feel" statements can help. Many couples dealing with this pattern benefit from learning specific de-escalation techniques - there are some good resources out there for handling these dynamics.',
   'That eggshells feeling... it takes a toll. When someone shuts down or gets angry during hard talks, they''re often reacting to feeling overwhelmed or criticized (even if that''s not your intention). Here''s something to try: before your next difficult conversation, let them know in advance. Something like "I''d like to talk about something that''s been on my mind - can we do that tomorrow evening?" It gives their nervous system time to prepare. And when you do talk, trying to stay with your own feelings ("I feel scared when we can''t discuss things") rather than observations about them can make a real difference.',
   'Walking on eggshells is exhausting, and I''m sorry you''re dealing with this. When a partner shuts down or gets angry during hard conversations, it often stems from feeling overwhelmed or threatened - not necessarily by you, but by the emotions the conversation brings up. That doesn''t make it okay, but it can help explain the pattern. Something that sometimes works: giving them a heads-up that you want to discuss something, and letting them choose when (within a day or two). It gives them time to regulate before the conversation even starts. And during the talk, keeping statements focused on your feelings ("I feel worried when...") rather than their behavior ("You always...") can reduce defensiveness.',
   'value_first', 0,
   '{"level": 0, "reasoning": "Focuses on understanding shutdown patterns and provides concrete strategies. No product mentions."}',
   0.65,
   '{"signal_component": 0.89, "risk_component": 0.55, "cta_component": 1.0, "calculation": "(0.89 * 0.4) + (0.55 * 0.3) + (1.0 * 0.3) = 0.65"}',
   false, 'CTS < 0.7 due to medium risk level',
   'pending',
   'Generated responses for stonewalling pattern. Medium risk requires manual review.',
   '{"tone": "gentle_understanding", "approach": "explain_pattern", "key_advice": ["advance_notice", "i_statements", "regulate_first"], "estimated_helpfulness": 0.86, "caution_notes": "walking_on_eggshells may indicate more serious dynamics"}',
   'response_v1.3', 'llama-3.1-70b',
   NOW() - INTERVAL '9 hours 51 minutes', NOW() - INTERVAL '9 hours 50 minutes');

-- No response generated for post5555 (crisis/blocked)

-- =====================================================
-- SAMPLE ENGAGEMENT QUEUE
-- =====================================================

INSERT INTO engagement_queue (id, response_id, organization_id, priority, queue_position, status) VALUES
  ('queue111-1111-1111-1111-111111111111', 'resp1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   80, 1, 'queued'),
  ('queue222-2222-2222-2222-222222222222', 'resp2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111',
   75, 2, 'queued'),
  ('queue444-4444-4444-4444-444444444444', 'resp4444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111',
   90, 3, 'queued');  -- Higher priority because needs review

-- =====================================================
-- SAMPLE CLUSTER MEMBERS
-- =====================================================

INSERT INTO cluster_members (cluster_id, post_id, similarity_score) VALUES
  ('clust111-1111-1111-1111-111111111111', 'post1111-1111-1111-1111-111111111111', 0.92),
  ('clust222-2222-2222-2222-222222222222', 'post2222-2222-2222-2222-222222222222', 0.88),
  ('clust333-3333-3333-3333-333333333333', 'post3333-3333-3333-3333-333333333333', 0.85);

-- =====================================================
-- SAMPLE AUDIT LOG ENTRIES
-- =====================================================

INSERT INTO audit_log (id, organization_id, action_type, entity_type, entity_id, action_data, device_type) VALUES
  ('audit111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   'post.detected', 'post', 'post1111-1111-1111-1111-111111111111',
   '{"platform": "reddit", "subreddit": "relationships", "detection_method": "keyword_match"}',
   'api'),
  ('audit222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111',
   'signal.generated', 'signal', 'sig11111-1111-1111-1111-111111111111',
   '{"processing_time_ms": 1200, "model": "llama-3.1-70b"}',
   'api'),
  ('audit333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111',
   'response.generated', 'response', 'resp1111-1111-1111-1111-111111111111',
   '{"variants_count": 3, "selected_type": "value_first", "auto_post_eligible": true}',
   'api'),
  ('audit444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111',
   'response.approved', 'response', 'resp3333-3333-3333-3333-333333333333',
   '{"approved_variant": "value_first", "review_time_ms": 45000}',
   'web');

-- =====================================================
-- SAMPLE DAILY METRICS
-- =====================================================

INSERT INTO daily_metrics (organization_id, metric_date, posts_detected, signals_generated, responses_generated, responses_approved, responses_rejected, responses_auto_posted, responses_manually_posted, platform_breakdown, risk_breakdown, new_clusters_detected, cluster_engagements, avg_response_time_ms, avg_review_time_ms) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day',
   45, 42, 38, 28, 5, 15, 13,
   '{"reddit": 30, "twitter": 10, "quora": 5}',
   '{"low": 32, "medium": 8, "high": 2, "blocked": 3}',
   2, 35, 2500, 42000),
  ('aaaa1111-1111-1111-1111-111111111111', CURRENT_DATE,
   12, 12, 10, 3, 0, 2, 1,
   '{"reddit": 8, "twitter": 3, "quora": 1}',
   '{"low": 9, "medium": 2, "high": 0, "blocked": 1}',
   0, 8, 2300, 38000);

-- =====================================================
-- SAMPLE AUTOMATION RULES
-- =====================================================

INSERT INTO automation_rules (id, organization_id, name, description, conditions, actions, is_active, priority) VALUES
  ('auto1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   'Auto-approve Low Risk Value-First',
   'Automatically approve and post responses with low risk and zero CTA',
   '{"risk_level": "low", "cta_level": 0, "cts_score_min": 0.8}',
   '{"action": "auto_post", "delay_minutes": 15}',
   true, 100),
  ('auto2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111',
   'Flag High Emotional Intensity',
   'Send notification when emotional intensity is very high',
   '{"emotional_intensity_min": 0.9}',
   '{"action": "notify", "priority": "high"}',
   true, 90),
  ('auto3333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111',
   'Block Crisis Content',
   'Automatically block and flag any content with crisis indicators',
   '{"risk_level": "blocked"}',
   '{"action": "block", "notify_admin": true, "log_reason": true}',
   true, 1000);
