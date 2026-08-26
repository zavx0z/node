import {
  layoutCoffmanGraham,
  type CoffmanGrahamLayoutGraph,
} from "@nodes/layout/coffman-graham"

export function layoutCoffmanGrahamConsumer(graph: CoffmanGrahamLayoutGraph): number {
  const result = layoutCoffmanGraham(graph)
  return result.bounds.width + result.bounds.height + result.edges.length
}
