 
## User
- **user_id**: string
- **email**: string
- **name**: string
- **profile_picture_url**: string (Firebase Storage URL)
- **walkout_audio_url**: string (optional, Firebase Storage URL)
- **memberships**: list of `Membership`
- **notification_preferences**: list of `NotificationPreference`
- **version**: int

## Membership
- **membership_id**: string
- **user_id**: string
- **tenant_id**: string
- **tenant_type**: enum ("club", "association", "team", "travel_league", "tournament")
- **roles**: list of enum ("scorer", "viewer", "admin", "statistician", "super_user", "player", "family_member", "fan")
- **version**: int

## NotificationPreference
- **notification_id**: string
- **membership_id**: string
- **notifications_enabled**: boolean
- **notification_types**: list of enum ("game_start", "game_end", "score_update", "player_event", "custom")
- **version**: int

## Player
- **player_id**: string
- **name**: string
- **dob**: date
- **teams**: list of `PlayerTeam`
- **version**: int
- **profile_picture_url**: string (Firebase storage URL)
- **walkout_audio_url**: string (optional, Firebase Storage URL)

## PlayerTeam
- **player_team_id**: string
- **player_id**: string
- **team_id**: string
- **season**: string
- **role**: string (e.g., pitcher, catcher, etc.)
- **version**: int

## Team
- **team_id**: string
- **name**: string
- **club_id**: string
- **association_id**: string
- **region_id**: string
- **state_id**: string
- **age_group_id**: string
- **travel_league_id**: string
- **team_type**: string (e.g., mixed, male, female)
- **team_category**: string (e.g., T-Ball, U12, U14, U16, U19, Women's A grade, Women's B grade, Men's Open)
- **home_field**: string
- **logo_url**: string (Firebase storage URL)
- **players**: list of `PlayerTeam`
- **officials**: list of `TeamOfficial`
- **statistics**: list of `TeamStatistics`
- **version**: int

## TeamOfficial
- **official_id**: string
- **team_id**: string
- **name**: string
- **role**: string (e.g., coach, assistant coach, statistician, manager, specialist coach)
- **specialization**: string (optional, e.g., battery coach, pitch coach)
- **contact_information**: string (optional)
- **version**: int

## AgeGroup
- **age_group_id**: string
- **name**: string
- **version**: int

## Club
- **club_id**: string
- **name**: string
- **association_id**: string
- **version**: int

## Association
- **association_id**: string
- **name**: string
- **region_id**: string
- **version**: int

## Region
- **region_id**: string
- **name**: string
- **state_id**: string
- **version**: int

## TravelLeague
- **travel_league_id**: string
- **name**: string
- **description**: string
- **regions**: list of `Region`
- **associations**: list of `Association`
- **version**: int

## State
- **state_id**: string
- **name**: string
- **version**: int

## TenantReference
- **tenant_id**: string
- **tenant_type**: enum ("club", "association", "team", "travel_league")
- **version**: int

## Game
- **game_id**: string
- **date**: timestamp
- **home_team_id**: string
- **away_team_id**: string
- **score_home**: int
- **score_away**: int
- **inning**: int
- **status**: string
- **lineups**: list of `Lineup`
- **events**: list of `Event`
- **runners_on_base**: list of `RunnerOnBase`
- **current_batter**: string (player_id)
- **current_pitcher**: string (player_id)
- **version**: int


## PlayerBattingStatistics
- **player_id**: string
- **game_id**: string
- **season**: string
- **at_bats** (AB): int
- **hits** (H): int
- **singles** (1B): int
- **doubles** (2B): int
- **triples** (3B): int
- **home_runs** (HR): int
- **runs_batted_in** (RBI): int
- **stolen_bases** (SB): int
- **caught_stealing** (CS): int
- **walks** (BB): int
- **intentional_walks** (IBB): int
- **hit_by_pitch** (HBP): int
- **strikeouts** (K): int
- **ground_into_double_play** (GDP): int
- **sacrifice_flies** (SF): int
- **sacrifice_hits** (SH): int
- **plate_appearances** (PA): int
- **left_on_base** (LOB): int
- **batting_average** (BA): float
- **on_base_percentage** (OBP): float
- **slugging_percentage** (SLG): float
- **on_base_plus_slugging** (OPS): float
- **total_bases** (TB): int
- **extra_base_hits** (XBH): int
- **runs_created** (RC): float
- **runs_produced** (RP): float
- **batting_average_on_balls_in_play** (BABIP): float
- **walk_to_strikeout_ratio** (BB/K): float
- **gross_production_average** (GPA): float
- **isolated_power** (ISO): float
- **at_bats_per_home_run** (AB/HR): float
- **equivalent_average** (EQA): float
- **inside_the_park_home_runs** (ITPHR): int
- **base_runs** (BsR): float
- **total_average** (TA): float
- **times_on_base** (TOB): int
- **runners_in_scoring_position** (RISP): float
- **ground_ball_fly_ball_ratio** (GO/AO): float
- **version**: int

## PlayerBattingStatistics
- **player_id**: string
- **game_id**: string
- **season**: string
- **at_bats** (AB): int
- **hits** (H): int
- **singles** (1B): int
- **doubles** (2B): int
- **triples** (3B): int
- **home_runs** (HR): int
- **runs_batted_in** (RBI): int
- **stolen_bases** (SB): int
- **caught_stealing** (CS): int
- **walks** (BB): int
- **intentional_walks** (IBB): int
- **hit_by_pitch** (HBP): int
- **strikeouts** (K): int
- **ground_into_double_play** (GDP): int
- **sacrifice_flies** (SF): int
- **sacrifice_hits** (SH): int
- **plate_appearances** (PA): int
- **left_on_base** (LOB): int
- **batting_average** (BA): float
- **on_base_percentage** (OBP): float
- **slugging_percentage** (SLG): float
- **on_base_plus_slugging** (OPS): float
- **total_bases** (TB): int
- **extra_base_hits** (XBH): int
- **runs_created** (RC): float
- **runs_produced** (RP): float
- **batting_average_on_balls_in_play** (BABIP): float
- **walk_to_strikeout_ratio** (BB/K): float
- **gross_production_average** (GPA): float
- **isolated_power** (ISO): float
- **at_bats_per_home_run** (AB/HR): float
- **equivalent_average** (EQA): float
- **inside_the_park_home_runs** (ITPHR): int
- **base_runs** (BsR): float
- **total_average** (TA): float
- **times_on_base** (TOB): int
- **runners_in_scoring_position** (RISP): float
- **ground_ball_fly_ball_ratio** (GO/AO): float
- **version**: int

## PlayerPitchingStatistics
- **player_id**: string
- **game_id**: string
- **season**: string
- **innings_pitched** (IP): float
- **wins** (W): int
- **losses** (L): int
- **earned_run_average** (ERA): float
- **strikeouts** (K): int
- **walks_allowed** (BB): int
- **hits_allowed** (H): int
- **runs_allowed** (R): int
- **earned_runs** (ER): int
- **home_runs_allowed** (HR): int
- **hit_batters** (HBP): int
- **wild_pitches** (WP): int
- **balks** (BK): int
- **batters_faced** (BF): int
- **games_started** (GS): int
- **complete_games** (CG): int
- **shutouts** (SHO): int
- **saves** (SV): int
- **save_opportunities** (SVO): int
- **holds** (HLD): int
- **blown_saves** (BS): int
- **strikeouts_per_9_innings** (K/9): float
- **walks_per_9_innings** (BB/9): float
- **strikeout_to_walk_ratio** (K/BB): float
- **fielding_independent_pitching** (FIP): float
- **walks_and_hits_per_inning_pitched** (WHIP): float
- **ground_ball_fly_ball_ratio** (GO/AO): float
- **version**: int

## PlayerFieldingStatistics
- **player_id**: string
- **game_id**: string
- **season**: string
- **putouts** (PO): int
- **assists** (A): int
- **errors** (E): int
- **double_plays** (DP): int
- **triple_plays** (TP): int
- **fielding_percentage** (FPCT): float
- **range_factor** (RF): float
- **passed_balls** (PB): int
- **stolen_bases_allowed** (SBA): int
- **caught_stealing** (CS): int
- **caught_stealing_percentage** (CS%): float
- **total_chances** (TC): int
- **innings** (INN): float
- **games** (G): int
- **games_started** (GS): int
- **wild_pitches** (WP): int
- **double_plays_turned** (DPT): int
- **triple_plays_turned** (TPT): int
- **version**: int

## GameLive
- **game_id**: string
- **date**: timestamp
- **home_team_id**: string
- **away_team_id**: string
- **score_home**: int
- **score_away**: int
- **inning**: int
- **status**: string
- **lineups**: list of `LineupLive`
- **events**: list of `EventLive`
- **runners_on_base**: list of `RunnerOnBaseLive`
- **current_batter**: string (player_id)
- **current_pitcher**: string (player_id)
- **version**: int

## LineupLive
- **lineup_id**: string
- **game_id**: string
- **team_id**: string
- **players**: list of `LineupPlayerLive`
- **version**: int

## LineupPlayerLive
- **lineup_player_id**: string
- **lineup_id**: string
- **player_id**: string
- **position**: string (e.g., pitcher, catcher, etc.)
- **batting_order**: int
- **version**: int

## RunnerOnBaseLive
- **runner_id**: string
- **game_id**: string
- **player_id**: string
- **base**: int (1 for first base, 2 for second base, etc.)
- **version**: int

## EventLive
- **event_id**: string
- **game_id**: string
- **inning**: int
- **team_id**: string
- **player_id**: string
- **event_type**: string (e.g., hit, strike, out, home run, etc.)
- **description**: string
- **timestamp**: timestamp
- **version**: int




