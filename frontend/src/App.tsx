import { loadDashboard } from "./services/windApi";
import { useEffect, useState } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import DecisionView from "./pages/DecisionView";
import AccuracyView from "./pages/AccuracyView";
import MethodologyView from "./pages/MethodologyView";
import { shortDate } from "./lib/presentation";
import type { Accuracy, Coverage, Decision } from "./types";

type View = "decision" | "accuracy" | "methodology";
const views: Record<
  View,
  { label: string; title: string; description: string }
> = {
  decision: {
    label: "Decision overview",
    title: "Day-ahead wind outlook",
    description:
      "Review the wind forecast available before the purchase cutoff.",
  },
  accuracy: {
    label: "Forecast accuracy",
    title: "Forecast performance",
    description:
      "Quantify the gap between decision-time forecasts and reported wind outturn.",
  },
  methodology: {
    label: "Data & methodology",
    title: "Sources, timing and assumptions",
    description:
      "Understand what the pilot measures and how each result is calculated.",
  },
};

function LoadingView() {
  return (
    <div
      className="loading-layout"
      role="status"
      aria-label="Loading historical wind data"
    >
      <span className="sr-only">Loading historical wind data</span>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<View>("decision");
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
    loadDashboard(date, range, controller.signal)
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
  const deliveryDate = new Date(
    new Date(date + "T12:00:00Z").getTime() + 86400000,
  )
    .toISOString()
    .slice(0, 10);

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead-inner">
          <a className="wordmark" href="/" aria-label="Wind Desk home">
            Wind Desk<span>Power market analytics</span>
          </a>
          <div className="market-context">
            <span>Great Britain</span>
            <span>January 2026 pilot</span>
          </div>
        </div>
      </header>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as View)}
        className="workspace-tabs"
      >
        <div className="nav-bar">
          <div className="nav-inner">
            <TabsList variant="line" aria-label="Workspace views">
              {(Object.keys(views) as View[]).map((view) => (
                <TabsTrigger key={view} value={view}>
                  {views[view].label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Badge variant="outline">Historical replay</Badge>
          </div>
        </div>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <h1>{views[tab].title}</h1>
              <p>{views[tab].description}</p>
            </div>
            {tab !== "methodology" && (
              <Button variant="outline" asChild>
                <a
                  href={`/api/export?from=${exportRange.from}&to=${exportRange.to}`}
                >
                  <Download data-icon="inline-start" />
                  Export CSV
                </a>
              </Button>
            )}
          </div>

          {tab === "decision" && (
            <section className="date-toolbar" aria-label="Decision context">
              <FieldGroup className="decision-fields">
                <Field className="date-field">
                  <FieldLabel htmlFor="decision-date">
                    Purchase decision date
                  </FieldLabel>
                  <div className="date-input-row">
                    <Input
                      id="decision-date"
                      type="date"
                      min="2026-01-01"
                      max="2026-01-31"
                      value={date}
                      onInput={(e) => {
                        if (e.currentTarget.value)
                          setDate(e.currentTarget.value);
                      }}
                    />
                    <div className="date-arrows">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Previous decision day"
                        disabled={date <= "2026-01-01"}
                        onClick={() => moveDay(-1)}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Next decision day"
                        disabled={date >= "2026-01-31"}
                        onClick={() => moveDay(1)}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                </Field>
              </FieldGroup>
              <div className="context-value">
                <span>Purchase cutoff</span>
                <strong>
                  {coverage?.decisionCutoffLocal ?? "—"} <small>GMT</small>
                </strong>
              </div>
              <div className="context-value delivery-value">
                <span>Next-day delivery</span>
                <strong>
                  {shortDate(deliveryDate)} <small>2026</small>
                </strong>
              </div>
              <div className="context-explanation">
                Only publications available
                <br />
                at the original cutoff are selected.
              </div>
            </section>
          )}

          {tab === "accuracy" && (
            <section
              className="date-toolbar range-toolbar"
              aria-label="Accuracy date range"
            >
              <FieldGroup className="range-fields">
                <Field>
                  <FieldLabel htmlFor="range-from">
                    First decision date
                  </FieldLabel>
                  <Input
                    id="range-from"
                    type="date"
                    min="2026-01-01"
                    max={range.to}
                    value={range.from}
                    onInput={(e) => {
                      if (e.currentTarget.value)
                        setRange({ ...range, from: e.currentTarget.value });
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="range-to">Last decision date</FieldLabel>
                  <Input
                    id="range-to"
                    type="date"
                    min={range.from}
                    max="2026-01-31"
                    value={range.to}
                    onInput={(e) => {
                      if (e.currentTarget.value)
                        setRange({ ...range, to: e.currentTarget.value });
                    }}
                  />
                </Field>
              </FieldGroup>
              <p className="context-explanation">
                Each forecast is scored against the following day’s outturn.
                <br />
                January 31 decisions include February 1 delivery.
              </p>
            </section>
          )}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Historical data could not be loaded</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry loading data
                </Button>
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <LoadingView />
          ) : (
            <>
              <TabsContent value="decision">
                {decision && (
                  <DecisionView
                    decision={decision}
                    actuals={actuals}
                    setActuals={setActuals}
                    date={date}
                    onAccuracy={() => setTab("accuracy")}
                  />
                )}
              </TabsContent>
              <TabsContent value="accuracy">
                {accuracy && (
                  <AccuracyView
                    accuracy={accuracy}
                    onInspect={(value) => {
                      setDate(value);
                      setActuals(true);
                      setTab("decision");
                    }}
                  />
                )}
              </TabsContent>
              <TabsContent value="methodology">
                <MethodologyView coverage={coverage} />
              </TabsContent>
            </>
          )}
          <footer className="page-footer">
            <span>
              Wind Desk <span className="footer-divider">/</span> January 2026
              pilot
            </span>
            <span>
              Elexon WINDFOR & FUELHH <span className="footer-divider">/</span>{" "}
              All times GMT
            </span>
          </footer>
        </main>
      </Tabs>
    </div>
  );
}
