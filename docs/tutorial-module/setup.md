---
sidebar_position: 2
---

# Setting up the project

Let's start by creating our project structure and installing the necessary dependencies.

## Creating the project directory

First, create a new directory for your module and navigate into it:

```bash
mkdir mongodb-module
cd mongodb-module
```

## Initializing the package

Initialize a new Node.js package:

```bash
npm init
```

Follow the prompts to create your `package.json`. After creation, update it to enable ES modules by adding the `"type": "module"` field:

```json
{
  "name": "mongodb-module",
  "version": "1.0.0",
  "description": "MongoDB module for Alliage framework",
  "main": "index.js",
  "type": "module",
  "license": "MIT"
}
```

## Installing dependencies

Install the required Alliage framework dependencies:

```bash
npm install --save-dev @alliage/framework @alliage/lifecycle @alliage/di @alliage/module-installer
```

Update your `package.json` to include these as peer dependencies:

```json
{
  // ... other fields ...
  "devDependencies": {
    "@alliage/di": "^x.y.z",
    "@alliage/framework": "^x.y.z",
    "@alliage/lifecycle": "^x.y.z",
    "@alliage/module-installer": "^x.y.z"
  },
  "peerDependencies": {
    "@alliage/di": "^x.y.z",
    "@alliage/framework": "^x.y.z",
    "@alliage/lifecycle": "^x.y.z"
  }
}
```

## Creating the module skeleton

Create a `src` directory and add the initial module file:

```bash
mkdir src
```

Create `src/index.ts` with the basic module structure:

```typescript
import { AbstractLifeCycleAwareModule } from "@alliage/lifecycle";
import { ServiceContainer } from "@alliage/di";

export default class MongoDBModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      // We'll add event handlers here later
    }
  }
  
  registerServices(container: ServiceContainer) {
    // We'll register services here later
  }
}
```

Now you have a basic Alliage module structure ready for development. In the next section, we'll add configuration management to our module. 