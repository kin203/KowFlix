// src/utils/ffmpeg.js
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

/**
 * Transcode MP4 -> HLS multi-quality and write master.m3u8
 * inputPath: absolute path to mp4
 * outDir: absolute dir to write (must exist or will be created)
 * qualities: array of { name: "1080p", height: 1080, bitrate: "5000k", maxrate:"5350k", bufsize:"7500k"}
 */
export async function transcodeToHlsMulti(inputPath, outDir, qualities = null) {
  // default qualities
  if (!qualities) {
    qualities = [
      { name: "1080p", height: 1080, bitrate: "5000k", maxrate: "5350k", bufsize: "7500k" },
      { name: "720p", height: 720, bitrate: "3000k", maxrate: "3210k", bufsize: "4500k" },
      { name: "480p", height: 480, bitrate: "1500k", maxrate: "1605k", bufsize: "2100k" },
      { name: "360p", height: 360, bitrate: "800k", maxrate: "856k", bufsize: "1200k" },
    ];
  }

  await fs.mkdir(outDir, { recursive: true });

  const variantPromises = qualities.map(q => {
    return new Promise((resolve, reject) => {
      // output names
      const playlist = path.join(outDir, `${q.name}.m3u8`);
      const segmentPattern = path.join(outDir, `${q.name}_%03d.ts`);

      // ffmpeg arguments: scale, bitrate, hls options
      const args = [
        "-y",
        "-i", inputPath,
        "-c:a", "aac",
        "-ar", "48000",
        "-b:a", "128k",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-g", "48",
        "-keyint_min", "48",
        "-sc_threshold", "0",
        "-b:v", q.bitrate,
        "-maxrate", q.maxrate,
        "-bufsize", q.bufsize,
        "-vf", `scale=-2:${q.height}`,
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", segmentPattern,
        playlist
      ];

      const ff = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

      let stderr = "";
      ff.stderr.on("data", d => stderr += d.toString());

      ff.on("close", code => {
        if (code === 0) {
          resolve({ quality: q.name, playlist: playlist });
        } else {
          reject(new Error(`ffmpeg failed for ${q.name} code=${code} ${stderr}`));
        }
      });
    });
  });

  // run all in sequence (to avoid heavy parallel load) OR do parallel if server strong
  const results = [];
  for (const p of variantPromises) {
    // p is a Promise — but we want sequential: await each creation
    // Actually need to await each mapped promise creation (above returns promises immediately),
    // so instead spawn sequentially using for..of over qualities:
  }

  // reimplement sequentially to avoid heavy CPU spike:
  const seqResults = [];
  for (const q of qualities) {
    const playlist = path.join(outDir, `${q.name}.m3u8`);
    const segmentPattern = path.join(outDir, `${q.name}_%03d.ts`);
    const args = [
      "-y",
      "-i", inputPath,
      "-c:a", "aac",
      "-ar", "48000",
      "-b:a", "128k",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-g", "48",
      "-keyint_min", "48",
      "-sc_threshold", "0",
      "-b:v", q.bitrate,
      "-maxrate", q.maxrate,
      "-bufsize", q.bufsize,
      "-vf", `scale=-2:${q.height}`,
      "-hls_time", "6",
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", segmentPattern,
      playlist
    ];

    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      ff.stderr.on("data", d => stderr += d.toString());
      ff.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg failed for ${q.name} code=${code} ${stderr}`));
      });
    });
    seqResults.push({ quality: q.name, playlist: `${q.name}.m3u8` });
  }

  // build master playlist (relative paths)
  const masterLines = [
    '#EXTM3U'
  ];
  // recommended bandwidths (approx)
  const bw = { "1080p": 5000000, "720p": 3000000, "480p": 1500000, "360p": 800000 };
  for (const r of seqResults) {
    const q = qualities.find(x => x.name === r.quality);
    masterLines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bw[r.quality] || 1000000},RESOLUTION=1920x${q.height}`);
    masterLines.push(r.playlist);
  }
  const masterContent = masterLines.join("\n");
  await fs.writeFile(path.join(outDir, "master.m3u8"), masterContent, "utf8");

  return {
    variants: seqResults.map(r => ({ quality: r.quality, playlist: r.playlist })), // playlist is filename like "720p.m3u8"
    master: "master.m3u8"
  };
}

/**
 * create thumbnail (single frame)
 * outPath: full path to jpg
 */
export async function createThumbnail(inputPath, outPath, atSeconds = 5) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i", inputPath,
      "-ss", `${atSeconds}`,
      "-vframes", "1",
      "-q:v", "2",
      outPath
    ];
    const ff = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    ff.on("close", code => {
      if (code === 0) resolve(outPath);
      else reject(new Error("ffmpeg thumbnail failed code=" + code));
    });
  });
}
