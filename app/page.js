"use client";

import { useState, useCallback } from "react";

const EXAMPLE_INPUT = [
  "A->B, A->C, B->D, C->E, E->F,",
  "X->Y, Y->Z, Z->X,",
  "P->Q, Q->R,",
  "G->H, G->H, G->I,",
  "hello, 1->2, A->",
].join("\n");

// ─── Tree Node Renderer ──────────────────────────────────────────────────────
function TreeNode({ name, children, depth = 0 }) {
  const childKeys = Object.keys(children || {});
  const hasChildren = childKeys.length > 0;
  return (
    <div className="tree-node">
      {depth > 0 && <div className="tree-connector" />}
      <div className={`tree-circle ${depth === 0 ? "root" : "child"}`}>{name}</div>
      {hasChildren && (
        <div className="tree-children">
          {childKeys.map((c) => (
            <TreeNode key={c} name={c} children={children[c]} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const parseInput = (raw) =>
    raw.split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.length > 0);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setResult(null);
    const data = parseInput(input);
    if (!data.length) { setError("Please enter at least one node edge."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Server error: " + res.status);
      else setResult(json);
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleExample = () => { setInput(EXAMPLE_INPUT); setResult(null); setError(null); };
  const handleClear = () => { setInput(""); setResult(null); setError(null); };
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Animated BG */}
      <div className="bg-gradient">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="grid-overlay" />

      <div className="page-wrapper">
        {/* Navbar */}
        <nav className="navbar">
          <span className="navbar-brand">SRM Challenge</span>
          <span className="navbar-badge">Node Hierarchy Explorer</span>
        </nav>

        {/* Hero */}
        <header className="hero">
          <div className="hero-pill">
            <span className="dot" />
            Full-Stack Engineering Challenge
          </div>
          <h1>
            Analyse <span className="gradient">Node Hierarchies</span> in
            Real-Time
          </h1>
          <p className="hero-sub">
            Paste your edge definitions below. We will build trees, detect
            cycles, and surface insights — instantly.
          </p>

          <div className="input-panel">
            <label className="input-label">Edge Definitions</label>
            <textarea
              className="input-textarea"
              placeholder={"A->B\nB->C\nC->A"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="btn-row">
              <button className="btn-primary" onClick={handleSubmit} disabled={loading || !input.trim()}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
                  {loading ? "sync" : "play_arrow"}
                </span>
                {loading ? "Analysing…" : "Analyse"}
              </button>
              <button className="btn-secondary" onClick={handleExample}>Load Example</button>
              <button className="btn-ghost" onClick={handleClear}>Clear</button>
            </div>
          </div>

          {error && (
            <div className="error-toast">
              <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>error</span>
              {error}
            </div>
          )}
        </header>

        {/* Results */}
        {result && (
          <section className="results-section">
            <div className="results-header">
              <h2>Results</h2>
              <div className="line" />
            </div>

            {/* Bento Stats */}
            <div className="bento-grid">
              <div className="bento-card">
                <div className="icon-wrap violet">
                  <span className="material-symbols-outlined">park</span>
                </div>
                <div className="bento-label">Valid Trees</div>
                <div className="bento-value violet">{result.summary.total_trees}</div>
              </div>
              <div className="bento-card">
                <div className="icon-wrap amber">
                  <span className="material-symbols-outlined">cycle</span>
                </div>
                <div className="bento-label">Cycles Detected</div>
                <div className="bento-value amber">{result.summary.total_cycles}</div>
              </div>
              <div className="bento-card">
                <div className="icon-wrap green">
                  <span className="material-symbols-outlined">trophy</span>
                </div>
                <div className="bento-label">Largest Root</div>
                <div className="bento-value green">{result.summary.largest_tree_root || "—"}</div>
              </div>
            </div>

            {/* Main Content */}
            <div className="content-grid">
              {/* Left: Hierarchies */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div className="section-card">
                  <div className="section-card-header">
                    <span className="section-card-title">Hierarchies</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>
                      {result.hierarchies.length} group{result.hierarchies.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="section-card-body">
                    {result.hierarchies.map((h, i) => (
                      <div key={i} className={"hierarchy-item" + (h.has_cycle ? " cyclic" : "")}>
                        <div className="hierarchy-meta">
                          <span className={"hierarchy-root-badge " + (h.has_cycle ? "cycle" : "tree")}>
                            Root: {h.root}
                          </span>
                          <span className="hierarchy-info">
                            {h.has_cycle ? "Cycle detected" : "Depth: " + h.depth}
                          </span>
                        </div>
                        {h.has_cycle ? (
                          <div className="cycle-visual">
                            <div className="cycle-ring"><span>{h.root}</span></div>
                          </div>
                        ) : (
                          <div className="tree-viz">
                            <TreeNode name={h.root} children={h.tree[h.root]} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Identity */}
                <div className="section-card">
                  <div className="section-card-header">
                    <span className="section-card-title">Identity</span>
                  </div>
                  <div className="section-card-body">
                    <div className="identity-row">
                      <span className="id-label">User ID</span>
                      <span className="id-value">{result.user_id}</span>
                    </div>
                    <div className="identity-row">
                      <span className="id-label">Email</span>
                      <span className="id-value">{result.email_id}</span>
                    </div>
                    <div className="identity-row">
                      <span className="id-label">Roll No</span>
                      <span className="id-value">{result.college_roll_number}</span>
                    </div>
                  </div>
                </div>

                {/* Validation */}
                <div className="section-card">
                  <div className="section-card-header">
                    <span className="section-card-title">Validation</span>
                  </div>
                  <div className="section-card-body">
                    <div className="chip-grid">
                      {result.invalid_entries.map((e, i) => (
                        <div key={"i" + i} className="chip error">
                          <span className="material-symbols-outlined">close</span>
                          {e || '""'}
                        </div>
                      ))}
                      {result.duplicate_edges.map((e, i) => (
                        <div key={"d" + i} className="chip warning">
                          <span className="material-symbols-outlined">content_copy</span>
                          {e}
                        </div>
                      ))}
                      {!result.invalid_entries.length && !result.duplicate_edges.length && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-3)", fontStyle: "italic" }}>
                          All entries valid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* JSON */}
                <div className="json-viewer">
                  <div className="json-toolbar">
                    <div className="json-toolbar-dots">
                      <span /><span /><span />
                    </div>
                    <button className="json-copy-btn" onClick={handleCopy}>
                      {copied ? "Copied ✓" : "Copy JSON"}
                    </button>
                  </div>
                  <div className="json-content">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="site-footer">
          © 2025 Shivam Mittal · SRM Full Stack Challenge
        </footer>
      </div>
    </>
  );
}
