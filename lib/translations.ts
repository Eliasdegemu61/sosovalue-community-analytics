// Translations for different languages
export const translations = {
    en: {
        // Header
        communityAnalytics: "SoSoValue Community",
        aiNotice: "“Insights are AI generated from limited context and logs; minor terminology or phrasing inaccuracies may occur.”",
        minimalActivityNotice: "This group shows minimal activity; sentiment insights may not be reliable and are not included",
        usdNote: "all USD calculations use current prices",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",
        weeklyReport: "7D Report/Suggestion",

        // Community selector
        sosovalue: "SoSoValue",
        sodex: "SoDEX",
        ssiIndex: "SSI Index",

        // Language selector
        english: "EN",
        chinese: "中文",
        japanese: "日本語",

        // Summary stats cards
        totalMessages: "Total Messages",
        activeUsers: "Active Users",

        // Section headings
        topQuestions: "Top Questions",
        summary: "Summary",
        category: "Category",
        languageSections: "Language Sections",
        topMods: "Top Mods",
        topChatters: "Top Chatters",
        mostEngagedPosts: "Most Engaged Posts",

        // Activity chart headings
        hourlyActivity: "Hourly Activity",
        averageMessages: "Average Messages",
        weeklyAvgHourlyActivity: "Weekly Average Hourly Activity",
        activityByHour: "Activity By Hour",
        weeklyPeakHours: "Weekly Peak Hours (Past 7 Days)",

        // Timeframe buttons
        today: "Today",
        oneWeek: "1 Week",

        // Chart labels
        allInUTC8: "ALL IN UTC+8 (SGT)",

        // Loading / empty states
        loadingData: "Loading data...",
        noDataAvailable: "No data available for the selected date",
        noSummary: "No summary available for this section.",

        // Misc
        messages: "messages",
        close: "Close",
        teamSuggestions: "Team Suggestions based on 7 days chat logs",
        actionPoint: "Action Point",
        actionType: "Action Type",
        resolve: "Resolve",
        communicate: "Communicate",
        discordReports: "Discord Reports",
        retail: "Retail",
        trading: "Trading",
        tickets: "Tickets",
        dev: "Dev",
        viewPostOnX: "View Post on X",
        updated: "Updated",
        showingDataFrom: "Showing data from",
        todayDataNotAvailable: "(today's data not available yet)",
        failedToFetch: "Failed to fetch data",
        failedToFetchDiscord: "Failed to fetch Discord data",
        noDataForDate: "no data available for this date",
    },
} as const

export type TranslationKey = keyof typeof translations.en
