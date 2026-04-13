// Translations for different languages
export type Lang = "en" | "zh" | "ja"

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
        allTimeTopMods: "All Time Top Mods",
        mostEngagedPosts: "Most Engaged Posts",

        // Activity chart headings
        hourlyActivity: "Hourly Activity",
        averageMessages: "Average Messages",
        weeklyAvgHourlyActivity: "Weekly Average Hourly Activity",
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
        dataCumulativeUntil: "Data cumulative until",
        viewPostOnX: "View Post on X",
        updated: "Updated",
        showingDataFrom: "Showing data from",
        todayDataNotAvailable: "(today's data not available yet)",
        failedToFetch: "Failed to fetch data",
        failedToFetchDiscord: "Failed to fetch Discord data",
        noDataForDate: "no data available for this date",
    },
    zh: {
        // Header
        communityAnalytics: "SoSoValue 社区",
        aiNotice: "“见解由 AI 根据有限的上下文和日志生成；可能会出现少量术语或表述不准确的情况。”",
        minimalActivityNotice: "该群组活跃度较低；情感见解可能不可靠，且未包含在内",
        usdNote: "所有USD计算均使用当前价格",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",
        weeklyReport: "7D 报告/建议",

        // Community selector
        sosovalue: "SoSoValue",
        sodex: "SoDEX",
        ssiIndex: "SSI 指数",

        // Language selector
        english: "EN",
        chinese: "中文",
        japanese: "日本語",

        // Summary stats cards
        totalMessages: "消息总数",
        activeUsers: "活跃用户",

        // Section headings
        topQuestions: "热门问题",
        summary: "摘要",
        category: "类别",
        languageSections: "语言频道",
        topMods: "管理员排行",
        topChatters: "活跃用户排行",
        allTimeTopMods: "历史管理员排行",
        mostEngagedPosts: "最热门帖子",

        // Activity chart headings
        hourlyActivity: "每小时活动",
        averageMessages: "平均消息数",
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
        teamSuggestions: "基于 7 天聊天日志的团队建议",
        actionPoint: "行动点",
        actionType: "行动类型",
        resolve: "解决",
        communicate: "沟通",
        discordReports: "Discord报告",
        retail: "散户",
        trading: "交易",
        tickets: "工单",
        dev: "开发",
        dataCumulativeUntil: "数据截至",
        viewPostOnX: "在X上查看帖子",
        updated: "更新于",
        showingDataFrom: "显示数据来自",
        todayDataNotAvailable: "（今日数据尚未可用）",
        failedToFetch: "获取数据失败",
        failedToFetchDiscord: "获取Discord数据失败",
        noDataForDate: "该日期尚无可用数据",
    },
    ja: {
        // Header
        communityAnalytics: "SoSoValue コミュニティ",
        aiNotice: "“インサイトは、限定されたコンテキストとログから AI によって生成されています。用語や表現に若干の不正確さが生じる場合があります。”",
        minimalActivityNotice: "このグループの活動は最小限です。センチメント分析は信頼性が低い可能性があるため、含まれていません",
        usdNote: "すべてのUSD計算は現在の価格を使用しています",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",
        weeklyReport: "7D レポート/提案",

        // Community selector
        sosovalue: "SoSoValue",
        sodex: "SoDEX",
        ssiIndex: "SSI 指数",

        // Language selector
        english: "EN",
        chinese: "中文",
        japanese: "日本語",

        // Summary stats cards
        totalMessages: "総メッセージ数",
        activeUsers: "アクティブユーザー",

        // Section headings
        topQuestions: "よくある質問",
        summary: "要約",
        category: "カテゴリー",
        languageSections: "言語セクション",
        topMods: "トップモデレーター",
        topChatters: "トップチャッター",
        allTimeTopMods: "歴代トップモデレーター",
        mostEngagedPosts: "最もエンゲージメントの高い投稿",

        // Activity chart headings
        hourlyActivity: "時間別活動",
        averageMessages: "平均メッセージ数",
        weeklyAvgHourlyActivity: "週平均時間別活動",
        allTimeActivityByHour: "全期間時間別活動",
        activityByHour: "時間別活動状況",
        weeklyPeakHours: "週刊ピークタイム（過去7日間）",

        // Timeframe buttons
        today: "今日",
        oneWeek: "1週間",
        allTime: "全期間",

        // Chart labels
        allInUTC8: "すべてUTC+8 (SGT)",

        // Loading / empty states
        loadingData: "データを読み込み中...",
        noDataAvailable: "選択された日付のデータはありません",
        noSummary: "このセクションの要約はありません。",

        // Misc
        messages: "メッセージ",
        close: "閉じる",
        teamSuggestions: "7日間のチャットログに基づくチームへの提案",
        actionPoint: "アクションポイント",
        actionType: "アクションタイプ",
        resolve: "解決する",
        communicate: "伝える",
        discordReports: "Discordレポート",
        retail: "リテール",
        trading: "取引",
        tickets: "チケット",
        dev: "開発",
        dataCumulativeUntil: "累積データ 終了日:",
        viewPostOnX: "Xで投稿を表示",
        updated: "更新日",
        showingDataFrom: "データ表示：",
        todayDataNotAvailable: "（本日のデータはまだ利用できません）",
        failedToFetch: "データの取得に失敗しました",
        failedToFetchDiscord: "Discordデータの取得に失敗しました",
        noDataForDate: "この日付のデータはまだ利用できません",
    },
} as const

export type TranslationKey = keyof typeof translations.en
