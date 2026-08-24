#!/usr/bin/env bash

set -euo pipefail
export LC_ALL=C LANG=C

action=${1:-}
checkout=${2:-}

[[ -n $action && -n $checkout && $# == 2 ]] || {
  printf 'error: usage: %s {status|ensure|start|restart|logs|stop|health} <checkout>\n' "$0" >&2
  exit 1
}

script_dir=$(cd "$(dirname "$0")" && pwd)
dispatcher="$script_dir/nodes-dispatcher.sh"
[[ -x $dispatcher ]] || {
  printf 'error: Nodes dispatcher is missing or not executable: %s\n' "$dispatcher" >&2
  exit 1
}

exec "$dispatcher" "$action" "$checkout" nodes
