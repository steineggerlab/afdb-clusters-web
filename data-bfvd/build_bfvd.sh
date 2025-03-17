#!/bin/bash -ex

INPUT="./input"
OUTPUT="."
TMP_DIR="./tmp-bfvd"
DB_DIR="/fast/databases/colabfold_db_all"
MMSEQS="${HOME}/repositories/mmseqs/build-GCC-14.1.0-Release/src/mmseqs"
FOLDCOMP="${HOME}/repositories/foldcomp/build/foldcomp"
SCRIPTS="../data"

hasCommand () {
    command -v "$1" >/dev/null 2>&1
}

hasCommand "${MMSEQS}"
hasCommand "${FOLDCOMP}"
hasCommand seqkit

mkdir -p "${OUTPUT}"
mkdir -p "${TMP_DIR}"

if [ ! -x "${SCRIPTS}/db.awk" ]; then echo "db.awk missing or not executable"; exit 1; fi
if [ ! -x "${SCRIPTS}/build.sh" ]; then echo "build.sh missing or not executable"; exit 1; fi

# Process virus members
awk '{ print $1"\t"$2"\t0\t"$3; }' "${INPUT}/uniref30_2302_virus-members.tsv" \
    > "${TMP_DIR}/uniref30_2302_virus-members_flag.tsv"

# Build database
"${SCRIPTS}/build.sh" "${OUTPUT}/afdb-clusters.sqlite3" \
    "${TMP_DIR}/uniref30_2302_virus-members_flag.tsv" \
    <(uniq "${INPUT}/uniref30_2302_virus_clusters-acc_issingleton_nmem_replen_avgplen_repplddt_avgplddt_lca.tsv")

# Extract and process all-vs-all data
gunzip -c "${INPUT}/bfvd_all_vs_all-queryId_targetId_evalue.tsv.gz" | \
    awk '{ gsub(/_.*/, "", $1); gsub(/_.*/, "", $2); print }' \
        > "${TMP_DIR}/ava.tsv"

"${SCRIPTS}/db.awk" -v outfile="${OUTPUT}/ava_db" "${TMP_DIR}/ava.tsv"
LC_ALL=C sort -k1,1 "${OUTPUT}/ava_db.index" > "${OUTPUT}/ava_db.index_sort"
mv -f -- "${OUTPUT}/ava_db.index_sort" "${OUTPUT}/ava_db.index"

# Extract plddt with Foldcomp
aria2c --dir=${OUTPUT} -x16 -s32 https://bfvd.steineggerlab.workers.dev/bfvd_foldcompdb.tar.gz
mkdir -p "${OUTPUT}/foldcomp"
tar -C "${OUTPUT}/foldcomp" -xzvf ${OUTPUT}/bfvd_foldcompdb.tar.gz
"${FOLDCOMP}" extract "${OUTPUT}/foldcomp/bfvd" "${TMP_DIR}/bfvd_plddt.fasta" --plddt
awk '/^>/ { gsub(/_unrelaxed.*/, "", $1); gsub(/_1/, "", $1); } { print; }' "${TMP_DIR}/bfvd_plddt.fasta" > "${TMP_DIR}/bfvd_plddt_fixed_header.fasta"
mv -f -- "${TMP_DIR}/bfvd_plddt_fixed_header.fasta" "${TMP_DIR}/bfvd_plddt.fasta"
seqkit fx2tab "${TMP_DIR}/bfvd_plddt.fasta" | LC_ALL=C sort -k1,1 > "${TMP_DIR}/bfvd_plddt.tsv"
"${SCRIPTS}/db.awk" -v outfile="${OUTPUT}/afdb_plddt" "${TMP_DIR}/bfvd_plddt.tsv"

# "${FOLDCOMP}" extract "${OUTPUT}/foldcomp/bfvd" "${TMP_DIR}/bfvd.fasta" --fasta
# awk '/^>/ { gsub(/_unrelaxed.*/, "", $1); gsub(/_1/, "", $1); } { print; }' "${TMP_DIR}/bfvd.fasta" > "${TMP_DIR}/bfvd_fixed_header.fasta"
# mv -f -- "${TMP_DIR}/bfvd_fixed_header.fasta" "${TMP_DIR}/bfvd.fasta"
# seqkit fx2tab "${TMP_DIR}/bfvd.fasta" | LC_ALL=C sort -k1,1 > "${TMP_DIR}/bfvd.tsv"
# "${SCRIPTS}/db.awk" -v outfile="${OUTPUT}/afdb" "${TMP_DIR}/bfvd.tsv"

cp -f -- "${OUTPUT}/foldseek/bfvd" "${OUTPUT}/afdb"
awk 'NR == FNR { f[$1] = $2; next; } $1 in f { print f[$1]"\t"$2"\t"$3; }' "${TMP_DIR}/bfvd_fixed.lookup" "${OUTPUT}/foldseek/bfvd.index" \
    | LC_ALL=C sort -k1,1 > "${OUTPUT}/afdb.index"

aria2c --dir=${OUTPUT} -x16 -s32 https://bfvd.steineggerlab.workers.dev/bfvd_foldseekdb.tar.gz
mkdir -p "${OUTPUT}/foldseek"
tar -C "${OUTPUT}/foldseek" -xzvf ${OUTPUT}/bfvd_foldseekdb.tar.gz
cp -f -- "${OUTPUT}/foldseek/bfvd_ca" "${OUTPUT}/afdb_ca"
awk '{ gsub(/_unrelaxed.*/, "", $2); gsub(/_1/, "", $2); print; }' "${OUTPUT}/foldseek/bfvd.lookup" > "${TMP_DIR}/bfvd_fixed.lookup"
awk 'NR == FNR { f[$1] = $2; next; } $1 in f { print f[$1]"\t"$2"\t"$3; }' "${TMP_DIR}/bfvd_fixed.lookup" "${OUTPUT}/foldseek/bfvd_ca.index" \
    | LC_ALL=C sort -k1,1 > "${OUTPUT}/afdb_ca.index"

aria2c --dir=${OUTPUT} -x16 -s32 https://bfvd.steineggerlab.workers.dev/bfvd.tar.gz
mkdir -p ${OUTPUT}/extracted
(cd ${OUTPUT}/extracted && tar xzvf bfvd.tar.gz)
"${SCRIPTS}/extract_plddt" "${OUTPUT}/extracted" > "${OUTPUT}/new_plddt.tsv"
awk '{ gsub(/_unrelaxed.*/, "", $1); gsub(/_1/, "", $1); print $1"\t"$3; }' "${OUTPUT}/new_plddt.tsv" \
    | LC_ALL=C sort -k1,1 > "${TMP_DIR}/bfvd_plddt.tsv"
"${SCRIPTS}/db.awk" -v outfile="${OUTPUT}/afdb_plddt" "${TMP_DIR}/bfvd_plddt.tsv"

# Virus database processing
awk '{ gsub(/.*_/, "", $2); print $1"\t"$2; }' "${DB_DIR}/uniref30_2302_db_seq_h.tsv" \
    > "${TMP_DIR}/uniref30_2302_db_seq_h_accessions.tsv"

awk 'NR == FNR { f[$2] = 1; next; } $2 in f { print; }' \
    "${INPUT}/uniref30_2302_virus-members.tsv" \
    "${TMP_DIR}/uniref30_2302_db_seq_h_accessions.tsv" \
        > "${TMP_DIR}/uniref30_2302_virus-members_keys.tsv"

"${MMSEQS}" createsubdb "${TMP_DIR}/uniref30_2302_virus-members_keys.tsv" "${DB_DIR}/uniref30_2302_db_seq_h" "${TMP_DIR}/uniref30_2302_virus_db" --subdb-mode 1
"${MMSEQS}" convert2fasta "${TMP_DIR}/uniref30_2302_virus_db" "${TMP_DIR}/uniref30_2302_virus_db.fasta"

# Further processing and sorting
zcat "${TMP_DIR}/uniref30_2302_virus_db.fasta" \
    | seqkit fx2tab > "${TMP_DIR}/uniref30_2302_virus_db.tsv"
awk '{ gsub(/.*_/, "", $1); print $1"\t"$(NF); }' "${TMP_DIR}/uniref30_2302_virus_db.tsv" \
    | LC_ALL=C sort -k1,1 > "${TMP_DIR}/bfvd_seq.tsv"
"${SCRIPTS}/db.awk" -v outfile="${OUTPUT}/afdb" "${TMP_DIR}/bfvd_seq.tsv"

# Prepare descriptions
sed -E 's/n=[0-9]+.*//g' "${TMP_DIR}/uniref30_2302_virus_db.tsv" | \
    awk '{ gsub(/.*_/, "", $1); s = $2; for (i = 3; i <= NF; i++) { s = s" "$i; } print $1"\t"s; }' | \
    LC_ALL=C sort -k1,1 > "${TMP_DIR}/bfvd_desc.tsv"
"${SCRIPTS}/db.awk" -v outfile="${OUTPUT}/afdb_desc" "${TMP_DIR}/bfvd_desc.tsv"
