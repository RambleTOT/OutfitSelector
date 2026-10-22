#!/bin/zsh
# Собирает ролик из записи: tools/encode-video.sh <папка-записи> <музыка.wav> <выход.mp4>
set -e
rec=${1:-video/out}; wav=$2; out=${3:-video/atelier-demo.mp4}
ffmpeg -y -loglevel error -f concat -safe 0 -i "$rec/frames.txt" -i "$wav" -vf "fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 17 -c:a aac -b:a 192k -shortest -movflags +faststart "$out"
echo "готово: $out"
