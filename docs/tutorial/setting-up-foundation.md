---
sidebar_position: 2
---

# Setting up the foundation

**The challenge**: Starting a new project usually involves a lot of setup - configuration files, folder structure, and boilerplate code before you can write actual business logic.

**How Alliage helps**: The CLI generates a complete project structure with sensible defaults.

## Creating your project

Let's start by creating a new Alliage application:

```bash
npx @alliage/create-app-cli@beta standard my-app
```

This command creates a new project with a well-organized structure. Here's what you get:

```
my-app/
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

## Understanding the generated code

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

## Testing the initial setup

Navigate to your project directory and run the generated command to make sure everything works:

```bash
cd my-app
yarn alliage:run:dev main
```

**Expected output**: `Hello, Alliage!`

**What happened**: Alliage discovered your process class, parsed command line arguments, and executed your code. The framework handled all the infrastructure so you could focus on the actual logic.

## Understanding the project structure

### Configuration files

- **`config/parameters.yaml`**: Stores application-specific settings and values
- **`config/services.yaml`**: Configures service discovery and dependency injection
- **`config/builder.yaml`**: Controls how your application is built and packaged

### Source code organization

- **`src/processes/`**: Contains CLI command handlers that users interact with
- **`src/services/`**: Houses your business logic, separated from CLI concerns
- **`integration-tests/`**: End-to-end tests that verify the complete application works

### Framework configuration

- **`alliage-modules.json`**: Specifies which Alliage modules your application uses
- **`vitest.config.ts`**: Configures the testing framework for both unit and integration tests

### Project scripts

Your `package.json` includes these useful scripts:

- `alliage:run:dev [process]`: Runs your application in development mode
- `alliage:run [process]`: Runs your application in production mode
- `alliage:build`: Builds your application
- `alliage:install [package]`: Executes an Alliage module installation procedures
- `test:unit`: Runs the unit tests
- `test:integration`: Runs the integration tests

## Next steps

Now that you have a working Alliage application, we'll start customizing it to build our greeting application. The next step will give our command a more descriptive name.

**[Continue to meaningful command names →](/docs/tutorial/meaningful-command-names)** 