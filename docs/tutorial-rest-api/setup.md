---
sidebar_position: 2
title: 'Project setup'
---

# Setup and project structure

Initialize your Alliage REST API project and understand the generated architecture.

## Create your project

Start by generating a new Alliage REST API project using the CLI:

```bash
npx @alliage/create-app-cli@beta rest my-meal-api
cd my-meal-api
```

This creates a complete project structure optimized for REST API development.

## Understanding the project structure

The Alliage CLI generates a comprehensive project with everything you need:

```
my-meal-api/
├── .alliage-rest-api-metadata.json  # OpenAPI generation metadata
├── .gitignore                       # Git ignore patterns
├── .scripts/install.js              # Installation script
├── alliage-modules.json             # Module configuration
├── config/                          # Configuration files
│   ├── builder.yaml                 # Build configuration
│   ├── parameters.yaml              # Application parameters
│   ├── rest-api-openapi-specs.yaml # OpenAPI specification config
│   ├── rest-api.yaml               # REST API configuration
│   ├── services.yaml               # Service registration
│   ├── webserver-express.yaml     # Express adapter config
│   └── webserver.yaml             # Webserver configuration
├── integration-tests/              # Integration test setup
├── package.json                    # Dependencies and scripts
├── src/controllers/                # Your API controllers
│   ├── __tests__/main.test.ts     # Unit tests
│   └── main.ts                    # Sample controller
├── tsconfig.json                  # TypeScript configuration
└── vitest.config.ts              # Test configuration
```

## Key architecture concepts

### Controllers: your API endpoints

Controllers handle HTTP requests and responses. Here's what the generated sample controller looks like:

```typescript title="src/controllers/main.ts"
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";

interface Params {
  /**
   * @pattern "^[a-zA-Z]+$"
   */
  name: string;
}

interface Query {
  lang?: "en" | "fr";
}

@Service("main_controller")
export default class MainController extends AbstractController {
  @Get("/api/hello/:name")
  async main(request: AbstractRequest<Params, Query>) {
    const { lang = "en" } = request.getQuery();
    const { name } = request.getParams();

    return {
      message: translations[lang].message(name),
    };
  }
}
```

**Key concepts about Alliage controllers:**

- **Controller Class**: Extends `AbstractController`
- **Service Registration**: `@Service("main_controller")` registers the controller in the DI container
- **HTTP Verb Decorators**: `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()` map routes to methods
- **Type-Safe Requests**: `AbstractRequest<Params, Query, Body>` provides type safety for:
  - **Route parameters** (`:name` in the URL)
  - **Query parameters** (`?lang=en`)
  - **Request body** (JSON payload)
- **Flexible Return Types**: Controllers can return scalars, objects, or arrays (automatically serialized to JSON)

### Configuration system

Alliage uses YAML configuration files that support environment variables:

```yaml title="config/parameters.yaml"
# Example configuration with environment variable support
database:
  url: $(DATABASE_URL?sqlite://local.db)
  
api:
  port: $(PORT?8080)
```

### Automatic OpenAPI generation

Your TypeScript interfaces automatically generate OpenAPI documentation. No manual specification writing needed!

## Install dependencies

```bash
yarn install
```

## Test your setup

Start the development server:

```bash
yarn alliage:run:dev web
```

Visit these URLs to verify everything works:

- **API Endpoint**: http://localhost:8080/api/hello/John
- **OpenAPI Documentation**: http://localhost:8080/api/specs

Expected response from the API:
```json
{
  "message": "Hello, John!"
}
```

## Development features

The development setup includes:

- **🔥 Hot Reload**: Automatically restarts when you change files
- **📚 Live Documentation**: OpenAPI specs update as you modify code
- **🧪 Test Suite**: Run tests with `yarn test:unit`
- **🔍 Type Checking**: Full TypeScript support with strict checking

## Project scripts

Your `package.json` includes these useful scripts:

- `alliage:run:dev [process]`: Runs your application in development mode
- `alliage:run [process]`: Runs your application in production mode
- `alliage:build`: Builds your application
- `alliage:install [package]`: Executes an Alliage module installation procedures
- `test:unit`: Runs the unit tests
- `test:integration`: Runs the integration tests

## Next steps

Now that you have a working Alliage REST API project, let's build our meal pairing functionality by creating a dedicated controller.

**[Create your first controller →](/docs/tutorial-rest-api/meal-pairing-controller)** 