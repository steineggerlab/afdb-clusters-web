#!/bin/bash

awk '$1=="id:" {id[$2]=""; cur=$2; next;} $1=="is_a:" {id[cur]=id[cur]$2";"} END {for (key in id) if (id[key]) print key"\t"id[key]}' go-basic.obo > child_parent.tsv