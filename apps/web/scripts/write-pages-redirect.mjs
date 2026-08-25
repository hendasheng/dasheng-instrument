import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const distRoot = resolve(import.meta.dirname, "..", "dist");
const latestVersion = "0.1";

mkdirSync(distRoot, { recursive: true });

writeFileSync(
  resolve(distRoot, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url=./${latestVersion}/" />
    <title>Loudroom / 大声练琴</title>
    <script>
      window.location.replace("./${latestVersion}/");
    </script>
  </head>
  <body>
    <a href="./${latestVersion}/">Open Loudroom ${latestVersion}</a>
  </body>
</html>
`,
);
