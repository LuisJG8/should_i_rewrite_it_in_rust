import { useMemo, useState } from "react";
import {
  Boxes,
  Gauge,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import rustMascot from "@/assets/rustacean-flat-happy.png";

type ScoreBand = "all" | "high" | "medium" | "low";
type SortOrder = "highest" | "lowest";

type FactorSet = {
  performance: number;
  safety: number;
  migration: number;
  ecosystem: number;
};

type Project = {
  id: string;
  name: string;
  summary: string;
  why: string;
  tags: string[];
  factors: FactorSet;
};

type WeightedProject = Project & {
  score: number;
};

type Weights = {
  performance: number;
  safety: number;
  migration: number;
  ecosystem: number;
};

const defaultWeights: Weights = {
  performance: 35,
  safety: 30,
  migration: 15,
  ecosystem: 20,
};

const totalScoreWeight = Object.values(defaultWeights).reduce((sum, value) => sum + value, 0);

const scoringCategories = [
  {
    key: "performance",
    title: "Performance upside",
    label: "Value signal",
    Icon: Gauge,
    color: "bg-emerald-500",
    description: "How much a Rust rewrite could improve throughput, latency, or memory usage.",
  },
  {
    key: "safety",
    title: "Safety upside",
    label: "Value signal",
    Icon: ShieldCheck,
    color: "bg-sky-500",
    description: "How much the project could benefit from stronger memory and concurrency safety.",
  },
  {
    key: "ecosystem",
    title: "Ecosystem fit",
    label: "Value signal",
    Icon: Boxes,
    color: "bg-indigo-500",
    description: "How well Rust tooling, crates, and deployment patterns match the project.",
  },
  {
    key: "migration",
    title: "Migration complexity penalty",
    label: "Risk signal",
    Icon: TriangleAlert,
    color: "bg-amber-500",
    description: "How much existing size, integrations, and compatibility requirements reduce rewrite value.",
  },
] satisfies Array<{
  key: keyof Weights;
  title: string;
  label: string;
  Icon: typeof Gauge;
  color: string;
  description: string;
}>;

const baseProjects: Project[] = [
  {
    id: "base-nodejs",
    name: "Node.js",
    summary:
      "JavaScript runtime used by web servers and tooling ecosystems built around fast IO and events.",
    why: "Rust could reduce memory spikes from GC-heavy workloads and improve raw performance for high-throughput services.",
    tags: ["runtime", "network", "ecosystem"],
    factors: {
      performance: 95,
      safety: 88,
      migration: 64,
      ecosystem: 90,
    },
  },
  {
    id: "base-curl",
    name: "curl",
    summary:
      "A command-line tool for transferring data with URL syntax support across multiple protocols.",
    why: "A Rust version could improve safety in URL parsing and TLS handling while preserving the compact CLI footprint.",
    tags: ["network", "cli", "security"],
    factors: {
      performance: 80,
      safety: 83,
      migration: 45,
      ecosystem: 72,
    },
  },
  {
    id: "base-redis",
    name: "Redis",
    summary:
      "Popular in-memory data structure store, typically written in C with strict performance goals.",
    why: "Rust can increase subsystem safety with minimal impact if focused on module boundaries and allocator-heavy parts.",
    tags: ["datastore", "c", "high-performance"],
    factors: {
      performance: 78,
      safety: 74,
      migration: 48,
      ecosystem: 85,
    },
  },
  {
    id: "base-ffmpeg",
    name: "FFmpeg",
    summary:
      "Massive multimedia framework with wide codec and muxer support.",
    why: "Rust rewrites could improve memory safety, but codec-module complexity means most benefit is long-term maintainability.",
    tags: ["media", "large-codebase", "c"],
    factors: {
      performance: 70,
      safety: 58,
      migration: 76,
      ecosystem: 66,
    },
  },
  {
    id: "base-tensorflow",
    name: "TensorFlow",
    summary:
      "Machine learning library with heavy C++ and Python integrations for scale.",
    why: "Rust could help at service boundaries, but the graph runtime depth means a full rewrite is disruptive and very large.",
    tags: ["ml", "c++", "python"],
    factors: {
      performance: 60,
      safety: 64,
      migration: 82,
      ecosystem: 80,
    },
  },
  {
    id: "base-gcc",
    name: "GCC",
    summary:
      "GNU Compiler Collection, huge legacy C++ compiler infrastructure.",
    why: "A full Rust rewrite is unrealistic; selective Rustization can improve safety in utilities and front-end tooling instead.",
    tags: ["compilers", "very-large", "legacy"],
    factors: {
      performance: 72,
      safety: 49,
      migration: 94,
      ecosystem: 57,
    },
  },
];

const scoreStyles: Record<"high" | "mid" | "low", string> = {
  high: "score-high",
  mid: "score-mid",
  low: "score-low",
};

const scoreLevel = (score: number): "high" | "mid" | "low" => {
  if (score >= 75) return "high";
  if (score >= 55) return "mid";
  return "low";
};

const scoreLabel = (score: number): string => {
  if (score >= 75) return "High value";
  if (score >= 55) return "Moderate value";
  return "Low value";
};

const normalize = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

function calculateScore(factors: FactorSet, weights: Weights): number {
  const positive = factors.performance * weights.performance
    + factors.safety * weights.safety
    + factors.ecosystem * weights.ecosystem;
  const penalty = factors.migration * weights.migration;

  const totalWeight = weights.performance + weights.safety + weights.ecosystem + weights.migration;
  if (totalWeight === 0) return 0;

  // shift range so migration can reduce score while everything stays in 0..100
  const shifted = positive - penalty + 100 * weights.migration;
  const maxPossible = 100 * (weights.performance + weights.safety + weights.ecosystem + weights.migration);
  return normalize((shifted / maxPossible) * 100);
}

export default function App() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("highest");
  const [bandFilter, setBandFilter] = useState<ScoreBand>("all");

  const scoredProjects = useMemo<WeightedProject[]>(() => {
    const withScores = baseProjects.map((project) => ({
      ...project,
      score: calculateScore(project.factors, defaultWeights),
    }));
    const filtered = withScores.filter((project) => {
      if (bandFilter === "all") return true;
      if (bandFilter === "high") return scoreLevel(project.score) === "high";
      if (bandFilter === "medium") return scoreLevel(project.score) === "mid";
      return scoreLevel(project.score) === "low";
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortOrder === "highest") return b.score - a.score;
      return a.score - b.score;
    });
    return sorted;
  }, [sortOrder, bandFilter]);

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <section className="mx-auto w-full max-w-6xl space-y-8">
        <div className="grid min-h-[420px] items-center gap-8 py-12 md:grid-cols-[1fr_auto] md:gap-12 md:py-20">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-serif text-4xl font-bold leading-[1.02] text-slate-950 md:text-6xl">
              Should I rewrite it with <span className="text-orange-600">Rust</span>?
            </h1>
            <div className="max-w-2xl space-y-2">
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                Add open-source projects, compare scoring factors, and rank by likely Rust conversion value.
              </p>
            </div>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <div className="relative h-56 w-64 md:h-80 md:w-96">
              <img
                src={rustMascot}
                alt="Rust crab mascot"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <Card className="border-slate-300">
          <CardHeader className="space-y-3">
            <CardTitle className="text-lg">How scores are calculated</CardTitle>
            <CardDescription>
              Scores are based on four categories that estimate the value of a Rust rewrite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1.3fr] md:items-center">
              <div className="space-y-3">
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    Score = upside signals - migration risk
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Performance, safety, and ecosystem fit raise the score. Migration complexity lowers it.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex h-3 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-slate-200">
                  {scoringCategories.map((category) => (
                    <span
                      key={category.key}
                      className={category.color}
                      style={{ width: `${(defaultWeights[category.key] / totalScoreWeight) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  {scoringCategories.map((category) => (
                    <div key={category.key} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${category.color}`} />
                        {category.title}
                      </span>
                      <span className="font-medium text-slate-900">
                        {defaultWeights[category.key]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {scoringCategories.map((category) => (
                <div key={category.title} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 p-2 text-slate-700">
                        <category.Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{category.title}</h3>
                        <p className="text-xs font-medium text-slate-500">{category.label}</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {category.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Scoreboard</h2>
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-slate-700">Sort:</span>
              <Button
                variant={sortOrder === "highest" ? "default" : "outline"}
                size="sm"
                aria-pressed={sortOrder === "highest"}
                onClick={() => setSortOrder("highest")}
              >
                Highest first
              </Button>
              <Button
                variant={sortOrder === "lowest" ? "default" : "outline"}
                size="sm"
                aria-pressed={sortOrder === "lowest"}
                onClick={() => setSortOrder("lowest")}
              >
                Lowest first
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "high", "medium", "low"] as ScoreBand[]).map((band) => (
                <Button
                  key={band}
                  size="sm"
                  variant={bandFilter === band ? "default" : "outline"}
                  aria-pressed={bandFilter === band}
                  onClick={() => setBandFilter(band)}
                  className="capitalize"
                >
                  {band} band
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {scoredProjects.map((project) => (
                <Card key={project.id} className="flex h-full flex-col">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <CardDescription className="mt-1 text-sm">{project.summary}</CardDescription>
                      </div>
                      <Badge
                        className={`${scoreStyles[scoreLevel(project.score)]} border`}
                        variant="outline"
                      >
                        {project.score}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    <p className="text-sm leading-relaxed text-slate-700">{project.why}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <span className="text-slate-600">Performance: {project.factors.performance}</span>
                      <span className="text-slate-600">Safety: {project.factors.safety}</span>
                      <span className="text-slate-600">Migration: {project.factors.migration}</span>
                      <span className="text-slate-600">Ecosystem: {project.factors.ecosystem}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                        <span>Rust benefit score</span>
                        <span>{project.score}/100</span>
                      </div>
                      <Progress value={project.score} />
                      <p className="text-xs font-medium text-slate-600">
                        Level: {scoreLabel(project.score)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
