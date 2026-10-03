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

# Embedded date tags (EXIF, XMP, IPTC, GPS), most reliable first
EMBEDDED_DATE_TAGS=(DateTimeOriginal CreateDate DateTimeCreated DateCreated DigitalCreationDateTime GPSDateTime ModifyDate)
DATE_FORMAT='%Y-%m-%d %H:%M:%S'
VALID_DATE_RE='^[12][0-9]{3}-[01][0-9]-[0-3][0-9] [0-2][0-9]:[0-5][0-9]:[0-5][0-9]$'
# Dates in filenames such as IMG_20250713_142503, PXL_20250713..., 2025-07-13 14.25.03 (time optional)
FILENAME_DATE_RE='(19[0-9]{2}|20[0-9]{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12][0-9]|3[01])([-_. T]?([01][0-9]|2[0-3])[-_.:]?([0-5][0-9])[-_.:]?([0-5][0-9]))?'

# Prints "<date>|<source>" for the best date found, or nothing.
# Tries embedded metadata, then a date in the filename, then file-system timestamps.
get_image_date() {
    local file="$1"
    local filename="$2"
    local output tag found created modified oldest source
    local i=0
    local -a values

    output=$(exiftool -T -f -d "$DATE_FORMAT" "${EMBEDDED_DATE_TAGS[@]/#/-}" -FileCreateDate -FileModifyDate "$file" 2>/dev/null || true)
    IFS=$'\t' read -r -a values <<< "$output"

    for tag in "${EMBEDDED_DATE_TAGS[@]}"; do
        if [[ "${values[$i]}" =~ $VALID_DATE_RE ]]; then
            echo "${values[$i]}|$tag"
            return 0
        fi
        i=$((i + 1))
    done

    if [[ "$filename" =~ $FILENAME_DATE_RE ]]; then
        found="${BASH_REMATCH[1]}-${BASH_REMATCH[2]}-${BASH_REMATCH[3]}"
        if [ -n "${BASH_REMATCH[5]}" ]; then
            found="$found ${BASH_REMATCH[5]}:${BASH_REMATCH[6]}:${BASH_REMATCH[7]}"
        fi
        echo "$found|filename"
        return 0
    fi

    created=${values[$i]}
    modified=${values[$((i + 1))]}
    if [ -s "$WINDOWS_TIMES" ]; then
        created=$(awk -F'|' -v name="$filename" '$1 == name { print $2; exit }' "$WINDOWS_TIMES")
    fi

    oldest=""
    if [[ "$created" =~ $VALID_DATE_RE ]]; then
        oldest=$created
        source="file created"
    fi
    if [[ "$modified" =~ $VALID_DATE_RE ]] && { [ -z "$oldest" ] || [[ "$modified" < "$oldest" ]]; }; then
        oldest=$modified
        source="file modified"
    fi

    # File-system times only record when the file was written (exported, unzipped, copied),
    # so keep just the day and let the filename (camera frame number) order shots within it
    if [ -n "$oldest" ]; then
        echo "${oldest%% *}|$source"
    fi
    return 0
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
    echo "Install with: sudo apt install libimage-exiftool-perl  (Ubuntu/WSL)"
    echo "          or: brew install exiftool                    (macOS)"
    exit 1
fi

echo "Processing images in: $TARGET_DIR"

TEMP_FILE=$(mktemp)
SORTED_FILE=$(mktemp)
WINDOWS_TIMES=$(mktemp)
trap "rm -f $TEMP_FILE $SORTED_FILE $WINDOWS_TIMES" EXIT

# Under WSL, Windows "Created" times aren't visible through /mnt/<drive>, so ask Windows directly
case "$(cd "$TARGET_DIR" && pwd -P)" in
    /mnt/[a-z]/*)
        if command -v powershell.exe >/dev/null 2>&1; then
            (cd "$TARGET_DIR" && powershell.exe -NoProfile -NonInteractive -Command \
                "[Console]::OutputEncoding = [Text.Encoding]::UTF8; Get-ChildItem -File | ForEach-Object { \$_.Name + '|' + \$_.CreationTime.ToString('yyyy-MM-dd HH:mm:ss') }") \
                2>/dev/null | tr -d '\r' > "$WINDOWS_TIMES" || true
        fi
        ;;
esac

# Find all .jpg files (case insensitive) and process them
find "$TARGET_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r file; do
    filename=$(basename "$file")

    # Numbered files keep their place; they're only listed so the highest prefix can be found
    if [[ "$filename" =~ ^[0-9]+_ ]]; then
        echo "00000000000000|${file}|${filename}" >> "$TEMP_FILE"
        continue
    fi

    echo "Processing: $filename"

    image_date=$(get_image_date "$file" "$filename")

    if [ -n "$image_date" ]; then
        echo "  Found date: ${image_date%%|*} (from ${image_date#*|})"
        sortable_date=$(echo "${image_date%%|*}" | tr -d ' :-')000000
        sortable_date=${sortable_date:0:14}
    else
        echo "  No date found - will be placed at end"
        sortable_date="99999999999999"
    fi

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

# Sort by date (ties broken by filename) and rename files
sort -t'|' -k1 "$TEMP_FILE" > "$SORTED_FILE"

# Continue numbering after the highest existing prefix so new images are appended
max_prefix=0
while IFS='|' read -r _ _ filename; do
    if [[ "$filename" =~ ^([0-9]+)_ ]]; then
        prefix=$((10#${BASH_REMATCH[1]}))
        if [ "$prefix" -gt "$max_prefix" ]; then
            max_prefix=$prefix
        fi
    fi
done < "$SORTED_FILE"

counter=$((max_prefix + 1))
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