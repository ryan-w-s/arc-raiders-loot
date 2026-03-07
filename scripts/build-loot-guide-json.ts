import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

declare const Bun: {
  file(path: string): {
    text(): Promise<string>
  }
  write(path: string, data: string): Promise<number>
}

const CSV_FILE_NAME = "ARC Raiders - Safe to Sell or Recycle GUIDE Mar. 2026 - All Items by Keep, Sell, Recycle.csv"
const OUTPUT_FILE_NAME = "arc-raiders-loot-guide.json"

type RecommendationAction = "keep" | "sell" | "recycle" | "unknown"

type CsvRow = string[]

interface QuantityEntry {
  quantity: number | null
  item: string
}

interface RecommendationRule {
  action: Exclude<RecommendationAction, "unknown">
  condition: string
}

interface SellPrice {
  raw: string | null
  value: number | null
  currency: "USD" | "credits" | null
}

interface LootItem {
  id: string
  name: string
  rarity: string
  recommendation: {
    raw: string
    primaryAction: RecommendationAction
    actions: RecommendationRule[]
  }
  recycleRewards: QuantityEntry[]
  keepReasons: string[]
  sellPrice: SellPrice
}

interface LootDataset {
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

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)
const repositoryRoot = path.resolve(currentDirectory, "..")

const inputFilePath = path.join(repositoryRoot, "public", CSV_FILE_NAME)
const outputDirectoryPath = path.join(repositoryRoot, "public", "data")
const outputFilePath = path.join(outputDirectoryPath, OUTPUT_FILE_NAME)

const csvSource = await Bun.file(inputFilePath).text()
const rows = parseCsv(csvSource)

if (rows.length === 0) {
  throw new Error("The CSV file is empty")
}

const [headerRow, ...dataRows] = rows
const guideNotes = collectGuideNotes(dataRows)
const items = dataRows
  .map(normalizeItem)
  .filter((item): item is LootItem => item !== null)
  .sort((left, right) => left.name.localeCompare(right.name))

const dataset: LootDataset = {
  metadata: buildMetadata(headerRow, items.length, guideNotes),
  summary: buildSummary(items),
  items,
}

await mkdir(outputDirectoryPath, { recursive: true })
await Bun.write(outputFilePath, `${JSON.stringify(dataset, null, 2)}\n`)

console.log(`Generated ${OUTPUT_FILE_NAME} with ${items.length} items`)

function parseCsv(input: string): CsvRow[] {
  const normalizedInput = input.replace(/^\uFEFF/, "")
  const parsedRows: CsvRow[] = []
  let currentCell = ""
  let currentRow: CsvRow = []
  let insideQuotes = false

  for (let index = 0; index < normalizedInput.length; index += 1) {
    const character = normalizedInput[index]
    const nextCharacter = normalizedInput[index + 1]

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }

      continue
    }

    if (character === "," && !insideQuotes) {
      currentRow.push(currentCell)
      currentCell = ""
      continue
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1
      }

      currentRow.push(currentCell)
      parsedRows.push(currentRow)
      currentCell = ""
      currentRow = []
      continue
    }

    currentCell += character
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell)
    parsedRows.push(currentRow)
  }

  return parsedRows
}

function normalizeItem(row: CsvRow): LootItem | null {
  const [itemName = "", rarity = "", recommendation = "", recycleFor = "", keepFor = "", sellPrice = ""] = row
  const name = itemName.trim()

  if (!name) {
    return null
  }

  const recommendationText = normalizeWhitespace(recommendation)
  const recycleText = normalizeWhitespace(recycleFor)
  const keepText = normalizeWhitespace(keepFor)
  const sellPriceText = normalizeWhitespace(sellPrice)
  const primaryAction = extractPrimaryAction(recommendationText)

  return {
    id: slugify(name),
    name,
    rarity: normalizeRarity(rarity),
    recommendation: {
      raw: recommendationText,
      primaryAction,
      actions: parseRecommendationActions(recommendationText),
    },
    recycleRewards: parseQuantityList(recycleText),
    keepReasons: splitNotes(keepText),
    sellPrice: parseSellPrice(sellPriceText),
  }
}

function buildMetadata(headerRow: CsvRow, totalItems: number, guideNotes: string[]): LootDataset["metadata"] {
  const updatedAt = extractHeaderValue(headerRow, "Updated:")
  const compatiblePatch = extractHeaderValue(headerRow, "Compatible Patch Ver:")
  const sourceLabel = headerRow.find((value) => value.trim() === "SOURCE") ?? null
  const referenceLabel = headerRow.find((value) => value.includes("Steam Discussion")) ?? null

  return {
    title: "ARC Raiders loot guide",
    sourceCsv: path.relative(repositoryRoot, inputFilePath).replaceAll("\\", "/"),
    generatedAt: new Date().toISOString(),
    updatedAt,
    compatiblePatch,
    totalItems,
    sourceLabel,
    referenceLabel,
    guideNotes,
  }
}

function collectGuideNotes(rows: CsvRow[]): string[] {
  return rows
    .flatMap((row) => row.slice(7))
    .map(normalizeWhitespace)
    .filter(Boolean)
}

function buildSummary(items: LootItem[]): LootDataset["summary"] {
  const byPrimaryAction = countBy(items, (item) => item.recommendation.primaryAction)
  const byRarity = countBy(items, (item) => item.rarity)

  return {
    byPrimaryAction,
    byRarity,
  }
}

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

function extractPrimaryAction(recommendation: string): RecommendationAction {
  const normalizedRecommendation = recommendation.toLowerCase()

  if (normalizedRecommendation.includes("keep")) {
    return "keep"
  }

  if (normalizedRecommendation.includes("sell")) {
    return "sell"
  }

  if (normalizedRecommendation.includes("recycle")) {
    return "recycle"
  }

  return "unknown"
}

function parseRecommendationActions(recommendation: string): RecommendationRule[] {
  return splitNotes(recommendation)
    .map((segment) => {
      const action = detectRuleAction(segment)

      if (action === "unknown") {
        return null
      }

      return {
        action,
        condition: segment,
      }
    })
    .filter((entry): entry is RecommendationRule => entry !== null)
}

function detectRuleAction(segment: string): RecommendationAction {
  const lowerCaseSegment = segment.toLowerCase()

  if (lowerCaseSegment.includes("keep")) {
    return "keep"
  }

  if (lowerCaseSegment.includes("sell")) {
    return "sell"
  }

  if (lowerCaseSegment.includes("recycle")) {
    return "recycle"
  }

  return "unknown"
}

function parseQuantityList(value: string): QuantityEntry[] {
  if (!value) {
    return []
  }

  return value
    .split(",")
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean)
    .map((segment) => {
      const quantityMatch = segment.match(/^(\d+)x\s+(.+)$/i)

      if (!quantityMatch) {
        return {
          quantity: null,
          item: segment,
        }
      }

      return {
        quantity: Number(quantityMatch[1]),
        item: quantityMatch[2].trim(),
      }
    })
}

function splitNotes(value: string): string[] {
  if (!value) {
    return []
  }

  return value
    .replace(/\r/g, "\n")
    .split(/[;\n]+/)
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean)
}

function parseSellPrice(value: string): SellPrice {
  if (!value) {
    return {
      raw: null,
      value: null,
      currency: null,
    }
  }

  const numericValue = Number(value.replaceAll("$", "").replaceAll(",", ""))

  return {
    raw: value,
    value: Number.isFinite(numericValue) ? numericValue : null,
    currency: value.includes("$") ? "USD" : "credits",
  }
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeRarity(rarity: string): string {
  const normalized = normalizeWhitespace(rarity).toLowerCase()

  return normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : "Unknown"
}

function extractHeaderValue(headerRow: CsvRow, prefix: string): string | null {
  const matchingCell = headerRow.find((value) => value.startsWith(prefix))
  return matchingCell ? matchingCell.slice(prefix.length).trim() : null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
