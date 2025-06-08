# Build Something with Alliage: From Zero to Production-Ready

Ever wondered what it's like to build applications with proper dependency injection, clean architecture, and testing built in from the start? This tutorial will walk you through the Alliage Framework step by step.

This tutorial focuses on practical implementation rather than theory. You'll start with a simple greeting app and gradually add features while learning important software development patterns. We'll build something small but demonstrate techniques that scale to larger applications.

## Why this tutorial matters

**What makes this tutorial useful**: Instead of learning concepts in isolation, you'll see how different pieces work together. Each step addresses a common development challenge and shows how Alliage can help solve it.

**What you'll build**: A multilingual greeting CLI application.
**What you'll learn**: Practical patterns for clean architecture and dependency injection.

### The skills you'll practice

- 🏗️ **Clean Architecture**: Organizing code that's easy to maintain
- 💉 **Dependency Injection**: Writing testable code without complex setup  
- ⚙️ **Configuration Management**: Keeping code flexible and environment-aware
- 🧪 **Testing Strategies**: Both unit and integration testing approaches
- 🎭 **Event-Driven Design**: Building extensible systems
- 🔧 **SOLID Principles**: Practical application of these design principles

---

## Step 1: Setting up the foundation

**The challenge**: Starting a new project usually involves a lot of setup - configuration files, folder structure, and boilerplate code before you can write actual business logic.

**How Alliage helps**: The CLI generates a complete project structure with sensible defaults.

### Creating your project

Let's start by creating a new Alliage application:

```bash
npx @alliage/create-app-cli@beta standard my-app
```

This command creates a new project with a well-organized structure. Here's what you get:

```
webserver-from-scratch/
├── .scripts/                         # Build and automation scripts
├── config/                          # Application configuration
│   ├── builder.yaml                 # Build settings
│   ├── parameters.yaml              # Application parameters
│   └── services.yaml                # Service discovery configuration
├── integration-tests/               # End-to-end tests
├── src/
│   ├── processes/                   # CLI command handlers
│   │   ├── __tests__/              # Unit tests for processes
│   │   └── main.ts                 # Example process
│   └── services/                   # Business logic services
├── alliage-modules.json            # Framework modules configuration
├── package.json                    # NPM dependencies
├── tsconfig.json                   # TypeScript configuration
└── vitest.config.ts                # Testing configuration
```

### Understanding the generated code

Let's look at what the CLI created in `src/processes/main.ts`. This file demonstrates how Alliage handles CLI commands:

```typescript
import { AbstractProcess } from "@alliage/process-manager";
import { Service } from "@alliage/service-loader";

@Service("main_process")
export default class MainProcess extends AbstractProcess {
  getName() {
    return "main";
  }

  async execute() {
    process.stdout.write("Hello, Alliage!\n");
    return true;
  }
}
```

**What this code does**: 

- **`@Service` decorator**: Tells Alliage to automatically discover and register this class as a service
- **`AbstractProcess`**: Base class that handles CLI process lifecycle
- **`getName()`**: Defines the command name users will type
- **`execute()`**: Contains the logic that runs when the command is called
- **Return value**: `true` indicates successful execution

The `@Service` decorator with the ID `"main_process"` means Alliage will automatically find this class and make it available as a CLI command.

### Testing the initial setup

Run the generated command to make sure everything works:

```bash
yarn alliage:run:dev main
```

**Expected output**: `Hello, Alliage!`

**What happened**: Alliage discovered your process class, parsed command line arguments, and executed your code. The framework handled all the infrastructure so you could focus on the actual logic.

---

## Step 2: Making meaningful command names

**The challenge**: Generic names like "main" don't tell you what a command actually does. Clear naming makes code self-documenting.

**The solution**: Alliage makes it easy to give commands descriptive names.

### Renaming the command

Let's give our command a more descriptive name. We only need to change the return value of the `getName()` method:

```diff
// src/processes/main.ts
export default class MainProcess extends AbstractProcess {
   getName() {
-    return "main";
+    return "say-hello";
   }
```

**What this change does**: The command name is now `say-hello` instead of `main`. This makes it immediately clear what the command does when someone looks at available commands or reads documentation.


Test the renamed command:

```bash
# Old name would no longer work
# yarn alliage:run:dev main

# New descriptive name
yarn alliage:run:dev say-hello
```

**Developer experience improvement**: Command names now clearly indicate their purpose, making the CLI self-documenting.

---

## Step 3: Adding user interaction

**The challenge**: Hard-coded messages aren't very useful. Real applications need to respond to user input.

**How Alliage helps**: Built-in argument parsing with type safety and validation.

### Step 3.1: Adding the necessary imports

First, let's add the necessary imports. These provide access to Alliage's CLI argument parsing features:

```typescript
import { Arguments, CommandBuilder } from "@alliage/framework";
```

**What these imports do**:
- **`Arguments`**: Type-safe access to parsed command line arguments
- **`CommandBuilder`**: API for defining what arguments your command accepts

### Step 3.2: Defining command arguments

Now we'll add a `configure` method that tells Alliage what arguments and options this command expects. Add this method to your `MainProcess` class:

```typescript
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

### Step 3.3: Adding optional language support

Now let's extend the configuration to support different languages:

```typescript
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

### Step 3.4: Creating the message templates

Now let's prepare the messages. Update your `execute` method to start with the message templates:

```typescript
async execute(args: Arguments) {
  const messages = {
    en: (name: string) => `Hello, ${name}!`,
    fr: (name: string) => `Bonjour ${name} !`,
  };

  process.stdout.write("Hello, Alliage!\n");
  return true;
}
```

**What this preparation does**:
- **`messages` object**: Maps language codes to message templates
- **Function templates**: Each language uses a function that takes a name parameter

### Step 3.5: Using the parsed arguments

Finally, let's connect the user input to our message templates:

```typescript
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

**What this final step does**:
- **`args.get("language")`**: Retrieves the language option (with type safety)
- **`args.get("name")`**: Retrieves the name argument
- **`messages[language](name)`**: Calls the appropriate message function
- **Type safety**: TypeScript ensures `language` is a valid key of the `messages` object

### Testing the interactive version

```bash
# Automatic help generation (Alliage creates this from your configuration)
yarn alliage:run:dev say-hello --help

# Using the required argument
yarn alliage:run:dev say-hello John

# Using both argument and option
yarn alliage:run:dev say-hello Marie --language=fr
```

**What you gained**: Professional CLI interface with validation, help generation, and type safety, implemented with minimal code.

---

## Step 4: Separating concerns with services

**The challenge**: Mixing CLI logic with business logic creates code that's hard to test, reuse, and maintain. When everything is in one place, it becomes difficult to change one aspect without affecting others.

**The solution**: Extract business logic into separate services that can be injected as dependencies.

### Step 4.1: Creating the basic service structure

Let's create a dedicated service for message creation. This will handle the business logic separately from the CLI concerns.

Create a new file `src/services/message-factory.ts` and start with the basic structure:

```typescript
import { Service } from "@alliage/service-loader";

@Service("message_factory")
export default class MessageFactory {
  // We'll add the method in the next step
}
```

**What this basic structure provides**:
- **`@Service("message_factory")`**: Registers this class as a service that can be injected
- **Clean separation**: This service doesn't know anything about command line interfaces

### Step 4.2: Moving the business logic

Now let's move the message creation logic from the process to the service:

```typescript
import { Service } from "@alliage/service-loader";

@Service("message_factory")
export default class MessageFactory {
  createHelloMessage(language: string, name: string) {
    const messages = {
      en: (name: string) => `Hello, ${name}!`,
      fr: (name: string) => `Bonjour ${name} !`,
    };
    
    return messages[language as keyof typeof messages](name);
  }
}
```

**What this method does**:
- **`createHelloMessage()`**: Pure business logic method that takes inputs and returns a message
- **No CLI dependencies**: This service has no knowledge of command line interfaces

### Step 4.3: Adding language fallback logic

Let's make the service more robust by handling unsupported languages:

```typescript
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

**What the fallback logic provides**:
- **Language validation**: Checks if the requested language is supported
- **Graceful degradation**: Falls back to English for unsupported languages
- **Robust behavior**: The service won't crash on unexpected input

### Step 4.4: Setting up dependency injection imports

Now let's update the process to use this service. First, add the necessary imports to `src/processes/main.ts`:

```typescript
// Add these new imports to your existing imports
import { instanceOf } from "@alliage/di";
import MessageFactory from "../services/message-factory.js";
```

**What these imports do**:
- **`instanceOf`**: Tells Alliage you want an instance of a specific class injected
- **`MessageFactory`**: The service class we just created

### Step 4.5: Declaring the dependency

Update the service registration to declare its dependencies:

```typescript
// Update your @Service decorator
@Service("main_process", [instanceOf(MessageFactory)])
export default class MainProcess extends AbstractProcess {
  // We'll add the constructor in the next step
}
```

**What this declaration does**:
- **`[instanceOf(MessageFactory)]`**: Declares that this process needs a MessageFactory instance
- **Dependency registration**: Alliage now knows to provide a MessageFactory when creating this process

### Step 4.6: Adding constructor injection

Add a constructor to receive the injected dependency:

```typescript
@Service("main_process", [instanceOf(MessageFactory)])
export default class MainProcess extends AbstractProcess {
  constructor(private readonly messageFactory: MessageFactory) {
    super();
  }

  // Your existing getName() and configure() methods stay the same
}
```

**What constructor injection provides**:
- **Automatic provision**: Alliage automatically provides the MessageFactory when creating the process
- **`private readonly`**: TypeScript ensures the dependency can't be changed after injection
- **Type safety**: Full TypeScript support for the injected service

### Step 4.7: Using the injected service

Finally, update the `execute` method to use the injected service:

```typescript
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

### Step 4.8: Enabling service discovery

Add one line to `config/services.yaml` to tell Alliage where to find your services:

```yaml
basePath: "$(ALLIAGE_TS_SERVICES_BASEPATH?dist)"
paths:
  - "services/**/*"     # This line enables automatic discovery of services
  - "processes/**/*"
```

**What this configuration does**:
- **`services/**/*`**: Tells Alliage to scan the services directory for classes with `@Service` decorators
- **Automatic discovery**: Alliage will find and register all services without manual configuration

### Understanding the benefits

**What you just implemented**:

- **Single Responsibility**: The process handles CLI concerns, the service handles business logic
- **Dependency Inversion**: The process depends on the service interface, not implementation details
- **Testability**: You can easily test the MessageFactory in isolation
- **Reusability**: Other processes can use the same MessageFactory

**Testing becomes straightforward**: Mock the MessageFactory to test process logic, or test the MessageFactory directly without any CLI setup.

---

## Step 5: External configuration

**The challenge**: Hard-coded values make applications inflexible. When messages, settings, or behavior need to change, you shouldn't have to modify and redeploy code.

**The solution**: Move configuration to external files that can be changed independently of the application code.

### Step 5.1: Setting up the configuration file

First, let's move our messages to the configuration file. Update `config/parameters.yaml`:

```yaml
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

### Step 5.2: Adding the parameter import

Now let's update the service to use injected configuration. First, add the parameter import to `src/services/message-factory.ts`:

```typescript
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";
```

**What the parameter import does**:
- **`parameter`**: Tells Alliage to inject configuration values instead of service instances

### Step 5.3: Creating the configuration interface

Let's add a TypeScript interface to ensure type safety for our configuration:

```typescript
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

### Step 5.4: Inject the configuration into the service

Update the service to declare its configuration dependency:

```typescript
@Service("message_factory", [parameter("parameters.messages")])
export default class MessageFactory {
  constructor(private readonly messages: Messages) {}
  
  // We'll update the method next
}
```

**What this declaration does**:
- **`parameter("parameters.messages")`**: Tells Alliage to inject the `messages` section from the configuration into the constructor
- **Automatic navigation**: Alliage automatically navigates the YAML structure using dot notation


### Step 5.5: Updating the message creation logic

Finally, update the `createHelloMessage` method to use the injected configuration:

```typescript
createHelloMessage(language: string, name: string) {
  const usedLanguage = Object.keys(this.messages).includes(language) ? language : "en";
  return this.messages[usedLanguage].helloMessage.replace("{name}", name);
}
```

**What this updated method does**:
- **Configuration usage**: Uses `this.messages` instead of hard-coded messages
- **Template replacement**: `replace("{name}", name)` substitutes the placeholder with the actual name
- **Same fallback logic**: Still defaults to English for unsupported languages

### Understanding the benefits

**Configuration management advantages**:

**For content managers**: They can now add new languages or modify messages without developer involvement

**For developers**: Code is more flexible and doesn't need to be rebuilt for content changes

**For operations**: Different environments can have different configurations without code changes

**For testing**: You can inject test configurations easily

### Testing the configuration

The application now supports Spanish without any code changes:

```bash
yarn alliage:run:dev say-hello Carlos --language=es
```

**Expected output**: `¡Hola Carlos!`

This demonstrates the power of external configuration: you added a new language by editing a YAML file, with no code changes required.

---

## Step 6: Unit testing

**The challenge**: Most developers find testing difficult because their code is tightly coupled and hard to test in isolation.

**How Alliage helps**: When your code uses dependency injection properly, testing becomes natural because you can easily provide test doubles.

### Testing business logic in isolation

Let's create a unit test for our MessageFactory. Create `src/services/__tests__/message-factory.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import MessageFactory from "../message-factory";

describe("MessageFactory", () => {
  const messages = {
    en: { helloMessage: "Hello, {name}!" },
    fr: { helloMessage: "Bonjour {name} !" },
    es: { helloMessage: "¡Hola {name}!" },
  };
  const messageFactory = new MessageFactory(messages);

  describe("#createHelloMessage", () => {
    it("creates messages in different languages", () => {
      expect(messageFactory.createHelloMessage("en", "John")).toBe("Hello, John!");
      expect(messageFactory.createHelloMessage("fr", "Jean")).toBe("Bonjour Jean !");
      expect(messageFactory.createHelloMessage("es", "Carlos")).toBe("¡Hola Carlos!");
    });

    it("gracefully handles unsupported languages", () => {
      expect(messageFactory.createHelloMessage("de", "Hans")).toBe("Hello, Hans!");
    });
  });
});
```

**What this test demonstrates**:
- **Direct instantiation**: We can create the MessageFactory directly with test data
- **No framework dependencies**: The test doesn't need to bootstrap the entire application
- **Focused testing**: Each test validates one specific behavior
- **Fast execution**: No file system, network, or database dependencies

**Why this is effective**: Because MessageFactory takes its configuration as a constructor parameter, we can easily provide test data and verify behavior in isolation.

### Testing the process with mocked dependencies

Now let's test the process. Update `src/processes/__tests__/main.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import MainProcess from "../main";
import MessageFactory from "../../services/message-factory";
import { Arguments } from "@alliage/framework";

describe("MainProcess", () => {
  const messageFactory = new MessageFactory({
    en: { helloMessage: "Hello, {name}!" },
    fr: { helloMessage: "Bonjour {name} !" },
  });
  const mainProcess = new MainProcess(messageFactory);

  describe("#execute", () => {
    it("outputs the correct message", async () => {
      const writeSpy = vi.spyOn(process.stdout, "write");
      
      const args = Arguments.create({
        language: "fr",
        name: "Marie",
      });
      
      const result = await mainProcess.execute(args);
      
      expect(writeSpy).toHaveBeenCalledWith("Bonjour Marie !");
      expect(result).toBe(true);
    });
  });
});
```

**What this test approach accomplishes**:
- **Integration testing**: Verifies that the process correctly uses the MessageFactory
- **Mocked I/O**: Uses a spy to capture output without actually writing to stdout
- **Controlled input**: Creates Arguments objects with specific test data
- **Clear assertions**: Verifies both the output content and the return value

**The dependency injection advantage**: Because the process receives its dependencies through the constructor, we can easily provide a real MessageFactory with test configuration instead of complex mocking.

### Running the tests

Execute your unit tests to verify everything works:

```bash
yarn test:unit
```

**Why these tests are valuable**: They run quickly, don't depend on external systems, and catch bugs early in the development cycle. When the business logic changes, the tests will immediately tell you if something breaks.

---

## Step 7: Integration testing

**The challenge**: Unit tests verify individual components, but they can't catch issues that occur when all parts of your application work together.

**The solution**: Integration tests that run your complete application in a controlled environment.

### Understanding Alliage's sandbox testing

Alliage provides a sandbox system that can run your entire application as a separate process for testing. This lets you test exactly what users will experience.

Update `integration-tests/main-scenario/index.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Sandbox } from "@alliage/sandbox";

describe("Main scenario", () => {
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  beforeAll(async () => {
    await sandbox.init();
  });

  afterAll(async () => {
    await sandbox.terminate();
  });

  describe("say-hello process", () => {
    it("greets users in English", async () => {
      const dataSpy = vi.fn();
      const { process: mainProcess, waitCompletion } = sandbox.run([
        "say-hello",
        "John",
      ]);

      mainProcess.stdout?.on("data", dataSpy);
      await waitCompletion();

      expect(dataSpy).toHaveBeenCalledWith("Hello, John!");
    });

    it("greets users in French", async () => {
      const dataSpy = vi.fn();
      const { process: mainProcess, waitCompletion } = sandbox.run([
        "say-hello",
        "Jean",
        "--language=fr",
      ]);

      mainProcess.stdout?.on("data", dataSpy);
      await waitCompletion();

      expect(dataSpy).toHaveBeenCalledWith("Bonjour Jean !");
    });
  });
});
```

**What the sandbox testing provides**:
- **Real process execution**: Spawns actual Node.js processes like production
- **Complete application stack**: Tests configuration loading, dependency injection, and service discovery
- **Isolated environment**: Each test runs with a clean application state
- **User perspective**: Tests the exact same entry points that users will use

**Understanding the test structure**:
- **`sandbox.init()`**: Prepares the testing environment
- **`sandbox.run()`**: Spawns a new process with the specified command line arguments
- **`mainProcess.stdout`**: Captures the actual output from the running process
- **`waitCompletion()`**: Waits for the process to finish executing

### Building and testing

Before running integration tests, you need to build the application:

```bash
yarn alliage:build
yarn test:integration
```

**Why the build step matters**: Integration tests run against the compiled JavaScript, not the TypeScript source. This ensures your tests verify the same code that runs in production.

### The complete testing strategy

You now have two levels of testing:
- **Unit tests**: Fast feedback for individual components and business logic
- **Integration tests**: Confidence that the complete system works correctly
- **Combined coverage**: Different types of bugs caught at appropriate levels

**This testing approach gives you**: Quick feedback during development (unit tests) and confidence in deployments (integration tests).

---

## Step 8: Event-driven architecture

**The challenge**: Cross-cutting concerns like logging, monitoring, and analytics often end up scattered throughout business logic, making code harder to maintain and test.

**The solution**: Event-driven architecture that allows you to add features without modifying existing code.

### Understanding Alliage's event system

Alliage provides a built-in event system where services can listen to events without being directly coupled to the services that emit them. This allows for clean separation of concerns.

### Step 8.1: Creating the basic event listener structure

Let's create a system logger that records when processes start and finish. Create `src/services/system-logger.ts` and start with the basic structure:

```typescript
import { AbstractEventsListener } from "@alliage/events-listener-loader";
import { Service } from "@alliage/service-loader";

@Service("system_logger")
export default class SystemLogger extends AbstractEventsListener {
  // We'll add the event handlers in the next steps
}
```

**What this basic structure provides**:
- **`AbstractEventsListener`**: Base class for services that respond to events
- **`@Service("system_logger")`**: Registers this as a service that can be discovered automatically

### Step 8.2: Adding event handling imports

Add the necessary imports for event handling:

```typescript
import {
  AbstractEventsListener,
  EventHandlers,
} from "@alliage/events-listener-loader";
import {
  PROCESS_EVENTS,
  PostTerminateEvent,
  PreExecuteEvent,
} from "@alliage/process-manager";
import { Service } from "@alliage/service-loader";
```

**What these imports provide**:
- **`EventHandlers`**: Type for defining which events to listen to
- **`PROCESS_EVENTS`**: Constants for built-in process lifecycle events
- **Event classes**: Specific event objects with context information

### Step 8.3: Adding configuration injection

Let's add configuration support for the log file location:

```typescript
import {
  AbstractEventsListener,
  EventHandlers,
} from "@alliage/events-listener-loader";
import {
  PROCESS_EVENTS,
  PostTerminateEvent,
  PreExecuteEvent,
} from "@alliage/process-manager";
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

@Service("system_logger", [parameter("parameters.systemLogger.filePath")])
export default class SystemLogger extends AbstractEventsListener {
  constructor(filePath: string) {
    super();
    // We'll add file handling in the next step
  }
}
```

**What this configuration setup does**:
- **`parameter("parameters.systemLogger.filePath")`**: Injects the log file path from configuration
- **Constructor parameter**: Receives the file path when the service is created

### Step 8.4: Adding file handling

Add file system operations for logging:

```typescript
import fs from "fs";
import path from "path";

@Service("system_logger", [parameter("parameters.systemLogger.filePath")])
export default class SystemLogger extends AbstractEventsListener {
  private logFileDescriptor: number;

  constructor(filePath: string) {
    super();
    this.logFileDescriptor = fs.openSync(
      path.resolve(filePath),
      fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT
    );
  }

  // We'll add event handlers next
}
```

**What this file handling does**:
- **`logFileDescriptor`**: Keeps a file handle open for efficient writing
- **File flags**: Opens for writing, appending to existing content, creates if doesn't exist
- **Path resolution**: Resolves the file path relative to the current working directory

### Step 8.5: Defining event handlers

Add the method that maps events to handler functions:

```typescript
getEventHandlers(): EventHandlers {
  return {
    [PROCESS_EVENTS.PRE_EXECUTE]: this.handlePreExecute,
    [PROCESS_EVENTS.POST_TERMINATE]: this.handlePostTerminate,
  };
}
```

**What this event mapping does**:
- **`getEventHandlers()`**: Required method that tells Alliage which events to listen for
- **`PROCESS_EVENTS.PRE_EXECUTE`**: Built-in event fired before any process executes
- **`PROCESS_EVENTS.POST_TERMINATE`**: Built-in event fired after process completion
- **Handler mapping**: Associates each event with a specific method

### Step 8.6: Adding the pre-execute handler

Add the handler for when processes start:

```typescript
handlePreExecute = (event: PreExecuteEvent) => {
  const processName = event.getProcess().getName();
  // Will be created below
  this.writeLog(
    `[Process - ${processName}] Executing with arguments: Name = ${event
      .getArgs()
      .get("name")}, Language = ${event.getArgs().get("language")}`
  );
};
```

**What this handler does**:
- **Event object access**: Uses the `PreExecuteEvent` to get context information
- **Process information**: Gets the process name and arguments
- **Structured logging**: Creates a consistent log message format

### Step 8.7: Adding the post-terminate handler

Add the handler for when processes finish:

```typescript
handlePostTerminate = (event: PostTerminateEvent) => {
  const processName = event.getProcess().getName();
  const signal = event.getSignal();
  // Will be created below
  this.writeLog(`[Process - ${processName}] Terminated with signal: ${signal}`);
  fs.closeSync(this.logFileDescriptor);
};
```

**What this handler does**:
- **Termination tracking**: Logs when and how processes finish
- **Signal information**: Records the exit signal (0 for success)
- **Resource cleanup**: Closes the file descriptor when done

### Step 8.8: Adding the logging utility

Finally, add the private method that actually writes to the file:

```typescript
private writeLog(message: string) {
  fs.writeSync(
    this.logFileDescriptor,
    `[${new Date().toISOString()}] ${message}\n`
  );
}
```

**What this utility provides**:
- **Timestamped logs**: Adds ISO timestamp to every log entry
- **Synchronous writing**: Ensures log entries are written immediately
- **Consistent formatting**: Standardized log entry format

### Step 8.9: Adding configuration for the logger

Update `config/parameters.yaml` to include the log file location:

```yaml
messages:
  en:
    helloMessage: "Hello, {name}!"
  fr:
    helloMessage: "Bonjour {name} !"
  es:
    helloMessage: "¡Hola {name}!"
systemLogger:
  filePath: "./system.log"
```

**Configuration explanation**:
- **`systemLogger.filePath`**: Defines where log entries will be written
- **External configuration**: Log location can be changed without code modifications

### Understanding the zero-coupling approach

**What's remarkable about this implementation**: You added comprehensive logging to your application without:
- Modifying the existing MainProcess or MessageFactory
- Adding any dependencies to your business logic  
- Writing complex wiring or setup code
- Creating tight coupling between components

**The event system provides**: Clean separation where the logger responds to events but doesn't know about the specific processes or services that trigger them.

### Testing the event-driven logging

Run your application and check the log output:

```bash
yarn alliage:run:dev say-hello Alice --language=fr
cat system.log
```

**You'll see output like**:
```
[2025-06-07T16:51:58.000Z] [Process - say-hello] Executing with arguments: Name = Alice, Language = fr
[2025-06-07T16:51:58.001Z] [Process - say-hello] Terminated with signal: 0
```

**What this demonstrates**: The logger captured the process lifecycle without any explicit connection to your business logic. This is the power of event-driven architecture for cross-cutting concerns.

---

## Step 9: Custom events for extensibility

**The challenge**: Your application needs to be extensible, but you don't want to break existing code when adding new features. How do you create extension points that feel natural?

**The solution**: Create your own events that other services can listen to, making your services as extensible as the framework itself.

### Understanding custom event design

We'll modify the MessageFactory to emit events when it creates messages. This allows other services to react to message creation without the MessageFactory needing to know about them.

### Step 9.1: Adding event system imports

First, let's update `src/services/message-factory.ts` to add the necessary imports for custom events:

```typescript
import { instanceOf, parameter } from "@alliage/di";
import { AbstractEvent, EventManager } from "@alliage/lifecycle";
import { Service } from "@alliage/service-loader";
```

**What these new imports provide**:
- **`AbstractEvent`**: Base class for creating custom event types
- **`EventManager`**: Service for emitting events to the application event system

### Step 9.2: Defining the event type

Add an enum to define your custom event types:

```typescript
export enum MESSAGE_FACTORY_EVENTS {
  CREATE_HELLO_MESSAGE = "message_factory/create_hello_message",
}
```

**What this enum provides**:
- **Type safety**: Ensures event names are consistent across your application
- **Namespacing**: The `message_factory/` prefix prevents conflicts with other services
- **Discoverability**: Makes it easy to see what events this service emits

### Step 9.3: Creating the event payload interface

Define what data your event will carry:

```typescript
export interface CreateHelloMessageEventPayload {
  availableLanguages: string[];
  usedLanguage: string;
  parameters: {
    name: string;
  };
}
```

**What this interface provides**:
- **Structured data**: Defines exactly what information the event contains
- **Type safety**: Ensures listeners receive the expected data structure
- **Documentation**: Makes it clear what data is available to event handlers

### Step 9.4: Creating the event class

Add the event class that wraps the payload:

```typescript
export class CreateHelloMessageEvent
  extends AbstractEvent<
    MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE,
    CreateHelloMessageEventPayload
  > {
    constructor(payload: CreateHelloMessageEventPayload) {
      super(MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE, payload);
    }

    // We'll add convenience methods in the next step
  }
```

**What this event class provides**:
- **Type safety**: Generic parameters ensure the event type and payload match
- **Event wrapping**: Follows Alliage's event pattern for consistency
- **Base functionality**: Inherits standard event behavior from `AbstractEvent`

### Step 9.5: Adding convenience methods

Add helper methods to make the event easier to use:

```typescript
export class CreateHelloMessageEvent
  extends AbstractEvent<
    MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE,
    CreateHelloMessageEventPayload
  > {
    constructor(payload: CreateHelloMessageEventPayload) {
      super(MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE, payload);
    }

    getUsedLanguage() {
      return this.getPayload().usedLanguage;
    }

    getAvailableLanguages() {
      return this.getPayload().availableLanguages;
    }

    getParameters() {
      return this.getPayload().parameters;
    }
  }
```

**What these convenience methods provide**:
- **Clean API**: Event listeners can call `event.getUsedLanguage()` instead of `event.getPayload().usedLanguage`
- **Encapsulation**: Hides the internal payload structure
- **Type safety**: Each method returns properly typed data

### Step 9.6: Adding EventManager dependency

Update the service registration to include the EventManager:

```typescript
@Service("message_factory", [parameter("parameters.messages"), instanceOf(EventManager)])
export default class MessageFactory {
  constructor(private readonly messages: Messages, private readonly eventManager: EventManager) {}
  
  // We'll update the method next
}
```

**What this dependency addition does**:
- **Event emission capability**: The service can now emit events to the application
- **Dependency injection**: Alliage automatically provides the EventManager instance

### Step 9.7: Adding event emission to the method

Update the `createHelloMessage` method to emit events:

```typescript
async createHelloMessage(language: string, name: string) {
  const availableLanguages = Object.keys(this.messages);
  const usedLanguage = availableLanguages.includes(language) ? language : "en";
  const message = this.messages[usedLanguage].helloMessage.replace("{name}", name);
  
  const event = new CreateHelloMessageEvent({
    availableLanguages,
    usedLanguage,
    parameters: { name },
  });
  await this.eventManager.emit(event.getType(), event);

  return message;
}
```

**What this event emission provides**:
- **Custom event creation**: Creates an instance of your custom event with relevant data
- **Event broadcasting**: Notifies all registered listeners about the message creation
- **Async emission**: Allows event handlers to perform complex operations without blocking

### Step 9.8: Listening to custom events in SystemLogger

Now let's update the SystemLogger to listen to our custom event. Add these imports to `src/services/system-logger.ts`:

```typescript
// Add these imports to your existing imports
import {
  CreateHelloMessageEvent,
  MESSAGE_FACTORY_EVENTS,
} from "./message-factory.js";
```

### Step 9.9: Adding the custom event handler

Update the `getEventHandlers` method to include your custom event:

```typescript
getEventHandlers(): EventHandlers {
  return {
    [PROCESS_EVENTS.PRE_EXECUTE]: this.handlePreExecute,
    [PROCESS_EVENTS.POST_TERMINATE]: this.handlePostTerminate,
    [MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE]: this.handleCreateHelloMessage,
  };
}
```

### Step 9.10: Implementing the custom event handler

Add the handler method for the message creation event:

```typescript
handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
  const usedLanguage = event.getUsedLanguage();
  const parameters = event.getParameters();

  this.writeLog(
    `[Message Factory] Create "Hello Message": Available languages = ${event
      .getAvailableLanguages()
      .join(", ")}, Used language = ${usedLanguage}, Parameters = ${JSON.stringify(parameters)}`
  );
};
```

**What this event handling provides**:
- **Event subscription**: The logger now responds to message creation events
- **Typed access**: Event methods provide type-safe access to event data
- **Detailed logging**: Captures information about message creation decisions

### Step 9.11: Updating the process for async support

Since the MessageFactory now emits events asynchronously, update `src/processes/main.ts`:

```typescript
async execute(args: Arguments) {
  const message = await this.messageFactory.createHelloMessage(
    args.get("language"),
    args.get("name")
  );

  process.stdout.write(message);
  return true;
}
```

**Why async matters**: Event emission is asynchronous to allow event handlers to perform complex operations without blocking the main business logic.

### Understanding the extensibility you've created

**What you accomplished**: You created a framework within your application. Other developers can now:
- Add analytics tracking by listening to message creation events
- Implement custom validation or filtering
- Add caching layers that respond to message creation
- Create audit trails for business operations

All without modifying your core MessageFactory code.

### Testing the custom events

```bash
yarn alliage:run:dev say-hello Emma --language=fr
cat system.log
```

**You'll see expanded logging**:
```
[2025-06-07T17:19:19.000Z] [Process - say-hello] Executing with arguments: Name = Emma, Language = fr
[2025-06-07T17:19:19.001Z] [Message Factory] Create "Hello Message": Available languages = en, fr, Used language = fr, Parameters = {"name":"Emma"}
[2025-06-07T17:19:19.002Z] [Process - say-hello] Terminated with signal: 0
```

**What this demonstrates**: Your MessageFactory is now open for extension while remaining closed for modification. Other services can observe and react to its behavior without coupling.

---

## Step 10: Writable events for data transformation

**The challenge**: Sometimes observing events isn't enough. What if you want to transform data as it flows through your application? Add timestamps, filter content, or implement complex business rules?

**The solution**: Writable events that allow controlled modification of data as it passes through the system.

### Understanding writable events

Writable events let listeners modify the event payload before it returns to the original caller. This creates a pipeline where multiple services can transform data in sequence.

### Step 10.1: Updating imports for writable events

Let's update `src/services/message-factory.ts` to use writable events. First, change the import:

```typescript
// Change this import to include writable events
import { AbstractWritableEvent, EventManager } from "@alliage/lifecycle";
```

**What this import change provides**:
- **`AbstractWritableEvent`**: Base class for events that can be modified by listeners
- **Writable functionality**: Allows event payload to be changed during event processing

### Step 10.2: Adding message to the payload interface

Update the payload interface to include the message that can be modified:

```typescript
export interface CreateHelloMessageEventPayload {
  availableLanguages: string[];
  usedLanguage: string;
  parameters: {
    name: string;
  };
  message: string;
}
```

**What this addition provides**:
- **Mutable data**: The message is now part of the event payload and can be modified
- **Pipeline support**: Services can transform the message as it flows through the event system

### Step 10.3: Converting to AbstractWritableEvent

Update the event class to extend the writable event base class:

```typescript
export class CreateHelloMessageEvent
  extends AbstractWritableEvent<
    MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE,
    CreateHelloMessageEventPayload
  > {
    constructor(payload: CreateHelloMessageEventPayload) {
      super(MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE, payload);
    }

    // We'll update the existing methods and add new ones next
  }
```

**What this conversion does**:
- **Writable functionality**: The event can now be modified by listeners
- **Same interface**: Existing getter methods continue to work as before

### Step 10.4: Updating existing convenience methods

The existing getter methods can stay the same since they read from the payload:

```typescript
getUsedLanguage() {
  return this.getPayload().usedLanguage;
}

getAvailableLanguages() {
  return this.getPayload().availableLanguages;
}

getParameters() {
  return this.getPayload().parameters;
}
```

**What these methods continue to provide**:
- **Read access**: Services can still read event data as before
- **Type safety**: All existing functionality remains intact

### Step 10.5: Adding message manipulation methods

Add new methods for reading and writing the message using writable payload access:

```typescript
// New methods for message manipulation
getMessage() {
  return this.getWritablePayload().message;
}

setMessage(message: string) {
  this.getWritablePayload().message = message;
}
```

**What these new methods provide**:
- **`getMessage()`**: Reads the current message (potentially modified by previous listeners)
- **`setMessage()`**: Allows listeners to modify the message content
- **`getWritablePayload()`**: Provides write access to the event payload

### Step 10.6: Updating the service method to include the message

Update the `createHelloMessage` method to include the message in the event payload:

```typescript
async createHelloMessage(language: string, name: string) {
  const availableLanguages = Object.keys(this.messages);
  const usedLanguage = availableLanguages.includes(language) ? language : "en";
  const message = this.messages[usedLanguage].helloMessage.replace("{name}", name);

  const event = new CreateHelloMessageEvent({
    availableLanguages,
    usedLanguage,
    parameters: { name },
    message,
  });
  
  // We'll add event emission and return the modified message next
}
```

**What this update does**:
- **Message inclusion**: The generated message is now part of the event payload
- **Pipeline preparation**: The message is ready to be modified by event listeners

### Step 10.7: Emitting and returning the modified message

Complete the method by emitting the event and returning the potentially modified message:

```typescript
async createHelloMessage(language: string, name: string) {
  const availableLanguages = Object.keys(this.messages);
  const usedLanguage = availableLanguages.includes(language) ? language : "en";
  const message = this.messages[usedLanguage].helloMessage.replace("{name}", name);

  const event = new CreateHelloMessageEvent({
    availableLanguages,
    usedLanguage,
    parameters: { name },
    message,
  });
  await this.eventManager.emit(event.getType(), event);

  // Return the potentially modified message
  return event.getMessage();
}
```

**What this completion provides**:
- **Event emission**: Notifies all listeners, allowing them to modify the message
- **Modified result**: Returns the final message after all transformations

### Step 10.8: Creating a message transformer service

Now let's create a service that modifies messages as they're created. Create `src/services/message-decorator.ts`:

```typescript
import { AbstractEventsListener, EventHandlers } from "@alliage/events-listener-loader";
import { Service } from "@alliage/service-loader";
import { CreateHelloMessageEvent, MESSAGE_FACTORY_EVENTS } from "./message-factory.js";

@Service("message_decorator")
export default class MessageDecorator extends AbstractEventsListener {
  getEventHandlers(): EventHandlers {
    return {
      [MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE]: this.handleCreateHelloMessage,
    };
  }

  handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
    const message = event.getMessage();
    // Transform the message by adding a timestamp
    event.setMessage(`[${new Date().toISOString()}] ${message}`);
  };
}
```

**What this decorator accomplishes**:
- **Message transformation**: Adds a timestamp prefix to every generated message
- **Non-intrusive modification**: Changes behavior without touching the original MessageFactory
- **Pipeline participation**: Can be one of many services that modify the message

### Understanding the transformation pipeline

**How the pipeline works**:
1. MessageFactory creates the base message
2. MessageFactory emits a writable event containing the message
3. All registered listeners (like MessageDecorator) can modify the message
4. MessageFactory returns the final, potentially transformed message

**Benefits of this approach**:
- **Composable transformations**: Multiple decorators can be applied in sequence
- **Configurable behavior**: You can enable/disable decorators without code changes
- **Type safety**: All modifications go through typed methods
- **Testable components**: Each decorator can be tested independently

### Testing the transformation pipeline

```bash
yarn alliage:run:dev say-hello David --language=fr
```

**Expected output**: `[2025-06-07T17:40:43.000Z] Bonjour David !`

**What happened**: The MessageFactory created "Bonjour David !", then the MessageDecorator added the timestamp prefix, and the final transformed message was output.

### Possibilities for extension

You could now easily add:

```typescript
// Emoji decorator
@Service("emoji_decorator")
export default class EmojiDecorator extends AbstractEventsListener {
  handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
    const message = event.getMessage();
    event.setMessage(`🎉 ${message} 🎉`);
  };
}

// Length limiter
@Service("message_length_limiter")
export default class MessageLengthLimiter extends AbstractEventsListener {
  handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
    const message = event.getMessage();
    if (message.length > 50) {
      event.setMessage(message.substring(0, 47) + "...");
    }
  };
}
```

**The power of composition**: Each service has a single responsibility, but together they create sophisticated behavior through the event pipeline.

---

## Conclusion: You've built something impressive

Congratulations! You've created a sophisticated application that demonstrates important software development patterns and practices.

### What you've accomplished

**You started with**: A simple "Hello World" that most tutorials would leave as-is

**You finished with**: A professional application that showcases clean architecture principles

**More importantly**: You've experienced how good tools make good practices natural rather than burdensome

### The architecture you've built

**Clean separation of concerns**:
- CLI logic handles user interface concerns
- Business logic services focus on core functionality  
- Event listeners manage cross-cutting concerns
- Configuration keeps behavior flexible

**Solid principles in practice**:
- Single Responsibility: Each service has one clear purpose
- Open/Closed: You can extend behavior without modifying existing code
- Dependency Inversion: Services depend on abstractions, not implementations
- Interface Segregation: Clean, focused interfaces throughout
- Liskov Substitution: Services can be replaced with compatible implementations

### Why this foundation matters

**For maintainability**: Changes to one part of the system don't ripple through unrelated parts

**For testability**: Dependencies can be easily mocked and components tested in isolation

**For extensibility**: New features can be added through the event system without touching existing code

**For team development**: Clear boundaries make it easier for multiple developers to work together

### Your development workflow

```bash
# Development and testing
yarn alliage:run:dev say-hello Alice --language=fr
yarn test:unit
yarn test:integration

# Production build
yarn alliage:build
```

### Next steps

You now have a solid foundation for building larger applications. The patterns you've learned scale from simple CLI tools to complex web applications and microservices.

The Alliage framework provides additional modules for web servers, databases, and distributed systems, all following the same principles of dependency injection and clean architecture that you've experienced here.

**The knowledge you've gained** - dependency injection, event-driven architecture, and clean separation of concerns - will serve you well in any development environment, not just Alliage projects. 