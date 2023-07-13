#!/bin/bash

# ./build_go.sh afdb-clusters.sqlite3 gene_ontology/server-only-valid-GO_cluRep.tsv gene_ontology/go2-parent_child.tsv

sqlite3 $1 << EOF

CREATE TABLE cluster_go (
  goid TEXT,
	rep_accession TEXT
);

CREATE TABLE go_child (
  parent TEXT,
  child TEXT
);

.mode tabs

.import "${2}" cluster_go
.import "${3}" go_child

CREATE INDEX cluster_go_goid_idx
ON cluster_go(goid);