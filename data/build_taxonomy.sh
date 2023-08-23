#!/bin/bash

# ./build_taxonomy.sh afdb-clusters.sqlite3 ./taxonomy-parent_child.tsv

sqlite3 $1 << EOF

CREATE TABLE taxonomy_lineage (
  parent TEXT,
	child TEXT
);

.mode tabs

.import "${2}" taxonomy_lineage

CREATE INDEX taxonomy_lineage_idx
ON taxonomy_lineage(parent);
