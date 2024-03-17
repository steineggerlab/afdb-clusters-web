#!/bin/bash

# Usage: ./build_go_terms.sh afdb-clusters.sqlite3 ./gene_ontology/go-basic.obo

sqlite3 <(awk -F': ' '/^id: GO:/ {id=$2} /^name:/ {print id"\t"$2}' $1) << EOF

-- Create a FTS5 virtual table for GO terms with trigram tokenizer
CREATE VIRTUAL TABLE go_terms USING fts5(go_id, go_name, tokenize = 'trigram');

-- Set mode to tabs since you are importing from a tsv file
.mode tabs

-- Import the data
.import "${2}" go_terms

EOF
