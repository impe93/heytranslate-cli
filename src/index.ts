#! /usr/bin/env node

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Command } from "commander";
import { HeyTranslateConfig, Translation } from "./types/config.type";
import diffObjects from "./helpers/diffObjects.helper";
import axios, { AxiosError, AxiosResponse } from "axios";
import recomposeObjects from "./helpers/recomposeObjects.helper";
import { TranslationToCache } from "./types/translationToCache.type";
import { greenLog } from "./helpers/log.helpers";

const baseDirectory = process.cwd(); // current working directory

const program = new Command();

program
  .name("heyt")
  .description("CLI to auto translate JSON keys in different languages")
  .version("0.0.1");

program
  .command("translate")
  .description(
    'Translate JSON files based on what\'s written in "heytranslate.config.json" file.'
  )
  .action(translateFromConfig);

program
  .command("build-cache")
  .description(
    "Build cache on JSON files based on what's written in \"heytranslate.config.json\" file. It's useful to run this command if you already have some translations in place and you want to translate only what's changing on main file from now on.\nDiscover more on docs.heytranslate.dev"
  )
  .action(buildCache);

program.parse();

async function translateFromConfig() {
  checkApiKey();
  const config: HeyTranslateConfig = getConfigFileContent();
  const cacheFolderPath = getCacheFolderPath();

  const translationsToSend: unknown[][] = [];

  const translationToCache: TranslationToCache[] = [];

  config.translations.forEach((t, index) => {
    const { mainTranslationFile, mainFileContent } = getMainFile(t);
    const cacheFilePath = path.join(cacheFolderPath, t.mainFilePath);

    let diffs: unknown;

    if (fs.existsSync(cacheFilePath)) {
      const cacheFileContent = fs.readFileSync(cacheFilePath, "utf-8");
      const cacheFile = JSON.parse(cacheFileContent);
      diffs = diffObjects(cacheFile, mainTranslationFile);
    } else {
      diffs = mainTranslationFile;
      const dir = path.dirname(cacheFilePath);
      fs.mkdirSync(dir, { recursive: true });
    }

    translationToCache.push({
      cacheFilePath,
      mainFileContent,
    });

    translationsToSend.push([]);

    t.outputFiles.forEach((of) => {
      const outputFilePath = path.join(
        baseDirectory,
        t.outputFolderPath,
        of.outputFileName
      );

      const isOutputFileAlreadyExist = fs.existsSync(outputFilePath);

      if (isOutputFileAlreadyExist) {
        translationsToSend[index].push({
          json: diffs,
          language: of.language,
        });
      } else {
        translationsToSend[index].push({
          json: mainTranslationFile,
          language: of.language,
        });
      }
    });
  });

  let translationApiResponse: AxiosResponse<Record<string, unknown>[], unknown>;

  console.log("🔄 Starting the translation...");

  try {
    translationApiResponse = await axios.post<Record<string, unknown>[]>(
      "http://localhost:3000/api/translate",
      translationsToSend,
      {
        params: {
          api_key: process.env.HEYT_API_KEY,
        },
      }
    );
  } catch (e: unknown) {
    const axiosError = e as AxiosError<{ message: string }>;

    if (axiosError?.response?.data?.message) {
      program.error(
        `\x1b[31mERROR: ${axiosError?.response?.data?.message}\x1b[0m`
      );
    } else {
      program.error(
        `\x1b[31mERROR: Something gone wrong during the translation\x1b[0m`
      );
    }
  }

  console.log("🔄 Translation completed!");

  config.translations.forEach((t, i) => {
    t.outputFiles.forEach((of) => {
      const outputPath = path.join(
        baseDirectory,
        t.outputFolderPath,
        of.outputFileName
      );

      let outputLanguage: Record<string, unknown>;

      if (fs.existsSync(outputPath)) {
        const languageFile = fs.readFileSync(outputPath, "utf-8");
        outputLanguage = JSON.parse(languageFile);
        recomposeObjects(
          outputLanguage,
          translationApiResponse.data[i][of.language] as Record<string, unknown>
        );
      } else {
        outputLanguage = translationApiResponse.data[i][of.language] as Record<
          string,
          unknown
        >;
      }

      fs.writeFileSync(
        outputPath,
        JSON.stringify(outputLanguage, undefined, 2)
      );
    });
  });

  console.log("🔄 Updating cache...");

  translationToCache.forEach((tc) => {
    fs.writeFileSync(tc.cacheFilePath, tc.mainFileContent);
  });

  greenLog("✅ All done!");
}

function buildCache() {
  const config = getConfigFileContent();
  const cacheFolderPath = getCacheFolderPath();
  config.translations.forEach((t) => {
    const { mainFileContent } = getMainFile(t);
    const cacheFilePath = path.join(cacheFolderPath, t.mainFilePath);
    fs.writeFileSync(cacheFilePath, mainFileContent);
  });
  greenLog("✅ Cache files built");
}

function checkApiKey() {
  let envFilePath = path.join(baseDirectory, `.env`);
  const specificEnvFile = path.join(
    baseDirectory,
    `.env.${process.env.NODE_ENV}`
  );

  if (fs.existsSync(specificEnvFile)) {
    envFilePath = specificEnvFile;
  }

  if (!fs.existsSync(envFilePath)) {
    program.error(
      `\x1b[31mERROR: .env file not found. Checked at ${envFilePath}\x1b[0m`
    );
  }

  dotenv.config({ path: envFilePath });

  if (!process.env.HEYT_API_KEY) {
    program.error(
      `\x1b[31mERROR: HeyTranslate Api Key not found. Checked at ${envFilePath}, the Api Key name has to be "HEYT_API_KEY"\x1b[0m`
    );
  }

  console.log("🔄 Api key exist...");
}

function getMainFile(t: Translation) {
  const translationFilePath = path.join(baseDirectory, t.mainFilePath);

  if (!fs.existsSync(translationFilePath)) {
    program.error(
      `\x1b[31mERROR: The main translation file does not exist at the following path:${t.mainFilePath} .\nAre you sure you have written the correct path on heytranslate.config.json?\x1b[0m`
    );
  }

  const mainFileContent = fs.readFileSync(translationFilePath, "utf-8");
  let mainTranslationFile;

  try {
    mainTranslationFile = JSON.parse(mainFileContent);
  } catch {
    program.error(
      `\x1b[31mERROR: The main translation file at ${t.mainFilePath} is not a valid JSON. Solve the problem and retry.\x1b[0m`
    );
  }
  return { mainTranslationFile, mainFileContent };
}

function getCacheFolderPath() {
  const cacheDir = path.join(baseDirectory, ".heytranslate-cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }
  return cacheDir;
}

function getConfigFileContent() {
  const configFilePath = path.join(baseDirectory, "heytranslate.config.json");
  let config: HeyTranslateConfig;
  if (fs.existsSync(configFilePath)) {
    const configContent = fs.readFileSync(configFilePath, "utf-8");
    config = JSON.parse(configContent);
  } else {
    program.error(
      `\x1b[31mERROR: heytranslate.config.json not found in your base directory.\x1b[0m`
    );
  }

  if (!config!.translations) {
    program.error(
      `\x1b[31mERROR: There is no "translations" key in heytranslate.config.json\x1b[0m`
    );
  }

  if (config!.translations.length === 0) {
    program.error(
      `\x1b[31mERROR: There is an empty list of translations in heytranslate.config.json\x1b[0m`
    );
  }
  return config!;
}
