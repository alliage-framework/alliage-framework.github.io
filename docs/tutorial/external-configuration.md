---
sidebar_position: 6
---

# External configuration

**The challenge**: Hard-coded values make applications inflexible. When messages, settings, or behavior need to change, you shouldn't have to modify and redeploy code.

**The solution**: Move configuration to external files that can be changed independently of the application code.

## Setting up the configuration file

First, let's move our messages to the configuration file. Update `config/parameters.yaml`:

```yaml title="config/parameters.yaml"
messages:
  en:
    helloMessage: "Hello, {name}!"
  fr:
    helloMessage: "Bonjour {name} !"
  es:
    helloMessage: "¡Hola {name}!"
```

**What this configuration provides**:
- **External storage**: Messages are no longer hard-coded in the application
- **Easy modification**: Non-developers can change messages without touching code
- **New language support**: We've added Spanish without any code changes

## Creating a configuration interface

Let's add a TypeScript interface to ensure type safety for our configuration. Update `src/services/message-factory.ts`:

```typescript title="src/services/message-factory.ts"
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

interface Messages {
  [language: string]: {
    helloMessage: string;
  };
}
```

**What this interface provides**:
- **Type safety**: The `Messages` interface ensures TypeScript knows the structure of the configuration
- **Intellisense**: You'll get autocomplete and error checking for configuration properties

## Injecting configuration into the service

Update the service to declare its configuration dependency:

```typescript title="src/services/message-factory.ts"
@Service("message_factory", [parameter("parameters.messages")])
export default class MessageFactory {
  constructor(private readonly messages: Messages) {}
  
  createHelloMessage(language: string, name: string) {
    const usedLanguage = Object.keys(this.messages).includes(language) ? language : "en";
    return this.messages[usedLanguage].helloMessage.replace("{name}", name);
  }
}
```

**What this implementation does**:
- **`parameter("parameters.messages")`**: Tells Alliage to inject the `messages` section from the configuration
- **Automatic navigation**: Alliage automatically navigates the YAML structure using dot notation
- **Configuration usage**: Uses `this.messages` instead of hard-coded messages
- **Template replacement**: `replace("{name}", name)` substitutes the placeholder with the actual name
- **Same fallback logic**: Still defaults to English for unsupported languages

## Complete updated service file

Here's the complete updated `src/services/message-factory.ts`:

```typescript title="src/services/message-factory.ts"
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

interface Messages {
  [language: string]: {
    helloMessage: string;
  };
}

@Service("message_factory", [parameter("parameters.messages")])
export default class MessageFactory {
  constructor(private readonly messages: Messages) {}
  
  createHelloMessage(language: string, name: string) {
    const usedLanguage = Object.keys(this.messages).includes(language) ? language : "en";
    return this.messages[usedLanguage].helloMessage.replace("{name}", name);
  }
}
```

## Understanding the benefits

**Configuration management advantages**:

**For content managers**: They can now add new languages or modify messages without developer involvement

**For developers**: Code is more flexible and doesn't need to be rebuilt for content changes

**For operations**: Different environments can have different configurations without code changes

**For testing**: You can inject test configurations easily

## Testing the configuration

The application now supports Spanish without any code changes:

```bash
yarn alliage:run:dev say-hello Carlos --language=es
```

**Expected output**: `¡Hola Carlos!`

This demonstrates the power of external configuration: you added a new language by editing a YAML file, with no code changes required.

## Configuration best practices

When designing configuration for Alliage applications:

### Structure configuration logically
```yaml title="config/parameters.yaml"
database:
  host: "localhost"
  port: 5432
  
api:
  timeout: 30000
  retries: 3

messages:
  defaultLanguage: "en"
  supportedLanguages: ["en", "fr", "es"]
```

### Inject environment variables

```yaml title="config/parameters.yaml"
database:
  # Injects DATABASE_HOST environment variable
  host: $(DATABASE_HOST)
  # Injests DATABASE_PORT environment variable, casts value as number
  port: $(DATABASE_PORT:number)
  
api:
  timeout: $(API_TIMEOUT:number)
  # Casts value as number, defaults to 3
  retries: $(API_RETRIES:number?3)

messages:
  defaultLanguage: $(MESSAGES_DEFAULT_LANGUAGE?en)
  # Turns comma separated values into an array
  supportedLanguages: $(MESSAGES_SUPPORTED_LANGUAGES:array)
```

Supported types are the following:
- `number`: Converts the value to a number using `parseFloat`
- `boolean`: Returns false if the value is `undefined`, `"0"`, or `"false"`, otherwise returns true
- `array`: Splits the string into an array of strings using `,` as a separator
- `json`: Parses the value as JSON using `JSON.parse`


## Next steps

Now that we have proper configuration management, let's add testing to ensure our code works correctly. The next step will show you how to write unit tests for your services.

**[Continue to unit testing →](/docs/tutorial/unit-testing)** 