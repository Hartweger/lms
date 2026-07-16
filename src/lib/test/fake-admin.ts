// In-memory zamena za Supabase admin klijent u testovima novčanog puta.
// Podržava lance koje koriste grant-access/callback/reconcile:
// from().select().eq().in().lt().is().single()/maybeSingle()/limit(), insert/update/upsert
// (update vraća pogođene redove, pa radi i update().eq().select().maybeSingle()),
// select sa {count:"exact", head:true}. Greške se ubrizgavaju preko failInsert/failUpdate.
type Row = Record<string, unknown>;

export function createFakeAdmin(seed: Record<string, Row[]> = {}) {
  const tables = new Map<string, Row[]>(Object.entries(seed).map(([k, v]) => [k, v.map((r) => ({ ...r }))]));
  const insertErrors = new Map<string, string>();
  const updateErrors = new Map<string, string>();
  const calls: { table: string; op: string; payload?: unknown }[] = [];

  function rowsOf(name: string): Row[] {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name)!;
  }

  function builder(name: string) {
    const filters: ((r: Row) => boolean)[] = [];
    let op = "select";
    let payload: unknown;
    let wantCount = false;

    const match = (r: Row) => filters.every((f) => f(r));

    function exec(): { data: unknown; error: { message: string } | null; count?: number } {
      calls.push({ table: name, op, payload });
      const rows = rowsOf(name);
      if (op === "insert" || op === "upsert") {
        const err = insertErrors.get(name);
        if (err) return { data: null, error: { message: err } };
        const arr = (Array.isArray(payload) ? payload : [payload]) as Row[];
        rows.push(...arr.map((r) => ({ ...r })));
        return { data: arr, error: null };
      }
      if (op === "update") {
        const err = updateErrors.get(name);
        if (err) return { data: null, error: { message: err } };
        const matched = rows.filter(match);
        matched.forEach((r) => Object.assign(r, payload as Row));
        return { data: matched, error: null };
      }
      const found = rows.filter(match);
      if (wantCount) return { data: null, count: found.length, error: null };
      return { data: found, error: null };
    }

    const api = {
      select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        if (opts?.count) wantCount = true;
        return api;
      },
      insert(p: Row | Row[]) { op = "insert"; payload = p; return api; },
      update(p: Row) { op = "update"; payload = p; return api; },
      upsert(p: Row | Row[], _o?: unknown) { op = "upsert"; payload = p; return api; },
      eq(col: string, val: unknown) { filters.push((r) => r[col] === val); return api; },
      ilike(col: string, val: unknown) {
        const pattern = new RegExp(`^${String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*")}$`, "i");
        filters.push((r) => pattern.test(String(r[col] ?? "")));
        return api;
      },
      neq(col: string, val: unknown) { filters.push((r) => r[col] !== val); return api; },
      in(col: string, vals: unknown[]) { filters.push((r) => vals.includes(r[col])); return api; },
      lt(col: string, val: unknown) { filters.push((r) => String(r[col]) < String(val)); return api; },
      gte(col: string, val: unknown) { filters.push((r) => String(r[col]) >= String(val)); return api; },
      is(col: string, val: unknown) { filters.push((r) => (val === null ? r[col] == null : r[col] === val)); return api; },
      not(col: string, operator: string, val: unknown) {
        if (operator === "is" && val === null) filters.push((r) => r[col] != null);
        return api;
      },
      order() { return api; },
      limit() { return api; },
      maybeSingle() {
        const res = exec();
        const row = (res.data as Row[] | null)?.[0] ?? null;
        return Promise.resolve({ data: row, error: res.error });
      },
      single() {
        const res = exec();
        if (res.error) return Promise.resolve({ data: null, error: res.error });
        const row = (res.data as Row[] | null)?.[0];
        return Promise.resolve(row ? { data: row, error: null } : { data: null, error: { message: "PGRST116: JSON object requested, multiple (or no) rows returned" } });
      },
      then<T>(onF: (v: ReturnType<typeof exec>) => T, onR?: (e: unknown) => T) {
        return Promise.resolve(exec()).then(onF, onR);
      },
    };
    return api;
  }

  const admin = {
    from: (name: string) => builder(name),
    auth: {
      admin: {
        generateLink: async () => ({ data: null, error: { message: "fake: not implemented" } }),
        createUser: async ({ email }: { email: string }) => ({ data: { user: { id: `fake-${email}` } }, error: null }),
      },
    },
  };

  return {
    admin,
    tables,
    calls,
    row(table: string, pred: (r: Row) => boolean) { return rowsOf(table).find(pred); },
    failInsert(table: string, message = "fake insert failure") { insertErrors.set(table, message); },
    failUpdate(table: string, message = "fake update failure") { updateErrors.set(table, message); },
  };
}
