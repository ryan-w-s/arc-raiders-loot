import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "@/App"

const mockDataset = {
  metadata: {
    title: "ARC Raiders loot guide",
    sourceCsv: "public/mock.csv",
    generatedAt: "2026-03-07T00:00:00.000Z",
    updatedAt: "03/03/2026",
    compatiblePatch: "1.18.0",
    totalItems: 3,
    sourceLabel: "SOURCE",
    referenceLabel: "Steam",
    guideNotes: ["note one", "note two"],
  },
  summary: {
    byPrimaryAction: {
      keep: 1,
      sell: 1,
      recycle: 1,
    },
    byRarity: {
      Rare: 1,
      Common: 1,
      Epic: 1,
    },
  },
  items: [
    {
      id: "advanced-electrical-components",
      name: "Advanced Electrical Components",
      rarity: "Rare",
      recommendation: {
        raw: "Keep until upgrades are complete",
        primaryAction: "keep",
        actions: [{ action: "keep", condition: "Keep until upgrades are complete" }],
      },
      recycleRewards: [{ quantity: 1, item: "Wires" }],
      keepReasons: ["10x for Gear Bench III"],
      sellPrice: {
        raw: "1750",
        value: 1750,
        currency: "credits",
      },
    },
    {
      id: "agave",
      name: "Agave",
      rarity: "Uncommon",
      recommendation: {
        raw: "Sell",
        primaryAction: "sell",
        actions: [{ action: "sell", condition: "Sell" }],
      },
      recycleRewards: [],
      keepReasons: [],
      sellPrice: {
        raw: "1000",
        value: 1000,
        currency: "credits",
      },
    },
    {
      id: "arc-flex-rubber",
      name: "ARC Flex Rubber",
      rarity: "Epic",
      recommendation: {
        raw: "Recycle if short on materials",
        primaryAction: "recycle",
        actions: [{ action: "recycle", condition: "Recycle if short on materials" }],
      },
      recycleRewards: [{ quantity: 2, item: "Rubber Parts" }],
      keepReasons: [],
      sellPrice: {
        raw: "500",
        value: 500,
        currency: "credits",
      },
    },
  ],
}

describe("App", () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDataset,
      }),
    )
  })

  it("renders loaded loot items", async () => {
    render(<App />)

    expect(await screen.findByText("Find the right item decision in seconds")).toBeInTheDocument()
    expect(screen.getAllByText("Advanced Electrical Components")[0]).toBeInTheDocument()
    expect(screen.getAllByText("ARC Flex Rubber")[0]).toBeInTheDocument()
  })

  it("filters results by search query", async () => {
    render(<App />)

    await screen.findAllByTestId("loot-card-title")

    fireEvent.change(screen.getAllByLabelText("Search loot items")[0], {
      target: { value: "agave" },
    })

    await waitFor(() => {
      expect(screen.getAllByText("Agave")[0]).toBeInTheDocument()
      expect(screen.queryByText("Advanced Electrical Components")).not.toBeInTheDocument()
    })
  })

  it("applies action filters", async () => {
    render(<App />)

    await screen.findAllByTestId("loot-card-title")

    fireEvent.click(screen.getByRole("button", { name: "Recycle" }))

    await waitFor(() => {
      expect(screen.getAllByText("ARC Flex Rubber")[0]).toBeInTheDocument()
      expect(screen.queryByText("Agave")).not.toBeInTheDocument()
    })
  })

  it("sorts items by high value", async () => {
    render(<App />)

    await screen.findAllByTestId("loot-card-title")

    fireEvent.click(screen.getByRole("button", { name: "Value high-low" }))

    await waitFor(() => {
      const headings = screen.getAllByTestId("loot-card-title")
      expect(headings[0]).toHaveTextContent("Advanced Electrical Components")
      expect(headings[1]).toHaveTextContent("Agave")
    })
  })
})
