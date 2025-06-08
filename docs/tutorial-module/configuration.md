---
sidebar_position: 3
---

# Adding configuration management

In this section, we'll add configuration capabilities to our module. This will allow users to customize MongoDB connection settings in their Alliage applications.

## Installing dependencies

First, let's install the required dependencies:

```bash
npm install --save-dev @alliage/config-loader
npm install json-schema-to-ts
```

Update your `package.json` to include `@alliage/config-loader` as a peer dependency:

```json
{
  // ... other fields ...
  "peerDependencies": {
    "@alliage/di": "^x.y.z",
    "@alliage/framework": "^x.y.z",
    "@alliage/lifecycle": "^x.y.z",
    "@alliage/config-loader": "^x.y.z"
  }
}
```

## Creating the configuration schema

Create `src/config.ts` to define the configuration schema:

```typescript
import { asConst, FromSchema } from "json-schema-to-ts";

// Name of the configuration file
export const CONFIG_NAME = "mongodb";

// JSON schema for MongoDB configuration
export const schema = asConst({
  type: "object",
  properties: {
    host: { type: "string" },
    port: { type: "number" },
    username: { type: "string" },
    password: { type: "string" },
    database: { type: "string" },
  },
  additionalProperties: false,
  required: ["host", "port", "username", "password", "database"],
});

// TypeScript type generated from the schema
export type Config = FromSchema<typeof schema>;
```

## Updating the module

Update `src/index.ts` to load and validate the configuration:

```typescript
import { AbstractLifeCycleAwareModule } from "@alliage/lifecycle";
import { ServiceContainer } from "@alliage/di";
import { CONFIG_EVENTS, loadConfig, validators } from "@alliage/config-loader";
import { CONFIG_NAME, schema } from "./config.js";

export default class MongoDBModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(
        CONFIG_NAME,
        validators.jsonSchema(schema)
      ),
    };
  }
  
  registerServices(container: ServiceContainer) {
    // We'll add services in the next section
  }
}

export * from "./config.js";
```

## Adding default configuration

Create a `base-files` directory and add a default configuration file:

```bash
mkdir base-files
```

Create `base-files/config.yaml` with default values:

```yaml
host: $(MONGODB_HOST?localhost)
port: $(MONGODB_PORT?27017)
username: $(MONGODB_USERNAME?admin)
password: $(MONGODB_PASSWORD?admin)
database: $(MONGODB_DATABASE?test)
```

This configuration uses Alliage's variable substitution syntax `$(ENV_VAR?default_value)` to allow easy configuration through environment variables.

## Understanding the alliageManifest

The `alliageManifest` section in `package.json` is a crucial part of any Alliage module. It tells the Alliage framework how to handle your module during installation and runtime. Let's break down each part:

```json
{
  "alliageManifest": {
    "type": "module",
    "dependencies": [
      "@alliage/di",
      "@alliage/lifecycle",
      "@alliage/config-loader"
    ],
    "installationProcedures": {
      "copyFiles": [
        "base-files/config.yaml",
        "config/mongodb.yaml"
      ]
    }
  }
}
```

### The manifest structure

1. **`type: "module"`**
   - This indicates that your package is an Alliage module
   - It helps Alliage identify and properly load your module in the application

2. **`dependencies`**
   - Lists other Alliage modules that your module depends on
   - These modules must be loaded before your module
   - In our case:
     - `@alliage/di`: For dependency injection capabilities
     - `@alliage/lifecycle`: For lifecycle event handling
     - `@alliage/config-loader`: For configuration management

3. **`installationProcedures`**
   - Defines actions to perform when your module is installed
   - The `copyFiles` array specifies files to copy into the user's project
   - Files are copied from your module's package to the user's project structure
   - In our example:
     - `base-files/config.yaml` → `config/mongodb.yaml`: Provides default configuration
     - This ensures users have a working configuration file after installation

### Why this matters

When a user installs your module using npm, Alliage will:
1. Update the `alliage-modules.json` automatically
2. Copy the configuration file to the user's project
3. Make the module ready to use with minimal manual setup

Now our module can load and validate configuration from YAML files. In the next section, we'll create the MongoDB service that will use this configuration. 