#!/bin/bash

# Script to process images by creation date and rename with numeric prefixes
# Usage: ./process_images_by_date.sh <target_directory>

set -e  # Exit on any error

# Function to display usage
usage() {
    echo "Usage: $0 <target_directory>"
    echo "Processes .jpg files in the target directory and renames them with numeric prefixes based on creation date"
    exit 1
}

# Function to extract date from image using exiftool
get_image_date() {
    local file="$1"
    local date=""
    
    # Try "Date/Time Original" first (preferred for photos)
    date=$(exiftool -s -s -s -DateTimeOriginal "$file" 2>/dev/null || echo "")
    
    # If empty, try "Create Date"
    if [ -z "$date" ]; then
        date=$(exiftool -s -s -s -CreateDate "$file" 2>/dev/null || echo "")
    fi
    
    # If still empty, try "Date Created"
    if [ -z "$date" ]; then
        date=$(exiftool -s -s -s -DateCreated "$file" 2>/dev/null || echo "")
    fi
    
    # If still empty, try "Modify Date" as last resort
    if [ -z "$date" ]; then
        date=$(exiftool -s -s -s -ModifyDate "$file" 2>/dev/null || echo "")
    fi
    
    echo "$date"
}

# Function to convert date to sortable format (YYYY:MM:DD HH:MM:SS to YYYYMMDDHHMMSS)
format_date_for_sorting() {
    local date="$1"
    if [ -n "$date" ]; then
        # Remove colons and spaces, keep only digits
        echo "$date" | sed 's/[: ]//g'
    else
        # Return a very high number for files without dates (they'll be last)
        echo "99999999999999"
    fi
}

# Check if target directory is provided
if [ $# -ne 1 ]; then
    usage
fi

TARGET_DIR="$1"

# Check if directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Directory '$TARGET_DIR' does not exist"
    exit 1
fi

# Check if exiftool is available
if ! command -v exiftool >/dev/null 2>&1; then
    echo "Error: exiftool is not installed or not in PATH"
    echo "Install with: brew install exiftool"
    exit 1
fi

echo "Processing images in: $TARGET_DIR"

# Create temporary file to store file data
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Find all .jpg files (case insensitive) and process them
find "$TARGET_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r file; do
    filename=$(basename "$file")
    
    echo "Processing: $filename"
    
    # Get the image date
    image_date=$(get_image_date "$file")
    
    if [ -n "$image_date" ] && [ "$image_date" != "99999999999999" ]; then
        echo "  Found date: $image_date"
    else
        echo "  No date found - will be placed at end"
    fi
    
    # Format date for sorting
    sortable_date=$(format_date_for_sorting "$image_date")
    
    # Store in temp file: sortable_date|full_path|filename
    echo "${sortable_date}|${file}|${filename}" >> "$TEMP_FILE"
done

# Check if any files were found
if [ ! -s "$TEMP_FILE" ]; then
    echo "No .jpg files found in $TARGET_DIR"
    exit 0
fi

echo ""
echo "Sorting files by date..."

# Sort by date and rename files
SORTED_FILE=$(mktemp)
trap "rm -f $TEMP_FILE $SORTED_FILE" EXIT

sort -t'|' -k1 "$TEMP_FILE" > "$SORTED_FILE"

counter=1
while IFS='|' read -r sortable_date full_path filename; do
    # Skip files that already have numeric prefix
    if echo "$filename" | grep -q '^[0-9]\+_'; then
        echo "Skipping $filename (already has numeric prefix)"
        continue
    fi
    
    # Create new filename with zero-padded numeric prefix (supports up to 999 images)
    padded_counter=$(printf "%03d" $counter)
    new_filename="${padded_counter}_${filename}"
    new_path="$(dirname "$full_path")/$new_filename"
    
    # Rename the file
    if [ "$full_path" != "$new_path" ]; then
        mv "$full_path" "$new_path"
        echo "Renamed: $filename -> $new_filename"
    else
        echo "No change needed: $filename"
    fi
    
    counter=$((counter + 1))
done < "$SORTED_FILE"

echo ""
echo "Processing complete!" 