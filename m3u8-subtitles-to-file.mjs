#!/usr/bin/env zx
import m3u8Parser from "m3u8-parser";
import slugify from "slugify";

if (!argv.url) {
  console.error(chalk.red("You need to provide --url argument value!"));
  process.exit();
}

try {
  await which("ffmpeg");
} catch (err) {
  console.error(
    chalk.red("You need to have FFmpeg installed to use this script!")
  );
  process.exit();
}

const urlObject = new URL(argv.url);

// Fetch playlist
const response = await fetch(urlObject.href);

if (!response.ok) {
  console.error(chalk.red("Fetch error: ") + response.statusText);
  process.exit();
}

const body = await response.text();

const parser = new m3u8Parser.Parser();
parser.push(body);
parser.end();

// Looking for subtitles groups
const subtitles = parser.manifest.mediaGroups?.SUBTITLES?.sub;

if (subtitles === undefined) {
  console.error(chalk.red("Can't find subtitles in media groups"));
  process.exit();
}

const subtitleNames = Object.keys(subtitles);
const subtitleDetails = Object.values(subtitles);

console.log(
  [
    chalk.blue(
      `I managed to find ${subtitleNames.length} playlist(s) with subtitles:`
    ),
    subtitleNames.map((s, i) => i + 1 + `. ${s}`).join("\n"),
  ].join("\n")
);

const playlistNumber = await question("Playlist number to convert: ");
const playlistName = slugify(subtitleNames[playlistNumber - 1], {
  lower: true,
});
const playlistData = subtitleDetails[playlistNumber - 1];
const playlistURI = urlObject.origin + playlistData.uri;
const date = new Date().getTime();

try {
  await $`ffmpeg -i ${playlistURI} subtitles-${playlistName}-${date}.srt`;
} catch (p) {
  console.log(`Exit code: ${p.exitCode}`);
  console.log(`Error: ${p.stderr}`);
}
