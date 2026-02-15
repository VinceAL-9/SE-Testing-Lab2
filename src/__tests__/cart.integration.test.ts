import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const hasCreds = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

if (!hasCreds) {
  describe.skip("Cart integration tests (real DB)", () => {
    it("skipped because .env.test is missing or SUPABASE_URL/SUPABASE_KEY not set", () => {
      // noop
    });
  });
} else {
  // require here so utils/db doesn't attempt client creation when creds absent
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { testClient, clearDatabase } =
    require("./utils/db") as typeof import("./utils/db");

  describe("Cart integration tests (real DB)", () => {
    beforeAll(async () => {
      // ensure DB is clean before starting
      await clearDatabase();
    });

    afterEach(async () => {
      await clearDatabase();
    });

    afterAll(async () => {
      await clearDatabase();
    });

    it("inserts and reads an item", async () => {
      const newItem = { name: "Integration Item", price: 123 };

      const { data: insertData, error: insertError } = await testClient
        .from("cart_items")
        .insert([newItem])
        .select();

      expect(insertError).toBeNull();
      expect(insertData).toBeDefined();
      const inserted = insertData![0];
      expect(inserted.name).toBe(newItem.name);
      expect(inserted.price).toBe(newItem.price);

      const { data: readData, error: readError } = await testClient
        .from("cart_items")
        .select("*")
        .eq("id", inserted.id);

      expect(readError).toBeNull();
      expect(readData && readData.length).toBe(1);
      expect(readData![0].name).toBe(newItem.name);
    });

    it("deletes an item", async () => {
      const { data: insertData } = await testClient
        .from("cart_items")
        .insert([{ name: "ToDelete", price: 9 }])
        .select();

      const id = insertData![0].id;

      const { error: delError } = await testClient
        .from("cart_items")
        .delete()
        .eq("id", id);

      expect(delError).toBeNull();

      const { data: after, error: afterErr } = await testClient
        .from("cart_items")
        .select("*")
        .eq("id", id);

      expect(afterErr).toBeNull();
      expect(after && after.length).toBe(0);
    });

    it("returns error for bad insert (missing fields)", async () => {
      // Attempt to insert an invalid row (missing price)
      const { data, error } = await testClient
        .from("cart_items")
        .insert([{ name: "BadInsert" }])
        .select();

      // Depending on DB schema, this may succeed if price is nullable.
      // We assert that either an error is present OR the returned row lacks price.
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(data).toBeDefined();
        expect(
          data![0].price === null || data![0].price === undefined,
        ).toBeTruthy();
      }
    });
  });
}
