---
sidebar_position: 4
---

# Creating the MongoDB service

In this section, we'll create a service that will handle MongoDB connections and provide access to collections.

## Installing MongoDB driver

First, install the official MongoDB driver:

```bash
npm install mongodb
```

## Creating the service

Create `src/mongodb-service.ts`:

```typescript
import { MongoClient } from "mongodb";
import { Config } from "./config";

export class MongoDBService {
  private client: MongoClient;

  constructor(private config: Config) {
    this.client = new MongoClient(
      `mongodb://${this.config.host}:${this.config.port}`,
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
  }

  async connect() {
    await this.client.connect();
  }

  async close() {
    await this.client.close();
  }

  getCollection(name: string) {
    return this.client.db(this.config.database).collection(name);
  }
}
```

## Integrating the service

Update `src/index.ts` to register the service and manage its lifecycle:

```typescript
import { AbstractLifeCycleAwareModule, RUN_EVENTS, LifeCycleRunEvent } from "@alliage/lifecycle";
import { parameter, ServiceContainer } from "@alliage/di";
import { CONFIG_EVENTS, loadConfig, validators } from "@alliage/config-loader";
import { CONFIG_NAME, schema } from "./config.js";
import { MongoDBService } from "./mongodb-service.js";

export default class MongoDBModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(
        CONFIG_NAME,
        validators.jsonSchema(schema)
      ),
      // Connect to MongoDB when the application starts
      [RUN_EVENTS.PRE_RUN]: async (event: LifeCycleRunEvent) => {
        const mongodbService = event.getServiceContainer().getInstanceOf<MongoDBService>(MongoDBService);
        await mongodbService.connect();
      },
      // Close the connection when the application stops
      [RUN_EVENTS.POST_RUN]: async (event: LifeCycleRunEvent) => {
        const mongodbService = event.getServiceContainer().getInstanceOf<MongoDBService>(MongoDBService);
        await mongodbService.close();
      },
    };
  }

  registerServices(container: ServiceContainer) {
    // Register the MongoDB service with its configuration
    container.registerService(MongoDBService, MongoDBService, [
      parameter(CONFIG_NAME),
    ]);
  }
}

export * from "./config.js";
export * from "./mongodb-service.js";
```

## Using the service

Now other modules can use the MongoDB service by injecting it into their services or processes. Here's an example:

```typescript
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import { MongoDBService } from "mongodb-module";

@Service('my_service', [instanceOf(MongoDBService)])
export class MyService {
  constructor(private readonly mongodbService: MongoDBService) {}

  async findDocuments() {
    const collection = this.mongodbService.getCollection('my_collection');
    return collection.find({}).toArray();
  }
}
```

In the next section, we'll add integration tests to ensure our module works correctly. 