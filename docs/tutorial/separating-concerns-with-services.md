---
sidebar_position: 5
---

# Separating concerns with services

**The challenge**: Mixing CLI logic with business logic creates code that's hard to test, reuse, and maintain. When everything is in one place, it becomes difficult to change one aspect without affecting others.

**The solution**: Extract business logic into separate services that can be injected as dependencies.

## Creating the message factory service

Let's create a dedicated service for message creation. This will handle the business logic separately from the CLI concerns.

Create a new file `src/services/message-factory.ts`:

```typescript title="src/services/message-factory.ts"
import { Service } from "@alliage/service-loader";

@Service("message_factory")
export default class MessageFactory {
  createHelloMessage(language: string, name: string) {
    const messages = {
      en: (name: string) => `Hello, ${name}!`,
      fr: (name: string) => `Bonjour ${name} !`,
    };
    
    const usedLanguage = Object.keys(messages).includes(language) ? language : "en";
    return messages[usedLanguage as keyof typeof messages](name);
  }
}
```

**What this service provides**:
- **`@Service("message_factory")`**: Registers this class as a service that can be injected
- **Clean separation**: This service doesn't know anything about command line interfaces
- **`createHelloMessage()`**: Pure business logic method that takes inputs and returns a message
- **Language fallback logic**: Handles unsupported languages gracefully
- **No CLI dependencies**: This service has no knowledge of command line interfaces

## Setting up dependency injection

Now let's update the process to use this service. First, add the necessary imports to `src/processes/main.ts`:

```typescript title="src/processes/main.ts"
// Add these new imports to your existing imports
import { instanceOf } from "@alliage/di";
import MessageFactory from "../services/message-factory.js";
```

**What these imports do**:
- **`instanceOf`**: Tells Alliage you want an instance of a specific class injected
- **`MessageFactory`**: The service class we just created

## Declaring the dependency

Update the service registration to declare its dependencies:

```typescript title="src/processes/main.ts"
// Update your @Service decorator
@Service("main_process", [instanceOf(MessageFactory)])
export default class MainProcess extends AbstractProcess {
  constructor(private readonly messageFactory: MessageFactory) {
    super();
  }

  // Your existing methods stay the same
}
```

**What this declaration does**:
- **`[instanceOf(MessageFactory)]`**: Declares that this process needs a MessageFactory instance
- **Dependency registration**: Alliage now knows to provide a MessageFactory when creating this process
- **Constructor injection**: Automatically provides the MessageFactory when creating the process
- **`private readonly`**: TypeScript ensures the dependency can't be changed after injection
- **Type safety**: Full TypeScript support for the injected service

## Using the injected service

Finally, update the `execute` method to use the injected service:

```typescript title="src/processes/main.ts"
async execute(args: Arguments) {
  const message = this.messageFactory.createHelloMessage(
    args.get("language"),
    args.get("name")
  );

  process.stdout.write(message);
  return true;
}
```

**What this simplified execute method does**:
- **Coordination**: Acts as a coordinator between CLI input and business logic
- **No business logic**: The process no longer contains message creation logic
- **Clean separation**: CLI concerns and business logic are properly separated

## Enabling service discovery

Add one line to `config/services.yaml` to tell Alliage where to find your services:

```yaml title="config/services.yaml"
basePath: "$(ALLIAGE_TS_SERVICES_BASEPATH?dist)"
paths:
  - "services/**/*"     # This line enables automatic discovery of services
  - "processes/**/*"
```

**What this configuration does**:
- **`services/**/*`**: Tells Alliage to scan the services directory for classes with `@Service` decorators
- **Automatic discovery**: Alliage will find and register all services without manual configuration

## Complete updated files

Here's what your files should look like:

```typescript title="src/processes/main.ts"
import { AbstractProcess } from "@alliage/process-manager";
import { Service } from "@alliage/service-loader";
import { Arguments, CommandBuilder } from "@alliage/framework";
import { instanceOf } from "@alliage/di";
import MessageFactory from "../services/message-factory.js";

@Service("main_process", [instanceOf(MessageFactory)])
export default class MainProcess extends AbstractProcess {
  constructor(private readonly messageFactory: MessageFactory) {
    super();
  }

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
    const message = this.messageFactory.createHelloMessage(
      args.get("language"),
      args.get("name")
    );

    process.stdout.write(message);
    return true;
  }
}
```

## Understanding the benefits

**What you just implemented**:

- **Single Responsibility**: The process handles CLI concerns, the service handles business logic
- **Dependency Inversion**: The process depends on the service interface, not implementation details
- **Testability**: You can easily test the MessageFactory in isolation
- **Reusability**: Other processes can use the same MessageFactory

**Testing becomes straightforward**: Mock the MessageFactory to test process logic, or test the MessageFactory directly without any CLI setup.

## Testing the refactored version

```bash
yarn alliage:run:dev say-hello John --language=fr
```

**Expected output**: `Bonjour John !`

The functionality is identical, but the code is now properly organized and much easier to test and maintain.

## Next steps

While our service works well, the messages are still hard-coded. The next step will show you how to move configuration to external files for better flexibility.

**[Continue to external configuration →](/docs/tutorial/external-configuration)** 