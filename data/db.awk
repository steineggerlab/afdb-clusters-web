#!/usr/bin/env gawk -f
BEGIN {
    last="";
    data="";
    offset=0;

    if (length(outfile) == 0) {
        outfile="afdb_desc";
    }
    outindex=outfile".index";

    printf("") > outfile;
    printf("") > outindex;
}

NR == 1 {
    last=$1;
}

($1 != last) && (NR > 1) {
    printf "%s\0", data >> outfile;
    size = length(data)+1;

    print last"\t"offset"\t"size >> outindex;
    offset = offset+size;
    last = $1;
    data = "";
}

{
    $1="";
	data = data""substr($0, 2)"\n";
}

END {
    close(outfile);
    close(outfile".index");
}

