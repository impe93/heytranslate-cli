# HeyTranslate CLI

HeyTranslate is a CLI tool that automates the translation of JSON keys into different languages. It is designed to work seamlessly with JSON files and can be easily integrated into any project requiring multi-language support.

## Features

- **Automated Translations**: Translate JSON files based on configuration.
- **Cache Support**: Build a cache to translate only the changes made to the JSON files, optimizing translation processes.
- **Easy Setup**: Configure your translations using the `heytranslate.config.json` file.

## Installation

In order to use the CLI you should signup and obtain an Api Key from [heytranslate.dev](http://heytranslate.dev).

**IT'S FREE!**

After that You can install HeyTranslate globally using npm:

    npm install -g heyt

or you can avoid to install it globally by using everytime the for with `npx`:

```bash
npx heyt [command]
```

## Configuration

Before running any commands, ensure that your project contains a `heytranslate.config.json` file. This file should include most of the required configuration settings, such as:

- Source and target languages
- Paths to your JSON files

The `heytranslate.config.json` file contains the following keys:

- **translations**: This is the primary key of the JSON object, represented as a list. Each item in the list corresponds to a different JSON file source and includes the following elements:
  - **mainFilePath**: The path to the file that needs to be translated into various languages (the main file). This path is relative to the project's base directory.
  - **outputFolderPath**: The folder where all translated files will be stored. Like the main file path, this is also relative to the project's base directory.
  - **outputFiles**: A list where each item represents a translation of the main file into a different language. Each item is an object containing the following keys:
    - **language**: The target language for the translation.
    - **outputFileName**: The name of the file that will contain the translated content.

A sample configuration might look like this:

```json
{
  "translations": [
    {
      "mainFilePath": "./dummy-project/locale/it.json",
      "outputFolderPath": "./dummy-project/locale",
      "outputFiles": [
        {
          "language": "en_GB",
          "outputFileName": "en.json"
        },
        {
          "language": "es_ES",
          "outputFileName": "es.json"
        }
      ]
    }
  ]
}
```

## Environment Variables

HeyTranslate uses environment variables to store sensitive data like API keys. Make sure to set the following variable in your `.env` file:

    HEYT_API_KEY=your-api-key

## Usage

HeyTranslate provides the following commands to help manage your translations:

### 1\. Translate Command

This command translates the JSON files based on the configuration defined in the `heytranslate.config.json` file.

```bash
heyt translate
```

### 2\. Build Cache Command

If you already have some translations in place and want to translate only the changes made to your main JSON file, you can build a cache.

```bash
heyt build-cache
```

This will create a cache of translations that speeds up future translation tasks by focusing only on what's new or changed.

The cache will be stored in a folder named `.heytranslate-cache`, which will contain all the necessary files. If you're working with a team, it's recommended to add this folder to your `.gitignore` file to prevent it from being included in version control.

## Help

For more details on each command, you can use the `--help` flag:

    heyt --help

## License

HeyTranslate is open-source software licensed under the MIT License.

---

Happy translating with HeyTranslate! If you encounter any issues or have questions, feel free to open an issue on GitHub or reach out for support.
