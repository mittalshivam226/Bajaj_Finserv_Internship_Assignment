// POST /bfhl — SRM Full Stack Engineering Challenge
// Processes hierarchical node relationships from edge strings

const USER_ID = "shivammittal_12022005";
const EMAIL_ID = "sm7465@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311003011700";

// Valid format: single uppercase letter -> single uppercase letter, no self-loop
const VALID_EDGE = /^[A-Z]->[A-Z]$/;

function processData(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();
  const duplicateSeen = new Set();
  const valid_edges = [];

  for (const entry of data) {
    const trimmed = typeof entry === "string" ? entry.trim() : String(entry).trim();

    // Validate format
    if (!VALID_EDGE.test(trimmed)) {
      invalid_entries.push(trimmed);
      continue;
    }

    // Reject self-loops (A->A)
    const [parent, child] = trimmed.split("->"); // e.g. ["A", "B"]
    if (parent === child) {
      invalid_entries.push(trimmed);
      continue;
    }

    // Duplicate edge check
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
      if (b.depth !== a.depth) return b.depth - a.depth; // highest depth first
      return a.root < b.root ? -1 : 1; // lex asc tiebreak
    });
    largest_tree_root = sorted[0].root;
  }

  const summary = {
    total_trees: nonCyclic.length,
    total_cycles: cyclic.length,
    largest_tree_root,
  };

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary,
  };
}

function buildHierarchies(valid_edges) {
  // Build directed adjacency (children) and first-parent tracking
  const children = {}; // node -> [child, ...]
  const parentOf = {}; // child -> parent (first wins)
  const allNodes = new Set();

  for (const edge of valid_edges) {
    const [p, c] = edge.split("->");
    allNodes.add(p);
    allNodes.add(c);

    if (!children[p]) children[p] = [];

    // Multi-parent: first parent wins; discard subsequent parent edges for same child
    if (parentOf[c] === undefined) {
      parentOf[c] = p;
      children[p].push(c);
    }
    // else: silently discard — do NOT add c to p's children list
  }

  // Find connected components using undirected BFS
  // We need to preserve insertion order of components (by first edge encountered)
  const visited = new Set();
  const components = [];

  // Iterate nodes in the order their edges were encountered
  const nodeOrder = [];
  const nodeOrderSet = new Set();
  for (const edge of valid_edges) {
    const [p, c] = edge.split("->");
    if (!nodeOrderSet.has(p)) { nodeOrder.push(p); nodeOrderSet.add(p); }
    if (!nodeOrderSet.has(c)) { nodeOrder.push(c); nodeOrderSet.add(c); }
  }

  for (const startNode of nodeOrder) {
    if (visited.has(startNode)) continue;

    // BFS undirected
    const component = [];
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const node = queue.shift();
      component.push(node);

      // Neighbors: children (directed out) + parent (directed in)
      for (const child of (children[node] || [])) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
        }
      }
      // Check if this node is a child of someone (find its parent)
      const par = parentOf[node];
      if (par !== undefined && !visited.has(par)) {
        visited.add(par);
        queue.push(par);
      }
    }

    components.push(component);
  }

  const hierarchies = [];

  for (const component of components) {
    // Root = nodes in this component that have no parent
    const roots = component.filter((n) => parentOf[n] === undefined);

    let root;
    if (roots.length === 0) {
      // Pure cycle: use lexicographically smallest node
      root = [...component].sort()[0];
    } else {
      // Should be exactly one root; take lex smallest if somehow multiple
      root = [...roots].sort()[0];
    }

    // Cycle detection via DFS coloring on the component
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
  // WHITE=0 GRAY=1 BLACK=2
  const color = {};
  for (const n of component) color[n] = 0;

  function dfs(node) {
    color[node] = 1; // GRAY — in current path
    for (const child of (children[node] || [])) {
      if (color[child] === 1) return true; // back-edge => cycle
      if (color[child] === 0 && dfs(child)) return true;
    }
    color[node] = 2; // BLACK — done
    return false;
  }

  for (const node of component) {
    if (color[node] === 0) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

function buildTree(node, children) {
  const childNodes = children[node] || [];
  const childObj = {};
  for (const child of childNodes) {
    // Recursively build; merge returned { child: {...} } into childObj
    Object.assign(childObj, buildTree(child, children));
  }
  return { [node]: childObj };
}

function calcDepth(node, children) {
  const kids = children[node] || [];
  if (kids.length === 0) return 1;
  return 1 + Math.max(...kids.map((c) => calcDepth(c, children)));
}

// ─── Next.js Route Handler ───────────────────────────────────────────────────

export async function POST(request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.data)) {
      return Response.json(
        { error: 'Request body must be JSON with a "data" array.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = processData(body.data);
    return Response.json(result, { status: 200, headers: corsHeaders });
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return Response.json(
    { operation_code: 1 },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
