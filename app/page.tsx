"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { ChevronDown, RotateCw, ChevronLeft, ChevronRight, Moon, Sun, FileText } from "lucide-react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { translations } from "@/lib/translations"

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
  const [data, setData] = useState<DashboardData | null>(null)
  const [discordData, setDiscordData] = useState<any>(null)
  const [xData, setXData] = useState<any>(null)
  const [weeklyReportData, setWeeklyReportData] = useState<any>(null)
  const [weeklySuggestions, setWeeklySuggestions] = useState<any>(null)
  const [community, setCommunity] = useState<"SOSOVALUE" | "SODEX">("SOSOVALUE")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeframe, setTimeframe] = useState<"today" | "weekly">("today")
  const [date, setDate] = useState<Date>(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [previousDayData, setPreviousDayData] = useState<any>(null)
  const [previousDayDiscordData, setPreviousDayDiscordData] = useState<any>(null)
  const [isPollingForToday, setIsPollingForToday] = useState<Record<string, boolean>>({
    SOSOVALUE: false,
    SODEX: false,
  })
  const [weeklyData, setWeeklyData] = useState<Array<{ hour: string; count: number }> | null>(null)
  const [weeklyDiscordData, setWeeklyDiscordData] = useState<Array<{ hour: string; count: number }> | null>(null)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const sessionCache = useRef<Record<string, any>>({})
  const pollingIntervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({
    SOSOVALUE: null,
    SODEX: null,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const t = (key: keyof typeof translations.en) => translations.en[key] || key
  const isDarkMode = resolvedTheme === "dark"

  const fetchWithCache = async (url: string, usePersistence = true) => {
    const CACHE_DURATION = 2 * 60 * 1000
    const sessionHit = sessionCache.current[url]
    if (sessionHit && sessionHit.timestamp && (Date.now() - sessionHit.timestamp < CACHE_DURATION)) {
      return sessionHit.data
    }
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
      } catch (e) { }
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const json = await response.json()
    const cacheEntry = { data: json, timestamp: Date.now() }
    sessionCache.current[url] = cacheEntry
    if (usePersistence) {
      try {
        localStorage.setItem(`soso_cache_${url}`, JSON.stringify(cacheEntry))
      } catch (e) { }
    }
    return json
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const monthShort = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const day = String(date.getDate())
      const fileName = `${monthShort}${day}_processed.json`
      const isToday = date.toDateString() === new Date().toDateString()
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${fileName}${isToday ? `?t=${Date.now()}` : ""}`
      try {
        const json = await fetchWithCache(url, !isToday)
        setData(json)
        setLastUpdated(new Date())
        fetchPreviousDayData(community, date)
      } catch (e) {
        const isTodayOrFuture = date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)
        if (isTodayOrFuture) {
          const prev = new Date(date)
          prev.setDate(prev.getDate() - 1)
          const pm = prev.toLocaleString("en-US", { month: "short" }).toLowerCase()
          const pd = String(prev.getDate())
          const purl = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${pm}${pd}_processed.json`
          try {
            const json = await fetchWithCache(purl, true)
            setData(json)
            setError(`Showing data from ${prev.toDateString()} (today's data not available yet)`)
            fetchPreviousDayData(community, prev)
            return
          } catch (err) { }
        }
        setError(t("noDataForDate"))
        setData(null)
      }
    } catch (err) {
      setError(t("failedToFetch"))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayData = async (comm: string) => {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const m = yesterday.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const d = String(yesterday.getDate())
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${comm}/${m}${d}_processed.json?t=${Date.now()}`
      const response = await fetch(url)
      if (response.ok) {
        if (pollingIntervalsRef.current[comm]) clearInterval(pollingIntervalsRef.current[comm]!)
        setIsPollingForToday(prev => ({ ...prev, [comm]: false }))
        return true
      }
      return false
    } catch (e) { return false }
  }

  const fetchPreviousDayData = async (comm: string, sel: Date) => {
    try {
      const prev = new Date(sel)
      prev.setDate(prev.getDate() - 1)
      const m = prev.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const d = String(prev.getDate())
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${comm}/${m}${d}_processed.json`
      const json = await fetchWithCache(url, true)
      setPreviousDayData(json)
    } catch (e) { setPreviousDayData(null) }
  }

  const fetchDiscordData = async () => {
    setLoading(true)
    setError(null)
    try {
      const m = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const d = String(date.getDate())
      const isToday = date.toDateString() === new Date().toDateString()
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${m}${d}data.json${isToday ? `?t=${Date.now()}` : ""}`
      try {
        const json = await fetchWithCache(url, !isToday)
        setDiscordData(json)
        setLastUpdated(new Date())
        fetchPreviousDayDiscordData(date)
      } catch (e) {
        if (date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)) {
          const prev = new Date(date)
          prev.setDate(prev.getDate() - 1)
          const pm = prev.toLocaleString("en-US", { month: "short" }).toLowerCase()
          const pd = String(prev.getDate())
          const purl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${pm}${pd}data.json`
          try {
            const json = await fetchWithCache(purl, true)
            setDiscordData(json)
            setError(`Showing data from ${prev.toDateString()} (today's data not available yet)`)
            fetchPreviousDayDiscordData(prev)
            return
          } catch (err) { }
        }
        setError(t("noDataForDate"))
        setDiscordData(null)
      }
    } catch (err) {
      setError(t("failedToFetchDiscord"))
      setDiscordData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreviousDayDiscordData = async (sel: Date) => {
    try {
      const prev = new Date(sel)
      prev.setDate(prev.getDate() - 1)
      const m = prev.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const d = String(prev.getDate())
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${m}${d}data.json`
      const json = await fetchWithCache(url, true)
      setPreviousDayDiscordData(json)
    } catch (e) { setPreviousDayDiscordData(null) }
  }

  const fetchWeeklyData = async () => {
    try {
      const results = await Promise.all(Array.from({ length: 7 }, (_, i) => {
        const d = new Date(date); d.setDate(d.getDate() - i)
        const ms = d.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const dd = String(d.getDate())
        return fetchWithCache(`https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${ms}${dd}_processed.json`, true).catch(() => null)
      }))
      const valid = results.filter(r => r !== null)
      const hours: Record<string, number> = {}
      valid.forEach((json: any) => {
        if (json && json.active_hours_sgt) {
          Object.entries(json.active_hours_sgt).forEach(([h, c]) => hours[h] = (hours[h] || 0) + (c as number))
        }
      })
      const labels = ["12 AM", "01 AM", "02 AM", "03 AM", "04 AM", "05 AM", "06 AM", "07 AM", "08 AM", "09 AM", "10 AM", "11 AM", "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM"]
      const chart = labels.map(h => ({ hour: h, count: valid.length > 0 ? Math.round((hours[h] || 0) / valid.length) : 0 }))
      setWeeklyData(chart)
    } catch (e) { setWeeklyData([]) }
  }

  const fetchWeeklyDiscordData = async () => {
    try {
      const results = await Promise.all(Array.from({ length: 7 }, (_, i) => {
        const d = new Date(date); d.setDate(d.getDate() - i)
        const ms = d.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const dd = String(d.getDate())
        return fetchWithCache(`https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${ms}${dd}data.json`, true).catch(() => null)
      }))
      const valid = results.filter(r => r !== null)
      const hours: Record<string, number> = {}
      valid.forEach((json: any) => {
        if (json && json.hourly_activity) {
          Object.entries(json.hourly_activity).forEach(([h, c]) => hours[h] = (hours[h] || 0) + (c as number))
        }
      })
      const labels = ["12 AM", "01 AM", "02 AM", "03 AM", "04 AM", "05 AM", "06 AM", "07 AM", "08 AM", "09 AM", "10 AM", "11 AM", "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM"]
      const chart = labels.map(h => ({ hour: h, count: valid.length > 0 ? Math.round((hours[h] || 0) / valid.length) : 0 }))
      setWeeklyDiscordData(chart)
    } catch (e) { setWeeklyDiscordData([]) }
  }

  const fetchXData = async () => {
    setLoading(true); setError(null)
    try {
      const ms = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const dd = String(date.getDate()).padStart(2, '0')
      const json = await fetchWithCache(`https://raw.githubusercontent.com/Eliasdegemu61/soso-x-analysis/main/${ms}${dd}.json`, true)
      setXData(json); setLastUpdated(new Date())
    } catch (e) { setError("Failed to fetch X data"); setXData(null) } finally { setLoading(false) }
  }

  const fetchWeeklyReport = async () => {
    setLoading(true); setError(null)
    try {
      const ms = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const dd = String(date.getDate())
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly${ms}${dd}.json`
      const json = await fetchWithCache(url, true)
      setWeeklyReportData(json); setLastUpdated(new Date())
    } catch (e) {
      if (date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)) {
        const p = new Date(date); p.setDate(p.getDate() - 1)
        const pm = p.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const pd = String(p.getDate())
        const purl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly${pm}${pd}.json`
        try {
          const json = await fetchWithCache(purl, true)
          setWeeklyReportData(json); setLastUpdated(new Date()); setError(`Showing data from ${p.toDateString()} (today's data not available yet)`)
          return
        } catch (err) { }
      }
      setError(t("noDataForDate")); setWeeklyReportData(null)
    } finally { setLoading(false) }
  }

  const fetchWeeklySuggestions = async () => {
    try {
      const ms = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
      const dd = String(date.getDate())
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly_suggestions/segg${ms}${dd}.json`
      const json = await fetchWithCache(url, true)
      setWeeklySuggestions(json)
    } catch (e) {
      if (date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)) {
        const p = new Date(date); p.setDate(p.getDate() - 1)
        const pm = p.toLocaleString("en-US", { month: "short" }).toLowerCase()
        const pd = String(p.getDate())
        const purl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly_suggestions/segg${pm}${pd}.json`
        try {
          const json = await fetchWithCache(purl, true)
          setWeeklySuggestions(json)
          return
        } catch (err) { }
      }
      setWeeklySuggestions(null)
    }
  }

  useEffect(() => {
    if (platform === "telegram") { fetchData(); fetchWeeklyData() }
    else if (platform === "discord") { fetchDiscordData(); fetchWeeklyDiscordData() }
    else if (platform === "x") { fetchXData() }
    else if (platform === "weekly") { fetchWeeklyReport(); fetchWeeklySuggestions() }
  }, [platform, community, date])

  useEffect(() => {
    const isToday = date.toDateString() === new Date().toDateString()
    if (isToday || isPollingForToday[community]) return
    setIsPollingForToday(prev => ({ ...prev, [community]: true }))
    fetchTodayData(community)
    const interval = setInterval(() => fetchTodayData(community), 1800000)
    pollingIntervalsRef.current[community] = interval
    return () => { if (pollingIntervalsRef.current[community]) clearInterval(pollingIntervalsRef.current[community]!) }
  }, [community])

  const parseAnalysis = (str: string) => {
    const sm = str.match(/(?:Summary:|摘要：|概要：|要約：)\s*([\s\S]+?)(?=(?:Top Community Questions:|社区热门问题：|热门社区问题：|顶级社区问题：|コミュニティの主な質問：|トップコミュニティ質問:|$))/i)
    let s = sm ? sm[1].trim() : ""
    s = s.replace("ome users are threatening to report the project to regulatory authorities.", "").trim()
    const qm = str.match(/(?:Top Community Questions:|社区热门问题：|热门社区问题：|顶级社区问题：|コミュニティの主な質問：|トップコミュニティ質問:)\s*([\s\S]+?)$/i)
    return { summary: s, questions: qm ? qm[1].split("\n").filter(q => q.trim()).map(q => q.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "")) : [] }
  }

  const ComparisonBadge = ({ current, previous }: { current: number; previous: number }) => {
    if (!previous) return null
    const diff = current - previous
    const perc = ((current - previous) / previous) * 100
    const pos = diff >= 0
    return (
      <div className={`text-sm font-sans mt-2 ${pos ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        <span>{pos ? "+" : ""}{diff.toLocaleString()}</span>
        <span className="ml-2">({pos ? "+" : ""}{perc.toFixed(1)}%)</span>
      </div>
    )
  }

  const formatHourTick = (t: string | number) => {
    const s = String(t).trim().toLowerCase()
    if (s.includes("am") || s.includes("pm")) {
      const h = s.replace(/(am|pm|\s)/g, '')
      const ampm = s.includes("pm") ? "pm" : "am"
      const p = parseInt(h, 10)
      return isNaN(p) ? s : `${p}${ampm}`
    }
    let hns = s; if (s.includes(':')) hns = s.split(':')[0]
    const h = parseInt(hns, 10)
    if (isNaN(h)) return s
    const ampm = h >= 12 ? 'pm' : 'am'
    let sh = h % 12; if (sh === 0) sh = 12
    return `${sh}${ampm}`
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background p-6 sm:p-10 font-serif transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-16 flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <img src="https://sosovalue.com/img/192x192.png" alt="SoSoValue" className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg" />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{t("communityAnalytics")}</h1>
                <span className="px-2 py-0.5 mt-2 text-[10px] font-sans font-bold bg-accent/10 text-accent border border-accent/20 rounded-full">v2.0</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 opacity-80 italic font-sans leading-tight max-w-2xl">{t("aiNotice")}</p>
            </div>
          </div>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 sm:p-3 rounded-lg hover:bg-secondary transition-all duration-200">
            {resolvedTheme === "dark" ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-row flex-wrap gap-2">
            {[
              { id: "telegram", label: t("telegram") },
              { id: "discord", label: t("discord") },
              { id: "x", label: t("x") },
              { id: "weekly", label: t("weeklyReport"), icon: FileText }
            ].map((p: any) => (
              <button key={p.id} onClick={() => setPlatform(p.id)} className={`px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-medium flex items-center gap-2 transition-all duration-200 ${platform === p.id ? "bg-accent text-accent-foreground shadow-md" : "bg-card border border-border text-foreground hover:border-accent"}`}>
                {p.icon && <p.icon className="w-4 h-4" />}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1 sm:flex-none">
              <button onClick={() => setShowCalendar(!showCalendar)} className="w-full sm:w-auto bg-card border border-border rounded-lg px-4 py-2 text-foreground font-sans flex items-center justify-between gap-2 hover:border-accent transition-all duration-200 text-xs sm:text-sm font-medium">
                <span>{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showCalendar ? "rotate-180" : ""}`} />
              </button>
              {showCalendar && (
                <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-lg shadow-xl p-4 z-50 w-[calc(100vw-3rem)] sm:w-80">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-1 hover:bg-secondary rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
                    <h3 className="font-semibold text-sm">{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-1 hover:bg-secondary rounded-lg"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const days = []; const dm = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate(); const fd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
                      for (let i = 0; i < fd; i++) days.push(null)
                      for (let i = 1; i <= dm; i++) days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i))
                      return days.map((d, i) => (
                        <button key={i} onClick={() => d && (setDate(d), setShowCalendar(false))} disabled={!d || d > new Date()} className={`aspect-square rounded text-xs transition-colors ${!d ? "" : d.toDateString() === date.toDateString() ? "bg-accent text-accent-foreground font-bold" : d > new Date() ? "text-muted-foreground opacity-30" : "hover:bg-secondary"}`}>
                          {d?.getDate()}
                        </button>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => { if (platform === "telegram") fetchData(); else if (platform === "discord") fetchDiscordData(); else if (platform === "x") fetchXData(); else if (platform === "weekly") { fetchWeeklyReport(); fetchWeeklySuggestions() } }} disabled={loading} className="p-2 rounded-lg text-accent hover:bg-secondary disabled:opacity-50">
              <RotateCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Messaging */}
        {error && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm italic">
            {error}
          </div>
        )}

        {/* Dynamic Content Area */}
        {loading && !(data || discordData || xData || weeklyReportData) ? (
          <div className="text-center py-20 text-muted-foreground">{t("loadingData")}</div>
        ) : (data && platform === "telegram") || (discordData && platform === "discord") || (xData && platform === "x") || (weeklyReportData && platform === "weekly") ? (
          <div className="space-y-10">
            {/* Discord Content */}
            {platform === "discord" && discordData && (
              <div className="space-y-10">
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: t("totalMessages"), val: discordData.vitals?.total_messages, prev: previousDayDiscordData?.vitals?.total_messages },
                    { label: t("activeUsers"), val: discordData.vitals?.active_users, prev: previousDayDiscordData?.vitals?.active_users }
                  ].map((v, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 min-w-[150px] shadow-sm">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{v.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-accent">{v.val?.toLocaleString() || 0}</span>
                        <ComparisonBadge current={v.val || 0} previous={v.prev || 0} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 sketchbook-paper">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-xl font-bold">{t("summary")} - {t(discordSection as any)}</h2>
                    <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50">
                      {["retail", "trading", "tickets", "dev"].map((s: any) => (
                        <button key={s} onClick={() => setDiscordSection(s)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${discordSection === s ? `bg-card shadow-sm ${s === "retail" ? "text-emerald-500" : s === "trading" ? "text-amber-500" : s === "tickets" ? "text-blue-500" : "text-purple-500"}` : "text-muted-foreground hover:text-foreground"}`}>
                          {t(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-foreground opacity-90">{discordData.reports?.[discordSection]?.summary || t("noSummary")}</p>
                </div>

                {discordData.reports?.[discordSection]?.questions?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 sketchbook-paper">
                    <h2 className="text-xl font-bold mb-6">{t("topQuestions")} - {t(discordSection as any)}</h2>
                    <ol className="space-y-4">
                      {discordData.reports[discordSection].questions.map((question: string, i: number) => (
                        <li key={i} className="text-sm flex gap-3">
                          <span className="font-bold text-accent min-w-[1rem]">{i + 1}.</span>
                          <span className="opacity-90">{question}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {discordData.hourly_activity && (
                  <div className="bg-card rounded-2xl p-6 sm:p-10 sketchbook-paper">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-bold">{timeframe === "today" ? t("hourlyActivity") : t("weeklyAvgHourlyActivity")}</h2>
                      <div className="flex bg-secondary/50 p-1 rounded-lg">
                        {["today", "weekly"].map((tf: any) => (
                          <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 text-[10px] font-bold rounded ${timeframe === tf ? "bg-card text-accent shadow-sm" : "text-muted-foreground"}`}>{tf === "today" ? t("today") : t("oneWeek")}</button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={timeframe === "today" ? Object.entries(discordData.hourly_activity).map(([h, c]) => ({ hour: h, count: c as number })) : (weeklyDiscordData || [])}>
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tickFormatter={formatHourTick} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} interval={window.innerWidth < 640 ? 3 : 1} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                        <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Telegram Content */}
            {platform === "telegram" && data && (
              <div className="space-y-10">
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: t("totalMessages"), val: data.totals?.messages, prev: previousDayData?.totals?.messages },
                    { label: t("activeUsers"), val: data.totals?.users, prev: previousDayData?.totals?.users }
                  ].map((v, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 min-w-[150px] shadow-sm">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{v.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-accent">{v.val?.toLocaleString() || 0}</span>
                        <ComparisonBadge current={v.val || 0} previous={v.prev || 0} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper">
                    <h2 className="text-xl font-bold mb-6">{t("summary")}</h2>
                    <p className="text-sm leading-relaxed opacity-90">{parseAnalysis(data.ai_analysis).summary}</p>
                  </div>
                  {parseAnalysis(data.ai_analysis).questions.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper">
                      <h2 className="text-xl font-bold mb-6">{t("topQuestions")}</h2>
                      <ol className="space-y-4">
                        {parseAnalysis(data.ai_analysis).questions.slice(0, 5).map((q, i) => (
                          <li key={i} className="text-sm flex gap-3">
                            <span className="font-bold text-accent min-w-[1rem]">{i + 1}.</span>
                            <span className="opacity-90">{q}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {data.sections && data.sections.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper">
                    <h2 className="text-xl font-bold mb-6">{t("languageSections")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {data.sections.map((section, i) => (
                        <div key={i} className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{section.name}</p>
                          <p className="text-lg font-bold text-accent">{section.msgs.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground uppercase ml-1">{t("messages")}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-card rounded-2xl p-6 sm:p-10 sketchbook-paper">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold">{t("activityByHour")}</h2>
                    <div className="flex bg-secondary/50 p-1 rounded-lg">
                      {["today", "weekly"].map((tf: any) => (
                        <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 text-[10px] font-bold rounded ${timeframe === tf ? "bg-card text-accent shadow-sm" : "text-muted-foreground"}`}>{tf === "today" ? t("today") : t("oneWeek")}</button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeframe === "today" ? Object.entries(data.active_hours_sgt).map(([h, c]) => ({ hour: h, count: c as number })) : (weeklyData || [])}>
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tickFormatter={formatHourTick} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} interval={window.innerWidth < 640 ? 3 : 1} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-accent">✦</span> {t("topMods")}
                      </h2>
                      <div className="space-y-4">
                        {(() => {
                          const maxCount = Math.max(...data.leaderboards.moderators.map((m: any) => m.count), 1);
                          return data.leaderboards.moderators.slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="group transition-all hover:bg-secondary/20 p-2 -m-2 rounded-xl">
                              <div className="flex items-center gap-4 mb-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-background shadow-sm ${
                                  i === 0 ? "bg-amber-400 text-white" : 
                                  i === 1 ? "bg-slate-300 text-slate-700" : 
                                  i === 2 ? "bg-orange-400 text-white" : 
                                  "bg-secondary text-muted-foreground"
                                }`}>
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm">{m.name}</span>
                                    <span className="text-[10px] font-black text-accent uppercase">{m.count} {t("messages")}</span>
                                  </div>
                                  <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-accent transition-all duration-1000 ease-out" 
                                      style={{ width: `${(m.count / maxCount) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-accent">◈</span> {t("topChatters")}
                      </h2>
                      <div className="space-y-4">
                        {(() => {
                          const maxCount = Math.max(...data.leaderboards.community_users.map((u: any) => u.count), 1);
                          return data.leaderboards.community_users.slice(0, 5).map((u: any, i: number) => (
                            <div key={i} className="group transition-all hover:bg-secondary/20 p-2 -m-2 rounded-xl">
                              <div className="flex items-center gap-4 mb-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                  i === 0 ? "bg-accent/20 text-accent ring-2 ring-accent/30" : "bg-secondary text-muted-foreground ring-1 ring-border"
                                }`}>
                                  #{i + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm line-clamp-1">{u.name}</span>
                                    <span className="text-[10px] font-black text-accent uppercase">{u.count} {t("messages")}</span>
                                  </div>
                                  <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-accent/60 group-hover:bg-accent transition-all duration-1000 ease-out" 
                                      style={{ width: `${(u.count / maxCount) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                </div>
              </div>
            )}

            {/* X Content */}
            {platform === "x" && xData && (
              <div className="space-y-10">
                <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-xl font-bold">{t("summary")} - {xSection}</h2>
                    <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50">
                      {["SoSoValue", "Sodex", "SSI Index"].map((s: any) => (
                        <button key={s} onClick={() => setXSection(s)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${xSection === s ? "bg-card text-accent shadow-sm" : "text-muted-foreground"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed opacity-90">{xData.summary?.[xSection === "SSI Index" ? "ssi" : xSection.toLowerCase()] || t("noSummary")}</p>
                </div>
                {(() => {
                  const sectionKey = xSection === "SSI Index" ? "ssi" : xSection.toLowerCase()
                  const questions = xData.top_questions?.[sectionKey]
                  const postsKey = Object.keys(xData).find(k => k.toLowerCase().includes("top post_links"))
                  const posts = postsKey ? xData[postsKey] : []

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {questions && questions.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper h-full">
                          <h2 className="text-xl font-bold mb-6">{t("topQuestions")} - {xSection}</h2>
                          <ol className="space-y-4">
                            {questions.map((question: string, i: number) => (
                              <li key={i} className="text-sm flex gap-3">
                                <span className="font-bold text-accent min-w-[1rem]">{i + 1}.</span>
                                <span className="opacity-90">{question}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {posts && posts.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper h-full">
                          <h2 className="text-xl font-bold mb-6">{t("mostEngagedPosts")}</h2>
                          <div className="space-y-6">
                            {posts.map((postStr: string, i: number) => {
                              const urlMatch = postStr.match(/https?:\/\/\S+/);
                              const url = urlMatch ? urlMatch[0] : "";
                              const statsMatch = postStr.match(/\((\d+)\s+likes?:\s*(.+)\)/i);
                              const likes = statsMatch ? statsMatch[1] : "0";
                              const description = statsMatch ? statsMatch[2] : postStr.replace(url, "").trim();

                              return (
                                <div key={i} className="bg-secondary/20 rounded-xl p-6 border border-border/50 flex flex-col gap-4 transition-all hover:bg-secondary/40">
                                  <p className="text-sm italic leading-relaxed opacity-90">"{description}"</p>
                                  <div className="flex justify-between items-center mt-auto">
                                    <div className="flex gap-4">
                                      <span className="text-xs font-bold text-accent">{parseInt(likes).toLocaleString()} Likes</span>
                                    </div>
                                    {url && (
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors underline decoration-dotted underline-offset-4">
                                        {t("viewPostOnX")}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Weekly/7D Report Content */}
            {platform === "weekly" && (
              <div className="space-y-8">
                {/* Team Suggestions Card */}
                {weeklySuggestions?.team_suggestions?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 sketchbook-paper hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col gap-1 mb-8">
                      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] animate-pulse" />
                        {t("teamSuggestions")}
                      </h2>
                      <p className="text-xs text-muted-foreground font-sans font-medium tracking-wide opacity-70">
                        {(() => {
                          const start = new Date(date); start.setDate(start.getDate() - 6)
                          return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        })()}
                      </p>
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden sm:block overflow-hidden rounded-xl border border-border/50">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/50">
                            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("category")}</th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("actionPoint")}</th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("actionType")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {weeklySuggestions.team_suggestions.map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-accent/5 transition-colors">
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.category === "retail" ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" : item.category === "trading" ? "text-amber-500 bg-amber-500/10 border border-amber-500/20" : item.category === "tickets" ? "text-blue-500 bg-blue-500/10 border border-blue-500/20" : "text-purple-500 bg-purple-500/10 border border-purple-500/20"}`}>
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium leading-relaxed opacity-90">{item.action_point}</td>
                              <td className="px-6 py-4">
                                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${item.action_type === "resolve" ? "text-amber-500" : "text-accent"}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.action_type === "resolve" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"}`} />
                                  {t(item.action_type)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="sm:hidden grid grid-cols-1 gap-4">
                      {weeklySuggestions.team_suggestions.map((item: any, i: number) => (
                        <div key={i} className="bg-secondary/20 border border-border/50 rounded-xl p-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.category === "retail" ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" : item.category === "trading" ? "text-amber-500 bg-amber-500/10 border border-amber-500/20" : item.category === "tickets" ? "text-blue-500 bg-blue-500/10 border border-blue-500/20" : "text-purple-500 bg-purple-500/10 border border-purple-500/20"}`}>
                              {item.category}
                            </span>
                            <span className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${item.action_type === "resolve" ? "text-amber-500" : "text-accent"}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${item.action_type === "resolve" ? "bg-amber-500" : "bg-accent"}`} />
                              {t(item.action_type)}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed italic pr-2">"{item.action_point}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Summary Card */}
                {weeklyReportData && (
                  <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 sketchbook-paper">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                       <h2 className="text-xl font-bold">{t("summary")} - {t(discordSection as any)}</h2>
                       <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50">
                        {["retail", "trading", "tickets", "dev"].map((s: any) => (
                          <button key={s} onClick={() => setDiscordSection(s)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${discordSection === s ? `bg-card shadow-sm ${s === "retail" ? "text-emerald-500" : s === "trading" ? "text-amber-500" : s === "tickets" ? "text-blue-500" : "text-purple-500"}` : "text-muted-foreground hover:text-foreground"}`}>
                            {t(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed opacity-90">{weeklyReportData.reports?.[discordSection]?.summary || t("noSummary")}</p>
                  </div>
                )}

                {/* Top Questions Card */}
                {weeklyReportData?.reports?.[discordSection]?.questions?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 sketchbook-paper hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col gap-1 mb-6">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                        {t("topQuestions")} - {t(discordSection as any)}
                      </h2>
                      <p className="text-xs text-muted-foreground font-sans font-medium tracking-wide opacity-70">
                        {(() => {
                          const start = new Date(date); start.setDate(start.getDate() - 6)
                          return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        })()}
                      </p>
                    </div>
                    <ol className="space-y-4">
                      {weeklyReportData.reports[discordSection].questions.map((question: string, i: number) => (
                        <li key={i} className="text-sm flex gap-4 text-foreground/90 font-serif leading-relaxed">
                          <span className="font-bold text-accent min-w-[1.5rem]">{i + 1}.</span> {question}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">{t("noDataAvailable")}</div>
        )}
      </div>
    </div>
  )
}
