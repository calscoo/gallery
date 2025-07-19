# Image Date Processor Script

This script processes .jpg files in a target directory and renames them with numeric prefixes based on their creation date (oldest = 1).

## Prerequisites

You need `exiftool` installed on your system:

```bash
brew install exiftool
```

## Usage

```bash
./process_images_by_date.sh <target_directory>
```

## Example

```bash
./process_images_by_date.sh ./hugo/content/assemblages/
```

## What it does

1. **Finds all .jpg/.jpeg files** in the target directory (case insensitive)
2. **Extracts creation dates** using `exiftool` with intelligent fallback:
   - First tries "Date/Time Original" (EXIF DateTimeOriginal)
   - Then tries "Create Date" (EXIF CreateDate)
   - Then tries "Date Created" (EXIF DateCreated)
   - Finally tries "Modify Date" (EXIF ModifyDate)
3. **Sorts images** by creation date (oldest first)
4. **Renames files** with zero-padded numeric prefixes: `001_filename.jpg`, `002_filename.jpg`, etc. (supports up to 999 images)
5. **Skips files** that already have numeric prefixes (pattern: `[number]_filename.jpg`)

## Example Output

```
Processing images in: ./test_images
Processing: sunset.jpg
  Found date: 2023:05:15 18:30:22
Processing: mountain.jpg
  Found date: 2023:05:12 14:20:10
Processing: beach.jpg
  No date found - will be placed at end

Sorting files by date...
Renamed: mountain.jpg -> 001_mountain.jpg
Renamed: sunset.jpg -> 002_sunset.jpg
Renamed: beach.jpg -> 003_beach.jpg

Processing complete!
```

## Notes

- Files without date metadata will be placed at the end
- The script only processes files in the target directory (not subdirectories)
- Files already with numeric prefixes are skipped
- Compatible with macOS bash limitations 