---
sidebar_position: 6
---

# Preparing for distribution

In this final section, we'll prepare our module for distribution on npm.

## TypeScript configuration

Create `tsconfig.json` to configure TypeScript compilation:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["es2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "integration-tests"
  ]
}
```

Install TypeScript:

```bash
npm install --save-dev typescript
```

## Updating package.json

Update your `package.json` with the necessary fields for distribution:

```json
{
  "name": "mongodb-module",
  // ...
  "main": "dist/index.js",
  "type": "module",
  "files": [
    "README.md",
    "dist",
    "base-files"
  ],
  "scripts": {
    // ...
    "build": "tsc -p tsconfig.json"
  },
  // ...
}
```

## Creating documentation

Create a `README.md` file to document your module:

````markdown
# MongoDB Module for Alliage

This module provides MongoDB integration for Alliage applications.

## Installation

```bash
npm install mongodb-module
```

## Configuration

The module requires a configuration file `config/mongodb.yaml`:

```yaml
host: $(MONGODB_HOST?localhost)
port: $(MONGODB_PORT?27017)
username: $(MONGODB_USERNAME?admin)
password: $(MONGODB_PASSWORD?admin)
database: $(MONGODB_DATABASE?test)
```

## Usage

The module provides a `MongoDBService` that can be injected into your services:

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

## License

MIT
````

## Building and publishing

1. Build the project:
```bash
npm run build
```

2. Test the build:
```bash
npm run test:integration
```

3. Login to npm:
```bash
npm login
```

4. Publish:
```bash
npm publish
```

Your module is now published and ready to be used in Alliage applications! 