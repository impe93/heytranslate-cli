export type HeyTranslateConfig = {
  translations: Translation[];
};

export type Translation = {
  mainFilePath: string;
  outputFolderPath: string;
  outputFiles: OutputFile[];
};

export type OutputFile = {
  language: string;
  outputFileName: string;
};
