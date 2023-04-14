# Run like:
#   ./build.sh <db.sqlite3> <members.tsv> <clusters.tsv>
# Where:
#   members.tsv  = rep_id, mem_id, flag, tax_id
#   clusters.tsv = acc, is_dark, n_mem, rep_len, avg_len, rep_plddt, avg_plddt, lca_tax_id

sqlite3 $1 << EOF
CREATE TABLE member (
	accession TEXT PRIMARY KEY,
	rep_accession TEXT,
	tax_id TEXT,
	flag INTEGER
);

CREATE TABLE cluster (
	rep_accession TEXT PRIMARY KEY,
	rep_len INTEGER,
	rep_plddt REAL,
	is_dark BOOLEAN,
	n_mem INTEGER,
	avg_len INTEGER,
	avg_plddt REAL,
	lca_tax_id INTEGER
);

PRAGMA journal_mode=OFF;
PRAGMA synchronous=OFF;
PRAGMA locking_mode=EXCLUSIVE;
PRAGMA temp_store=file;
PRAGMA cache_size=4000000000;
PRAGMA max_page_limit=13107200;

-- Import data into temp tables
.mode tabs

CREATE TABLE tmpMember (
	rep_id TEXT,
	mem_id TEXT,
	flag INTEGER,
	tax_id INTEGER
);

CREATE TABLE tmpCluster (
	rep_id TEXT,
	is_dark BOOLEAN,
	n_mem INTEGER,
	rep_len INTEGER,
	avg_len REAL,
	rep_plddt REAL,
	avg_plddt REAL,
	lca_tax_id INTEGER
);

.import "${2}" tmpMember
.import "${3}" tmpCluster

-- Process names
UPDATE tmpMember
SET rep_id = REPLACE(rep_id, 'AF-', ''),
    mem_id = REPLACE(mem_id, 'AF-', '');
UPDATE tmpMember
SET rep_id = REPLACE(rep_id, '-F1-model_v3.cif', ''),
    mem_id = REPLACE(mem_id, '-F1-model_v3.cif', '');
UPDATE tmpCluster
SET rep_id = REPLACE(rep_id, 'AF-', '');
UPDATE tmpCluster
SET rep_id = REPLACE(rep_id, '-F1-model_v3.cif', '');

-- Insert members & index on accession
INSERT INTO member (accession, rep_accession, flag, tax_id)
SELECT mem_id, rep_id, flag, tax_id
FROM tmpMember;

-- Index on member accessions
CREATE INDEX member_acc_idx
ON member(accession);

-- Index on member representative accessions
CREATE INDEX member_rep_idx
ON member(rep_accession);

-- Insert clusters
INSERT INTO cluster (rep_accession, is_dark, n_mem, rep_len, avg_len, rep_plddt, avg_plddt, lca_tax_id)
SELECT rep_id, is_dark, n_mem, rep_len, avg_len, rep_plddt, avg_plddt, lca_tax_id
FROM tmpCluster;

-- Index on cluster representative accessions
CREATE INDEX cluster_rep_idx
ON cluster(rep_accession);

-- Cleanup
DROP TABLE IF EXISTS tmpMember;
DROP TABLE IF EXISTS tmpCluster;
EOF

