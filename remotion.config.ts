import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
// CI runners have fewer cores than a workstation; REMOTION_CONCURRENCY lets them say so.
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY) || 8);
Config.setOverwriteOutput(true);
