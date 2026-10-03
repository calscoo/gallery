# Image Date Processor Script

This script processes .jpg files in a target directory and renames them with numeric prefixes based on their creation date (oldest = 1).

## Prerequisites

You need `exiftool` installed on your system:

```bash
# Ubuntu / WSL
sudo apt install libimage-exiftool-perl

# macOS
brew install exiftool
```

On Windows, run the script from WSL. The repo's `.gitattributes` forces LF line endings for `*.sh`; if you see `/bin/bash^M: bad interpreter`, the script was saved with CRLF endings and needs converting back (`sed -i 's/\r$//' process_images_by_date.sh`).

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
2. **Finds a date for each new file**, using the first of these that exists:
   - Dates embedded in the image (EXIF/XMP/IPTC): `DateTimeOriginal`, `CreateDate`, `DateTimeCreated`, `DateCreated`, `DigitalCreationDateTime`, `GPSDateTime`, `ModifyDate`
   - A date in the filename, e.g. `PXL_20250713_142503.jpg` or `2025-07-13 14.25.03.jpg`
   - The older of the file's Created and Modified times, kept to the day only. Under WSL the Windows "Created" time is fetched through `powershell.exe`, since Linux can't see it on `/mnt/c`
3. **Sorts images** by date (oldest first); files with the same date are ordered by filename, which for camera files like `DSCF4051.jpg` is the shot order
4. **Renames files** with zero-padded numeric prefixes: `001_filename.jpg`, `002_filename.jpg`, etc. (supports up to 999 images)
5. **Skips files** that already have numeric prefixes (pattern: `[number]_filename.jpg`)
6. **Appends new files** after the highest existing prefix, so adding `new.jpg` to a folder ending in `053_old.jpg` produces `054_new.jpg`

## Example Output

```
Processing images in: ./test_images
Processing: sunset.jpg
  Found date: 2023-05-15 18:30:22 (from DateTimeOriginal)
Processing: mountain.jpg
  Found date: 2023-05-12 14:20:10 (from DateTimeOriginal)
Processing: beach.jpg
  Found date: 2023-05-20 (from file created)

Sorting files by date...
Renamed: mountain.jpg -> 001_mountain.jpg
Renamed: sunset.jpg -> 002_sunset.jpg
Renamed: beach.jpg -> 003_beach.jpg

Processing complete!
```

## Notes

- Files with no date anywhere (not even a file-system timestamp) are placed at the end
- File-system dates only say when the file was written. Copying a file (in Explorer, or by dragging it into Cursor/VS Code) resets its Created date to "now". To keep it, either:
  - **Move** the files instead (Cut/Paste in Explorer, `Move-Item`, or `mv`) - on the same drive this keeps Created
  - Or copy with `robocopy`, which keeps it (`/IS /IM /IT` also overwrites copies that are already there):
    ```powershell
    robocopy C:\path\to\exports hugo\content\assemblages *.jpg /IS /IM /IT
    ```
- Exporting from Lightroom with Metadata set to "Copyright Only" strips the capture date; "All Except Camera & Camera Raw Info" (with "Remove Location Info" checked) keeps it without exposing GPS or camera settings
- The script only processes files in the target directory (not subdirectories)
- Files already with numeric prefixes are skipped
- Compatible with macOS bash limitations 