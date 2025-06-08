---
sidebar_position: 4
---

# Adding user interaction

**The challenge**: Hard-coded messages aren't very useful. Real applications need to respond to user input.

**How Alliage helps**: Built-in argument parsing with type safety and validation.

## Adding the necessary imports

First, let's add the necessary imports. These provide access to Alliage's CLI argument parsing features:

```typescript title="src/processes/main.ts"
import { Arguments, CommandBuilder } from "@alliage/framework";
```

**What these imports do**:
- **`Arguments`**: Type-safe access to parsed command line arguments
- **`CommandBuilder`**: API for defining what arguments your command accepts

## Defining command arguments

Now we'll add a `configure` method that tells Alliage what arguments and options this command expects. Add this method to your `MainProcess` class:

```typescript title="src/processes/main.ts"
configure(config: CommandBuilder): void {
  config
    .addArgument("name", {
      type: "string",
      describe: "Your name",
    });
}
```

**What this does so far**:
- **`addArgument("name")`**: Defines a required positional argument called "name"
- **`type: "string"`**: Ensures the argument will be treated as a string
- **`describe`**: Provides help text for users

## Adding optional language support

Now let's extend the configuration to support different languages:

```typescript title="src/processes/main.ts"
configure(config: CommandBuilder): void {
  config
    .addArgument("name", {
      type: "string", 
      describe: "Your name",
    })
    .addOption("language", {
      type: "string", 
      describe: "The language to use",
      default: "en",
    });
}
```

**What the new addition does**:
- **`addOption("language")`**: Defines an optional flag with `--language`
- **`default: "en"`**: Sets a fallback value when the option isn't provided

The difference between arguments and options:
- **Arguments**: Required, positional (e.g., `say-hello John`)
- **Options**: Optional, named with flags (e.g., `--language=fr`)

## Creating the message logic

Now let's update the `execute` method to use the parsed arguments:

```typescript title="src/processes/main.ts"
async execute(args: Arguments) {
  const messages = {
    en: (name: string) => `Hello, ${name}!`,
    fr: (name: string) => `Bonjour ${name} !`,
  };

  const language = args.get<keyof typeof messages>("language");
  const name = args.get("name");

  process.stdout.write(messages[language](name));
  return true;
}
```

**What this implementation does**:
- **`messages` object**: Maps language codes to message templates
- **Function templates**: Each language uses a function that takes a name parameter
- **`args.get("language")`**: Retrieves the language option (with type safety)
- **`args.get("name")`**: Retrieves the name argument
- **`messages[language](name)`**: Calls the appropriate message function
- **Type safety**: TypeScript ensures `language` is a valid key of the `messages` object

## Complete updated file

Here's what your complete `src/processes/main.ts` file should look like:

```typescript title="src/processes/main.ts"
import { AbstractProcess } from "@alliage/process-manager";
import { Service } from "@alliage/service-loader";
import { Arguments, CommandBuilder } from "@alliage/framework";

@Service("main_process")
export default class MainProcess extends AbstractProcess {
  getName() {
    return "say-hello";
  }

  configure(config: CommandBuilder): void {
    config
      .addArgument("name", {
        type: "string",
        describe: "Your name",
      })
      .addOption("language", {
        type: "string",
        describe: "The language to use",
        default: "en",
      });
  }

  async execute(args: Arguments) {
    const messages = {
      en: (name: string) => `Hello, ${name}!`,
      fr: (name: string) => `Bonjour ${name} !`,
    };

    const language = args.get<keyof typeof messages>("language");
    const name = args.get("name");

    process.stdout.write(messages[language](name));
    return true;
  }
}
```

## Testing the interactive version

```bash
# Automatic help generation (Alliage creates this from your configuration)
yarn alliage:run:dev say-hello --help

# Using the required argument
yarn alliage:run:dev say-hello John

# Using both argument and option
yarn alliage:run:dev say-hello Marie --language=fr
```

**Expected outputs**:
- Help command: Shows usage information and available options
- `say-hello John`: `Hello, John!`
- `say-hello Marie --language=fr`: `Bonjour Marie !`

## What you gained

Professional CLI interface with validation, help generation, and type safety, implemented with minimal code. Alliage handled:

- **Argument parsing**: Converting command line strings to typed values
- **Validation**: Ensuring required arguments are provided
- **Help generation**: Creating usage documentation automatically
- **Type safety**: Providing TypeScript support for all parsed values

## Next steps

While this works, mixing CLI logic with business logic creates code that's hard to test and reuse. The next step will show you how to separate concerns using dependency injection.

**[Continue to separating concerns with services →](/docs/tutorial/separating-concerns-with-services)** 