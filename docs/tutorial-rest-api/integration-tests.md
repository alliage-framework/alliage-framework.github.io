---
sidebar_position: 7
title: 'Integration testing'
---

# Add comprehensive testing

Create integration tests that verify your complete API flow using mock servers and Alliage's testing sandbox.

## Make configuration environment-aware

First, update your configuration to support environment variables, enabling different URLs for testing:

```yaml title="config/parameters.yaml"
apis:
  meals:
    url: $(MEALS_API_URL?https://www.themealdb.com/api/json/v1/1/filter.php)
  cocktails:
    url: $(COCKTAILS_API_URL?https://www.thecocktaildb.com/api/json/v1/1/filter.php)
```

The syntax `$(VARIABLE_NAME?default_value)` allows:
- **Production**: Uses the default URLs when environment variables aren't set
- **Testing**: Override with mock server URLs via environment variables
- **Development**: Customize APIs for local development

## Mocking external APIs

To test our application's full flow, we need to simulate the external Meals and Cocktails APIs. Real network calls would make our tests slow and unreliable. Instead, we'll use a mock server to control the API responses.

For this, we'll use `mockttp`. It's a library that lets us create a local HTTP server that can fake responses, allowing us to test how our application behaves in different scenarios (like when an API returns an error, or no results).

First, let's add `mockttp` to our development dependencies:

```bash
yarn add -D mockttp
```

## Create integration tests

Create a comprehensive integration test that covers the complete flow:

```typescript title="integration-tests/main-scenario/index.test.ts"
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Sandbox } from "@alliage/sandbox";
import { WebserverSandbox } from "@alliage/webserver-sandbox";
import { getLocal } from "mockttp";

describe("Main scenario", () => {
  // Create a mock server to simulate external APIs
  const mockServer = getLocal();

  // Create a sandbox to run the Alliage application in isolation
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  // Use the webserver sandbox wrapper to run the webserver
  const webserverSandbox = new WebserverSandbox(sandbox);

  beforeAll(async () => {
    try {
      // Start the mock server on port 8880
      await mockServer.start(8880);
      
      // Initialize the Alliage sandbox
      await sandbox.init();
      
      // Start the webserver with environment variables pointing to mock server
      await webserverSandbox.start({
        commandOptions: {
          env: {
            MEALS_API_URL: "http://localhost:8880/meals",
            COCKTAILS_API_URL: "http://localhost:8880/cocktails",
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  });

  afterAll(async () => {
    await mockServer.stop();
    await webserverSandbox.stop();
    await sandbox.clear();
  });

  describe("Webserver", () => {
    describe("GET /api/meal-pairing", () => {
      it("should return intelligent meal pairing for Italian cuisine", async () => {
        // Mock the meals API to return Italian pizza
        mockServer
          .forGet("/meals")
          .withQuery({ i: "pepperoni" })
          .thenJson(200, {
            meals: [
              {
                strMeal: "Pizza with Pepperoni",
                strArea: "Italian",
                strCategory: "Pizza",
              },
            ],
          });

        // Mock the cocktails API to return Italian cocktail (Campari-based)
        mockServer
          .forGet("/cocktails")
          .withQuery({ i: "Campari" })
          .thenJson(200, {
            drinks: [
              {
                strDrink: "Aperol Spritz",
              },
            ],
          });

        // Make request to the meal pairing API
        const res = await webserverSandbox
          .getClient()
          .get("/api/meal-pairing?ingredient=pepperoni", {
            validateStatus: () => true,
          });

        // Verify intelligent pairing: Italian meal → Campari cocktail
        expect(res.status).toBe(200);
        expect(res.data).toEqual({
          meal: "Pizza with Pepperoni",
          cocktail: "Aperol Spritz",
        });
      });
    });
  });
});
```

## Understanding integration testing concepts

### Mock server setup
```typescript
const mockServer = getLocal();
await mockServer.start(8880);
```

- **`mockttp` library**: Creates a local HTTP server for mocking external APIs
- **Port 8880**: Runs on a different port than your application (8080)
- **Complete control**: Define exact request/response patterns

### Alliage sandbox
```typescript
const sandbox = new Sandbox({ scenarioPath: __dirname });
const webserverSandbox = new WebserverSandbox(sandbox);
```

- **Isolated environment**: Tests run in complete isolation from other processes
- **Clean state**: Each test starts with a fresh application instance
- **Environment control**: Override configuration via environment variables

### Test lifecycle
```typescript
beforeAll(async () => {
  await mockServer.start(8880);           // Start mock APIs
  await sandbox.init();                   // Initialize test environment
  await webserverSandbox.start({          // Start your application
    commandOptions: {
      env: {
        MEALS_API_URL: "http://localhost:8880/meals",
        COCKTAILS_API_URL: "http://localhost:8880/cocktails",
      },
    },
  });
});

afterAll(async () => {
  await mockServer.stop();                // Cleanup mock server
  await webserverSandbox.stop();          // Stop application
  await sandbox.clear();                  // Clean up test environment
});
```

### Mock API responses
```typescript
// Mock specific request patterns
mockServer
  .forGet("/meals")                       // Match GET requests to /meals
  .withQuery({ i: "pepperoni" })         // With specific query parameters
  .thenJson(200, { meals: [...] });      // Return specific JSON response
```

### Testing different scenarios

The test suite must cover multiple important scenarios:

1. **Happy path**: Successful meal-cocktail pairing with intelligent logic
2. **No results**: External API returns no data
3. **API failures**: External API returns errors
4. **Business logic**: Different cuisine types trigger different cocktail pairings

## Run integration tests

Run the integration tests:

```bash
yarn alliage:build
yarn test:integration
```
