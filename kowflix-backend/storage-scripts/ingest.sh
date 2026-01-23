#!/bin/bash
# ingest.sh - Script for encoding video to HLS
# Usage: ./ingest.sh <input_file> <movie_slug>

INPUT_FILE="$1"
SLUG="$2"
# Use MEDIA_ROOT from env or argument, default to /media/DATA/kowflix
MEDIA_ROOT="${3:-${MEDIA_ROOT:-/media/DATA/kowflix}}"
OUTPUT_DIR="$MEDIA_ROOT/hls/$SLUG"

if [ -z "$INPUT_FILE" ] || [ -z "$SLUG" ]; then
    echo "Usage: $0 <input_file> <movie_slug>"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found."
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "=========================================="
echo "Starting Encoding for: $SLUG"
echo "Input: $INPUT_FILE"
echo "Output: $OUTPUT_DIR"
echo "=========================================="

# FFmpeg command for HLS segmenting (Fixed 720p/1080p adaptive bitrate optional, here single stream for simplicity or multi-bitrate)
# Using a robust command for standard HLS
# -c:v libx264 : Video codec H.264
# -crf 23      : Constant Rate Factor (Quality)
# -preset veryfast : Fast encoding
# -c:a aac     : Audio codec AAC
# -b:a 128k    : Audio bitrate
# -hls_time 10 : Segment duration 10s
# -hls_playlist_type vod : VOD playlist

ffmpeg -i "$INPUT_FILE" \
    -map 0:v:0 -map 0:a:0 \
    -c:v libx264 -mlibx264 -crf 23 -preset veryfast -g 48 -sc_threshold 0 \
    -c:a aac -b:a 128k \
    -hls_time 10 \
    -hls_playlist_type vod \
    -hls_segment_filename "$OUTPUT_DIR/segment_%03d.ts" \
    "$OUTPUT_DIR/master.m3u8" \
    -y

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✅ Encoding Completed Successfully!"
    echo "Playlist: $OUTPUT_DIR/master.m3u8"
    echo "=========================================="
    
    # Optional: Delete original file after success
    # rm "$INPUT_FILE"
else
    echo "=========================================="
    echo "❌ Encoding Failed!"
    echo "=========================================="
    exit 1
fi
