#!/usr/bin/env python3

import tarfile
import gzip
from multiprocessing import Pool
import os
import io
import sys
import time
from tqdm import tqdm

def manipulate_filename(filename):
    """
    Function to manipulate the file base name.
    Turns filenames like:
    './A0A2D3I5G7_1_unrelaxed_rank_001_alphafold2_ptm_model_1_seed_000.pdb'
    into:
    'A0A2D3I5G7_1.pdb.gz'
    """
    base_filename = os.path.basename(filename)
    # Find the position of "_unrelaxed"
    idx = base_filename.find('_unrelaxed')
    if idx != -1:
        id_part = base_filename[:idx]
    else:
        # If "_unrelaxed" not found, remove the extension
        id_part = os.path.splitext(base_filename)[0]
    new_filename = id_part + '.pdb.gz'
    return new_filename, id_part

def compress_file(args):
    """
    Function to compress file content using gzip.
    This function is intended to be run in a multiprocessing pool.
    """
    filename, content = args
    compressed_content = gzip.compress(content)
    # Manipulate the file base name
    new_filename, id_part = manipulate_filename(filename)
    return new_filename, compressed_content, id_part

def main():
    if len(sys.argv) != 3:
        print("Usage: script.py input.tar output.tar")
        sys.exit(1)
    
    input_tar_filename = sys.argv[1]
    output_tar_filename = sys.argv[2]
    index_filename = output_tar_filename + '.index'

    # Record the script start time to use as mtime for all files
    SCRIPT_START_TIME = time.time()
    
    # List to hold file data
    files_to_process = []

    # Read the input tar file with a progress bar
    with tarfile.open(input_tar_filename, 'r') as tar:
        members = tar.getmembers()
        for member in tqdm(members, desc="Reading input tar", unit="file"):
            if member.isfile():
                # Extract file content
                f = tar.extractfile(member)
                content = f.read()
                # Append file data to the list
                files_to_process.append((member.name, content))
            else:
                # Ignore other members
                pass

    # Use multiprocessing Pool to compress files with a progress bar
    with Pool() as pool:
        # Create an iterator with imap_unordered for progress tracking
        results = []
        for result in tqdm(pool.imap_unordered(compress_file, files_to_process), 
                           total=len(files_to_process), desc="Compressing files", unit="file"):
            results.append(result)
    
    # Now, write the compressed files to a new tar file
    # and write the index file with a progress bar
    with tarfile.open(output_tar_filename, 'w', format=tarfile.USTAR_FORMAT) as tar_out, open(index_filename, 'w') as index_file:
        for new_filename, compressed_content, id_part in tqdm(results, desc="Writing output tar", unit="file"):
            # Create a new TarInfo object for each compressed file
            tarinfo = tarfile.TarInfo(name=new_filename)
            tarinfo.size = len(compressed_content)
            tarinfo.mtime = SCRIPT_START_TIME
            tarinfo.mode = 0o644
            # Set uname, gname to empty strings and uid, gid to zero
            tarinfo.uname = ''
            tarinfo.gname = ''
            tarinfo.uid = 0
            tarinfo.gid = 0

            # Get the current offset before adding the file (this is the offset of the header)
            file_header_offset = tar_out.offset

            # Add the file to the tar archive
            tar_out.addfile(tarinfo, io.BytesIO(compressed_content))

            # Calculate the offset to the file content
            file_content_offset = file_header_offset + 512  # Header is 512 bytes

            # Record the file info to the index file
            content_length = tarinfo.size  # Size of the compressed file data
            index_file.write(f"{id_part}\t{file_content_offset}\t{content_length}\n")

    print(f"Index file written to {index_filename}")

if __name__ == '__main__':
    main()

