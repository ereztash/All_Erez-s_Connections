const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "data", "people.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Helpers ---

function readData() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Routes ---

// GET /api/people
app.get("/api/people", (req, res) => {
  let people = readData();
  const { q, cluster } = req.query;

  if (cluster) {
    people = people.filter((p) => p.cluster === cluster);
  }

  if (q) {
    const term = q.toLowerCase();
    people = people.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.title.toLowerCase().includes(term) ||
        p.problem.toLowerCase().includes(term) ||
        p.solution.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  res.json({ count: people.length, people });
});

// GET /api/people/:id
app.get("/api/people/:id", (req, res) => {
  const people = readData();
  const person = people.find((p) => p.id === req.params.id);
  if (!person) return res.status(404).json({ error: "Not found" });
  res.json(person);
});

// POST /api/people
app.post("/api/people", (req, res) => {
  const { name, title, problem, solution, cluster, tags } = req.body;

  if (!name || !problem || !solution) {
    return res.status(400).json({ error: "name, problem, solution are required" });
  }

  const people = readData();
  const newPerson = {
    id: slugify(name) || uuidv4(),
    name,
    title: title || "",
    problem,
    solution,
    cluster: cluster || "uncategorized",
    tags: tags || [],
    source: "manual",
    added: new Date().toISOString().split("T")[0],
  };

  if (people.find((p) => p.id === newPerson.id)) {
    newPerson.id = newPerson.id + "-" + Date.now();
  }

  people.push(newPerson);
  writeData(people);
  res.status(201).json(newPerson);
});

// PUT /api/people/:id
app.put("/api/people/:id", (req, res) => {
  const people = readData();
  const idx = people.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const allowed = ["name", "title", "problem", "solution", "cluster", "tags"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      people[idx][key] = req.body[key];
    }
  }

  writeData(people);
  res.json(people[idx]);
});

// DELETE /api/people/:id
app.delete("/api/people/:id", (req, res) => {
  let people = readData();
  const before = people.length;
  people = people.filter((p) => p.id !== req.params.id);
  if (people.length === before) return res.status(404).json({ error: "Not found" });
  writeData(people);
  res.json({ deleted: req.params.id });
});

// GET /api/clusters
app.get("/api/clusters", (req, res) => {
  const people = readData();
  const clusters = {};
  for (const p of people) {
    if (!clusters[p.cluster]) {
      clusters[p.cluster] = { count: 0, people: [] };
    }
    clusters[p.cluster].count++;
    clusters[p.cluster].people.push(p.name);
  }
  res.json(clusters);
});

// GET /api/stats
app.get("/api/stats", (req, res) => {
  const people = readData();
  const clusters = {};
  const tags = {};
  for (const p of people) {
    clusters[p.cluster] = (clusters[p.cluster] || 0) + 1;
    for (const t of p.tags) {
      tags[t] = (tags[t] || 0) + 1;
    }
  }
  res.json({
    total: people.length,
    clusters,
    topTags: Object.entries(tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Referral API running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
  console.log(`${readData().length} people loaded`);
});
