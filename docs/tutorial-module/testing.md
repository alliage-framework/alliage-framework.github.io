---
sidebar_position: 5
---

# Testing the module

In this section, we'll set up integration tests to ensure our module works correctly in a real Alliage application environment.

## Test structure overview

Our test setup consists of three main parts:
- A sandbox environment that simulates a real Alliage application
- A test process that uses our MongoDB module
- Integration tests that verify the module's behavior

## Setting up the test environment

First, install the required testing dependencies:

```bash
npm install --save-dev @alliage/process-manager @alliage/sandbox @alliage/service-loader @types/node tsx vitest
```

Add a test script to your `package.json`:

```json
{
  "scripts": {
    "test:integration": "NODE_ENV=test vitest run --config ./integration-tests/vitest.config.ts"
  }
}
```

## Creating the test structure

Create the test directory structure:

```bash
mkdir -p integration-tests/main-scenario/src/processes
mkdir integration-tests/main-scenario/config
```

## Configuring Vitest

Create `integration-tests/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "."),
  test: {
    root: resolve(__dirname, "."),
    include: ["**/*.test.ts"],
    environment: "node",
  },
});
```

## Setting up the sandbox

The sandbox simulates a real Alliage application environment. Create `integration-tests/main-scenario/alliage-sandbox-config.json`:

```json
{
  "command": "tsx",
  "copyFiles": [
    "<scenarioRoot>/src",
    "<scenarioRoot>/config",
    "<scenarioRoot>/package.json"
  ],
  "linkModules": {
    "mongodb-module": "<projectRoot>"
  },
  "alliageModules": [
    "@alliage/lifecycle",
    "@alliage/di",
    "@alliage/module-installer",
    "@alliage/config-loader",
    "@alliage/process-manager",
    "@alliage/service-loader",
    "mongodb-module"
  ]
}
```

This sandbox configuration creates an isolated test environment:

- `command`: Uses `tsx` to run TypeScript files directly without compilation
- `copyFiles`: Copies test scenario files into the sandbox environment
  - `src`: Your test process and services
  - `config`: MongoDB and services configuration
  - `package.json`: Dependencies and module settings
- `linkModules`: Links your module into the sandbox's `node_modules`
  - Creates a symlink to your module using `<projectRoot>`
  - Allows testing the module as if it were installed
- `alliageModules`: Lists all modules needed for the test scenario to generate the `alliage-modules.json` of the sandbox
  - Core Alliage modules for DI, lifecycle, etc.
  - Your module (`mongodb-module`) to test its integration

## Test configuration files

The sandbox needs two configuration files:

1. MongoDB configuration (`config/mongodb.yaml`):
```yaml
host: localhost
port: 27017
username: admin
password: admin
database: test
```

2. Service loader configuration (`config/services.yaml`):
```yaml
basePath: src
paths:
  - "processes/**/*"
```

## Test process

Create a process that uses your module (`src/processes/TestProcess.ts`):

```typescript
import { instanceOf } from "@alliage/di";
import { AbstractProcess } from "@alliage/process-manager";
import { Service } from "@alliage/service-loader";
import { MongoDBService } from "mongodb-module";

@Service('test_process', [instanceOf(MongoDBService)])
export default class TestProcess extends AbstractProcess {
  constructor(private readonly mongodbService: MongoDBService) {
    super();
  }
  
  getName() {
    return "test-process";
  }

  async execute() {
    // Test our module by reading from MongoDB
    const collection = this.mongodbService.getCollection('test_collection');
    const data = await collection.find({}).toArray();
    console.log(JSON.stringify(data, null, 2));
    return true;
  }
}
```

## Integration test

Create `integration-tests/main-scenario/index.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Sandbox } from "@alliage/sandbox";
import { text } from "stream/consumers";
import { MongoClient } from "mongodb";

const MONGO_DB_HOST = "localhost";
const MONGO_DB_PORT = 27017;
const MONGO_DB_USERNAME = "admin";
const MONGO_DB_PASSWORD = "admin";
const MONGO_DB_DATABASE = "test";

describe("Main scenario", () => {
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  const mongoClient = new MongoClient(
    `mongodb://${MONGO_DB_HOST}:${MONGO_DB_PORT}`,
    {
      auth: {
        username: MONGO_DB_USERNAME,
        password: MONGO_DB_PASSWORD,
      },
    }
  );

  beforeAll(async () => {
    // Initialize sandbox and seed test data
    await sandbox.init();
    await mongoClient.connect();
    const database = mongoClient.db(MONGO_DB_DATABASE);
    const collection = database.collection("test_collection");
    await collection.deleteMany({});
    await collection.insertOne({ name: "test" });
  });

  afterAll(async () => {
    // Cleanup
    await sandbox.clear();
    await mongoClient.close();
  });

  it("should read from the database", async () => {
    // Run the test process in the sandbox
    const { process: runProcess, waitCompletion } = await sandbox.run([
      "test-process",
    ]);

    runProcess.stderr?.pipe(process.stderr);
    const output = await text(runProcess.stdout!);

    await waitCompletion();

    // Verify the output
    expect(JSON.parse(output)).toEqual([
      {
        "_id": expect.stringMatching(/^[0-9a-f]{24}$/),
        "name": "test",
      },
    ]);
  });
});
```

## Running the tests

Before running the tests, start MongoDB:

```bash
docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin mongo
```

Then run the tests:

```bash
npm run test:integration
```

The test verifies that:
1. The module loads correctly in an Alliage application
2. Configuration is properly loaded
3. The MongoDB service can connect and query data
4. The dependency injection system works as expected 