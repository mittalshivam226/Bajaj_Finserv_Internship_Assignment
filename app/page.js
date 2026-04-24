"use client";

import { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const EXAMPLE_INPUT = `A->B, A->C, B->D, C->E, E->F,
X->Y, Y->Z, Z->X,
P->Q, Q->R,
G->H, G->H, G->I,
hello, 1->2, A->`;

// ─── Tree Renderer ────────────────────────────────────────────────────────────
function TreeNode({ name, children, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const childKeys = Object.keys(children || {});
  const hasChildren = childKeys.length > 0;
  const delay = depth * 0.05;

  return (
    <div style={{ marginLeft: depth > 0 ? "1.4rem" : 0 }}>
      <div
        className="tree-node-row"
        style={{ animationDelay: `${delay}s`, cursor: hasChildren ? "pointer" : "default" }}
        onClick={() => hasChildren && setCollapsed((c) => !c)}
      >
        {depth > 0 && <span className="connector">{"└─"}</span>}
        <span className="node-name">{name}</span>
        {hasChildren && (
          <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginLeft: "0.25rem" }}>
            {collapsed ? "▶" : "▼"}
          </span>
        )}
      </div>
      {!collapsed &&
        childKeys.map((child) => (
          <TreeNode key={child} name={child} children={children[child]} depth={depth + 1} />
        ))}
    </div>
  );
}

function TreeView({ tree }) {
  if (!tree || Object.keys(tree).length === 0) return null;
  const rootKey = Object.keys(tree)[0];
  return (
    <div className="tree-container">
      <TreeNode name={rootKey} children={tree[rootKey]} depth={0} />
    </div>
  );
}

// ─── Hierarchy Card ───────────────────────────────────────────────────────────
function HierarchyCard({ h, index }) {
  return (
    <div
      className={`hierarchy-card ${h.has_cycle ? "is-cycle" : ""}`}
      style={{ animationDelay: `${index * 0.07}s`, animation: "fadeSlide 0.4s ease both" }}
    >
      <div className="card-header">
        <div className="card-root">
          <div className={`root-badge ${h.has_cycle ? "cycle-badge" : ""}`}>
            {h.root}
          </div>
          <div className="root-info">
            <span className="root-label">Root Node</span>
            <span className="root-name">{h.root}</span>
          </div>
        </div>
        <div className="card-tags">
          {h.has_cycle ? (
            <span className="tag cycle-tag">⟳ Cycle</span>
          ) : (
            <span className="tag depth-tag">Depth {h.depth}</span>
          )}
        </div>
      </div>
      <div className="card-body">
        {h.has_cycle ? (
          <div className="cycle-placeholder">
            <span className="cycle-icon">⟳</span>
            <span>Circular dependency detected — no tree structure</span>
          </div>
        ) : (
          <TreeView tree={h.tree} />
        )}
      </div>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className={`btn-copy ${copied ? "copied" : ""}`} onClick={handleCopy}>
      {copied ? "✓ Copied" : "⎘ Copy JSON"}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Parse the text-area input: split by commas and/or newlines
  const parseInput = (raw) => {
    return raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleSubmit = useCallback(async () => {
    setError(null);
    setResult(null);

    const data = parseInput(input);
    if (data.length === 0) {
      setError("Please enter at least one node edge.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Server error: ${res.status}`);
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(`Network error: ${e.message}. Make sure the API is running.`);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleExample = () => {
    setInput(EXAMPLE_INPUT);
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setInput("");
    setResult(null);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-badge">
          <span>🌐</span> SRM Full Stack Challenge — Round 1
        </div>
        <h1>Node Hierarchy Explorer</h1>
        <p>
          Submit edge relationships and instantly visualise tree structures,
          cycle detection, and graph insights.
        </p>
      </header>

      {/* Input Panel */}
      <div className="input-panel">
        <div className="input-label">
          <span className="dot" />
          Input Node Edges
        </div>
        <textarea
          id="node-input"
          className="node-input"
          placeholder={`Enter edges separated by commas or new lines…\ne.g.  A->B, A->C, B->D`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
        />
        <p className="input-hint">
          Valid format: <code>X-&gt;Y</code> where X and Y are single uppercase letters (A–Z).
          Separate entries with commas or new lines. Press{" "}
          <code>Ctrl+Enter</code> to submit.
        </p>
        <div className="btn-row">
          <button
            id="submit-btn"
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Processing…
              </>
            ) : (
              <>⚡ Analyse Nodes</>
            )}
          </button>
          <button id="example-btn" className="btn-example" onClick={handleExample}>
            📋 Load Example
          </button>
          <button id="clear-btn" className="btn-clear" onClick={handleClear}>
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div id="error-banner" className="error-banner">
          <span className="err-icon">⚠</span>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div id="results-section" className="results-section">
          {/* Identity Card */}
          <div className="identity-card">
            <div className="identity-field">
              <label>User ID</label>
              <span>{result.user_id}</span>
            </div>
            <div className="identity-field">
              <label>Email</label>
              <span>{result.email_id}</span>
            </div>
            <div className="identity-field">
              <label>Roll Number</label>
              <span>{result.college_roll_number}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="summary-bar">
            <div className="summary-stat">
              <div className="stat-label">Total Trees</div>
              <div className="stat-value accent">{result.summary.total_trees}</div>
            </div>
            <div className="summary-stat">
              <div className="stat-label">Total Cycles</div>
              <div className="stat-value cycle">{result.summary.total_cycles}</div>
            </div>
            <div className="summary-stat">
              <div className="stat-label">Largest Tree Root</div>
              <div className="stat-value root">
                {result.summary.largest_tree_root || "—"}
              </div>
            </div>
            <div className="summary-stat">
              <div className="stat-label">Total Groups</div>
              <div className="stat-value">{result.hierarchies.length}</div>
            </div>
          </div>

          {/* Hierarchies */}
          {result.hierarchies.length > 0 && (
            <>
              <div className="section-title">
                🌳 Hierarchies
                <span className="pill">{result.hierarchies.length}</span>
              </div>
              <div className="hierarchies-grid">
                {result.hierarchies.map((h, i) => (
                  <HierarchyCard key={`${h.root}-${i}`} h={h} index={i} />
                ))}
              </div>
            </>
          )}

          {/* Invalid & Duplicates */}
          <div className="chips-panel">
            <div className="chips-card error-card">
              <div className="section-title" style={{ margin: 0 }}>
                ✗ Invalid Entries
                <span className="pill" style={{ background: "rgba(248,113,113,0.12)", color: "var(--error)" }}>
                  {result.invalid_entries.length}
                </span>
              </div>
              <div className="chips-list">
                {result.invalid_entries.length === 0 ? (
                  <span className="chip none">None</span>
                ) : (
                  result.invalid_entries.map((e, i) => (
                    <span key={i} className="chip invalid">{e || '""'}</span>
                  ))
                )}
              </div>
            </div>
            <div className="chips-card dup-card">
              <div className="section-title" style={{ margin: 0 }}>
                ⧉ Duplicate Edges
                <span className="pill" style={{ background: "rgba(245,158,11,0.12)", color: "var(--cycle)" }}>
                  {result.duplicate_edges.length}
                </span>
              </div>
              <div className="chips-list">
                {result.duplicate_edges.length === 0 ? (
                  <span className="chip none">None</span>
                ) : (
                  result.duplicate_edges.map((e, i) => (
                    <span key={i} className="chip dup">{e}</span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Raw JSON */}
          <div className="json-panel">
            <div className="json-header">
              <span className="json-title">⟨/⟩ Raw JSON Response</span>
              <CopyButton text={JSON.stringify(result, null, 2)} />
            </div>
            <div className="json-body">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          SRM Full Stack Engineering Challenge · Built with{" "}
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
            Next.js
          </a>
        </p>
      </footer>
    </div>
  );
}
