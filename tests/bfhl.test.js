// ─── SRM BFHL Challenge — Comprehensive Test Suite ────────────────────────────
// Tests all processing rules from the PDF specification.
// Run: node tests/bfhl.test.js

const USER_ID = "shivammittal_12022005";
const EMAIL_ID = "sm7465@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311003011700";

// ── Import the processing logic by simulating it here ─────────────────────────
// (We duplicate the logic inline so tests can run standalone without Next.js)
const VALID_EDGE = /^[A-Z]->[A-Z]$/;

function processData(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();
  const duplicateSeen = new Set();
  const valid_edges = [];

  for (const entry of data) {
    const trimmed = typeof entry === "string" ? entry.trim() : String(entry).trim();
    if (!VALID_EDGE.test(trimmed)) {
      invalid_entries.push(trimmed);
      continue;
    }
    const [parent, child] = trimmed.split("->");
    if (parent === child) {
      invalid_entries.push(trimmed);
      continue;
    }
    if (seenEdges.has(trimmed)) {
      if (!duplicateSeen.has(trimmed)) {
        duplicate_edges.push(trimmed);
        duplicateSeen.add(trimmed);
      }
      continue;
    }
    seenEdges.add(trimmed);
    valid_edges.push(trimmed);
  }

  const hierarchies = buildHierarchies(valid_edges);
  const nonCyclic = hierarchies.filter((h) => !h.has_cycle);
  const cyclic = hierarchies.filter((h) => h.has_cycle);

  let largest_tree_root = "";
  if (nonCyclic.length > 0) {
    const sorted = [...nonCyclic].sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return a.root < b.root ? -1 : 1;
    });
    largest_tree_root = sorted[0].root;
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles: cyclic.length,
      largest_tree_root,
    },
  };
}

function buildHierarchies(valid_edges) {
  const children = {};
  const parentOf = {};
  const allNodes = new Set();

  for (const edge of valid_edges) {
    const [p, c] = edge.split("->");
    allNodes.add(p);
    allNodes.add(c);
    if (!children[p]) children[p] = [];
    if (parentOf[c] === undefined) {
      parentOf[c] = p;
      children[p].push(c);
    }
  }

  const visited = new Set();
  const components = [];
  const nodeOrder = [];
  const nodeOrderSet = new Set();
  for (const edge of valid_edges) {
    const [p, c] = edge.split("->");
    if (!nodeOrderSet.has(p)) { nodeOrder.push(p); nodeOrderSet.add(p); }
    if (!nodeOrderSet.has(c)) { nodeOrder.push(c); nodeOrderSet.add(c); }
  }

  for (const startNode of nodeOrder) {
    if (visited.has(startNode)) continue;
    const component = [];
    const queue = [startNode];
    visited.add(startNode);
    while (queue.length > 0) {
      const node = queue.shift();
      component.push(node);
      for (const child of (children[node] || [])) {
        if (!visited.has(child)) { visited.add(child); queue.push(child); }
      }
      const par = parentOf[node];
      if (par !== undefined && !visited.has(par)) { visited.add(par); queue.push(par); }
    }
    components.push(component);
  }

  const hierarchies = [];
  for (const component of components) {
    const roots = component.filter((n) => parentOf[n] === undefined);
    let root;
    if (roots.length === 0) {
      root = [...component].sort()[0];
    } else {
      root = [...roots].sort()[0];
    }
    const hasCycle = detectCycle(component, children);
    if (hasCycle) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const tree = buildTree(root, children);
      const depth = calcDepth(root, children);
      hierarchies.push({ root, tree, depth });
    }
  }
  return hierarchies;
}

function detectCycle(component, children) {
  const color = {};
  for (const n of component) color[n] = 0;
  function dfs(node) {
    color[node] = 1;
    for (const child of (children[node] || [])) {
      if (color[child] === 1) return true;
      if (color[child] === 0 && dfs(child)) return true;
    }
    color[node] = 2;
    return false;
  }
  for (const node of component) {
    if (color[node] === 0) { if (dfs(node)) return true; }
  }
  return false;
}

function buildTree(node, children) {
  const childNodes = children[node] || [];
  const childObj = {};
  for (const child of childNodes) {
    Object.assign(childObj, buildTree(child, children));
  }
  return { [node]: childObj };
}

function calcDepth(node, children) {
  const kids = children[node] || [];
  if (kids.length === 0) return 1;
  return 1 + Math.max(...kids.map((c) => calcDepth(c, children)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════════
let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, detail) {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${testName}`);
  } else {
    failCount++;
    const msg = `  ❌ ${testName}${detail ? " — " + detail : ""}`;
    console.log(msg);
    failures.push(msg);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1 — PDF Example (Primary Acceptance Test)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 1: PDF Example Case ═══");
{
  const input = [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->",
  ];
  const res = processData(input);

  assert(res.user_id === USER_ID, "user_id matches");
  assert(res.email_id === EMAIL_ID, "email_id matches");
  assert(res.college_roll_number === COLLEGE_ROLL_NUMBER, "college_roll_number matches");

  // Invalid entries
  assert(deepEqual(res.invalid_entries, ["hello", "1->2", "A->"]),
    "invalid_entries correct", JSON.stringify(res.invalid_entries));

  // Duplicate edges
  assert(deepEqual(res.duplicate_edges, ["G->H"]),
    "duplicate_edges correct", JSON.stringify(res.duplicate_edges));

  // Hierarchies
  assert(res.hierarchies.length === 4, "4 hierarchies returned", res.hierarchies.length);

  // Hierarchy 0: A tree
  const h0 = res.hierarchies[0];
  assert(h0.root === "A", "H0 root = A");
  assert(deepEqual(h0.tree, { A: { B: { D: {} }, C: { E: { F: {} } } } }),
    "H0 tree structure correct", JSON.stringify(h0.tree));
  assert(h0.depth === 4, "H0 depth = 4", h0.depth);
  assert(h0.has_cycle === undefined, "H0 has_cycle absent for non-cyclic tree");

  // Hierarchy 1: X->Y->Z->X cycle
  const h1 = res.hierarchies[1];
  assert(h1.root === "X", "H1 root = X");
  assert(deepEqual(h1.tree, {}), "H1 tree = {} for cycle");
  assert(h1.has_cycle === true, "H1 has_cycle = true");
  assert(h1.depth === undefined, "H1 depth absent for cyclic group");

  // Hierarchy 2: P tree
  const h2 = res.hierarchies[2];
  assert(h2.root === "P", "H2 root = P");
  assert(deepEqual(h2.tree, { P: { Q: { R: {} } } }),
    "H2 tree correct", JSON.stringify(h2.tree));
  assert(h2.depth === 3, "H2 depth = 3", h2.depth);

  // Hierarchy 3: G tree
  const h3 = res.hierarchies[3];
  assert(h3.root === "G", "H3 root = G");
  assert(deepEqual(h3.tree, { G: { H: {}, I: {} } }),
    "H3 tree correct", JSON.stringify(h3.tree));
  assert(h3.depth === 2, "H3 depth = 2", h3.depth);

  // Summary
  assert(res.summary.total_trees === 3, "total_trees = 3", res.summary.total_trees);
  assert(res.summary.total_cycles === 1, "total_cycles = 1", res.summary.total_cycles);
  assert(res.summary.largest_tree_root === "A", "largest_tree_root = A", res.summary.largest_tree_root);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2 — Valid Node Format (Rule 2)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 2: Invalid Node Format ═══");
{
  const invalids = ["hello", "1->2", "AB->C", "A-B", "A->", "A->A", "", " ", "a->b", "->B", "A->BC"];
  const res = processData(invalids);

  assert(res.invalid_entries.length === invalids.length,
    `All ${invalids.length} inputs invalid`, res.invalid_entries.length);
  assert(res.hierarchies.length === 0, "No hierarchies for all-invalid input");
  assert(res.summary.total_trees === 0, "total_trees = 0");
  assert(res.summary.total_cycles === 0, "total_cycles = 0");
  assert(res.summary.largest_tree_root === "", "largest_tree_root = empty string");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3 — Self-loop Treated as Invalid (Rule 2)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 3: Self-loop ═══");
{
  const res = processData(["A->A", "B->B", "C->D"]);
  assert(res.invalid_entries.length === 2, "2 self-loops invalid", JSON.stringify(res.invalid_entries));
  assert(res.invalid_entries.includes("A->A"), "A->A is invalid");
  assert(res.invalid_entries.includes("B->B"), "B->B is invalid");
  assert(res.hierarchies.length === 1, "1 hierarchy from C->D");
  assert(res.hierarchies[0].root === "C", "Root = C");
  assert(res.hierarchies[0].depth === 2, "Depth = 2");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 4 — Whitespace Trimming (Rule 2)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 4: Whitespace Trimming ═══");
{
  const res = processData([" A->B ", "  C->D  "]);
  assert(res.invalid_entries.length === 0, "Trimmed entries are valid");
  assert(res.hierarchies.length === 2, "2 hierarchies");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 5 — Duplicate Edges (Rule 3)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 5: Duplicate Edges ═══");
{
  // Triple duplicate → only one entry in duplicate_edges
  const res = processData(["A->B", "A->B", "A->B"]);
  assert(deepEqual(res.duplicate_edges, ["A->B"]),
    "Triple dup → single entry in duplicate_edges", JSON.stringify(res.duplicate_edges));
  assert(res.hierarchies.length === 1, "Only 1 hierarchy");
  assert(res.hierarchies[0].depth === 2, "Depth = 2 (A->B)");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 6 — Multi-parent / Diamond (Rule 4)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 6: Multi-parent (Diamond) ═══");
{
  // A->D and B->D: first parent (A) wins
  const res = processData(["A->D", "B->D", "A->B"]);
  // A is root (A->D, A->B), B->D is silently discarded
  // All nodes connected via undirected graph: A-D, A-B (B->D discarded but they are all connected)
  assert(res.hierarchies.length === 1, "1 hierarchy (all connected)");
  const h = res.hierarchies[0];
  assert(h.root === "A", "Root = A");
  // Tree: A has children D and B (from edges A->D and A->B)
  assert(deepEqual(h.tree, { A: { D: {}, B: {} } }),
    "Diamond resolved: first parent wins", JSON.stringify(h.tree));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 7 — Pure Cycle, Lex-smallest Root (Rule 4/5)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 7: Pure Cycle (all nodes are children) ═══");
{
  const res = processData(["C->A", "A->B", "B->C"]);
  assert(res.hierarchies.length === 1, "1 hierarchy");
  const h = res.hierarchies[0];
  assert(h.has_cycle === true, "Cycle detected");
  assert(h.root === "A", "Lex-smallest root = A", h.root);
  assert(deepEqual(h.tree, {}), "Tree is empty for cycle");
  assert(h.depth === undefined, "No depth for cyclic group");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 8 — Cycle Detection Output Format (Rule 5)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 8: Cycle Output Format ═══");
{
  const res = processData(["X->Y", "Y->Z", "Z->X"]);
  const h = res.hierarchies[0];
  assert(h.has_cycle === true, "has_cycle is true");
  assert(deepEqual(h.tree, {}), "tree is empty object");
  assert(!("depth" in h), "depth key absent entirely", JSON.stringify(Object.keys(h)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 9 — Non-cyclic: has_cycle Omitted (Rule 5)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 9: Non-cyclic has_cycle omitted ═══");
{
  const res = processData(["A->B", "B->C"]);
  const h = res.hierarchies[0];
  assert(!("has_cycle" in h), "has_cycle key absent for non-cyclic tree", JSON.stringify(Object.keys(h)));
  assert(h.depth === 3, "Depth = 3 (A->B->C)");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 10 — Depth Calculation (Rule 6)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 10: Depth Calculation ═══");
{
  // A->B->C = depth 3
  const res1 = processData(["A->B", "B->C"]);
  assert(res1.hierarchies[0].depth === 3, "Linear chain depth = 3");

  // Single edge A->B = depth 2
  const res2 = processData(["A->B"]);
  assert(res2.hierarchies[0].depth === 2, "Single edge depth = 2");

  // Branching: A->B, A->C, B->D = depth 3 (A-B-D)
  const res3 = processData(["A->B", "A->C", "B->D"]);
  assert(res3.hierarchies[0].depth === 3, "Branching depth = 3");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 11 — largest_tree_root Tiebreaker (Rule 7)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 11: Largest Tree Root Tiebreaker ═══");
{
  // Two trees of equal depth 2: Z->W and A->B
  // Tiebreaker: lex smaller root wins → A
  const res = processData(["Z->W", "A->B"]);
  assert(res.summary.largest_tree_root === "A",
    "Lex tiebreak: A < Z", res.summary.largest_tree_root);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 12 — total_trees Counts Only Non-cyclic (Rule 7)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 12: total_trees Excludes Cycles ═══");
{
  const res = processData(["A->B", "X->Y", "Y->X"]);
  assert(res.summary.total_trees === 1, "total_trees = 1 (excludes cycle)", res.summary.total_trees);
  assert(res.summary.total_cycles === 1, "total_cycles = 1");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 13 — Empty Input
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 13: Empty Array ═══");
{
  const res = processData([]);
  assert(res.hierarchies.length === 0, "No hierarchies");
  assert(res.invalid_entries.length === 0, "No invalid entries");
  assert(res.duplicate_edges.length === 0, "No duplicate edges");
  assert(res.summary.total_trees === 0, "total_trees = 0");
  assert(res.summary.total_cycles === 0, "total_cycles = 0");
  assert(res.summary.largest_tree_root === "", "largest_tree_root = empty");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 14 — Single Valid Edge
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 14: Single Valid Edge ═══");
{
  const res = processData(["A->B"]);
  assert(res.hierarchies.length === 1, "1 hierarchy");
  assert(res.hierarchies[0].root === "A", "Root = A");
  assert(res.hierarchies[0].depth === 2, "Depth = 2");
  assert(deepEqual(res.hierarchies[0].tree, { A: { B: {} } }), "Tree correct");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 15 — Multiple Independent Trees
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 15: Multiple Independent Trees ═══");
{
  const res = processData(["A->B", "C->D", "E->F"]);
  assert(res.hierarchies.length === 3, "3 independent trees");
  assert(res.summary.total_trees === 3, "total_trees = 3");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 16 — Large Input (up to 50 edges, must respond < 3s)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 16: Performance (50 edges) ═══");
{
  // Generate 25 edges in one tree + 25 in another
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXY";
  const edges = [];
  for (let i = 0; i < 24; i++) {
    edges.push(letters[i] + "->" + letters[i + 1]);
  }
  // Second tree: Z->A already used, so use duplicates/invalids
  edges.push("Z->A");
  // Fill rest with duplicates to reach 50
  for (let i = edges.length; i < 50; i++) {
    edges.push("A->B"); // duplicates
  }
  
  const start = Date.now();
  const res = processData(edges);
  const elapsed = Date.now() - start;
  
  assert(elapsed < 3000, `Responded in ${elapsed}ms (< 3000ms)`, elapsed + "ms");
  assert(res.hierarchies.length > 0, "Has hierarchies");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 17 — Edge with only invalids → no hierarchies
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 17: All Invalid Input ═══");
{
  const res = processData(["hello", "world", "123", ""]);
  assert(res.hierarchies.length === 0, "No hierarchies");
  assert(res.invalid_entries.length === 4, "4 invalid entries");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 18 — Two-node cycle
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TEST 18: Two-node Cycle ═══");
{
  const res = processData(["A->B", "B->A"]);
  assert(res.hierarchies.length === 1, "1 hierarchy");
  assert(res.hierarchies[0].has_cycle === true, "Cycle detected");
  assert(res.summary.total_cycles === 1, "total_cycles = 1");
  assert(res.summary.total_trees === 0, "total_trees = 0");
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══════════════════════════════════════════════");
console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
if (failures.length > 0) {
  console.log("\nFAILURES:");
  failures.forEach((f) => console.log(f));
}
console.log("═══════════════════════════════════════════════\n");
process.exit(failCount > 0 ? 1 : 0);
