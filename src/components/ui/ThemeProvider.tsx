"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
export type Theme     = "light" | "dark";
export type Locale    = "en" | "ar";
export type Direction = "ltr" | "rtl";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

interface LocaleContextProps {
  locale: Locale;
  direction: Direction;
  isRTL: boolean;
  toggleLocale: () => void;
  t: (key: string) => string;
  tPlural: (key: string, count: number) => string;
}

// ── Translation Dictionary ─────────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // ── Welcome / Landing ──────────────────────────────────────────────────────
    welcome:              "Welcome to 11Players",
    tagline:              "Gamified Football Matchmaking & Community Management",
    cta_login:            "Login with Google",
    how_it_works:         "How It Works",
    step_join:            "Join",
    step_rate:            "Rate",
    step_compete:         "Compete",
    step_join_desc:       "Create an account and join your football community in seconds.",
    step_rate_desc:       "Rate teammates after each match to keep stats accurate and fair.",
    step_compete_desc:    "Climb the leaderboard, win awards, and dominate the season.",
    see_all_features:     "See All Features",
    why_use_us:           "Why use 11Players?",
    why_use_us_desc:      "Everything you need to organize matches, track performance, and keep competition fair.",
    privacy_banner:       "We use cookies to enhance your matchmaking balance accuracy.",
    accept:               "Accept",
    registered_players:   "Registered Players",
    active_communities:   "Active Communities",
    platform_ovr_avg:     "Platform OVR Avg",
    matches_recorded:     "Matches Recorded",

    // ── Navigation / Sidebar ──────────────────────────────────────────────────
    home:                 "Home",
    communities:          "Communities",
    match:                "Match",
    stats:                "Leaderboard",
    profile:              "My Profile",
    achievements:         "Achievements",
    notifications:        "Notifications",
    chat:                 "Community Chat",
    admin:                "Admin Dashboard",
    season_ceremony:      "Season Ceremony",
    announcements:        "Announcements",
    support:              "Support",
    inbox:                "Inbox",
    users:                "Users",
    owner:                "Owner Panel",
    guide:                "Guide & Rules",
    global:               "Global Registry",
    settings:             "Settings",
    logout:               "Logout",
    login:                "Login",

    // ── Settings Menu ─────────────────────────────────────────────────────────
    light_mode:           "Light Mode",
    dark_mode:            "Dark Mode",
    language:             "العربية",
    theme:                "Theme",
    default_page:         "Default Page",
    save:                 "Save",
    saving:               "Saving...",
    saved:                "Saved!",

    // ── Auth ──────────────────────────────────────────────────────────────────
    login_with_google:    "Continue with Google",
    logging_in:           "Signing in...",
    login_error:          "Login failed. Please try again.",
    login_popup_blocked:  "Popup was blocked. Please allow popups for this site.",
    welcome_back:         "Welcome back",
    new_here:             "New here? Your account will be set up automatically.",

    // ── Onboarding ────────────────────────────────────────────────────────────
    onboarding_title:     "Set Up Your Player Profile",
    onboarding_step:      "Step {n} of {total}",
    step_name:            "Your Name",
    step_position:        "Your Position",
    step_skills:          "Your Skills",
    step_community:       "Your Community",
    full_name:            "Full Name",
    card_name:            "Card Name",
    full_name_hint:       "Your real name for the roster",
    card_name_hint:       "Short name shown on your player card",
    pick_position:        "Click your position on the pitch",
    skill_sliders_hint:   "Drag the sliders to rate yourself honestly",
    ovr_preview:          "OVR Preview",
    continue:             "Continue",
    back:                 "Back",
    finish:               "Finish Setup",
    all_done:             "You're All Set!",
    all_done_desc:        "Your player profile is ready. Time to hit the pitch!",
    go_to_communities:    "Go to Communities",

    // ── Communities ───────────────────────────────────────────────────────────
    my_community:         "My Community",
    active:               "Active",
    join_community:       "Join",
    leave_community:      "Leave",
    create_community:     "Create Community",
    enter_password:       "Enter password",
    wrong_password:       "Wrong password. Try again.",
    joining:              "Joining...",
    community_members:    "Members",
    community_private:    "Private",
    community_public:     "Public",
    challenge:            "Challenge",
    incoming_challenges:  "Incoming Challenges",
    outgoing_challenges:  "Outgoing Challenges",
    no_communities:       "No communities found.",
    search_communities:   "Search communities...",

    // ── Match ─────────────────────────────────────────────────────────────────
    current_match:        "Current Match",
    match_history:        "Match History",
    team_a:               "Team A",
    team_b:               "Team B",
    generate_teams:       "Generate Teams",
    start_match:          "Start Match",
    end_match:            "End Match",
    checkin:              "Check In",
    checkout:             "Check Out",
    checked_in:           "Checked In",
    score:                "Score",
    timer:                "Timer",
    extra_time:           "Extra Time",
    goals:                "Goals",
    assists:              "Assists",
    yellow_card:          "Yellow Card",
    red_card:             "Red Card",
    motm:                 "Man of the Match",
    motm_select:          "Select MOTM",
    penalty_shootout:     "Penalty Shootout",
    no_match_yet:         "No match has been set up yet.",
    captain:              "Captain",
    vote_captain:         "Vote Captain",

    // ── Leaderboard / Stats ───────────────────────────────────────────────────
    leaderboard:          "Leaderboard",
    top_players:          "Top Players",
    all_time:             "All Time",
    this_season:          "This Season",
    this_month:           "This Month",
    rank:                 "Rank",
    player:               "Player",
    overall:              "Overall",
    goals_stat:           "Goals",
    assists_stat:         "Assists",
    mvp_stat:             "MVP",
    ballon_dor:           "Ballon d'Or",
    top_scorer:           "Top Scorer",
    top_playmaker:        "Top Playmaker",
    season_mvp:           "Season MVP",
    golden_shield:        "Golden Shield",

    // ── Profile ───────────────────────────────────────────────────────────────
    my_profile:           "My Profile",
    edit_profile:         "Edit Profile",
    player_card:          "Player Card",
    attributes:           "Attributes",
    recent_matches:       "Recent Matches",
    trophies:             "Trophies",
    bio:                  "Bio",
    share_profile:        "Share Profile",
    export_pdf:           "Export PDF",
    compare:              "Compare",
    ovr:                  "OVR",
    positions:            "Positions",
    playstyle:            "Playstyle",
    skills:               "Skills",
    matches_played:       "Matches Played",
    win_rate:             "Win Rate",
    rating_avg:           "Avg Rating",
    peer_rating:          "Peer Rating",

    // ── Achievements ──────────────────────────────────────────────────────────
    achievements_title:   "Achievements",
    earned:               "Earned",
    in_progress:          "In Progress",
    locked:               "Locked",
    all_achievements:     "All",
    progress:             "Progress",
    rare:                 "Rare",
    epic:                 "Epic",
    legendary:            "Legendary",
    share_achievement:    "Share",
    unlocked:             "Unlocked!",

    // ── Notifications ─────────────────────────────────────────────────────────
    notifications_title:  "Notifications",
    mark_all_read:        "Mark All as Read",
    delete_all:           "Delete All",
    no_notifications:     "You're all caught up!",
    no_notifications_sub: "No new notifications right now.",
    today:                "Today",
    yesterday:            "Yesterday",
    this_week:            "This Week",
    older:                "Older",
    filter_all:           "All",
    filter_match:         "Match",
    filter_rating:        "Rating",
    filter_system:        "System",
    filter_achievement:   "Achievement",

    // ── Community Chat ────────────────────────────────────────────────────────
    chat_title:           "Community Chat",
    type_message:         "Type a message...",
    send:                 "Send",
    reply_to:             "Reply to",
    edit_message:         "Edit",
    delete_message:       "Delete",
    attach_image:         "Attach Image",
    slow_mode:            "Slow mode: wait {n}s",
    no_messages:          "No messages yet. Say hello!",
    pinned:               "Pinned",
    reactions:            "Reactions",
    you:                  "You",

    // ── Admin ─────────────────────────────────────────────────────────────────
    admin_title:          "Admin Dashboard",
    pending_requests:     "Pending Requests",
    player_management:    "Player Management",
    run_aggregation:      "Run Daily Aggregation",
    apply_ai_all:         "Apply AI to All Players",
    reset_votes:          "Reset Captain Votes",
    export_roster:        "Export Roster PDF",
    lock_community:       "Lock All to Community",
    approve:              "Approve",
    reject:               "Reject",
    search_players:       "Search players...",
    no_pending:           "No pending requests.",

    // ── Season Ceremony ───────────────────────────────────────────────────────
    season_ceremony_title: "Season Ceremony",
    current_season:        "Current Season",
    past_seasons:          "Past Seasons",
    archive_season:        "Archive Season",
    delete_season:         "Delete Season",
    season_winners:        "Season Winners",
    download_ceremony:     "Download Ceremony",
    share_winners:         "Share to Chat",

    // ── Announcements ─────────────────────────────────────────────────────────
    announcements_title:  "Announcements",
    new_announcement:     "New Announcement",
    title_en:             "Title (English)",
    title_ar:             "Title (Arabic)",
    message_en:           "Message (English)",
    message_ar:           "Message (Arabic)",
    priority_normal:      "Normal",
    priority_urgent:      "Urgent",
    target_community:     "Community",
    target_global:        "Global (All Users)",
    action_link:          "Action Link (optional)",
    send_announcement:    "Send Announcement",
    sending:              "Sending...",
    sent:                 "Sent!",
    no_announcements:     "No announcements yet.",

    // ── Support / Inbox ───────────────────────────────────────────────────────
    support_title:        "Support",
    inbox_title:          "Support Inbox",
    type_reply:           "Type a reply...",
    thread_open:          "Open",
    thread_replied:       "Replied",
    thread_resolved:      "Resolved",
    thread_spam:          "Spam",
    no_threads:           "No support threads.",
    delete_thread:        "Delete Thread",
    pin_thread:           "Pin",
    unpin_thread:         "Unpin",

    // ── Users ─────────────────────────────────────────────────────────────────
    users_title:          "Users",
    role:                 "Role",
    joined:               "Joined",
    ban_user:             "Ban",
    promote_moderator:    "Promote to Moderator",
    revoke_moderator:     "Revoke Moderator",
    no_users:             "No users found.",

    // ── Owner Panel ───────────────────────────────────────────────────────────
    owner_title:          "Owner Control Panel",
    create_community_btn: "Create New Community",
    community_name:       "Community Name",
    admin_uid:            "Admin UID",
    private_community:    "Private",
    community_password:   "Password",
    danger_zone:          "Danger Zone",
    wipe_all_data:        "Wipe All Data",
    confirm_wipe:         "Type CONFIRM to proceed",
    reset_global_stats:   "Reset Global Stats",
    maintenance_mode:     "Maintenance Mode",

    // ── Guide ─────────────────────────────────────────────────────────────────
    guide_title:          "Guide & Rules",
    guide_overview:       "Overview",
    guide_positions:      "Positions",
    guide_playstyles:     "Play Styles",
    guide_skills:         "Special Skills",
    guide_features:       "Features",
    guide_rules:          "Rules",
    search_guide:         "Search guide...",

    // ── General ───────────────────────────────────────────────────────────────
    loading:              "Loading...",
    error:                "Something went wrong.",
    retry:                "Retry",
    cancel:               "Cancel",
    confirm:              "Confirm",
    delete:               "Delete",
    edit:                 "Edit",
    close:                "Close",
    view_all:             "View All",
    no_data:              "No data available.",
    success:              "Done!",
    copied:               "Copied!",
    share:                "Share",
    download:             "Download",
    filter:               "Filter",
    sort_by:              "Sort by",
    search:               "Search",
    submit:               "Submit",
    upload:               "Upload",
    uploading:            "Uploading...",
    required_community:   "Please select a community first.",
    admin_only:           "You do not have admin access for this community.",
    not_found:            "Page not found.",
    go_home:              "Go to Home",
    tos:                  "Terms of Service",
    privacy:              "Privacy Policy",
    cookie_policy:        "Cookie Policy",
  },

  // ── Arabic Translations ────────────────────────────────────────────────────
  ar: {
    // ── Welcome / Landing ──────────────────────────────────────────────────────
    welcome:              "مرحباً بك في 11Players",
    tagline:              "تنظيم مجتمعي متكامل وتشكيل متوازن ومحسّن لفرق كرة القدم",
    cta_login:            "تسجيل الدخول بواسطة جوجل",
    how_it_works:         "كيف يعمل؟",
    step_join:            "انضم",
    step_rate:            "قيّم",
    step_compete:         "تنافس",
    step_join_desc:       "أنشئ حساباً وانضم لمجتمعك الكروي في ثوانٍ.",
    step_rate_desc:       "قيّم زملاءك بعد كل مباراة لضمان دقة الإحصاءات وعدالتها.",
    step_compete_desc:    "تسلق لوحة المتصدرين، احصد الجوائز، وسيطر على الموسم.",
    see_all_features:     "جميع المميزات",
    why_use_us:           "لماذا تستخدم 11Players؟",
    why_use_us_desc:      "كل ما تحتاجه لتنظيم مبارياتك، تتبع الأداء، وضمان المنافسة العادلة.",
    privacy_banner:       "نحن نستخدم ملفات تعريف الارتباط لتحسين دقة موازنة تشكيل الفرق.",
    accept:               "موافق",
    registered_players:   "لاعب مسجل",
    active_communities:   "مجتمعات نشطة",
    platform_ovr_avg:     "متوسط التقييم العام (OVR)",
    matches_recorded:     "مباراة ملعوبة",

    // ── Navigation / Sidebar ──────────────────────────────────────────────────
    home:                 "الرئيسية",
    communities:          "المجتمعات",
    match:                "المباراة",
    stats:                "لوحة المتصدرين",
    profile:              "ملفي الشخصي",
    achievements:         "الإنجازات",
    notifications:        "الإشعارات",
    chat:                 "شات المجتمع",
    admin:                "لوحة الإدارة",
    season_ceremony:      "حفل الموسم",
    announcements:        "الإعلانات",
    support:              "الدعم",
    inbox:                "صندوق الوارد",
    users:                "المستخدمون",
    owner:                "لوحة المالك",
    guide:                "الدليل والقواعد",
    global:               "السجل العالمي",
    settings:             "الإعدادات",
    logout:               "تسجيل الخروج",
    login:                "تسجيل الدخول",

    // ── Settings Menu ─────────────────────────────────────────────────────────
    light_mode:           "الوضع الفاتح",
    dark_mode:            "الوضع الداكن",
    language:             "English",
    theme:                "المظهر",
    default_page:         "الصفحة الافتراضية",
    save:                 "حفظ",
    saving:               "جاري الحفظ...",
    saved:                "تم الحفظ!",

    // ── Auth ──────────────────────────────────────────────────────────────────
    login_with_google:    "المتابعة بواسطة جوجل",
    logging_in:           "جاري تسجيل الدخول...",
    login_error:          "فشل تسجيل الدخول. حاول مرة أخرى.",
    login_popup_blocked:  "تم حظر النافذة المنبثقة. يرجى السماح بها لهذا الموقع.",
    welcome_back:         "مرحباً بعودتك",
    new_here:             "مرحباً بك! سيتم إعداد حسابك تلقائياً.",

    // ── Onboarding ────────────────────────────────────────────────────────────
    onboarding_title:     "إعداد ملفك الكروي",
    onboarding_step:      "الخطوة {n} من {total}",
    step_name:            "اسمك",
    step_position:        "مركزك",
    step_skills:          "مهاراتك",
    step_community:       "مجتمعك",
    full_name:            "الاسم الكامل",
    card_name:            "اسم البطاقة",
    full_name_hint:       "اسمك الحقيقي في القائمة",
    card_name_hint:       "اسم قصير يظهر على بطاقة اللاعب",
    pick_position:        "انقر على مركزك في الملعب",
    skill_sliders_hint:   "حرك المؤشرات لتقييم نفسك بصدق",
    ovr_preview:          "معاينة OVR",
    continue:             "متابعة",
    back:                 "رجوع",
    finish:               "إنهاء الإعداد",
    all_done:             "أنت جاهز!",
    all_done_desc:        "ملفك الكروي جاهز. حان وقت الملعب!",
    go_to_communities:    "اذهب للمجتمعات",

    // ── Communities ───────────────────────────────────────────────────────────
    my_community:         "مجتمعي",
    active:               "نشط",
    join_community:       "انضم",
    leave_community:      "مغادرة",
    create_community:     "إنشاء مجتمع",
    enter_password:       "أدخل كلمة المرور",
    wrong_password:       "كلمة المرور خاطئة. حاول مجدداً.",
    joining:              "جاري الانضمام...",
    community_members:    "أعضاء",
    community_private:    "خاص",
    community_public:     "عام",
    challenge:            "تحدي",
    incoming_challenges:  "تحديات واردة",
    outgoing_challenges:  "تحديات صادرة",
    no_communities:       "لا توجد مجتمعات.",
    search_communities:   "ابحث عن مجتمع...",

    // ── Match ─────────────────────────────────────────────────────────────────
    current_match:        "المباراة الحالية",
    match_history:        "سجل المباريات",
    team_a:               "الفريق أ",
    team_b:               "الفريق ب",
    generate_teams:       "توليد الفرق",
    start_match:          "بدء المباراة",
    end_match:            "إنهاء المباراة",
    checkin:              "تسجيل حضور",
    checkout:             "إلغاء الحضور",
    checked_in:           "مسجل",
    score:                "النتيجة",
    timer:                "المؤقت",
    extra_time:           "الوقت الإضافي",
    goals:                "أهداف",
    assists:              "تمريرات حاسمة",
    yellow_card:          "كرت أصفر",
    red_card:             "كرت أحمر",
    motm:                 "رجل المباراة",
    motm_select:          "اختر رجل المباراة",
    penalty_shootout:     "ركلات الترجيح",
    no_match_yet:         "لم يتم إعداد أي مباراة بعد.",
    captain:              "كابتن",
    vote_captain:         "صوّت للكابتن",

    // ── Leaderboard / Stats ───────────────────────────────────────────────────
    leaderboard:          "لوحة المتصدرين",
    top_players:          "أفضل اللاعبين",
    all_time:             "كل الأوقات",
    this_season:          "هذا الموسم",
    this_month:           "هذا الشهر",
    rank:                 "الترتيب",
    player:               "اللاعب",
    overall:              "التقييم العام",
    goals_stat:           "الأهداف",
    assists_stat:         "الصناعة",
    mvp_stat:             "MVP",
    ballon_dor:           "كرة الذهب",
    top_scorer:           "الهداف",
    top_playmaker:        "أفضل صانع ألعاب",
    season_mvp:           "أفضل لاعب في الموسم",
    golden_shield:        "الدرع الذهبي",

    // ── Profile ───────────────────────────────────────────────────────────────
    my_profile:           "ملفي الشخصي",
    edit_profile:         "تعديل الملف",
    player_card:          "البطاقة",
    attributes:           "الصفات",
    recent_matches:       "آخر المباريات",
    trophies:             "الجوائز",
    bio:                  "نبذة",
    share_profile:        "مشاركة الملف",
    export_pdf:           "تصدير PDF",
    compare:              "مقارنة",
    ovr:                  "OVR",
    positions:            "المراكز",
    playstyle:            "أسلوب اللعب",
    skills:               "مهارات خاصة",
    matches_played:       "مباريات ملعوبة",
    win_rate:             "نسبة الفوز",
    rating_avg:           "متوسط التقييم",
    peer_rating:          "تقييم الأقران",

    // ── Achievements ──────────────────────────────────────────────────────────
    achievements_title:   "الإنجازات",
    earned:               "محقق",
    in_progress:          "قيد التحقيق",
    locked:               "مقفل",
    all_achievements:     "الكل",
    progress:             "التقدم",
    rare:                 "نادر",
    epic:                 "ملحمي",
    legendary:            "أسطوري",
    share_achievement:    "شاركه",
    unlocked:             "تم فتحه!",

    // ── Notifications ─────────────────────────────────────────────────────────
    notifications_title:  "الإشعارات",
    mark_all_read:        "تحديد الكل كمقروء",
    delete_all:           "حذف الكل",
    no_notifications:     "لا توجد إشعارات جديدة!",
    no_notifications_sub: "أنت على اطلاع بكل شيء.",
    today:                "اليوم",
    yesterday:            "أمس",
    this_week:            "هذا الأسبوع",
    older:                "أقدم",
    filter_all:           "الكل",
    filter_match:         "مباراة",
    filter_rating:        "تقييم",
    filter_system:        "نظام",
    filter_achievement:   "إنجاز",

    // ── Community Chat ────────────────────────────────────────────────────────
    chat_title:           "شات المجتمع",
    type_message:         "اكتب رسالة...",
    send:                 "إرسال",
    reply_to:             "رد على",
    edit_message:         "تعديل",
    delete_message:       "حذف",
    attach_image:         "إرفاق صورة",
    slow_mode:            "الوضع البطيء: انتظر {n} ثانية",
    no_messages:          "لا توجد رسائل بعد. قل مرحباً!",
    pinned:               "مثبتة",
    reactions:            "ردود الفعل",
    you:                  "أنت",

    // ── Admin ─────────────────────────────────────────────────────────────────
    admin_title:          "لوحة الإدارة",
    pending_requests:     "الطلبات المعلقة",
    player_management:    "إدارة اللاعبين",
    run_aggregation:      "تشغيل التجميع اليومي",
    apply_ai_all:         "تطبيق الذكاء الاصطناعي على الجميع",
    reset_votes:          "إعادة تعيين أصوات الكابتن",
    export_roster:        "تصدير قائمة اللاعبين PDF",
    lock_community:       "قفل الجميع للمجتمع",
    approve:              "موافقة",
    reject:               "رفض",
    search_players:       "ابحث عن لاعب...",
    no_pending:           "لا توجد طلبات معلقة.",

    // ── Season Ceremony ───────────────────────────────────────────────────────
    season_ceremony_title: "حفل نهاية الموسم",
    current_season:        "الموسم الحالي",
    past_seasons:          "المواسم السابقة",
    archive_season:        "أرشفة الموسم",
    delete_season:         "حذف الموسم",
    season_winners:        "أبطال الموسم",
    download_ceremony:     "تحميل الحفل",
    share_winners:         "مشاركة في الشات",

    // ── Announcements ─────────────────────────────────────────────────────────
    announcements_title:  "الإعلانات",
    new_announcement:     "إعلان جديد",
    title_en:             "العنوان (بالإنجليزية)",
    title_ar:             "العنوان (بالعربية)",
    message_en:           "الرسالة (بالإنجليزية)",
    message_ar:           "الرسالة (بالعربية)",
    priority_normal:      "عادي",
    priority_urgent:      "عاجل",
    target_community:     "المجتمع",
    target_global:        "عالمي (جميع المستخدمين)",
    action_link:          "رابط الإجراء (اختياري)",
    send_announcement:    "إرسال الإعلان",
    sending:              "جاري الإرسال...",
    sent:                 "تم الإرسال!",
    no_announcements:     "لا توجد إعلانات بعد.",

    // ── Support / Inbox ───────────────────────────────────────────────────────
    support_title:        "الدعم",
    inbox_title:          "صندوق الوارد",
    type_reply:           "اكتب رداً...",
    thread_open:          "مفتوح",
    thread_replied:       "تم الرد",
    thread_resolved:      "محلول",
    thread_spam:          "بريد عشوائي",
    no_threads:           "لا توجد خيوط دعم.",
    delete_thread:        "حذف الخيط",
    pin_thread:           "تثبيت",
    unpin_thread:         "إلغاء التثبيت",

    // ── Users ─────────────────────────────────────────────────────────────────
    users_title:          "المستخدمون",
    role:                 "الدور",
    joined:               "انضم في",
    ban_user:             "حظر",
    promote_moderator:    "ترقية إلى مشرف",
    revoke_moderator:     "سحب صلاحية المشرف",
    no_users:             "لم يُعثر على مستخدمين.",

    // ── Owner Panel ───────────────────────────────────────────────────────────
    owner_title:          "لوحة تحكم المالك",
    create_community_btn: "إنشاء مجتمع جديد",
    community_name:       "اسم المجتمع",
    admin_uid:            "معرف المشرف",
    private_community:    "خاص",
    community_password:   "كلمة المرور",
    danger_zone:          "منطقة الخطر",
    wipe_all_data:        "مسح جميع البيانات",
    confirm_wipe:         "اكتب CONFIRM للمتابعة",
    reset_global_stats:   "إعادة تعيين الإحصاءات العالمية",
    maintenance_mode:     "وضع الصيانة",

    // ── Guide ─────────────────────────────────────────────────────────────────
    guide_title:          "الدليل والقواعد",
    guide_overview:       "نظرة عامة",
    guide_positions:      "المراكز",
    guide_playstyles:     "أساليب اللعب",
    guide_skills:         "المهارات الخاصة",
    guide_features:       "المميزات",
    guide_rules:          "القواعد",
    search_guide:         "ابحث في الدليل...",

    // ── General ───────────────────────────────────────────────────────────────
    loading:              "جاري التحميل...",
    error:                "حدث خطأ ما.",
    retry:                "إعادة المحاولة",
    cancel:               "إلغاء",
    confirm:              "تأكيد",
    delete:               "حذف",
    edit:                 "تعديل",
    close:                "إغلاق",
    view_all:             "عرض الكل",
    no_data:              "لا توجد بيانات.",
    success:              "تم!",
    copied:               "تم النسخ!",
    share:                "مشاركة",
    download:             "تحميل",
    filter:               "تصفية",
    sort_by:              "ترتيب حسب",
    search:               "بحث",
    submit:               "إرسال",
    upload:               "رفع",
    uploading:            "جاري الرفع...",
    required_community:   "يرجى اختيار مجتمع أولاً.",
    admin_only:           "ليس لديك صلاحيات إدارية لهذا المجتمع.",
    not_found:            "الصفحة غير موجودة.",
    go_home:              "العودة للرئيسية",
    tos:                  "شروط الخدمة",
    privacy:              "سياسة الخصوصية",
    cookie_policy:        "سياسة ملفات تعريف الارتباط",
  },
};

// ── Context ────────────────────────────────────────────────────────────────────
const ThemeContext  = createContext<ThemeContextProps  | undefined>(undefined);
const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

// ── Theme Provider ─────────────────────────────────────────────────────────────
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme;
    const resolved = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(resolved);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Locale Provider ────────────────────────────────────────────────────────────
export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ FIX: Initialize from localStorage synchronously to prevent flash
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale;
      if (saved === "en" || saved === "ar") return saved;
    }
    return "ar";
  });

  const [direction, setDirection] = useState<Direction>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale;
      return saved === "en" ? "ltr" : "rtl";
    }
    return "rtl";
  });

  // Sync document attributes on mount
  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    const resolved = saved === "en" || saved === "ar" ? saved : "ar";
    const dir = resolved === "ar" ? "rtl" : "ltr";
    setLocale(resolved);
    setDirection(dir);
    document.documentElement.lang = resolved;
    document.documentElement.dir  = dir;
  }, []);

  const toggleLocale = () => {
    const next    = locale === "ar" ? "en" : "ar";
    const nextDir = next === "ar" ? "rtl" : "ltr";
    setLocale(next);
    setDirection(nextDir);
    localStorage.setItem("locale", next);
    document.documentElement.lang = next;
    document.documentElement.dir  = nextDir;
  };

  /** Basic key lookup with fallback to key name */
  const t = (key: string): string => {
    return translations[locale][key] ?? translations["en"][key] ?? key;
  };

  /** Pluralization helper — key_one / key_other pattern */
  const tPlural = (key: string, count: number): string => {
    const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
    const str = translations[locale][pluralKey] ?? translations[locale][key] ?? key;
    return str.replace("{count}", String(count));
  };

  // ✅ FIX: Removed `if (!mounted) return null` — no more full-page flash
  return (
    <LocaleContext.Provider value={{ locale, direction, isRTL: direction === "rtl", toggleLocale, t, tPlural }}>
      {children}
    </LocaleContext.Provider>
  );
};

// ── Hooks ──────────────────────────────────────────────────────────────────────
export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};

export const useLocale = (): LocaleContextProps => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
};
