import {
  filterAndRankItems,
  getItemCategories,
  getOpeningStatus,
} from "./establishmentExperience";

describe("establishment experience helpers", () => {
  const items = [
    {
      id: 1,
      name: "Tinta azul",
      category: "Tintas",
      price: 80,
      status: true,
      total_views: 12,
      updated_at: "2026-09-01T10:00:00Z",
    },
    {
      id: 2,
      name: "Martelo profissional",
      category: "Ferramentas",
      price: 35,
      status: true,
      total_views: 80,
      updated_at: "2026-09-02T10:00:00Z",
    },
    {
      id: 3,
      name: "Tinta premium",
      category: "Tintas",
      price: 120,
      status: true,
      is_featured: true,
      total_views: 2,
      updated_at: "2026-09-03T10:00:00Z",
    },
  ];

  it("builds distinct categories and filters by search and category", () => {
    expect(getItemCategories(items)).toEqual([
      "Todos",
      "Ferramentas",
      "Tintas",
    ]);

    const filtered = filterAndRankItems(items, {
      query: "tinta",
      category: "Tintas",
      sort: "price_asc",
    });

    expect(filtered.map((item) => item.id)).toEqual([1, 3]);
  });

  it("prioritizes featured and popular data in smart ranking", () => {
    const ranked = filterAndRankItems(items, { sort: "smart" });
    expect(ranked[0].id).toBe(3);
  });

  it("recognizes a 24 hour establishment", () => {
    expect(
      getOpeningStatus({ business_profile: { open_24_hours: true } })
    ).toMatchObject({ isOpen: true, label: "Aberto agora" });
  });

  it("moves to the next day after today's closing time", () => {
    const mondayAt20 = new Date(2026, 8, 7, 20, 0, 0);
    const result = getOpeningStatus(
      {
        business_profile: {
          opening_hours: {
            monday: { open: "08:00", close: "18:00" },
            tuesday: { open: "09:00", close: "17:00" },
          },
        },
      },
      mondayAt20
    );

    expect(result).toMatchObject({
      isOpen: false,
      label: "Fechado agora",
      detail: "Abre amanhã às 09:00",
    });
  });
});
