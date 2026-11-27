import { availableParallelism } from "node:os";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
// Never ask for more render threads than the machine has (CI runners have 4);
// REMOTION_CONCURRENCY can lower it further.
Config.setConcurrency(
  Math.min(availableParallelism(), Number(process.env.REMOTION_CONCURRENCY) || 8),
);
Config.setOverwriteOutput(true);
