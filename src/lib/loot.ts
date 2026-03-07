export type RecommendationAction = "keep" | "sell" | "recycle" | "unknown"
export type LootSort = "relevance" | "action" | "rarity" | "price-high" | "price-low" | "name"

export interface RecommendationRule {
  action: Exclude<RecommendationAction, "unknown">
  condition: string
}

export interface LootItem {
  id: string
  name: string
  rarity: string
  recommendation: {
    raw: string
    primaryAction: RecommendationAction
    actions: RecommendationRule[]
  }
  recycleRewards: Array<{
    quantity: number | null
    item: string
  }>
  keepReasons: string[]
  sellPrice: {
    raw: string | null
    value: number | null
    currency: "USD" | "credits" | null
  }
}

export interface LootDataset {
  metadata: {
    title: string
    sourceCsv: string
    generatedAt: string
    updatedAt: string | null
    compatiblePatch: string | null
    totalItems: number
    sourceLabel: string | null
    referenceLabel: string | null
    guideNotes: string[]
  }
  summary: {
    byPrimaryAction: Record<string, number>
    byRarity: Record<string, number>
  }
  items: LootItem[]
}

export interface LootViewItem extends LootItem {
  searchableText: string
  recycleText: string
  matchScore: number
}

export interface LootFilters {
  query: string
  sort: LootSort
  actions: RecommendationAction[]
  rarities: string[]
  requireKeepReasons: boolean
  requireRecycleRewards: boolean
}

const ACTION_ORDER: RecommendationAction[] = ["keep", "sell", "recycle", "unknown"]
const RARITY_ORDER = ["Legendary", "Epic", "Rare", "Uncommon", "Common", "Unknown"]

export function normalizeLootItems(items: LootItem[]): LootViewItem[] {
  return items.map((item) => {
    const recycleText = item.recycleRewards
      .map((reward) => (reward.quantity ? `${reward.quantity}x ${reward.item}` : reward.item))
      .join(", ")

    return {
      ...item,
      recycleText,
      searchableText: [
        item.name,
        item.rarity,
        item.recommendation.raw,
        item.keepReasons.join(" "),
        recycleText,
        item.sellPrice.raw ?? "",
      ]
        .join(" ")
        .toLowerCase(),
      matchScore: 0,
    }
  })
}

export function getVisibleItems(items: LootViewItem[], filters: LootFilters) {
  const query = filters.query.trim().toLowerCase()
  const tokens = query.split(/\s+/).filter(Boolean)

  return items
    .map((item) => ({
      ...item,
      matchScore: getMatchScore(item, query, tokens),
    }))
    .filter((item) => {
      if (filters.actions.length > 0 && !filters.actions.includes(item.recommendation.primaryAction)) {
        return false
      }

      if (filters.rarities.length > 0 && !filters.rarities.includes(item.rarity)) {
        return false
      }

      if (filters.requireKeepReasons && item.keepReasons.length === 0) {
        return false
      }

      if (filters.requireRecycleRewards && item.recycleRewards.length === 0) {
        return false
      }

      if (!query) {
        return true
      }

      return item.matchScore > 0
    })
    .sort((left, right) => compareItems(left, right, filters.sort, Boolean(query)))
}

export function getRarityOptions(items: LootItem[]) {
  return [...new Set(items.map((item) => item.rarity))].sort(compareRarity)
}

export function formatSellPrice(item: LootItem) {
  if (item.sellPrice.value == null) {
    return "No sell value"
  }

  if (item.sellPrice.currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(item.sellPrice.value)
  }

  return `${new Intl.NumberFormat("en-US").format(item.sellPrice.value)}c`
}

function getMatchScore(item: LootViewItem, query: string, tokens: string[]) {
  if (!query) {
    return 0
  }

  const name = item.name.toLowerCase()
  let score = 0

  if (name === query) {
    score += 200
  }

  if (name.startsWith(query)) {
    score += 120
  }

  if (name.includes(query)) {
    score += 90
  }

  if (item.searchableText.includes(query)) {
    score += 20
  }

  for (const token of tokens) {
    if (name.startsWith(token)) {
      score += 24
    } else if (name.includes(token)) {
      score += 16
    }

    if (item.keepReasons.some((reason) => reason.toLowerCase().includes(token))) {
      score += 10
    }

    if (item.recycleText.toLowerCase().includes(token)) {
      score += 8
    }

    if (item.recommendation.raw.toLowerCase().includes(token)) {
      score += 6
    }
  }

  return score
}

function compareItems(left: LootViewItem, right: LootViewItem, sort: LootSort, hasQuery: boolean) {
  if (hasQuery && sort === "relevance" && right.matchScore !== left.matchScore) {
    return right.matchScore - left.matchScore
  }

  switch (sort) {
    case "action": {
      return compareByAction(left, right) || compareRarity(left.rarity, right.rarity) || left.name.localeCompare(right.name)
    }
    case "rarity": {
      return compareRarity(left.rarity, right.rarity) || compareByAction(left, right) || left.name.localeCompare(right.name)
    }
    case "price-high": {
      return (right.sellPrice.value ?? -1) - (left.sellPrice.value ?? -1) || left.name.localeCompare(right.name)
    }
    case "price-low": {
      const leftValue = left.sellPrice.value ?? Number.MAX_SAFE_INTEGER
      const rightValue = right.sellPrice.value ?? Number.MAX_SAFE_INTEGER
      return leftValue - rightValue || left.name.localeCompare(right.name)
    }
    case "name": {
      return left.name.localeCompare(right.name)
    }
    case "relevance":
    default: {
      return compareByAction(left, right) || compareRarity(left.rarity, right.rarity) || left.name.localeCompare(right.name)
    }
  }
}

function compareByAction(left: LootItem, right: LootItem) {
  return ACTION_ORDER.indexOf(left.recommendation.primaryAction) - ACTION_ORDER.indexOf(right.recommendation.primaryAction)
}

function compareRarity(left: string, right: string) {
  const leftIndex = RARITY_ORDER.indexOf(left)
  const rightIndex = RARITY_ORDER.indexOf(right)
  const safeLeftIndex = leftIndex === -1 ? RARITY_ORDER.length : leftIndex
  const safeRightIndex = rightIndex === -1 ? RARITY_ORDER.length : rightIndex
  return safeLeftIndex - safeRightIndex
}
