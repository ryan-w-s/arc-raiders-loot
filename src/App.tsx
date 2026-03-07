import { Search, ShieldCheck, Sparkles, Wrench, X, type LucideIcon } from "lucide-react"
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  formatSellPrice,
  getRarityOptions,
  getVisibleItems,
  normalizeLootItems,
  type LootDataset,
  type LootFilters,
  type LootSort,
  type LootViewItem,
  type RecommendationAction,
} from "@/lib/loot"
import { cn } from "@/lib/utils"

const ACTION_OPTIONS: Array<{ value: RecommendationAction; label: string }> = [
  { value: "keep", label: "Keep" },
  { value: "sell", label: "Sell" },
  { value: "recycle", label: "Recycle" },
]

const SORT_OPTIONS: Array<{ value: LootSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "action", label: "Action" },
  { value: "rarity", label: "Rarity" },
  { value: "price-high", label: "Value high-low" },
  { value: "price-low", label: "Value low-high" },
  { value: "name", label: "Name" },
]

const DEFAULT_FILTERS: LootFilters = {
  query: "",
  sort: "relevance",
  actions: [],
  rarities: [],
  requireKeepReasons: false,
  requireRecycleRewards: false,
}

export function App() {
  const [dataset, setDataset] = useState<LootDataset | null>(null)
  const [filters, setFilters] = useState<LootFilters>(DEFAULT_FILTERS)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let cancelled = false

    async function loadDataset() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/arc-raiders-loot-guide.json`)

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`)
        }

        const nextDataset = (await response.json()) as LootDataset

        if (!cancelled) {
          setDataset(nextDataset)
          setStatus("ready")
        }
      } catch {
        if (!cancelled) {
          setStatus("error")
        }
      }
    }

    void loadDataset()

    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(() => normalizeLootItems(dataset?.items ?? []), [dataset])
  const rarityOptions = useMemo(() => getRarityOptions(dataset?.items ?? []), [dataset])
  const visibleItems = useMemo(() => getVisibleItems(items, filters), [filters, items])
  const activeFilterCount = filters.actions.length + filters.rarities.length + Number(filters.requireKeepReasons) + Number(filters.requireRecycleRewards)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.2),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,23,42,0.6)_45%,rgba(9,12,18,1))]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.75),transparent)]" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
          <Card className="overflow-hidden border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86))]">
            <CardHeader className="gap-4 pb-4 sm:pb-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <Badge className="border-amber-400/35 bg-amber-400/10 text-amber-200">ARC Raiders loot lookup</Badge>
                  <div>
                    <CardTitle className="text-3xl sm:text-4xl">Find the right item decision in seconds</CardTitle>
                    <CardDescription className="mt-2 max-w-2xl text-sm sm:text-base">
                      Search by item name first, then refine by action, rarity, stash value, or crafting usefulness.
                    </CardDescription>
                  </div>
                </div>
                <div className="grid min-w-[13rem] gap-2 text-sm text-[var(--muted-foreground)]">
                  <InfoRow label="Patch" value={dataset?.metadata.compatiblePatch ?? "-"} />
                  <InfoRow label="Updated" value={dataset?.metadata.updatedAt ?? "-"} />
                  <InfoRow label="Items" value={String(dataset?.metadata.totalItems ?? 0)} />
                </div>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  value={filters.query}
                  onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                  className="h-13 rounded-2xl border-white/12 bg-white/6 pl-11 text-base"
                  placeholder="Search item name, material, keep reason, recommendation..."
                  aria-label="Search loot items"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {ACTION_OPTIONS.map((option) => {
                  const active = filters.actions.includes(option.value)

                  return (
                    <FilterChip
                      key={option.value}
                      active={active}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          actions: active
                            ? current.actions.filter((value) => value !== option.value)
                            : [...current.actions, option.value],
                        }))
                      }
                    >
                      {option.label}
                    </FilterChip>
                  )
                })}
                {rarityOptions.map((rarity) => {
                  const active = filters.rarities.includes(rarity)

                  return (
                    <FilterChip
                      key={rarity}
                      active={active}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          rarities: active
                            ? current.rarities.filter((value) => value !== rarity)
                            : [...current.rarities, rarity],
                        }))
                      }
                    >
                      {rarity}
                    </FilterChip>
                  )
                })}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter focus</CardTitle>
              <CardDescription>Keep the result set tight when your stash is full.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ActionStatCard label="Keep" value={dataset?.summary.byPrimaryAction.keep ?? 0} icon={ShieldCheck} tone="keep" />
                <ActionStatCard label="Sell" value={dataset?.summary.byPrimaryAction.sell ?? 0} icon={Sparkles} tone="sell" />
                <ActionStatCard label="Recycle" value={dataset?.summary.byPrimaryAction.recycle ?? 0} icon={Wrench} tone="recycle" />
                <ActionStatCard label="Showing" value={visibleItems.length} icon={Search} tone="neutral" />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Utility filters</p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={filters.requireKeepReasons}
                    onClick={() => setFilters((current) => ({ ...current, requireKeepReasons: !current.requireKeepReasons }))}
                  >
                    Has keep reasons
                  </FilterChip>
                  <FilterChip
                    active={filters.requireRecycleRewards}
                    onClick={() =>
                      setFilters((current) => ({ ...current, requireRecycleRewards: !current.requireRecycleRewards }))
                    }
                  >
                    Has recycle rewards
                  </FilterChip>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]" htmlFor="sort-items">
                  Sort results
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.sort === option.value ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setFilters((current) => ({ ...current, sort: option.value }))}
                      id={option.value === filters.sort ? "sort-items" : undefined}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                disabled={filters.query.length === 0 && activeFilterCount === 0 && filters.sort === DEFAULT_FILTERS.sort}
              >
                <X className="size-4" />
                Reset filters
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <SummaryCard title="Fast path" value={filters.query ? `Top matches for "${filters.query}"` : "Search item names first"} />
          <SummaryCard title="Active filters" value={activeFilterCount ? `${activeFilterCount} enabled` : "No filters applied"} />
          <SummaryCard title="Guide notes" value={`${dataset?.metadata.guideNotes.length ?? 0} stash and economy notes`} />
          <SummaryCard title="Current sort" value={SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ?? "Relevance"} />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Results</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {status === "ready"
                  ? `${visibleItems.length} of ${items.length} items visible`
                  : status === "loading"
                    ? "Loading loot guide..."
                    : "Unable to load loot guide"}
              </p>
            </div>
            {filters.query ? (
              <Badge className="border-sky-400/30 bg-sky-400/10 text-sky-200">Searching: {filters.query}</Badge>
            ) : null}
          </div>

          {status === "loading" ? <LoadingGrid /> : null}
          {status === "error" ? <ErrorState /> : null}
          {status === "ready" && visibleItems.length === 0 ? <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} /> : null}

          {status === "ready" && visibleItems.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleItems.map((item) => (
                <LootCard key={item.id} item={item} query={filters.query} />
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

function LootCard({ item, query }: { item: LootViewItem; query: string }) {
  return (
    <Card className="overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.7))]">
      <CardHeader className="gap-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-xl leading-tight" data-testid="loot-card-title">
              {highlightMatch(item.name, query)}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("border", getActionBadgeClass(item.recommendation.primaryAction))}>
                {item.recommendation.primaryAction}
              </Badge>
              <Badge className={cn("border border-white/10 bg-white/5 text-white", getRarityClass(item.rarity))}>{item.rarity}</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-200">{formatSellPrice(item)}</Badge>
            </div>
          </div>
          {item.matchScore > 0 ? (
            <Badge className="border-sky-400/30 bg-sky-400/10 text-sky-200">Score {item.matchScore}</Badge>
          ) : null}
        </div>
        <CardDescription>{item.recommendation.raw}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Rules" value={item.recommendation.actions.length} />
          <Metric label="Keep uses" value={item.keepReasons.length} />
          <Metric label="Recycle mats" value={item.recycleRewards.length} />
        </div>

        <Separator />

        <div className="grid gap-4 lg:grid-cols-2">
          <InfoBlock title="Keep for" emptyLabel="No keep reasons listed">
            {item.keepReasons.map((reason) => (
              <li key={reason}>{highlightMatch(reason, query)}</li>
            ))}
          </InfoBlock>
          <InfoBlock title="Recycle into" emptyLabel="No recycle rewards listed">
            {item.recycleRewards.map((reward) => {
              const label = reward.quantity ? `${reward.quantity}x ${reward.item}` : reward.item
              return <li key={label}>{highlightMatch(label, query)}</li>
            })}
          </InfoBlock>
        </div>

        {item.recommendation.actions.length > 1 ? (
          <div className="space-y-2 rounded-xl border border-white/8 bg-white/4 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Conditional rules</p>
            <ul className="space-y-2 text-sm text-slate-200">
              {item.recommendation.actions.map((rule) => (
                <li key={`${rule.action}-${rule.condition}`} className="flex items-start gap-2">
                  <span className={cn("mt-1 size-2 rounded-full", getActionDotClass(rule.action))} />
                  <span>{highlightMatch(rule.condition, query)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function InfoBlock({
  title,
  emptyLabel,
  children,
}: {
  title: string
  emptyLabel: string
  children: ReactNode
}) {
  const items = Array.isArray(children) ? children : [children]
  const hasEntries = items.some(Boolean)

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{title}</p>
      {hasEntries ? <ul className="space-y-2 text-sm text-slate-100">{children}</ul> : <p className="text-sm text-[var(--muted-foreground)]">{emptyLabel}</p>}
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-white/8 bg-white/4">
      <CardContent className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{title}</p>
        <p className="text-sm font-medium text-slate-100">{value}</p>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
      <span>{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function ActionStatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone: "keep" | "sell" | "recycle" | "neutral"
}) {
  return (
    <div className={cn("rounded-xl border p-3", getToneClass(tone))}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
        <Icon className="size-4" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function FilterChip({ active, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn("rounded-full", className)}
      {...props}
    />
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="h-72 animate-pulse border-white/8 bg-white/4" />
      ))}
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="border-dashed border-white/12 bg-white/4">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Search className="size-8 text-[var(--muted-foreground)]" />
        <div>
          <p className="text-lg font-semibold">No matching loot items</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Try a broader search or clear some filters.</p>
        </div>
        <Button variant="outline" onClick={onReset}>
          Reset filters
        </Button>
      </CardContent>
    </Card>
  )
}

function ErrorState() {
  return (
    <Card className="border-rose-500/20 bg-rose-500/8">
      <CardContent className="py-10">
        <p className="text-lg font-semibold text-rose-100">Could not load the loot dataset</p>
        <p className="mt-2 text-sm text-rose-100/80">The app expects `public/data/arc-raiders-loot-guide.json` to be available in the deployed site.</p>
      </CardContent>
    </Card>
  )
}

function highlightMatch(value: string, query: string) {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return value
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "ig")
  const parts = value.split(pattern)

  return parts.map((part, index) =>
    part.toLowerCase() === trimmedQuery.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-300/25 px-0.5 text-amber-50">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getActionBadgeClass(action: RecommendationAction) {
  if (action === "keep") {
    return "border-emerald-400/40 bg-emerald-400/12 text-emerald-100"
  }

  if (action === "sell") {
    return "border-amber-400/40 bg-amber-400/12 text-amber-100"
  }

  if (action === "recycle") {
    return "border-sky-400/40 bg-sky-400/12 text-sky-100"
  }

  return "border-slate-400/40 bg-slate-400/12 text-slate-100"
}

function getActionDotClass(action: RecommendationAction) {
  if (action === "keep") {
    return "bg-emerald-300"
  }

  if (action === "sell") {
    return "bg-amber-300"
  }

  if (action === "recycle") {
    return "bg-sky-300"
  }

  return "bg-slate-300"
}

function getRarityClass(rarity: string) {
  if (rarity === "Legendary") {
    return "text-amber-100"
  }

  if (rarity === "Epic") {
    return "text-fuchsia-100"
  }

  if (rarity === "Rare") {
    return "text-sky-100"
  }

  if (rarity === "Uncommon") {
    return "text-emerald-100"
  }

  return "text-slate-100"
}

function getToneClass(tone: "keep" | "sell" | "recycle" | "neutral") {
  if (tone === "keep") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
  }

  if (tone === "sell") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-100"
  }

  if (tone === "recycle") {
    return "border-sky-400/20 bg-sky-400/10 text-sky-100"
  }

  return "border-white/10 bg-white/5 text-slate-100"
}

export default App
