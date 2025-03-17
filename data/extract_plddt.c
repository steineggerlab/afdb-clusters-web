#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/stat.h>
#include <libgen.h>

#define BUFFER_SIZE 1024

// Check if the file has a .pdb extension
int has_pdb_extension(const char *filename) {
    const char *dot = strrchr(filename, '.');
    if (!dot || dot == filename) return 0;
    return strcmp(dot, ".pdb") == 0;
}

int is_ca_atom(const char *line) {
    char atom_name[5]; // Buffer to store the atom name
    strncpy(atom_name, line + 12, 4); // Extract columns 13-16 (0-based index is 12-15)
    atom_name[4] = '\0'; // Null-terminate the string

    // Check if the atom name is "CA" (allow for leading or trailing spaces)
    return strstr(atom_name, "CA") != NULL;
}

// Extract pLDDT values from an ATOM line
float extract_plddt_from_line(const char *line) {
    char buffer[7];
    // B-factor/pLDDT is located at columns 61-66 (starting from index 60 in 0-based indexing)
    strncpy(buffer, line + 60, 6);
    buffer[6] = '\0';
    return atof(buffer);
}

// Discretize a pLDDT value into a range of 0-9
int discretize_plddt(float plddt) {
    // Ensure pLDDT is between 0 and 100
    if (plddt < 0.0) plddt = 0.0;
    if (plddt > 100.0) plddt = 100.0;
    
    // Divide the range into 10 bins, each 10 units wide
    return (int)(plddt / 10.0);
}

char *reallocate_buffer(char *buffer, size_t *current_size) {
    size_t new_size = (*current_size) * 1.5;
    char *new_buffer = realloc(buffer, new_size);
    if (!new_buffer) {
        perror("Error reallocating buffer");
        free(buffer);
        exit(EXIT_FAILURE);
    }
    *current_size = new_size;
    return new_buffer;
}

// Process a single pdb file and compute the average pLDDT and pLDDT-sequence
void process_pdb_file(const char *filepath, char **plddt_sequence, size_t *sequence_size) {
    FILE *file = fopen(filepath, "r");
    if (file == NULL) {
        perror("Error opening file");
        return;
    }

    char line[BUFFER_SIZE];
    int count = 0;
    float sum_plddt = 0.0;

    (*plddt_sequence)[0] = '\0'; // Start with an empty string
    size_t sequence_length = 0;

    // Read the file line by line
    while (fgets(line, sizeof(line), file)) {
        if (strncmp(line, "ATOM  ", 6) == 0 && is_ca_atom(line)) {
            float plddt = extract_plddt_from_line(line);
            sum_plddt += plddt;
            count++;

            // Discretize the pLDDT value and map to its ASCII equivalent
            int discretized_value = discretize_plddt(plddt);
            char discretized_char = '0' + discretized_value;

            // Check if we need to reallocate the buffer
            if (sequence_length + 1 >= *sequence_size) { // +1 for null terminator
                *plddt_sequence = reallocate_buffer(*plddt_sequence, sequence_size);
            }

            // Append the discretized ASCII value to the sequence
            (*plddt_sequence)[sequence_length] = discretized_char;
            sequence_length++;
        }
    }

    // Null-terminate the sequence
    (*plddt_sequence)[sequence_length] = '\0';

    fclose(file);

    if (count > 0) {
        float average_plddt = sum_plddt / count;
        char *filename = basename((char *)filepath);
        printf("%s\t%.2f\t%s\n", filename, average_plddt, *plddt_sequence);
    }
}

void walk_directory(const char *dirpath, char **plddt_sequence, size_t *sequence_size) {
    struct dirent *entry;
    DIR *dp = opendir(dirpath);

    if (dp == NULL) {
        perror("Error opening directory");
        return;
    }

    while ((entry = readdir(dp)) != NULL) {
        // Skip "." and ".."
        if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) {
            continue;
        }

        char fullpath[BUFFER_SIZE];
        snprintf(fullpath, sizeof(fullpath), "%s/%s", dirpath, entry->d_name);

        struct stat statbuf;
        if (stat(fullpath, &statbuf) == 0) {
            if (S_ISDIR(statbuf.st_mode)) {
                walk_directory(fullpath, plddt_sequence, sequence_size);
            } else if (S_ISREG(statbuf.st_mode) && has_pdb_extension(entry->d_name)) {
                process_pdb_file(fullpath, plddt_sequence, sequence_size);
            }
        }
    }

    closedir(dp);
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <directory_or_file>\n", argv[0]);
        return 1;
    }

    const char *path = argv[1];
    struct stat statbuf;

    // Initialize pLDDT sequence buffer and size
    size_t sequence_size = BUFFER_SIZE;
    char *plddt_sequence = (char *)malloc(sequence_size);
    if (!plddt_sequence) {
        perror("Error allocating memory");
        return 1;
    }

    if (stat(path, &statbuf) != 0) {
        perror("Error getting file status");
        free(plddt_sequence);
        return 1;
    }

    if (S_ISDIR(statbuf.st_mode)) {
        walk_directory(path, &plddt_sequence, &sequence_size);
    } else if (S_ISREG(statbuf.st_mode)) {
        process_pdb_file(path, &plddt_sequence, &sequence_size);
    } else {
        fprintf(stderr, "Error: %s is not a valid file or directory.\n", path);
    }

    free(plddt_sequence);

    return 0;
}
