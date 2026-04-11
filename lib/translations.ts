// Translations for different languages
export type Lang = "en" | "zh" | "ja"

export const translations = {
    en: {
        // Header
        communityAnalytics: "Community Analytics",
        aiNotice: "contains AI generated insights based on limited context ,  minor terminology or phrasing inaccuracies may occur.",
        usdNote: "all USD calculations use current prices",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",
        weeklyReport: "Weekly Report",

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
        noDataForDate: "No data available for this date yet",
    },
    zh: {
        // Header
        communityAnalytics: "社区分析",
        aiNotice: "包含基于有限上下文的 AI 生成见解，可能会出现少量术语或表述不准确的情况。",
        usdNote: "所有USD计算均使用当前价格",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",
        weeklyReport: "周报",

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
        communityAnalytics: "コミュニティ分析",
        aiNotice: "限られた文脈に基づく AI 生成のインサイトが含まれており、用語や表現に若干の不正確さが生じる場合があります。",
        usdNote: "すべてのUSD計算は現在の価格を使用しています",

        // Platform tabs
        telegram: "Telegram",
        discord: "Discord",
        x: "X",
        weeklyReport: "週報",

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
        languageSections: "言語セクション",
        topMods: "トップモデレーター",
        topChatters: "トップチャッター",
        allTimeTopMods: "歴代トップモデレーター",
        mostEngagedPosts: "最もエンゲージメントの高い投稿",

        // Activity chart headings
        hourlyActivity: "時間別活動",
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
