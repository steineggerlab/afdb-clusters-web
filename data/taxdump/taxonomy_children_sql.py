#!/usr/bin/env python3
fn = "nodes.dmp"
f = open(f"{fn}")

parent2child = {}

while True:
  line = f.readline().strip()

  if not line:
    break

  tokens = line.split('	|	')
  child = tokens[0]
  parent = tokens[1]
  if parent2child.get(parent):
    parent2child[parent].append(child)
  else:
    parent2child[parent] = [child]


fw = open('taxonomy-parent_child.tsv', 'w')

visited = set()
mapping = {}
max_cur_parents = 0

def traverse(cur, cur_parents):
  global max_cur_parents
  cur_parents = cur_parents + [cur]

  for parent in cur_parents:
    fw.write(f"{parent}\t{cur}\n")

  visited.add(cur)

  if not parent2child.get(cur):
    return

  for next in parent2child[cur]:
    if next in visited:
      continue

    traverse(next, cur_parents)

traverse('10239', [])
fw.close()
