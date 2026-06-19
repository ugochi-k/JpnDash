import React, { useState, useMemo } from "react";
import { Database, TrendingUp, LineChart as LineChartIcon, ChevronRight, Search, X } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ---- ダミーデータ（月次・12ヶ月）。実数を保持し、表示時に指数化(基準=100)も選べる ----
const MONTHS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

const CATEGORIES = [
  {
    name: "データ一覧",
    Icon: Database,
    iconColor: "#E8B04B",
    subcategories: [
      {
        name: "マクロ指標",
        Icon: LineChartIcon,
        iconColor: "#9B8CFF",
        items: [
          { key: "gdp",    label: "実質GDP",      detail: "国内総生産（実質）", unit: "兆円", color: "#E0708A", raw: [557,559,561,560,563,566,565,568,571,570,573,576] },
          { key: "cpi",    label: "消費者物価",   detail: "消費者物価指数（総合）", unit: "指数", color: "#9B8CFF", raw: [106.0,106.4,107.2,107.5,108.1,108.6,109.0,109.3,109.7,110.1,110.4,110.9] },
          { key: "unemp",  label: "完全失業率",   detail: "完全失業率（男女計）", unit: "%",    color: "#C98E5A", raw: [2.4,2.5,2.6,2.5,2.6,2.4,2.5,2.7,2.6,2.5,2.4,2.5] },
          { key: "ip",     label: "鉱工業生産",   detail: "鉱工業生産指数（季調値）", unit: "指数", color: "#5AA9C9", raw: [103.1,102.4,104.0,103.6,105.2,104.8,106.1,105.5,107.0,106.4,108.2,107.9] },
          { key: "wage",   label: "実質賃金",     detail: "実質賃金指数（現金給与総額）", unit: "指数", color: "#7BB66E", raw: [99.2,98.8,99.5,99.1,99.8,100.2,99.9,100.5,100.1,100.7,101.0,101.4] },
        ]
      },
      {
        name: "金融市場",
        Icon: TrendingUp,
        iconColor: "#4FB6A8",
        items: [
          { key: "usdjpy", label: "USD/JPY",     detail: "米ドル対円相場（日中値）", unit: "円",   color: "#E8B04B", raw: [141,143,148,152,157,156,161,149,146,151,154,158] },
          { key: "nikkei", label: "日経平均",     detail: "日経平均株価", unit: "円",   color: "#4FB6A8", raw: [33400,36800,39900,38200,38700,39100,42000,38800,39200,40500,41200,42800] },
          { key: "rate",   label: "政策金利",     detail: "日銀政策金利", unit: "%",    color: "#6FA8E0", raw: [-0.1,-0.1,0.0,0.1,0.1,0.25,0.25,0.25,0.5,0.5,0.5,0.75] },
          { key: "jgb10",  label: "長期金利",     detail: "新発10年国債利回り", unit: "%",    color: "#D98E4F", raw: [0.6,0.7,0.85,0.9,1.0,1.05,1.1,0.95,1.0,1.15,1.2,1.3] },
          { key: "topix",  label: "TOPIX",       detail: "東証株価指数", unit: "pt",   color: "#8E7BD9", raw: [2370,2620,2780,2700,2740,2760,2920,2710,2750,2830,2880,2980] },
        ]
      },
    ]
  },
];

const SERIES = CATEGORIES.flatMap(c => c.subcategories.flatMap(sc => sc.items));

export default function JapanDashboard() {
  const [active, setActive] = useState(["usdjpy", "nikkei", "cpi"]);
  const [open, setOpen] = useState(new Set()); // start all closed
  const [subOpen, setSubOpen] = useState(new Set()); // track subcategory state
  const [period, setPeriod] = useState(12); // 6 / 12 months window
  const [query, setQuery] = useState("");

  // いずれかのカテゴリが開いている = リスト閲覧モード（グラフを上にスライドして畳む）
  const listMode = open.size > 0 || query.trim().length > 0;

  // 指標が1つなら実数、複数なら指数化（基準=100）
  const mode = active.length <= 1 ? "raw" : "index";

  const toggle = (k) =>
    setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  const toggleCat = (cat) => {
    const next = new Set(open);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    setOpen(next);
  };

  const toggleSubCat = (subcat) => {
    const next = new Set(subOpen);
    next.has(subcat) ? next.delete(subcat) : next.add(subcat);
    setSubOpen(next);
  };

  const matches = (s) =>
    !query ||
    s.label.toLowerCase().includes(query.toLowerCase()) ||
    s.detail.toLowerCase().includes(query.toLowerCase());

  const chartData = useMemo(() => {
    const start = MONTHS.length - period;
    return MONTHS.slice(start).map((m, i) => {
      const row = { m };
      SERIES.forEach((s) => {
        if (!active.includes(s.key)) return;
        const base = s.raw[start]; // 表示期間の起点を基準=100に
        row[s.key] = mode === "index"
          ? Math.round((s.raw[start + i] / base) * 1000) / 10
          : s.raw[start + i];
      });
      return row;
    });
  }, [active, mode, period]);

  const latest = (s) => s.raw[s.raw.length - 1];
  const chg = (s) => {
    const start = MONTHS.length - period;
    const d = ((s.raw[s.raw.length - 1] / s.raw[start]) - 1) * 100;
    return Math.round(d * 10) / 10;
  };

  const activeSeries = SERIES.filter(s => active.includes(s.key));

  return (
    <div style={S.app}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        button:focus-visible, input:focus-visible {
          outline: 2px solid #2563EB; outline-offset: 2px;
        }
        .jd-scroll::-webkit-scrollbar { width: 8px; }
        .jd-scroll::-webkit-scrollbar-thumb { background: #D7DBE0; border-radius: 8px; }
        .jd-collapse {
          transition: max-height 0.34s cubic-bezier(0.4,0,0.2,1),
                      opacity 0.24s ease, margin 0.34s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; }
        }
      `}</style>
      <div style={S.phone} className="jd-scroll">
        <div style={S.stickyTop}>
          {/* チャート：リスト閲覧モードでは上にスライドして畳む */}
          <div
            className="jd-collapse"
            style={{
              maxHeight: listMode ? 0 : 620,
              opacity: listMode ? 0 : 1,
              marginBottom: listMode ? 0 : 10,
            }}
          >
            <div style={S.chartCard}>
              <div style={S.controlRow}>
                <div style={S.periodGroup}>
                  {[6, 12].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      style={{ ...S.periodBtn, ...(period === p ? S.periodBtnOn : {}) }}
                    >
                      {p}ヶ月
                    </button>
                  ))}
                </div>
                {active.length > 0 && (
                  <span style={S.modeTag}>{mode === "index" ? "指数化 (基準=100)" : "実数"}</span>
                )}
              </div>
              {active.length === 0 ? (
                <div style={S.empty}>
                  下のリストから指標を選ぶと、ここに重ねて表示されます
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={208}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    {mode === "index" && (
                      <ReferenceLine y={100} stroke="#E2E5EA" strokeDasharray="4 4" />
                    )}
                    <XAxis
                      dataKey="m" tick={{ fill: "#9AA0AB", fontSize: 11 }}
                      axisLine={false} tickLine={false} interval={1}
                      tickFormatter={(m) => `${m}月`}
                    />
                    <YAxis
                      tick={{ fill: "#9AA0AB", fontSize: 11 }}
                      axisLine={false} tickLine={false} width={42}
                      tickFormatter={(v) =>
                        Math.abs(v) >= 10000 ? `${Math.round(v / 1000)}k` : v
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF", border: "1px solid #EAECEF",
                        borderRadius: 12, fontSize: 12, color: "#1A1F2B",
                        boxShadow: "0 6px 24px rgba(20,30,50,0.10)",
                      }}
                      labelFormatter={(m) => `${m}月`}
                      formatter={(val, key) => {
                        const s = SERIES.find((x) => x.key === key);
                        const text = mode === "index"
                          ? `${val}（${val >= 100 ? "+" : ""}${Math.round((val - 100) * 10) / 10}%）`
                          : `${fmt(val)} ${s?.unit ?? ""}`;
                        return [text, s?.label ?? key];
                      }}
                    />
                    {activeSeries.map((s) => (
                      <Line
                        key={s.key} type="monotone" dataKey={s.key}
                        stroke={s.color} strokeWidth={2.4} dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 凡例：チャート外の独立カードに切り出し。指標が増えてもチャートを圧迫しない */}
            {active.length > 0 && (
              <div style={S.legendCard}>
                <div style={S.legendHead}>
                  <span style={S.legendTitle}>表示中の指標 {active.length}</span>
                  <button onClick={() => setActive([])} style={S.clearBtn}>すべて解除</button>
                </div>
                <div style={S.legend}>
                  {activeSeries.map(s => (
                    <button key={s.key} onClick={() => toggle(s.key)} style={S.legendChip}>
                      <span style={{ ...S.legendDot, background: s.color }} />
                      {s.label}
                      <span style={S.legendX}>×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* データ一覧ヘッダー（常に上部・stickyのまま） */}
          {CATEGORIES.map((cat) => {
            const isOpen = open.has(cat.name);
            const preview = cat.subcategories?.flatMap(sc => sc.items).filter(s => active.includes(s.key)) || [];
            return (
              <button key={cat.name} onClick={() => toggleCat(cat.name)} style={S.accHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <span style={{ ...S.iconWrap, background: cat.iconColor + "22" }}>
                    <cat.Icon size={18} color={cat.iconColor} />
                  </span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={S.accTitle}>{cat.name}</div>
                    {!isOpen && (
                      <div style={S.accPreview}>
                        {preview.length > 0
                          ? preview.map(s => s.label).join("・")
                          : <span style={{ color: "#B6BBC4" }}>指標を選択してください</span>
                        }
                      </div>
                    )}
                  </div>
                </div>
                {preview.length > 0 && (
                  <span style={{ ...S.countBadge, background: cat.iconColor }}>{preview.length}</span>
                )}
                <ChevronRight size={18} color="#A6ACB6"
                  style={{ ...S.chevron, ...(isOpen ? S.chevronOpen : {}) }} />
              </button>
            );
          })}

          {/* 検索バー：カテゴリ展開とは独立。リスト閲覧モード中は常に表示 */}
          {listMode && (
            <div style={S.searchWrap}>
              <Search size={16} color="#A6ACB6" style={{ flexShrink: 0 }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="指標を検索"
                style={S.searchInput}
              />
              {query && (
                <button onClick={() => setQuery("")} style={S.searchClear} aria-label="検索をクリア">
                  <X size={15} color="#A6ACB6" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* カテゴリ中身（スクロール可） */}
        <div style={S.accordion}>
          {CATEGORIES.map((cat) => {
            const searching = query.trim().length > 0;
            const isOpen = searching || open.has(cat.name);
            if (!isOpen) return null;
            const hasMatch = cat.subcategories.some(sc => sc.items.some(matches));
            if (searching && !hasMatch) return null;
            return (
              <div key={cat.name} style={S.accItem}>
                <div style={S.accContent}>
                  {cat.subcategories.map((subcat) => {
                    const subItems = subcat.items.filter(matches);
                    if (searching && subItems.length === 0) return null;
                    const isSubOpen = searching || subOpen.has(subcat.name);
                    const subPreview = subcat.items.filter(s => active.includes(s.key));
                    return (
                      <div key={subcat.name} style={S.subAccItem}>
                        <button onClick={() => toggleSubCat(subcat.name)} style={S.subAccHeader}>
                          <span style={{ ...S.subIconWrap, background: subcat.iconColor + "22" }}>
                            <subcat.Icon size={15} color={subcat.iconColor} />
                          </span>
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <div style={S.subAccTitle}>{subcat.name}</div>
                            {!isSubOpen && !searching && (
                              <div style={S.accPreview}>
                                {subPreview.length > 0
                                  ? subPreview.map(s => s.label).join("・")
                                  : <span style={{ color: "#B6BBC4" }}>未選択</span>
                                }
                              </div>
                            )}
                          </div>
                          {subPreview.length > 0 && (
                            <span style={{ ...S.countBadge, background: subcat.iconColor }}>{subPreview.length}</span>
                          )}
                          <ChevronRight size={16} color="#A6ACB6"
                            style={{ ...S.chevron, ...(isSubOpen ? S.chevronOpen : {}) }} />
                        </button>
                        {isSubOpen && (
                          <div style={S.subAccContent}>
                            {subItems.map((s) => {
                              const on = active.includes(s.key);
                              return (
                                <button
                                  key={s.key}
                                  onClick={() => toggle(s.key)}
                                  style={{
                                    ...S.row,
                                    ...(on ? { background: s.color + "0F", borderColor: s.color + "55" } : {}),
                                  }}
                                >
                                  <span style={{ ...S.swatch, background: on ? s.color : "#D7DBE0" }} />
                                  <div style={{ flex: 1, textAlign: "left" }}>
                                    <div style={S.rowLabel}>{s.label}</div>
                                    <div style={S.rowSub}>{s.detail}</div>
                                  </div>
                                  <div style={{ textAlign: "right", marginRight: 4 }}>
                                    <div style={S.chg}>{fmt(latest(s))} <span style={S.unit}>{s.unit}</span></div>
                                    <div style={{ ...S.deltaBadge, color: chg(s) >= 0 ? "#0E9F6E" : "#E02424" }}>
                                      {chg(s) >= 0 ? "▲" : "▼"} {Math.abs(chg(s))}%
                                    </div>
                                  </div>
                                  <span style={{ ...S.check, ...(on ? { ...S.checkOn, background: s.color, borderColor: s.color } : {}) }}>
                                    {on ? "✓" : ""}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {query.trim() && SERIES.filter(matches).length === 0 && (
            <div style={S.noResults}>「{query}」に一致する指標がありません</div>
          )}
        </div>

        <div style={S.foot}>e-Stat / 日本銀行 / 市場データ を集約 ・ 最終更新 6月18日</div>
      </div>
    </div>
  );
}

function fmt(n) {
  if (Math.abs(n) >= 1000) return n.toLocaleString("ja-JP");
  return n;
}

const S = {
  app: {
    minHeight: "100vh", background: "#EEF0F4", display: "flex",
    justifyContent: "center", padding: "24px 0",
    fontFamily: "-apple-system, 'Hiragino Sans', system-ui, sans-serif",
  },
  phone: {
    width: 390, maxWidth: "100%", background: "#F7F8FA",
    height: 760, borderRadius: 28, padding: "22px 16px 28px",
    border: "1px solid #E4E7EC", boxShadow: "0 12px 40px rgba(20,30,50,0.08)",
    overflowY: "auto",
  },
  modeTag: {
    display: "inline-flex", alignItems: "center",
    background: "#1A1F2B", color: "#fff", borderRadius: 99,
    padding: "4px 11px", fontSize: 11, fontWeight: 700,
  },

  stickyTop: {
    position: "sticky", top: 0, zIndex: 10, background: "#F7F8FA",
    paddingTop: 4, paddingBottom: 10, display: "flex", flexDirection: "column", gap: 10,
  },
  chartCard: {
    background: "#FFFFFF", border: "1px solid #EAECEF",
    borderRadius: 18, padding: "14px 10px 10px",
    boxShadow: "0 2px 12px rgba(20,30,50,0.04)",
  },
  controlRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 4px 10px",
  },
  periodGroup: {
    display: "flex", gap: 3, background: "#F0F2F5", borderRadius: 9, padding: 3,
  },
  periodBtn: {
    border: "none", background: "transparent", color: "#6B7280",
    fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 7,
    cursor: "pointer", transition: "all 0.15s",
  },
  periodBtnOn: { background: "#FFFFFF", color: "#161B26", boxShadow: "0 1px 3px rgba(20,30,50,0.12)" },

  legendCard: {
    background: "#FFFFFF", border: "1px solid #EAECEF", borderRadius: 16,
    padding: "12px 12px 10px", marginTop: 10,
    boxShadow: "0 1px 3px rgba(20,30,50,0.04)",
  },
  legendHead: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8, padding: "0 2px",
  },
  legendTitle: { fontSize: 12.5, fontWeight: 700, color: "#3B4252" },
  clearBtn: {
    border: "1px solid #E4E7EC", background: "#FFFFFF", color: "#6B7280",
    fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 8, cursor: "pointer",
  },
  legend: { display: "flex", flexWrap: "wrap", gap: 6 },
  legendChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#F2F4F7", border: "none", borderRadius: 99, padding: "4px 8px 4px 10px",
    fontSize: 11.5, fontWeight: 600, color: "#3B4252", cursor: "pointer",
  },
  legendX: { color: "#A6ACB6", fontSize: 13, fontWeight: 700, marginLeft: 1 },
  legendDot: { width: 8, height: 8, borderRadius: 99 },
  empty: {
    height: 208, display: "flex", alignItems: "center", justifyContent: "center",
    textAlign: "center", color: "#A6ACB6", fontSize: 13, padding: "0 24px",
  },

  searchWrap: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#FFFFFF", border: "1px solid #E8EAEF", borderRadius: 12,
    padding: "10px 12px", boxShadow: "0 1px 3px rgba(20,30,50,0.04)",
  },
  searchInput: {
    flex: 1, border: "none", outline: "none", background: "transparent",
    fontSize: 14, color: "#1A1F2B",
    fontFamily: "inherit",
  },
  searchClear: {
    border: "none", background: "transparent", cursor: "pointer",
    display: "flex", padding: 0,
  },

  accordion: { display: "flex", flexDirection: "column", gap: 10, marginTop: 0 },
  accItem: {},
  accHeader: {
    width: "100%", border: "1px solid #E8EAEF", background: "#FFFFFF",
    borderRadius: 16, padding: "14px 14px", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 1px 3px rgba(20,30,50,0.04)",
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 11, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  subIconWrap: {
    width: 30, height: 30, borderRadius: 9, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 10,
  },
  accTitle: { color: "#1A1F2B", fontSize: 15.5, fontWeight: 700 },
  subAccTitle: { color: "#2A2F3B", fontSize: 14, fontWeight: 700 },
  accPreview: { color: "#7A828F", fontSize: 12, marginTop: 2, lineHeight: 1.4 },
  countBadge: {
    minWidth: 20, height: 20, borderRadius: 99, color: "#fff",
    fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center",
    justifyContent: "center", padding: "0 6px", flexShrink: 0,
  },
  chevron: { transition: "transform 0.2s ease", flexShrink: 0 },
  chevronOpen: { transform: "rotate(90deg)" },
  accContent: { display: "flex", flexDirection: "column", gap: 8, marginTop: 0 },

  subAccItem: {},
  subAccHeader: {
    width: "100%", border: "1px solid #EAECEF", background: "#FBFCFD",
    borderRadius: 13, padding: "11px 12px", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 8,
  },
  subAccContent: { display: "flex", flexDirection: "column", gap: 7, marginTop: 7, paddingLeft: 6 },

  row: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#FFFFFF", border: "1px solid #EAECEF", borderRadius: 13,
    padding: "12px 14px", cursor: "pointer", width: "100%",
    transition: "background 0.15s, border-color 0.15s",
  },
  swatch: { width: 5, height: 34, borderRadius: 4, flexShrink: 0 },
  rowLabel: { color: "#1A1F2B", fontSize: 15, fontWeight: 700 },
  rowSub: { color: "#9AA0AB", fontSize: 11, marginTop: 2 },
  chg: { fontSize: 14, fontWeight: 700, color: "#1A1F2B", fontVariantNumeric: "tabular-nums" },
  unit: { fontSize: 11, fontWeight: 600, color: "#9AA0AB" },
  deltaBadge: { fontSize: 11.5, fontWeight: 700, marginTop: 3, fontVariantNumeric: "tabular-nums" },
  check: {
    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
    border: "1.5px solid #D7DBE0", background: "#fff",
    color: "#fff", fontSize: 14, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  },
  checkOn: {},

  foot: { color: "#A6ACB6", fontSize: 11, textAlign: "center", marginTop: 24 },
  noResults: { textAlign: "center", color: "#A6ACB6", fontSize: 13, padding: "24px 0" },
};
