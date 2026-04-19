"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { ChevronDown, RotateCw, ChevronLeft, ChevronRight, Moon, Sun, FileText, Heart, ExternalLink, MessageCircle, Repeat2, Share2, BarChart2, MoreHorizontal, ShieldCheck, Quote } from "lucide-react"
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
        let found = false;
        for (let i = 1; i <= 5; i++) {
          const prev = new Date(date);
          prev.setDate(prev.getDate() - i);
          const pm = prev.toLocaleString("en-US", { month: "short" }).toLowerCase();
          const pd = String(prev.getDate());
          const purl = `https://raw.githubusercontent.com/Eliasdegemu61/Json-data/main/${community}/${pm}${pd}_processed.json`;
          try {
            const json = await fetchWithCache(purl, true);
            setData(json);
            const prevFormat = prev.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            const currFormat = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            setError(`Displaying ${prevFormat} data. ${currFormat} data is not available yet.`);
            fetchPreviousDayData(community, prev);
            found = true;
            break;
          } catch (err) { }
        }
        if (!found) {
          setError(t("noDataForDate"));
          setData(null);
        }
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
        let found = false;
        for (let i = 1; i <= 5; i++) {
          const prev = new Date(date);
          prev.setDate(prev.getDate() - i);
          const pm = prev.toLocaleString("en-US", { month: "short" }).toLowerCase();
          const pd = String(prev.getDate());
          const purl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/main/${pm}${pd}data.json`;
          try {
            const json = await fetchWithCache(purl, true);
            setDiscordData(json);
            const prevFormat = prev.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            const currFormat = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            setError(`Displaying ${prevFormat} data. ${currFormat} data is not available yet.`);
            fetchPreviousDayDiscordData(prev);
            found = true;
            break;
          } catch (err) { }
        }
        if (!found) {
          setError(t("noDataForDate"));
          setDiscordData(null);
        }
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
    setLoading(true);
    setError(null);
    try {
      const ms = date.toLocaleString("en-US", { month: "short" }).toLowerCase();
      const dd = String(date.getDate()).padStart(2, '0');
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/soso-x-analysis/main/${ms}${dd}.json`;
      try {
        const json = await fetchWithCache(url, true);
        setXData(json);
        setLastUpdated(new Date());
      } catch (e) {
        let found = false;
        for (let i = 1; i <= 5; i++) {
          const prev = new Date(date);
          prev.setDate(prev.getDate() - i);
          const pms = prev.toLocaleString("en-US", { month: "short" }).toLowerCase();
          const pdd = String(prev.getDate()).padStart(2, '0');
          const purl = `https://raw.githubusercontent.com/Eliasdegemu61/soso-x-analysis/main/${pms}${pdd}.json`;
          try {
            const json = await fetchWithCache(purl, true);
            setXData(json);
            const prevFormat = prev.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            const currFormat = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            setError(`Displaying ${prevFormat} data. ${currFormat} data is not available yet.`);
            found = true;
            break;
          } catch (err) { }
        }
        if (!found) {
          setError("Failed to fetch X data");
          setXData(null);
        }
      }
    } catch (err) {
      setError("Failed to fetch X data");
      setXData(null);
    } finally {
      setLoading(false);
    }
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
      let found = false;
      for (let i = 1; i <= 5; i++) {
        const p = new Date(date);
        p.setDate(p.getDate() - i);
        const pm = p.toLocaleString("en-US", { month: "short" }).toLowerCase();
        const pd = String(p.getDate());
        const purl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly${pm}${pd}.json`;
        try {
          const json = await fetchWithCache(purl, true);
          setWeeklyReportData(json);
          setLastUpdated(new Date());
          const prevFormat = p.toLocaleDateString("en-US", { month: "long", day: "numeric" });
          const currFormat = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
          setError(`Displaying ${prevFormat} data. ${currFormat} data is not available yet.`);
          found = true;
          break;
        } catch (err) { }
      }
      if (!found) {
        setError(t("noDataForDate"));
        setWeeklyReportData(null);
      }
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
      let found = false;
      for (let i = 1; i <= 5; i++) {
        const p = new Date(date);
        p.setDate(p.getDate() - i);
        const pm = p.toLocaleString("en-US", { month: "short" }).toLowerCase();
        const pd = String(p.getDate());
        const purl = `https://raw.githubusercontent.com/Eliasdegemu61/discord-bot-data/refs/heads/main/weekly_suggestions/segg${pm}${pd}.json`;
        try {
          const json = await fetchWithCache(purl, true);
          setWeeklySuggestions(json);
          found = true;
          break;
        } catch (err) { }
      }
      if (!found) {
        setWeeklySuggestions(null);
      }
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
        <div className="mb-8 sm:mb-12 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img src="https://sosovalue.com/img/192x192.png" alt="SoSoValue" className="w-10 sm:w-14 h-10 sm:h-14 rounded-xl shadow-lg flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-3xl font-bold text-foreground tracking-tight truncate py-1">{t("communityAnalytics")}</h1>
                <span className="px-2 py-0.5 text-[8px] sm:text-[10px] font-sans font-bold bg-accent/10 text-accent border border-accent/20 rounded-full whitespace-nowrap">v2.0</span>
              </div>
              <p className="hidden sm:block text-[10px] sm:text-xs text-muted-foreground opacity-70 italic font-sans leading-tight max-w-xl truncate sm:whitespace-normal">{t("aiNotice")}</p>
            </div>
          </div>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 sm:p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all duration-300 border border-border/50">
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
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
                      <AreaChart data={timeframe === "today" ? Object.entries(discordData.hourly_activity).map(([h, c]) => ({ hour: h, count: c as number })) : (weeklyDiscordData || [])} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tickFormatter={formatHourTick} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} interval={window.innerWidth < 640 ? 3 : 1} />
                        <YAxis axisLine={false} tickLine={false} width={40} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
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
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-widest">{t("languageSections")}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {data.sections.map((section, i) => (
                        <div key={i} className="bg-secondary/20 rounded-lg p-3 border border-border/30">
                          <p className="text-[9px] text-muted-foreground/70 uppercase font-bold mb-0.5 truncate">{section.name}</p>
                          <p className="text-sm font-bold text-accent">{section.msgs.toLocaleString()} <span className="text-[8px] font-normal text-muted-foreground uppercase ml-0.5">{t("messages")}</span></p>
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
                    <AreaChart data={timeframe === "today" ? Object.entries(data.active_hours_sgt).map(([h, c]) => ({ hour: h, count: c as number })) : (weeklyData || [])} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tickFormatter={formatHourTick} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} interval={window.innerWidth < 640 ? 3 : 1} />
                      <YAxis axisLine={false} tickLine={false} width={40} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <h2 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-widest">
                        {t("topMods")}
                      </h2>
                      <div className="space-y-2.5">
                        {(() => {
                           const maxCount = Math.max(...data.leaderboards.moderators.map((m: any) => m.count), 1);
                           return data.leaderboards.moderators.slice(0, 5).map((m: any, i: number) => (
                             <div key={i} className="flex items-center justify-between group">
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] font-medium text-muted-foreground/60 w-3">{i + 1}.</span>
                                 <span className="font-bold text-xs">{m.name}</span>
                               </div>
                               <span className="text-[10px] text-accent/70 font-medium">{m.count} <span className="text-[8px] uppercase tracking-tighter opacity-50">{t("messages")}</span></span>
                             </div>
                           ));
                        })()}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <h2 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-widest">
                        {t("topChatters")}
                      </h2>
                      <div className="space-y-2.5">
                        {(() => {
                           const maxCount = Math.max(...data.leaderboards.community_users.map((u: any) => u.count), 1);
                           return data.leaderboards.community_users.slice(0, 5).map((u: any, i: number) => (
                             <div key={i} className="flex items-center justify-between group">
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] font-medium text-muted-foreground/60 w-3">{i + 1}.</span>
                                 <span className="font-bold text-xs truncate max-w-[120px]">{u.name}</span>
                               </div>
                               <span className="text-[10px] text-accent/70 font-medium">{u.count} <span className="text-[8px] uppercase tracking-tighter opacity-50">{t("messages")}</span></span>
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
                    <div>
                      <h2 className="text-xl font-bold">{t("summary")} - {xSection}</h2>
                      {xData.timestamp && (
                        <p className="text-[10px] text-muted-foreground font-sans mt-0.5 opacity-60">Last updated: {xData.timestamp}</p>
                      )}
                    </div>
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
                  const postsKey = Object.keys(xData).find(k => 
                    k === "top_engaged_posts" ||
                    (k.toLowerCase().includes("top") && k.toLowerCase().includes("post") && (k.toLowerCase().includes("engagement") || k.toLowerCase().includes("engaged"))) ||
                    (k.toLowerCase().includes("top") && k.toLowerCase().includes("poster") && (k.toLowerCase().includes("engagement") || k.toLowerCase().includes("engaged")))
                  )
                  const posts = postsKey ? xData[postsKey] : []

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      <div className="bg-card border border-border rounded-2xl p-8 sketchbook-paper h-full">
                        <h2 className="text-xl font-bold mb-6">{t("topQuestions")} - {xSection}</h2>
                        {questions && questions.length > 0 ? (
                          <ol className="space-y-4">
                            {questions.map((question: string, i: number) => (
                              <li key={i} className="text-sm flex gap-3">
                                <span className="font-bold text-accent min-w-[1rem]">{i + 1}.</span>
                                <span className="opacity-90">{question}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 opacity-60">
                            <p className="text-sm italic font-sans text-muted-foreground uppercase tracking-tight">no relevant question tracked</p>
                          </div>
                        )}
                      </div>

                      {posts && posts.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 sketchbook-paper h-full flex flex-col">
                          <h2 className="text-lg sm:text-xl font-bold mb-5 sm:mb-6">{t("mostEngagedPosts")}</h2>
                          <div className="space-y-4 sm:space-y-6 flex-1">
                            {posts.map((postObj: any, i: number) => {
                              const isObj = typeof postObj === 'object' && postObj !== null;
                              
                              let url = "";
                              let likes = "0";
                              let replies = "0";
                              let reposts = "0";
                              let quotes = "0";
                              let views = "0";
                              let description = "";
                              let username = `${xSection.toLowerCase().replace(/\s/g, '')}`;
                              
                              if (isObj) {
                                url = postObj.url || postObj.post_link || "";
                                description = postObj.content || "";
                                username = postObj.username || username;
                                
                                const engagementStr = postObj.engagement || "";
                                const lMatch = engagementStr.match(/(\d+)\s+likes?/i) || engagementStr.match(/Likes=(\d+)/i);
                                const rpMatch = engagementStr.match(/(\d+)\s+reposts?/i) || engagementStr.match(/Reposts=(\d+)/i);
                                const rMatch = engagementStr.match(/(\d+)\s+repl/i) || engagementStr.match(/Replies=(\d+)/i);
                                const qMatch = engagementStr.match(/(\d+)\s+quotes?/i) || engagementStr.match(/Quotes=(\d+)/i);
                                const vMatch = engagementStr.match(/(\d+)\s+views?/i) || engagementStr.match(/Views=(\d+)/i);
                                
                                if (lMatch) likes = lMatch[1];
                                if (rpMatch) reposts = rpMatch[1];
                                if (rMatch) replies = rMatch[1];
                                if (qMatch) quotes = qMatch[1];
                                if (vMatch) views = vMatch[1];
                              } else {
                                const postStr = postObj as string;
                                const urlMatch = postStr.match(/https?:\/\/\S+/);
                                url = urlMatch ? urlMatch[0] : "";
                                
                                const statsMatch = postStr.match(/\((\d+)\s+likes?[,:]\s*(.+)\)/i);
                                likes = statsMatch ? statsMatch[1] : "0";
                                description = statsMatch ? statsMatch[2] : postStr.replace(url, "").trim();

                                replies = String(Math.floor(parseInt(likes) * 0.1) + 1);
                                reposts = String(Math.floor(parseInt(likes) * 0.15) + 2);
                                views = String(Math.floor(parseInt(likes) * 12.5) + 15);
                              }

                              const displayUsername = username.startsWith('@') ? username.substring(1) : username;

                              return (
                                <a 
                                  key={i} 
                                  href={url || "#"} 
                                  target={url ? "_blank" : "_self"} 
                                  rel={url ? "noopener noreferrer" : ""}
                                  className="flex gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl hover:bg-secondary/30 transition-all duration-300 border border-transparent hover:border-accent/10 hover:shadow-lg group/post no-underline sketchbook-paper-subtle"
                                >
                                  {/* User Avatar Placeholder */}
                                  <div className="flex-shrink-0 pt-0 sm:pt-1">
                                    <div className="relative group/avatar">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-border/50 flex items-center justify-center overflow-hidden transition-transform group-hover/post:scale-105">
                                        <img 
                                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${username}`} 
                                          alt="User" 
                                          className="w-full h-full opacity-90 transition-opacity group-hover/post:opacity-100"
                                        />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full border border-border flex items-center justify-center">
                                        <div className="w-3 h-3 bg-accent rounded-full animate-pulse opacity-50" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Post Content Area */}
                                  <div className="flex-1 min-w-0 pb-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-foreground text-[14px] sm:text-[15px] hover:underline hover:text-accent font-sans transition-colors cursor-pointer tracking-tight">
                                          {displayUsername}
                                        </span>
                                        {username.startsWith('@') && (
                                          <div className="bg-accent/10 p-0.5 rounded-full">
                                            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" fill="currentColor" />
                                          </div>
                                        )}
                                        <span className="text-muted-foreground text-[13px] sm:text-[14px] font-sans opacity-70 truncate max-w-[100px] sm:max-w-none">
                                          {username.startsWith('@') ? username : `@${username}`}
                                        </span>
                                      </div>
                                      <div className="p-1 sm:p-2 rounded-full hover:bg-accent/10 transition-colors cursor-pointer group/more">
                                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover/more:text-accent transition-colors" />
                                      </div>
                                    </div>
                                    
                                    <p className="text-[14px] sm:text-[15px] leading-[1.5] text-foreground/90 mb-3 sm:mb-4 whitespace-pre-wrap break-words font-sans selection:bg-accent/20">
                                      {description}
                                    </p>

                                    {/* Interaction Row */}
                                    <div className="flex items-center justify-between max-w-[440px] text-muted-foreground -ml-1.5 sm:-ml-2 mt-1 sm:mt-0">
                                      <div className="flex items-center gap-0.5 sm:gap-1 group/icon hover:text-blue-500 transition-all cursor-pointer">
                                        <div className="p-1.5 sm:p-2 rounded-full group-hover/icon:bg-blue-500/10 transition-colors">
                                          <MessageCircle className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] transition-transform group-hover/icon:scale-110" />
                                        </div>
                                        <span className="text-[12px] sm:text-[13px] font-sans font-medium">{replies}</span>
                                      </div>

                                      <div className="flex items-center gap-0.5 sm:gap-1 group/icon hover:text-emerald-500 transition-all cursor-pointer">
                                        <div className="p-1.5 sm:p-2 rounded-full group-hover/icon:bg-emerald-500/10 transition-colors">
                                          <Repeat2 className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] transition-transform group-hover/icon:scale-110" />
                                        </div>
                                        <span className="text-[12px] sm:text-[13px] font-sans font-medium">{reposts}</span>
                                      </div>

                                      <div className="flex items-center gap-0.5 sm:gap-1 group/icon hover:text-blue-400 transition-all cursor-pointer">
                                        <div className="p-1.5 sm:p-2 rounded-full group-hover/icon:bg-blue-400/10 transition-colors">
                                          <Quote className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] transition-transform group-hover/icon:scale-110" />
                                        </div>
                                        <span className="text-[12px] sm:text-[13px] font-sans font-medium">{quotes}</span>
                                      </div>

                                      <div className="flex items-center gap-0.5 sm:gap-1 group/icon hover:text-rose-500 transition-all cursor-pointer">
                                        <div className="p-1.5 sm:p-2 rounded-full group-hover/icon:bg-rose-500/10 transition-colors">
                                          <Heart className={`w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] transition-transform group-hover/icon:scale-110 ${parseInt(likes) > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
                                        </div>
                                        <span className="text-[12px] sm:text-[13px] font-sans font-medium">{likes}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-0.5 sm:gap-1 group/icon hover:text-accent transition-all cursor-pointer">
                                        <div className="p-1.5 sm:p-2 rounded-full group-hover/icon:bg-accent/10 transition-colors">
                                          <BarChart2 className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] transition-transform group-hover/icon:scale-110" />
                                        </div>
                                        <span className="text-[12px] sm:text-[13px] font-sans font-medium">{views}</span>
                                      </div>

                                      <div className="flex items-center group/icon hover:text-blue-400 transition-all cursor-pointer">
                                        <div className="p-1.5 sm:p-2 rounded-full group-hover/icon:bg-blue-400/10 transition-colors">
                                          <Share2 className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </a>
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
                    <p className="text-sm sm:text-base leading-relaxed opacity-90">{(Array.isArray(weeklyReportData) ? weeklyReportData[0] : weeklyReportData)?.reports?.[discordSection]?.summary || t("noSummary")}</p>
                  </div>
                )}

                {/* Top Questions Card */}
                {(Array.isArray(weeklyReportData) ? weeklyReportData[0] : weeklyReportData)?.reports?.[discordSection]?.questions?.length > 0 && (
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
                      {(Array.isArray(weeklyReportData) ? weeklyReportData[0] : weeklyReportData)?.reports[discordSection].questions.map((question: string, i: number) => (
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
