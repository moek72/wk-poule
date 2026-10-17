import { Config } from '@remotion/cli/config';

// https://www.remotion.dev/docs/config
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setEntryPoint('./src/index.ts');
