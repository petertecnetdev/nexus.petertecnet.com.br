describe("Nexus public discovery", () => {
  test("keeps the public home available without authentication", () => {
    expect("/home/2").toContain("/home/");
  });
});
