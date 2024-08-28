#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const commander_1 = require("commander");
const diffObjects_helper_1 = __importDefault(require("./helpers/diffObjects.helper"));
const axios_1 = __importDefault(require("axios"));
const recomposeObjects_helper_1 = __importDefault(require("./helpers/recomposeObjects.helper"));
const log_helpers_1 = require("./helpers/log.helpers");
const baseDirectory = process.cwd(); // current working directory
const program = new commander_1.Command();
program
    .name("heyt")
    .description("CLI to auto translate JSON keys in different languages")
    .version("0.0.1");
program
    .command("translate")
    .description('Translate JSON files based on what\'s written in "heytranslate.config.json" file.')
    .action(translateFromConfig);
program
    .command("build-cache")
    .description("Build cache on JSON files based on what's written in \"heytranslate.config.json\" file. It's useful to run this command if you already have some translations in place and you want to translate only what's changing on main file from now on.\nDiscover mode on heytranslate.dev")
    .action(buildCache);
program.parse();
function translateFromConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        checkApiKey();
        const config = getConfigFileContent();
        const cacheFolderPath = getCacheFolderPath();
        const translationsToSend = [];
        const translationToCache = [];
        config.translations.forEach((t, index) => {
            const { mainTranslationFile, mainFileContent } = getMainFile(t);
            const cacheFilePath = path_1.default.join(cacheFolderPath, t.mainFilePath);
            let diffs;
            if (fs_1.default.existsSync(cacheFilePath)) {
                const cacheFileContent = fs_1.default.readFileSync(cacheFilePath, "utf-8");
                const cacheFile = JSON.parse(cacheFileContent);
                diffs = (0, diffObjects_helper_1.default)(cacheFile, mainTranslationFile);
            }
            else {
                diffs = mainTranslationFile;
                const dir = path_1.default.dirname(cacheFilePath);
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            translationToCache.push({
                cacheFilePath,
                mainFileContent,
            });
            translationsToSend.push([]);
            t.outputFiles.forEach((of) => {
                const outputFilePath = path_1.default.join(baseDirectory, t.outputFolderPath, of.outputFileName);
                const isOutputFileAlreadyExist = fs_1.default.existsSync(outputFilePath);
                if (isOutputFileAlreadyExist) {
                    translationsToSend[index].push({
                        json: diffs,
                        language: of.language,
                    });
                }
                else {
                    translationsToSend[index].push({
                        json: mainTranslationFile,
                        language: of.language,
                    });
                }
            });
        });
        let translationApiResponse;
        console.log("🔄 Starting the translation...");
        try {
            translationApiResponse = yield axios_1.default.post("http://localhost:3000/api/translate", translationsToSend);
        }
        catch (_a) {
            const err = new Error(`ERROR: Something gone wrong during the translation of your file, retry!`);
            err.stack = "";
            throw err;
        }
        console.log("🔄 Translation completed!");
        config.translations.forEach((t, i) => {
            t.outputFiles.forEach((of) => {
                const outputPath = path_1.default.join(baseDirectory, t.outputFolderPath, of.outputFileName);
                let outputLanguage;
                if (fs_1.default.existsSync(outputPath)) {
                    const languageFile = fs_1.default.readFileSync(outputPath, "utf-8");
                    outputLanguage = JSON.parse(languageFile);
                    (0, recomposeObjects_helper_1.default)(outputLanguage, translationApiResponse.data[i][of.language]);
                }
                else {
                    outputLanguage = translationApiResponse.data[i][of.language];
                }
                fs_1.default.writeFileSync(outputPath, JSON.stringify(outputLanguage, undefined, 2));
            });
        });
        console.log("🔄 Updating cache...");
        translationToCache.forEach((tc) => {
            fs_1.default.writeFileSync(tc.cacheFilePath, tc.mainFileContent);
        });
        (0, log_helpers_1.greenLog)("✅ All done!");
    });
}
function buildCache() {
    const config = getConfigFileContent();
    const cacheFolderPath = getCacheFolderPath();
    config.translations.forEach((t) => {
        const { mainFileContent } = getMainFile(t);
        const cacheFilePath = path_1.default.join(cacheFolderPath, t.mainFilePath);
        fs_1.default.writeFileSync(cacheFilePath, mainFileContent);
    });
    (0, log_helpers_1.greenLog)("✅ Cache files built");
}
function checkApiKey() {
    let envFilePath = path_1.default.join(baseDirectory, `.env`);
    const specificEnvFile = path_1.default.join(baseDirectory, `.env.${process.env.NODE_ENV}`);
    if (fs_1.default.existsSync(specificEnvFile)) {
        envFilePath = specificEnvFile;
    }
    if (!fs_1.default.existsSync(envFilePath)) {
        const err = new Error(`ERROR: .env file not found. Checked at ${envFilePath}`);
        err.stack = "";
        throw err;
    }
    dotenv_1.default.config({ path: envFilePath });
    if (!process.env.HEYT_API_KEY) {
        const err = new Error(`ERROR: HeyTranslate Api Key not found. Checked at ${envFilePath}, the Api Key name has to be "HEYT_API_KEY"`);
        err.stack = "";
        throw err;
    }
    // TODO: Check if Api Key has the rights to process the translations if not throw error, if yes say that
    console.log("🔄 Api key verified...");
}
function getMainFile(t) {
    const translationFilePath = path_1.default.join(baseDirectory, t.mainFilePath);
    if (!fs_1.default.existsSync(translationFilePath)) {
        const err = new Error(`ERROR: The main translation file does not exist at the following path:${t.mainFilePath} .\nAre you sure you have written the correct path on heytranslate.config.json?`);
        err.stack = "";
        throw err;
    }
    const mainFileContent = fs_1.default.readFileSync(translationFilePath, "utf-8");
    let mainTranslationFile;
    try {
        mainTranslationFile = JSON.parse(mainFileContent);
    }
    catch (_a) {
        const err = new Error(`ERROR: The main translation file at ${t.mainFilePath} is not a valid JSON. Solve the problem and retry.`);
        err.stack = "";
        throw err;
    }
    return { mainTranslationFile, mainFileContent };
}
function getCacheFolderPath() {
    const cacheDir = path_1.default.join(baseDirectory, ".heytranslate-cache");
    if (!fs_1.default.existsSync(cacheDir)) {
        fs_1.default.mkdirSync(cacheDir);
    }
    return cacheDir;
}
function getConfigFileContent() {
    const configFilePath = path_1.default.join(baseDirectory, "heytranslate.config.json");
    let config;
    if (fs_1.default.existsSync(configFilePath)) {
        const configContent = fs_1.default.readFileSync(configFilePath, "utf-8");
        config = JSON.parse(configContent);
    }
    else {
        const err = new Error(`ERROR: heytranslate.config.json not found in your base directory.`);
        err.stack = "";
        throw err;
    }
    if (!config.translations) {
        const err = new Error(`ERROR: There is no "translations" key in heytranslate.config.json`);
        err.stack = "";
        throw err;
    }
    if (config.translations.length === 0) {
        const err = new Error(`ERROR: There is an empty list of translations in heytranslate.config.json`);
        err.stack = "";
        throw err;
    }
    return config;
}
//# sourceMappingURL=index.js.map