import {layoutTopDown, type TopDownLayoutGraph} from "@nodes/layout/top-down"

export function layoutTopDownConsumer(graph: TopDownLayoutGraph): number {
  const result = layoutTopDown(graph)
  return result.nodes.length + result.edges.length
}
