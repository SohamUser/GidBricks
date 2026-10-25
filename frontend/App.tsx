import DecisionView from "./DecisionView";
import AccuracyView from "./AccuracyView";
import MethodologyView from "./MethodologyView";
import { shortDate } from "./shared";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Gauge,
  Layers3,
  Wind,
} from "lucide-react";
import type { Accuracy, Coverage, Decision } from "./types";

async function get<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Request failed (${response.status})`);
  }
  return response.json();
}

export default function App() {
  const [tab, setTab] = useState<"decision" | "accuracy" | "methodology">(
    "decision",
  );
  const [date, setDate] = useState("2026-01-15");
  const [range, setRange] = useState({ from: "2026-01-01", to: "2026-01-31" });
  const [decision, setDecision] = useState<Decision | null>(null);
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [actuals, setActuals] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      get<Decision>(`/api/decision?date=${date}`, controller.signal),
      get<Accuracy>(
        `/api/accuracy?from=${range.from}&to=${range.to}`,
        controller.signal,
      ),
      get<Coverage>("/api/coverage", controller.signal),
    ])
      .then(([day, score, source]) => {
        setDecision(day);
        setAccuracy(score);
        setCoverage(source);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, range.from, range.to, retry]);

  function moveDay(amount: number) {
    const next = new Date(date + "T12:00:00Z");
    next.setUTCDate(next.getUTCDate() + amount);
    setDate(next.toISOString().slice(0, 10));
  }

  const exportRange = tab === "decision" ? { from: date, to: date } : range;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Wind Desk home">
          <span className="brand-mark">
            <Wind size={25} />
          </span>
          <span>
            wind<span className="brand-light">desk</span>
            <small>ENERGY INTELLIGENCE</small>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <Layers3 size={17} />
          </span>
          <div>
            GB trading desk<small>National wind portfolio</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          <button
            className={tab === "decision" ? "active" : ""}
            onClick={() => setTab("decision")}
          >
            <Wind size={18} />
            Decision overview
            <span className="nav-indicator" />
          </button>
          <button
            className={tab === "accuracy" ? "active" : ""}
            onClick={() => setTab("accuracy")}
          >
            <Gauge size={18} />
            Forecast accuracy
          </button>
          <button
            className={tab === "methodology" ? "active" : ""}
            onClick={() => setTab("methodology")}
          >
            <Database size={18} />
            Data & methodology
          </button>
        </nav>
        <div className="pilot-note">
          <span className="pilot-tag">JANUARY PILOT</span>
          <h3>A clearer view of tomorrow.</h3>
          <p>Wind forecasts, grounded in what was known at decision time.</p>
          <span className="pilot-period">01 — 31 JAN 2026</span>
          <Wind className="pilot-wind" size={80} />
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">GB</span>
          <div>
            Great Britain<small>Europe/London · GMT</small>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <ChevronRight size={13} />
            <span>
              {tab === "decision"
                ? "Decision overview"
                : tab === "accuracy"
                  ? "Forecast accuracy"
                  : "Data & methodology"}
            </span>
          </div>
          <span className="snapshot-badge">
            <span />
            Historical replay <span className="separator">|</span> January 2026
          </span>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="section-kicker">DAY-AHEAD WIND INTELLIGENCE</div>
              <h1>
                {tab === "decision"
                  ? "Tomorrow, with perspective."
                  : tab === "accuracy"
                    ? "Measure the uncertainty."
                    : "Know what’s behind the numbers."}
              </h1>
              <p>
                {tab === "decision"
                  ? "The wind outlook available before your day-ahead purchase decision."
                  : tab === "accuracy"
                    ? "A transparent backtest of the forecasts available at 09:50 UK time."
                    : "Two Elexon datasets. One reproducible view of the January trading window."}
              </p>
            </div>
            <a
              className="export-button"
              href={`/api/export?from=${exportRange.from}&to=${exportRange.to}`}
            >
              <ArrowDownToLine size={16} />
              Export data
            </a>
          </div>

          {tab === "decision" && (
            <section className="date-toolbar">
              <div className="decision-picker">
                <CalendarDays size={18} />
                <div>
                  <label htmlFor="decision-date">Decision date</label>
                  <input
                    id="decision-date"
                    type="date"
                    min="2026-01-01"
                    max="2026-01-31"
                    value={date}
                    onChange={(e) => {
                      if (e.target.value) setDate(e.target.value);
                    }}
                  />
                </div>
                <div className="date-arrows">
                  <button
                    aria-label="Previous decision day"
                    disabled={date <= "2026-01-01"}
                    onClick={() => moveDay(-1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next decision day"
                    disabled={date >= "2026-01-31"}
                    onClick={() => moveDay(1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="cutoff-chip">
                <Clock3 size={15} />
                <span>
                  Decision cutoff <strong>09:50 GMT</strong>
                </span>
              </div>
              <ArrowRight size={18} className="delivery-arrow" />
              <div className="delivery-date">
                <span>DELIVERY DAY</span>
                <strong>
                  {shortDate(
                    new Date(new Date(date + "T12:00Z").getTime() + 86400000)
                      .toISOString()
                      .slice(0, 10),
                  )}{" "}
                  2026
                </strong>
              </div>
            </section>
          )}
          {tab === "accuracy" && (
            <section className="date-toolbar range-toolbar">
              <CalendarDays size={18} />
              <label>
                Decision dates{" "}
                <input
                  aria-label="First decision date"
                  type="date"
                  min="2026-01-01"
                  max={range.to}
                  value={range.from}
                  onChange={(e) => {
                    if (e.target.value)
                      setRange({ ...range, from: e.target.value });
                  }}
                />
              </label>
              <span>to</span>
              <input
                aria-label="Last decision date"
                type="date"
                min={range.from}
                max="2026-01-31"
                value={range.to}
                onChange={(e) => {
                  if (e.target.value)
                    setRange({ ...range, to: e.target.value });
                }}
              />
              <span className="range-note">
                Scored at the original decision cutoff
              </span>
            </section>
          )}

          {error ? (
            <div className="error-state" role="alert">
              <h2>We couldn’t load the snapshot</h2>
              <p>{error}</p>
              <button onClick={() => setRetry(retry + 1)}>Try again</button>
            </div>
          ) : loading ? (
            <div className="loading-state" role="status">
              Loading the historical wind snapshot…
            </div>
          ) : (
            <>
              {tab === "decision" && decision && (
                <DecisionView
                  decision={decision}
                  actuals={actuals}
                  setActuals={setActuals}
                  date={date}
                  onAccuracy={() => setTab("accuracy")}
                />
              )}
              {tab === "accuracy" && accuracy && (
                <AccuracyView
                  accuracy={accuracy}
                  onInspect={(value) => {
                    setDate(value);
                    setActuals(true);
                    setTab("decision");
                  }}
                />
              )}
              {tab === "methodology" && <MethodologyView coverage={coverage} />}
            </>
          )}
          <footer className="page-footer">
            <span>
              <Wind size={14} />
              winddesk <span> / </span> January 2026 pilot
            </span>
            <span>Elexon data · Great Britain · All times GMT</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
