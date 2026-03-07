export type Lang = "en" | "zh"

export const translations = {
    en: {
        // Header
        communityAnalytics: "Community Analytics",
        usdNote: "all USD calculations use current prices",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",

        // Community selector
        sosovalue: "SoSoValue",
        sodex: "SoDEX",

        // Language selector
        english: "EN",
        chinese: "中文",

        // Summary stats cards
        totalMessages: "Total Messages",
        activeUsers: "Active Users",

        // Section headings
        topQuestions: "Top Questions",
        summary: "Summary",
        languageSections: "Language Sections",
        topMods: "Top Mods",
        topChatters: "Top Chatters",
        allTimeTopMods: "All Time Top Mods",
        mostEngagedPosts: "Most Engaged Posts",

        // Activity chart headings
        hourlyActivity: "Hourly Activity",
        weeklyAvgHourlyActivity: "Weekly average Hourly Activity",
        allTimeActivityByHour: "All Time Activity By Hour",
        activityByHour: "Activity By Hour",
        weeklyPeakHours: "Weekly Peak Hours (Past 7 Days)",

        // Timeframe buttons
        today: "Today",
        oneWeek: "1 Week",
        allTime: "All Time",

        // Chart labels
        allInUTC8: "ALL IN UTC+8 (SGT)",

        // Loading / empty states
        loadingData: "Loading data...",
        noDataAvailable: "No data available for the selected date",
        noSummary: "No summary available for this section.",

        // Misc
        messages: "messages",
        close: "Close",
        dataCumulativeUntil: "Data cumulative until",
        viewPostOnX: "View Post on X",
        updated: "Updated",
    },
    zh: {
        // Header
        communityAnalytics: "社区分析",
        usdNote: "所有USD计算均使用当前价格",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",

        // Community selector
        sosovalue: "SoSoValue",
        sodex: "SoDEX",

        // Language selector
        english: "EN",
        chinese: "中文",

        // Summary stats cards
        totalMessages: "消息总数",
        activeUsers: "活跃用户",

        // Section headings
        topQuestions: "热门问题",
        summary: "摘要",
        languageSections: "语言频道",
        topMods: "管理员排行",
        topChatters: "活跃用户排行",
        allTimeTopMods: "历史管理员排行",
        mostEngagedPosts: "最热门帖子",

        // Activity chart headings
        hourlyActivity: "每小时活动",
        weeklyAvgHourlyActivity: "每周平均每小时活动",
        allTimeActivityByHour: "历史每小时活动",
        activityByHour: "按小时统计活动",
        weeklyPeakHours: "每周高峰时段（过去7天）",

        // Timeframe buttons
        today: "今天",
        oneWeek: "1周",
        allTime: "全部",

        // Chart labels
        allInUTC8: "均为UTC+8（新加坡时间）",

        // Loading / empty states
        loadingData: "加载数据中...",
        noDataAvailable: "所选日期无可用数据",
        noSummary: "该板块暂无摘要。",

        // Misc
        messages: "条消息",
        close: "关闭",
        dataCumulativeUntil: "数据截至",
        viewPostOnX: "在X上查看帖子",
        updated: "更新于",
    },
} as const

export type TranslationKey = keyof typeof translations.en
