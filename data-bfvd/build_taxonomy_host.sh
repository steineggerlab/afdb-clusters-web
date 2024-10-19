#!/bin/bash

# ./build_taxonomy_host.sh afdb-clusters.sqlite3 ./taxonomy-accession_host.tsv

sqlite3 $1 << EOF

CREATE TABLE taxonomy_host (
  accession TEXT,
  tax_id TEXT
);

.mode tabs

.import "${2}" taxonomy_host

CREATE INDEX taxonomy_host_idx
ON taxonomy_host(accession);

EOF
