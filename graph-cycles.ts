/**
 * @file
 * Checks cycles in dependency graph for java packages: used to check it
 * in github.com/specs-feup/specs-java-libs/SpecsUtils
 */

const input_file = await Deno.readTextFile("graph-cycles-in.txt");

const lines = input_file.split("\n").filter((line) => line !== "");

type Entry = {
  pkg: string;
  deps: string[];
};

const entries = lines.map<Entry>((line) => {
  const [pkg, depString] = line.split(" - ");
  return {
    pkg,
    deps: depString === "" ? [] : depString.split(", "),
  };
});

const graph = new Map(entries.map(({ pkg, deps }) => [pkg, deps]));

function checkCyclesInner(
  graph: Map<string, string[]>,
  visited: Set<string>,
  node: string,
): [string, string][] {
  let res: [string, string][] = [];
  const deps = graph.get(node)!;
  visited.add(node);
  for (const dep of deps) {
    if (visited.has(dep)) {
      res = [...res, [node, dep]];
    } else {
      res = [...res, ...checkCyclesInner(graph, visited, dep)];
    }
  }
  visited.delete(node);
  return res;
}

function checkCycles(graph: Map<string, string[]>): [string, string][] {
  const keys = [...graph.keys()];
  return keys.flatMap((node) => checkCyclesInner(graph, new Set(), node));
}

function removeDuplicatesAndDirection(sortedCycles: [string, string][]) {
  const seens = new Map<string, Set<string>>();
  for (let i = 0; i < sortedCycles.length;) {
    const [a, b] = sortedCycles[i];
    if ((seens.get(b)?.has(a) ?? false) || (seens.get(a)?.has(b) ?? false)) {
      sortedCycles.splice(i, 1);
      continue;
    }
    if (!seens.has(a)) {
      seens.set(a, new Set([b]));
    } else {
      seens.get(a)?.add(b);
    }
    i++;
  }
}

const cycles = checkCycles(graph);

cycles.sort(([a1, a2], [b1, b2]) =>
  a1.localeCompare(b1) !== 0 ? a1.localeCompare(b1) : a2.localeCompare(b2)
);
removeDuplicatesAndDirection(cycles);

console.log(cycles);
