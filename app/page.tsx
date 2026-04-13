"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { ChevronDown, RotateCw, ChevronLeft, ChevronRight, Moon, Sun, FileText } from "lucide-react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { translations, type Lang } from "@/lib/translations"

export const dynamic = "force-dynamic"

interface DashboardData {
  totals: {
    messages: number
    users: number
  }
  active_hours_sgt: Record<string, number>
  ai_analysis: string
  sections?: Array<{ name: string; msgs: number }>
  leaderboards: {
    community_users: Array<{ name: string; points: number }>
    moderators: Array<{ name: string; points: number }>
  }
}

export default function Dashboard() {
  const [platform, setPlatform] = useState<"telegram" | "discord" | "x" | "weekly">("weekly")
  const [xSection, setXSection] = useState<"SoSoValue" | "Sodex" | "SSI Index">("SoSoValue")
  const [discordSection, setDiscordSection] = useState<"retail" | "trading" | "tickets" | "dev">("retail")
  const [xData, setXData] = useState<any>(null)
  const [community, setCommunity] = useState("SOSOVALUE")
  const [showCommunityMenu, setShowCommunityMenu] = useState(false)
  const [date, setDate] = useState(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  })
  const [data, setData] = useState<DashboardData | null>(null)
  const [discordData, setDiscordData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previousDayData, setPreviousDayData] = useState<DashboardData | null>(null)
  const [previousDayDiscordData, setPreviousDayDiscordData] = useState<any>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [lang, setLang] = useState<Lang>("en")
  const t = (key: keyof typeof translations.en) => translations[lang][key]
  const isDarkMode = resolvedTheme === "dark"
  const [isPollingForToday, setIsPollingForToday] = useState<Record<string, boolean>>({
    SOSOVALUE: false,
    SODEX: false,
  })
  const [showLangMenu, setShowLangMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  const pollingIntervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({
    SOSOVALUE: null,
    SODEX: null,
  })
  const [weeklyData, setWeeklyData] = useState<Array<{ hour: string; count: number }> | null>(null)
  const [weeklyDiscordData, setWeeklyDiscordData] = useState<Array<{ hour: string; count: number }> | null>(null)
  const [cumulativeData, setCumulativeData] = useState<any>(null)
  const [cumulativeLoadingError, setCumulativeLoadingError] = useState<string | null>(null)
  const [cumulativeDiscordData, setCumulativeDiscordData] = useState<any>(null)
  const [cumulativeDiscordLoadingError, setCumulativeDiscordLoadingError] = useState<string | null>(null)
  const [translatedAnalysis, setTranslatedAnalysis] = useState<string | null>(null)
  const [translatedDiscordData, setTranslatedDiscordData] = useState<any>(null)
  const [translatedXData, setTranslatedXData] = useState<any>(null)
  const [weeklyReportData, setWeeklyReportData] = useState<any>(null)
  const [weeklySuggestions, setWeeklySuggestions] = useState<any>(null)
  const sessionCache = useRef<Record<string, any>>({})




  const fetchWithCache = async (url: string, usePersistence = true) => {
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    // 1. Check Session Cache (In-Memory)
    const sessionHit = sessionCache.current[url]
    if (sessionHit && sessionHit.timestamp && (Date.now() - sessionHit.timestamp < CACHE_DURATION)) {
      return sessionHit.data
    }

    // 2. Check LocalStorage (Persistence) for historical data
    if (usePersistence) {
      try {
        const cached = localStorage.getItem(`soso_cache_${url}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_DURATION)) {
            sessionCache.current[url] = parsed
            return parsed.data
          }
        }
      } catch (e) {
        console.warn("Cache read error", e)
      }
    }

    // 3. Fetch from Network
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    const cacheEntry = { data, timestamp: Date.now() }

    // 4. Update Caches
    sessionCache.current[url] = cacheEntry
    if (usePersistence) {
      try {
        localStorage.setItem(`soso_cache_${url}`, JSON.stringify(cacheEntry))
      } catch (e) {
        console.warn("Cache write error", e)
      }
    }

    return data
  }
  const communities = [
    { value: "SOSOVALUE", label: "SoSoValue" },
    { value: "SODEX", label: "SoDEX" },
  ]
  const [fallingGMs, setFallingGMs] = useState<any[]>([]); // Declare setFallingGMs variable
  const [timeframe, setTimeframe] = useState<"today" | "weekly">("today")

  useEffect(() => {
    let isMounted = true

    const fetchTranslation = async () => {
      if (lang === "en") {
        setTranslatedAnalysis(null)
        setTranslatedDiscordData(null)
        setTranslatedXData(null)
        return
      }

      const monthShort = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(date.getDate())
      const paddedDay = date.getDate().toString().padStart(2, '0')

      const datePrefix = `${monthShort}${day}`
      const datePrefixPadded = `${monthShort}${paddedDay}`
      const langDir = lang === "zh" ? "Chinese" : "Japanese"

      try {
        if (platform === "telegram") {
          const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/translations/${datePrefix}_Translations/${community}/${langDir}/${datePrefix}_processed.json`
          const json = await fetchWithCache(url, true)
          if (isMounted) {
            setTranslatedAnalysis(json?.ai_analysis || null)
          }
        } else if (platform === "discord") {
          const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/translations/${datePrefix}_Translations/DISCORD/${langDir}/${datePrefix}.json`
          const json = await fetchWithCache(url, true)
          if (isMounted) {
            setTranslatedDiscordData(json || null)
          }
        } else if (platform === "x") {
          const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/translations/${datePrefix}_Translations/X_ANALYSIS/${langDir}/${datePrefixPadded}.json`
          const json = await fetchWithCache(url, true)
          if (isMounted) {
            setTranslatedXData(json || null)
          }
        }
      } catch (error) {
        console.warn(`[v0] Failed to fetch translation for ${platform}:`, error)
        if (isMounted) {
          if (platform === "telegram") setTranslatedAnalysis(null)
          if (platform === "discord") setTranslatedDiscordData(null)
          if (platform === "x") setTranslatedXData(null)
        }
      }
    }

    fetchTranslation()

    return () => { isMounted = false }
  }, [lang, platform, community, date])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const monthShort = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(date.getDate())
      const fileName = `${monthShort}${day}_processed.json`
      // Only use cache-buster for today's dynamic data
      const isToday = date.toDateString() === new Date().toDateString()
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${fileName}${isToday ? `?t=${Date.now()}` : ""}`

      try {
        const json = await fetchWithCache(url, !isToday)
        setData(json)
        setLastUpdated(new Date())
        fetchPreviousDayData(community, date)
      } catch (error) {
        const isTodayOrFuture = date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)

        if (isTodayOrFuture) {
          console.log(`[v0] Today's data not available, attempting fallback for ${community}`)
          const previousDay = new Date(date)
          previousDay.setDate(previousDay.getDate() - 1)
          const prevMonthShort = previousDay.toLocaleString("en-US", { month: "short" }).toLowerCase()
          const prevDay = String(previousDay.getDate())
          const prevFileName = `${prevMonthShort}${prevDay}_processed.json`
          const prevUrl = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${prevFileName}`

          try {
            const json = await fetchWithCache(prevUrl, true)
            setData(json)
            setLastUpdated(new Date())
            setError(`${t("showingDataFrom")} ${previousDay.toDateString()} ${t("todayDataNotAvailable")}`)
            fetchPreviousDayData(community, previousDay)
            return
          } catch (fallbackError) {
            // Fall through to no data available
          }
        }

        setError(t("noDataForDate"))
        setData(null)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t("failedToFetch"))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayData = async (comm: string) => {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const monthShort = yesterday.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(yesterday.getDate())
      const fileName = `${monthShort}${day}_processed.json`
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${comm}/${fileName}?t=${Date.now()}`

      console.log(`[v0] [${comm}] Polling attempt at ${new Date().toLocaleTimeString()}: Checking for ${fileName}`)

      const response = await fetch(url)
      if (response.ok) {
        console.log(`[v0] [${comm}] SUCCESS! Data for ${fileName} is now available. Stopping polling.`)
        if (pollingIntervalsRef.current[comm]) {
          clearInterval(pollingIntervalsRef.current[comm]!)
          pollingIntervalsRef.current[comm] = null
        }
        setIsPollingForToday((prev) => ({ ...prev, [comm]: false }))
        return true
      }
      console.log(
        `[v0] [${comm}] Data not available yet (${response.status}). Will retry in 30 minutes at ${new Date(Date.now() + 1800000).toLocaleTimeString()}`,
      )
      return false
    } catch (error) {
      console.log(
        `[v0] [${community}] Polling error: ${error instanceof Error ? error.message : "Unknown error"}. Will retry in 30 minutes.`,
      )
      return false
    }
  }

  const fetchPreviousDayData = async (comm: string, selectedDate: Date) => {
    try {
      const previousDay = new Date(selectedDate)
      previousDay.setDate(previousDay.getDate() - 1)
      const monthShort = previousDay.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(previousDay.getDate())
      const fileName = `${monthShort}${day}_processed.json`
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${comm}/${fileName}`

      const json = await fetchWithCache(url, true)
      setPreviousDayData(json)
    } catch (error) {
      setPreviousDayData(null)
    }
  }

  const fetchDiscordData = async () => {
    setLoading(true)
    setError(null)
    try {
      const monthShort = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(date.getDate())
      const fileName = `${monthShort}${day}data.json`
      const isToday = date.toDateString() === new Date().toDateString()
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${fileName}${isToday ? `?t=${Date.now()}` : ""}`

      console.log("[v0] Discord fetch attempting:", url)
      try {
        const json = await fetchWithCache(url, !isToday)
        console.log("[v0] Discord data loaded:", json)
        setDiscordData(json)
        setLastUpdated(new Date())
        fetchPreviousDayDiscordData(date)
      } catch (error) {
        const isTodayOrFuture = date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)

        if (isTodayOrFuture) {
          console.log("[v0] Discord: Current date not available, trying fallback")
          const previousDay = new Date(date)
          previousDay.setDate(previousDay.getDate() - 1)
          const prevMonthShort = previousDay.toLocaleString("en-US", { month: "short" }).toLowerCase()
          const prevDay = String(previousDay.getDate())
          const prevFileName = `${prevMonthShort}${prevDay}data.json`
          const prevUrl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${prevFileName}`

          try {
            const json = await fetchWithCache(prevUrl, true)
            setDiscordData(json)
            setLastUpdated(new Date())
            setError(`${t("showingDataFrom")} ${previousDay.toDateString()} ${t("todayDataNotAvailable")}`)
            fetchPreviousDayDiscordData(previousDay)
            return
          } catch (fallbackError) {
            // Fall through
          }
        }

        setError(t("noDataForDate"))
        setDiscordData(null)
      }
    } catch (error) {
      console.log("[v0] Discord fetch error:", error)
      setError(error instanceof Error ? error.message : t("failedToFetchDiscord"))
      setDiscordData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreviousDayDiscordData = async (selectedDate: Date) => {
    try {
      const previousDay = new Date(selectedDate)
      previousDay.setDate(previousDay.getDate() - 1)
      const monthShort = previousDay.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(previousDay.getDate())
      const fileName = `${monthShort}${day}data.json`
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${fileName}`

      const json = await fetchWithCache(url, true)
      setPreviousDayDiscordData(json)
    } catch (error) {
      setPreviousDayDiscordData(null)
    }
  }

  const fetchWeeklyData = async () => {
    try {
      const fetchPromises = Array.from({ length: 7 }, (_, i) => {
        const dayDate = new Date(date)
        dayDate.setDate(dayDate.getDate() - i)

        const monthShort = dayDate.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const day = String(dayDate.getDate())
        const fileName = `${monthShort}${day}_processed.json`
        const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${fileName}`

        return fetchWithCache(url, true).catch(() => null)
      })

      const results = await Promise.all(fetchPromises)
      const validResultsCount = results.filter((r) => r !== null).length

      const weeklyHours: Record<string, number> = {}
      results.forEach((json) => {
        if (json) {
          const hourlyData = json.active_hours_sgt || {}
          for (const [hour, count] of Object.entries(hourlyData)) {
            weeklyHours[hour] = (weeklyHours[hour] || 0) + (count as number)
          }
        }
      })

      const hourLabels = [
        "12 AM", "01 AM", "02 AM", "03 AM", "04 AM", "05 AM",
        "06 AM", "07 AM", "08 AM", "09 AM", "10 AM", "11 AM",
        "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM",
        "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM",
      ]

      const chartData = hourLabels.map((hour) => ({
        hour,
        count: validResultsCount > 0 ? Math.round((weeklyHours[hour] || 0) / validResultsCount) : 0,
      }))

      setWeeklyData(chartData.length > 0 ? chartData : [])
    } catch (error) {
      console.error("[v0] Error fetching weekly data:", error)
      setWeeklyData([])
    }
  }

  const fetchWeeklyDiscordData = async () => {
    try {
      const fetchPromises = Array.from({ length: 7 }, (_, i) => {
        const dayDate = new Date(date)
        dayDate.setDate(dayDate.getDate() - i)

        const monthShort = dayDate.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const day = String(dayDate.getDate())
        const fileName = `${monthShort}${day}data.json`
        const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${fileName}`

        return fetchWithCache(url, true).catch(() => null)
      })

      const results = await Promise.all(fetchPromises)
      const validResultsCount = results.filter((r) => r !== null).length

      const weeklyHours: Record<string, number> = {}
      results.forEach((json) => {
        if (json && json.hourly_activity) {
          for (const [hour, count] of Object.entries(json.hourly_activity)) {
            weeklyHours[hour] = (weeklyHours[hour] || 0) + (count as number)
          }
        }
      })

      const hourLabels = [
        "12 AM", "01 AM", "02 AM", "03 AM", "04 AM", "05 AM",
        "06 AM", "07 AM", "08 AM", "09 AM", "10 AM", "11 AM",
        "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM",
        "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM",
      ]

      const chartData = hourLabels.map((hour) => ({
        hour,
        count: validResultsCount > 0 ? Math.round((weeklyHours[hour] || 0) / validResultsCount) : 0,
      }))

      setWeeklyDiscordData(chartData.length > 0 ? chartData : [])
    } catch (error) {
      console.error("[v0] Error fetching Discord weekly data:", error)
      setWeeklyDiscordData([])
    }
  }

  const fetchCumulativeData = async () => {
    try {
      setCumulativeLoadingError(null)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const monthShort = yesterday.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const dayNum = String(yesterday.getDate()).padStart(2, "0").replace(/^0/, "")
      const fileName = `${monthShort}${dayNum}cumm.json`

      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${fileName}`
      console.log("[v0] Fetching cumulative data from:", url)
      const json = await fetchWithCache(url, true)
      console.log("[v0] Cumulative data loaded:", json)
      setCumulativeData(json)
    } catch (error) {
      console.log("[v0] Error fetching cumulative data:", error)
      setCumulativeLoadingError(error instanceof Error ? error.message : "Failed to fetch cumulative data")
      setCumulativeData(null)
    }
  }

  const fetchCumulativeDiscordData = async () => {
    try {
      setCumulativeDiscordLoadingError(null)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const monthShort = yesterday.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const dayNum = String(yesterday.getDate()).padStart(2, "0").replace(/^0/, "")
      const fileName = `${monthShort}${dayNum}cumm.json`

      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/DISCORD/${fileName}`
      console.log("[v0] Fetching Discord cumulative data from:", url)
      const json = await fetchWithCache(url, true)
      console.log("[v0] Discord cumulative data loaded:", json)
      setCumulativeDiscordData(json)
    } catch (error) {
      console.log("[v0] Error fetching Discord cumulative data:", error)
      setCumulativeDiscordLoadingError(error instanceof Error ? error.message : "Failed to fetch cumulative data")
      setCumulativeDiscordData(null)
    }
  }

  const fetchXData = async () => {
    setLoading(true)
    setError(null)
    try {
      const monthShort = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(date.getDate()).padStart(2, '0')
      const fileName = `${monthShort}${day}.json`
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/soso-x-analysis/main/${fileName}`

      const json = await fetchWithCache(url, true)
      setXData(json)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("[v0] X fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch X analysis data")
      setXData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklyReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const monthShort = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(date.getDate())
      const fileName = `weekly${monthShort}${day}.json`
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/${fileName}`

      console.log("[v0] Weekly report fetch attempting:", url)
      const json = await fetchWithCache(url, true)
      console.log("[v0] Weekly report data loaded:", json)
      setWeeklyReportData(json)
      setLastUpdated(new Date())
    } catch (error) {
      const isTodayOrFuture = date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)

      if (isTodayOrFuture) {
        console.log("[v0] Weekly report: Current date not found, attempting fallback")
        const previousDay = new Date(date)
        previousDay.setDate(previousDay.getDate() - 1)
        const prevMonthShort = previousDay.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const prevDay = String(previousDay.getDate())
        const prevFileName = `weekly${prevMonthShort}${prevDay}.json`
        const prevUrl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/${prevFileName}`

        try {
          const json = await fetchWithCache(prevUrl, true)
          setWeeklyReportData(json)
          setLastUpdated(new Date())
          setError(`${t("showingDataFrom")} ${previousDay.toDateString()} ${t("todayDataNotAvailable")}`)
          return
        } catch (fallbackError) {
          // Fall through
        }
      }

      setError(t("noDataForDate"))
      setWeeklyReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklySuggestions = async () => {
    try {
      const monthShort = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(date.getDate())
      const fileName = `segg${monthShort}${day}.json`
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly_suggestions/${fileName}`

      console.log("[v0] Weekly suggestions fetch attempting:", url)
      const json = await fetchWithCache(url, true)
      console.log("[v0] Weekly suggestions data loaded:", json)
      setWeeklySuggestions(json)
    } catch (error) {
      const isTodayOrFuture = date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)

      if (isTodayOrFuture) {
        console.log("[v0] Weekly suggestions: Current date not found, attempting fallback")
        const previousDay = new Date(date)
        previousDay.setDate(previousDay.getDate() - 1)
        const prevMonthShort = previousDay.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const prevDay = String(previousDay.getDate())
        const prevFileName = `segg${prevMonthShort}${prevDay}.json`
        const prevUrl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly_suggestions/${prevFileName}`

        try {
          const json = await fetchWithCache(prevUrl, true)
          setWeeklySuggestions(json)
          return
        } catch (fallbackError) {
          // Fall through
        }
      }

      setWeeklySuggestions(null)
    }
  }

  useEffect(() => {
    if (platform === "telegram") {
      fetchData()
      fetchWeeklyData()
      fetchCumulativeData()
      const interval = setInterval(fetchData, 3600000)
      return () => clearInterval(interval)
    } else if (platform === "discord") {
      fetchDiscordData()
      fetchWeeklyDiscordData()
      fetchCumulativeDiscordData()
      const interval = setInterval(fetchDiscordData, 3600000)
      return () => clearInterval(interval)
    } else if (platform === "x") {
      fetchXData()
      const interval = setInterval(fetchXData, 3600000)
      return () => clearInterval(interval)
    } else if (platform === "weekly") {
      fetchWeeklyReport()
      fetchWeeklySuggestions()
      const interval = setInterval(() => {
        fetchWeeklyReport()
        fetchWeeklySuggestions()
      }, 3600000)
      return () => clearInterval(interval)
    }
  }, [platform, community, date])

  useEffect(() => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday || isPollingForToday[community]) {
      return
    }

    console.log(`[v0] [${community}] Starting polling for yesterday's data`)
    setIsPollingForToday((prev) => ({ ...prev, [community]: true }))

    fetchTodayData(community)

    const interval = setInterval(() => {
      fetchTodayData(community)
    }, 1800000)

    pollingIntervalsRef.current[community] = interval

    return () => {
      if (pollingIntervalsRef.current[community]) {
        clearInterval(pollingIntervalsRef.current[community]!)
        pollingIntervalsRef.current[community] = null
      }
    }
  }, [community])

  const chartData = data
    ? Object.entries(data.active_hours_sgt).map(([hour, count]) => ({
      hour,
      count: count as number,
    }))
    : []

  const parseAnalysis = (analysis: string) => {
    const summaryMatch = analysis.match(/(?:Summary:|摘要：|概要：|要約：)\s*([\s\S]+?)(?=(?:Top Community Questions:|社区热门问题：|热门社区问题：|顶级社区问题：|コミュニティの主な質問：|トップコミュニティ質問:|$))/i);
    let summary = summaryMatch ? summaryMatch[1].trim() : ""

    summary = summary.replace("ome users are threatening to report the project to regulatory authorities.", "")
    summary = summary.trim()

    const questionsMatch = analysis.match(/(?:Top Community Questions:|社区热门问题：|热门社区问题：|顶级社区问题：|コミュニティの主な質問：|トップコミュニティ質問:)\s*([\s\S]+?)$/i);

    return {
      summary,
      questions: questionsMatch
        ? questionsMatch[1]
          .split("\n")
          .filter((q) => q.trim())
          .map((q) => q.replace(/^\d+\.\s*/, ""))
          .map((q) => q.replace(/^[-•]\s*/, ""))
        : [],
    }
  }

  const analysis = data ? parseAnalysis(data.ai_analysis) : null

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth)
    const firstDay = getFirstDayOfMonth(calendarMonth)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i))
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const isDateSelected = (day: Date | null) => {
    if (!day) return false
    return day.toDateString() === date.toDateString()
  }

  const handleDateSelect = (day: Date) => {
    setDate(day)
    setShowCalendar(false)
  }

  const previousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const ComparisonBadge = ({ current, previous }: { current: number; previous: number }) => {
    if (!previous) return null
    const change = current - previous
    const percentage = calculateChange(current, previous)
    const isPositive = change >= 0

    return (
      <div
        className={`text-sm font-sans mt-2 ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
      >
        <span>
          {isPositive ? "+" : ""}
          {change.toLocaleString()}
        </span>
        <span className="ml-2">
          ({isPositive ? "+" : ""}
          {percentage.toFixed(1)}%)
        </span>
      </div>
    )
  }

  const formatHourTick = (tick: string | number) => {
    const tickStr = String(tick).trim().toLowerCase()

    if (tickStr.includes("am") || tickStr.includes("pm")) {
      const hr = tickStr.replace(/(am|pm|\s)/g, '')
      const ampm = tickStr.includes("pm") ? "pm" : "am"
      const parsedHr = parseInt(hr, 10)
      return isNaN(parsedHr) ? tickStr : `${parsedHr}${ampm}`
    }

    let hourNumStr = tickStr
    if (tickStr.includes(':')) {
      hourNumStr = tickStr.split(':')[0]
    }
    const hour = parseInt(hourNumStr, 10)
    if (isNaN(hour)) return tickStr

    const ampm = hour >= 12 ? 'pm' : 'am'
    let stdHour = hour % 12
    if (stdHour === 0) stdHour = 12

    return `${stdHour}${ampm}`
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      className={`min-h-screen bg-background p-6 sm:p-10 font-serif transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-16 flex justify-between items-start gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <img src="https://sosovalue.com/img/192x192.png" alt="SoSoValue" className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg flex-shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{t("communityAnalytics")}</h1>
                <span className="px-2 py-0.5 mt-1 sm:mt-2 text-[10px] font-sans font-bold bg-accent/10 text-accent border border-accent/20 rounded-full">v2.0</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 opacity-80 italic font-sans leading-tight max-w-2xl">
                {t("aiNotice")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-sm hover:border-accent/50 transition-all duration-200 text-xs font-sans font-semibold text-foreground uppercase tracking-wider"
              >
                <span>{lang === "en" ? "English" : lang === "zh" ? "中文" : "日本語"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLangMenu ? "rotate-180" : ""}`} />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={() => { setLang("en"); setShowLangMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-sans font-medium transition-colors ${lang === "en" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLang("zh"); setShowLangMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-sans font-medium transition-colors ${lang === "zh" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => { setLang("ja"); setShowLangMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-sans font-medium transition-colors ${lang === "ja" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  >
                    日本語
                  </button>
                </div>
              )}
            </div>
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 sm:p-3 rounded-lg hover:bg-secondary transition-all duration-200 text-foreground shadow-sm hover:shadow-md"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 mb-6">
          <div className="flex flex-row flex-wrap gap-2 sm:gap-2">
            <button
              onClick={() => setPlatform("telegram")}
              className={`px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start ${platform === "telegram"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-accent"
                }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.336-.373-.123l-6.871 4.326-2.962-.924c-.643-.204-.658-.643.135-.953l11.566-4.461c.538-.196 1.006.128.832.941z" />
              </svg>
              <span>{t("telegram")}</span>
            </button>
            <button
              onClick={() => setPlatform("discord")}
              className={`px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start ${platform === "discord"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-accent"
                }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.396-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.294.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.098.246.198.373.295a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.041.107c.359.698.77 1.364 1.225 1.994a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-4.718-.838-8.812-3.549-12.44a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.964-2.157 2.157-2.157 1.193 0 2.157.964 2.157 2.157 0 1.191-.964 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.964-2.157 2.157-2.157 1.193 0 2.157.964 2.157 2.157 0 1.191-.964 2.156-2.157 2.156z" />
              </svg>
              <span>{t("discord")}</span>
            </button>
            <button
              onClick={() => setPlatform("x")}
              className={`px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start ${platform === "x"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-accent"
                }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
              </svg>
              <span>{t("x")}</span>
            </button>
            <button
              onClick={() => setPlatform("weekly")}
              className={`px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 w-full sm:w-auto sm:flex-none justify-center sm:justify-start ${platform === "weekly"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-accent"
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t("weeklyReport")}</span>
            </button>
          </div>

          {platform === "x" && (
            <div className="flex flex-wrap gap-2">
              {(["SoSoValue", "Sodex", "SSI Index"] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setXSection(section)}
                  className={`px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-medium transition-all duration-200 ${xSection === section
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-card border border-border text-foreground hover:border-accent"
                    }`}
                >
                  {section}
                </button>
              ))}
            </div>
          )}

          {platform === "telegram" && (
            <div className="flex gap-2 w-full">
              {communities.map((comm) => (
                <button
                  key={comm.value}
                  onClick={() => setCommunity(comm.value)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-medium transition-all duration-200 ${community === comm.value
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-card border border-border text-foreground hover:border-accent"
                    }`}
                >
                  {comm.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full sm:w-auto bg-card border border-border rounded-lg px-4 py-2 text-foreground font-sans flex items-center justify-between sm:justify-start gap-2 hover:border-accent hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
              >
                <span>{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showCalendar ? "rotate-180" : ""}`}
                />
              </button>

              {showCalendar && (
                <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-lg shadow-xl p-4 sm:p-5 z-50 w-[calc(100vw-3rem)] sm:w-80">
                  <div className="flex items-center justify-between mb-5">
                    <button
                      onClick={previousMonth}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors duration-150"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-semibold text-foreground text-sm">
                      {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h3>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors duration-150"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-3">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => day && handleDateSelect(day)}
                        disabled={!day}
                        className={`aspect-square rounded-lg text-sm font-sans transition-all duration-150 ${!day
                          ? "bg-transparent cursor-default"
                          : isDateSelected(day)
                            ? "bg-accent text-accent-foreground font-bold shadow-md"
                            : day > new Date()
                              ? "text-muted-foreground cursor-not-allowed bg-background"
                              : "hover:bg-secondary text-foreground cursor-pointer hover:shadow-sm"
                          }`}
                      >
                        {day?.getDate()}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowCalendar(false)}
                    className="w-full mt-5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 font-sans rounded-lg hover:bg-secondary"
                  >
                    {t("close")}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => (platform === "telegram" ? fetchData() : fetchDiscordData())}
              disabled={loading}
              className={`p-2 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${loading
                ? "text-accent/60 cursor-not-allowed opacity-75"
                : "text-accent hover:bg-secondary"
                }`}
              aria-label="Refresh data"
            >
              <RotateCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 sm:mt-0">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground italic block w-full sm:w-auto">{t("updated")} {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            {error.includes("404") ? t("noDataForDate") : error}
          </div>
        )}

        {platform === "telegram" && community === "SODEX" && (
          <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm italic font-sans shadow-sm">
            {t("minimalActivityNotice")}
          </div>
        )}

        {loading && !(data || discordData) ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t("loadingData")}</p>
          </div>
        ) : (data && platform === "telegram") || (discordData && platform === "discord") || (xData && platform === "x") || (weeklyReportData && platform === "weekly") ? (
          <div className="space-y-10">
            {platform === "discord" && discordData && (
              <>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-card border border-border rounded-lg px-4 py-2.5 hover:border-accent/50 transition-all duration-200 flex items-center gap-4">
                    <div className="flex flex-col">
                      <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">{t("totalMessages")}</p>
                      <div className="text-base sm:text-lg font-bold text-accent leading-none">
                        {discordData.vitals?.total_messages?.toLocaleString() || 0}
                      </div>
                    </div>
                    <ComparisonBadge current={discordData.vitals?.total_messages || 0} previous={previousDayDiscordData?.vitals?.total_messages || 0} />
                  </div>
                  <div className="bg-card border border-border rounded-lg px-4 py-2.5 hover:border-accent/50 transition-all duration-200 flex items-center gap-4">
                    <div className="flex flex-col">
                      <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">{t("activeUsers")}</p>
                      <div className="text-base sm:text-lg font-bold text-accent leading-none">
                        {discordData.vitals?.active_users?.toLocaleString() || 0}
                      </div>
                    </div>
                    <ComparisonBadge current={discordData.vitals?.active_users || 0} previous={previousDayDiscordData?.vitals?.active_users || 0} />
                  </div>
                </div>

                {discordData?.reports ? (
                  <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-foreground">{t("summary")} - {t(discordSection as keyof typeof translations.en)}</h2>
                        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                          {(["retail", "trading", "tickets", "dev"] as const).map((section) => (
                            <button
                              key={section}
                              onClick={() => setDiscordSection(section)}
                              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-sans font-semibold transition-all duration-300 ${discordSection === section
                                ? `bg-card shadow-sm ring-1 ring-border/50 scale-[1.05] ${section === "retail" ? "text-emerald-500" :
                                  section === "trading" ? "text-amber-500" :
                                    section === "tickets" ? "text-blue-500" :
                                      "text-purple-500"
                                }`
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                }`}
                            >
                              {t(section as keyof typeof translations.en)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {(translatedDiscordData?.reports?.[discordSection]?.summary || discordData.reports[discordSection]?.summary || t("noSummary"))}
                      </p>
                    </div>

                    {(translatedDiscordData?.reports?.[discordSection]?.questions || discordData.reports[discordSection]?.questions)?.length > 0 && (
                      <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                        <h2 className="text-xl font-bold text-foreground mb-6">{t("topQuestions")} - {t(discordSection as keyof typeof translations.en)}</h2>
                        <ol className="space-y-4">
                          {(translatedDiscordData?.reports?.[discordSection]?.questions || discordData.reports[discordSection]?.questions).map((question: string, i: number) => (
                            <li key={i} className="text-sm text-foreground leading-relaxed">
                              <span className="font-bold text-accent">{i + 1}.</span> {question}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ) : null}

                {discordData?.hourly_activity && (
                  <div className="bg-card rounded-xl p-8 sm:p-10 hover:shadow-lg transition-all duration-200 sketchbook-paper">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                      <h2 className="text-2xl font-bold text-foreground capitalize">
                        {timeframe === "today" ? t("hourlyActivity") : t("weeklyAvgHourlyActivity")}
                      </h2>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
                        <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-[0.2em] opacity-70">{t("allInUTC8")} </span>
                        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                          {(['today', 'weekly'] as const).map((tf) => (
                            <button
                              key={tf}
                              onClick={() => setTimeframe(tf)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all duration-300 ${timeframe === tf
                                ? "bg-card text-accent shadow-lg ring-1 ring-border/50 scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                }`}
                            >
                              {tf === 'today' ? t("today") : t("oneWeek")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart
                        data={
                          timeframe === "today"
                            ? Object.entries(discordData.hourly_activity).map(([hour, count]) => ({
                              hour,
                              count: count as number,
                            }))
                            : (weeklyDiscordData || [])
                        }
                      >
                        <defs>
                          <linearGradient id="colorDiscord" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis
                          dataKey="hour"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={formatHourTick}
                          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                          interval={window.innerWidth < 640 ? 3 : 1}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                        <Tooltip
                          labelClassName="font-sans font-bold text-foreground"
                          formatter={(value: any) => [value, timeframe === "weekly" ? t("averageMessages") : t("messages")]}
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="var(--accent)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorDiscord)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}



              </>
            )}
            {platform === "telegram" && data && (
              <div className="flex flex-wrap gap-3">
                <div className="bg-card border border-border rounded-lg px-4 py-2.5 hover:border-accent/50 transition-all duration-200 flex items-center gap-4">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">{t("totalMessages")}</p>
                    <div className="text-base sm:text-lg font-bold text-accent leading-none">
                      {data.totals?.messages?.toLocaleString() || 0}
                    </div>
                  </div>
                  <ComparisonBadge current={data.totals?.messages || 0} previous={previousDayData?.totals?.messages || 0} />
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-2.5 hover:border-accent/50 transition-all duration-200 flex items-center gap-4">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">{t("activeUsers")}</p>
                    <div className="text-base sm:text-lg font-bold text-accent leading-none">
                      {data.totals?.users?.toLocaleString() || 0}
                    </div>
                  </div>
                  <ComparisonBadge current={data.totals?.users || 0} previous={previousDayData?.totals?.users || 0} />
                </div>
              </div>
            )}


            {platform === "telegram" && data && (


              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                  <h2 className="text-xl font-bold text-foreground mb-6">{t("topQuestions")}</h2>
                  <ol className="space-y-4">
                    {parseAnalysis(translatedAnalysis || data.ai_analysis).questions.slice(0, 3).map((q: string) => q.replace(/^\d+\.\s*/, "")).map((question: string, i: number) => (
                      <li key={i} className="text-sm text-foreground leading-relaxed">
                        <span className="font-bold text-accent">{i + 1}.</span> {question}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                  <h2 className="text-xl font-bold text-foreground mb-6">{t("summary")}</h2>
                  <p className="text-foreground leading-relaxed text-base">
                    {parseAnalysis(translatedAnalysis || data.ai_analysis).summary}
                  </p>
                </div>
              </div>
            )}

            {platform === "telegram" && data && (
              <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <h2 className="text-2xl font-bold text-foreground capitalize">
                    {timeframe === "today" ? t("activityByHour") : t("weeklyAvgHourlyActivity")}
                  </h2>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
                    <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-[0.2em] opacity-70">{t("allInUTC8")} </span>
                    <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                      {(['today', 'weekly'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all duration-300 ${timeframe === tf
                            ? "bg-card text-accent shadow-lg ring-1 ring-border/50 scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            }`}
                        >
                          {tf === 'today' ? t("today") : t("oneWeek")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={
                      timeframe === "today"
                        ? Object.entries(data.active_hours_sgt).map(([hour, count]) => ({
                          hour,
                          count: count as number,
                        }))
                        : (weeklyData || [])
                    }
                  >
                    <defs>
                      <linearGradient id="colorTelegram" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatHourTick}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      interval={window.innerWidth < 640 ? 3 : 1}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <Tooltip
                      labelClassName="font-sans font-bold text-foreground"
                      formatter={(value: any) => [value, timeframe === "weekly" ? t("averageMessages") : t("messages")]}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--accent)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTelegram)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {platform === "telegram" && data && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.sections && (
                    <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                      <h2 className="text-xl font-bold text-foreground mb-6">{t("languageSections")}</h2>
                      <div className="space-y-3 text-sm">
                        {data.sections.slice(0, community === "SOSOVALUE" ? 5 : data.sections.length).map((section: any) => (
                          <div key={section.name} className="flex justify-between items-center">
                            <span className="text-foreground">{section.name}</span>
                            <span className="font-bold text-accent">{section.msgs}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.leaderboards?.moderators && data.leaderboards.moderators.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-foreground">{t("topMods")}</h2>
                        <span className="text-xs text-muted-foreground font-sans">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <ol className="space-y-3">
                        {data.leaderboards.moderators.slice(0, 10).map((mod: any, i: number) => (
                          <li key={i} className="text-sm text-foreground">
                            <span className="font-bold text-accent">{i + 1}.</span> {mod.name} - {mod.count} {t("messages")}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {data.leaderboards?.community_users && data.leaderboards.community_users.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-foreground">{t("topChatters")}</h2>
                        <span className="text-xs text-muted-foreground font-sans">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <ol className="space-y-3">
                        {data.leaderboards.community_users.slice(0, 10).map((user: any, i: number) => (
                          <li key={i} className="text-sm text-foreground">
                            <span className="font-bold text-accent">{i + 1}.</span> {user.name} - {user.count} {t("messages")}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {cumulativeData && (
                  <>

                    {cumulativeData.top_moderators && cumulativeData.top_moderators.length > 0 && (
                      <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                        <h2 className="text-xl font-bold text-foreground mb-6">{t("allTimeTopMods")}</h2>
                        <ol className="space-y-3">
                          {cumulativeData.top_moderators.map((mod: any, i: number) => (
                            <li key={i} className="text-sm text-foreground">
                              <span className="font-bold text-accent">{i + 1}.</span> {mod.name} - {mod.messages} {t("messages")}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {platform === "x" && xData ? (
              <div className="space-y-10">
                {(() => {
                  const mappedKey = xSection === "SoSoValue" ? "sosovalue" : xSection === "Sodex" ? "sodex" : "ssi";
                  return (
                    <>
                      {/* Section Specific Summary Card */}
                      <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                          <h2 className="text-xl font-bold text-foreground">{t("summary")} - {xSection === "SoSoValue" ? t("sosovalue") : xSection === "Sodex" ? t("sodex") : t("ssiIndex")}</h2>
                          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                            {(["SoSoValue", "Sodex", "SSI Index"] as const).map((section) => (
                              <button
                                key={section}
                                onClick={() => setXSection(section)}
                                className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-sans font-semibold transition-all duration-300 ${xSection === section
                                  ? "bg-card text-accent shadow-sm ring-1 ring-border/50 scale-[1.02]"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                  }`}
                              >
                                {section === "SoSoValue" ? t("sosovalue") : section === "Sodex" ? t("sodex") : t("ssiIndex")}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {(translatedXData?.summary?.[mappedKey] || xData.summary?.[mappedKey] || t("noSummary"))}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Questions for Section */}
                        <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                          <h2 className="text-xl font-bold text-foreground mb-6">{t("topQuestions")} - {xSection === "SoSoValue" ? t("sosovalue") : xSection === "Sodex" ? t("sodex") : t("ssiIndex")}</h2>
                          <ol className="space-y-4">
                            {(translatedXData?.top_questions?.[mappedKey] || xData.top_questions?.[mappedKey] || []).map((question: string, i: number) => (
                              <li key={i} className="text-sm text-foreground leading-relaxed">
                                <span className="font-bold text-accent">{i + 1}.</span> {question}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Engaged Posts */}
                        <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                          <h2 className="text-xl font-bold text-foreground mb-6">{t("mostEngagedPosts")}</h2>
                          <div className="space-y-4">
                            {(xData["Top post_links on that date with the highest engagement, atleast 3 posts"] || xData.post_links || []).map((link: string, i: number) => {
                              let href: string = link;
                              let displayText: string = t("viewPostOnX" as any) as string;

                              // Handle markdown link format: [text](url)
                              const mdMatch = link.match(/\[(.*?)\]\((.*?)\)/);
                              if (mdMatch) {
                                displayText = mdMatch[1];
                                href = mdMatch[2];
                              } else {
                                // Handle raw URL optionally followed by (text)
                                const urlMatch = link.match(/^(https?:\/\/[^\s]+)/);
                                const textMatch = link.match(/\((.*?)\)/);
                                if (urlMatch) href = urlMatch[1];
                                if (textMatch) displayText = textMatch[1];
                              }

                              return (
                                <a
                                  key={i}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/50 transition-all duration-200 group"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-foreground group-hover:text-accent truncate">
                                      {displayText}
                                    </span>
                                    <svg className="w-4 h-4 text-muted-foreground group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1 truncate">{href}</p>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}

            {platform === "weekly" && (
              <div className="space-y-6">
                {weeklySuggestions && weeklySuggestions.team_suggestions && weeklySuggestions.team_suggestions.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                    <div className="flex flex-col gap-1 mb-8">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        {t("teamSuggestions")}
                      </h2>
                      <p className="text-xs text-muted-foreground font-sans font-medium">
                        {(() => {
                          const start = new Date(date)
                          start.setDate(start.getDate() - 6)
                          const format = (d: Date) => d.toLocaleDateString(lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "ja-JP", { month: lang === "en" ? "long" : "short", day: "numeric" })
                          return `${format(start)} - ${format(date)}`
                        })()}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border/50">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-bottom border-border/50">
                            <th className="px-6 py-4 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("category")}</th>
                            <th className="px-6 py-4 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("actionPoint")}</th>
                            <th className="px-6 py-4 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("actionType")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {weeklySuggestions.team_suggestions.map((item: any, i: number) => (
                            <tr key={i} className="group hover:bg-accent/5 transition-colors">
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.category === "dev" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                    item.category === "retail" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                      item.category === "trading" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}>
                                  {t(item.category as any) || item.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground/90 font-serif italic max-w-md">
                                {item.action_point}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.action_type === "resolve" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                                  }`}>
                                  {item.action_type === "resolve" ? (
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  )}
                                  {t(item.action_type as any) || item.action_type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {weeklyReportData && (
                  <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-foreground">{t("summary")} - {t(discordSection as keyof typeof translations.en)}</h2>
                        <p className="text-xs text-muted-foreground font-sans font-medium">
                          {(() => {
                            const start = new Date(date)
                            start.setDate(start.getDate() - 6)
                            const format = (d: Date) => d.toLocaleDateString(lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "ja-JP", { month: lang === "en" ? "long" : "short", day: "numeric" })
                            return `${format(start)} - ${format(date)}`
                          })()}
                        </p>
                      </div>
                      <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                        {(["retail", "trading", "tickets", "dev"] as const).map((section) => (
                          <button
                            key={section}
                            onClick={() => setDiscordSection(section)}
                            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-sans font-semibold transition-all duration-300 ${discordSection === section
                              ? `bg-card shadow-sm ring-1 ring-border/50 scale-[1.05] ${section === "retail" ? "text-emerald-500" :
                                section === "trading" ? "text-amber-500" :
                                  section === "tickets" ? "text-blue-500" :
                                    "text-purple-500"
                              }`
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                              }`}
                          >
                            {t(section as keyof typeof translations.en)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {weeklyReportData.reports?.[discordSection]?.summary || t("noSummary")}
                    </p>
                  </div>
                )}

                {weeklyReportData?.reports?.[discordSection]?.questions?.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-all duration-200 sketchbook-paper">
                    <div className="flex flex-col gap-1 mb-6">
                      <h2 className="text-xl font-bold text-foreground">{t("topQuestions")} - {t(discordSection as keyof typeof translations.en)}</h2>
                      <p className="text-xs text-muted-foreground font-sans font-medium">
                        {(() => {
                          const start = new Date(date)
                          start.setDate(start.getDate() - 6)
                          const format = (d: Date) => d.toLocaleDateString(lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "ja-JP", { month: lang === "en" ? "long" : "short", day: "numeric" })
                          return `${format(start)} - ${format(date)}`
                        })()}
                      </p>
                    </div>
                    <ol className="space-y-4">
                      {weeklyReportData.reports[discordSection].questions.map((question: string, i: number) => (
                        <li key={i} className="text-sm text-foreground leading-relaxed">
                          <span className="font-bold text-accent">{i + 1}.</span> {question}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t("noDataAvailable")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
