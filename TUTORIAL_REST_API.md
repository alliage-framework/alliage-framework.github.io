# Building an Alliage REST API: Step-by-Step Tutorial

This tutorial will guide you through building a REST API using the Alliage framework, step by step, following the exact same process used to create this project.

## Overview

This project demonstrates how to build a meal pairing API that suggests cocktails to pair with meals. We'll use the Alliage framework, which is a Node.js framework for building modular applications.

## Prerequisites

- Basic knowledge of TypeScript
- Understanding of REST API concepts


### Step 1: Setup Alliage REST Distribution (Commit: f14db1f)

This step sets up the complete project structure using the Alliage CLI tool.

**What you'll do:**

1. **Create the project using the Alliage CLI:**
```bash
npx @alliage/create-app-cli@beta rest my-api
```

2. **Understanding the project structure:**

The command creates a comprehensive project with the following key files:

```
├── .alliage-rest-api-metadata.json  # Metadata for OpenAPI generation
├── .gitignore                       # Git ignore patterns
├── .scripts/install.js              # Installation script
├── alliage-modules.json             # Module configuration
├── config/                          # Configuration files
│   ├── builder.yaml
│   ├── parameters.yaml
│   ├── rest-api-openapi-specs.yaml
│   ├── rest-api.yaml
│   ├── services.yaml
│   ├── webserver-express.yaml
│   └── webserver.yaml
├── integration-tests/               # Integration test setup
├── package.json                     # Dependencies and scripts
├── src/controllers/                 # Your API controllers
│   ├── __tests__/main.test.ts      # Unit tests
│   └── main.ts                     # Main controller
├── tsconfig.json                   # TypeScript configuration
└── vitest.config.ts               # Test configuration
```

3. **Understanding the main controller (`src/controllers/main.ts`):**

The initial controller demonstrates the Alliage pattern and how controllers are structured:

```typescript
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
- **Action Methods**: Controller methods are called "actions" - they handle HTTP requests
- **HTTP Verb Decorators**: 
  - `@Get()` for GET requests
  - `@Post()`, `@Put()`, `@Delete()`, `@Patch()` for other HTTP verbs
  - Each decorator maps a route to the action method
- **Type-Safe Requests**: `AbstractRequest<Params, Query, Body>` provides type safety for:
  - **Route parameters** (`:name` in the URL)
  - **Query parameters** (`?lang=en`)
  - **Request body** (JSON payload)
- **Flexible Return Types**: Actions can return:
  - **Scalar values** (string, number, boolean)
  - **Plain objects** (automatically serialized to JSON)
  - **Arrays** (automatically serialized to JSON)
- **Automatic OpenAPI Generation**: 
  - TypeScript types are automatically analyzed
  - OpenAPI schema is generated from your interfaces
  - Documentation stays in sync with your code

4. **Install dependencies:**
```bash
yarn install
```

5. **Test the setup:**
```bash
# Development mode with hot reload
yarn alliage:run:dev web

# Visit: http://localhost:8080/api/hello/John
# API docs: http://localhost:8080/api/specs
```

---

### Step 2: Create Meal Pairing Controller (Commit: eea9532)

In this step, we replace the initial "hello world" controller with our core functionality - a meal pairing controller that will suggest cocktails to pair with meals.

**Purpose**: Create a new controller called `MealPairingController` that provides an endpoint `/api/meal-pairing`, expecting an `ingredient` as query parameter and returning the association of a `meal` containing that ingredient and a `cocktail` matching with this meal. For now, everything is static - the logic will be added in the next steps.

**What you'll do:**

1. **Remove the initial controller files:**
```bash
rm src/controllers/__tests__/main.test.ts
rm src/controllers/main.ts
```

2. **Create the meal pairing controller (`src/controllers/meal-pairing.controller.ts`):**

```typescript
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";

export interface MealPairing {
  meal: string;
  cocktail: string;
}

export interface MealPairingQuery {
  ingredient: string;
}

@Service("meal_pairing_controller")
export default class MealPairingController extends AbstractController {
  @Get("/api/meal-pairing")
  async getMealPairing(
    // We expect a query parameter called ingredient
    request: AbstractRequest<unknown, MealPairingQuery>
    // We return a MealPairing object
  ): Promise<MealPairing> {
    return {
      meal: "Pizza",
      cocktail: "Mojito",
    };
  }
}
```

**Key concepts:**
- **Route Mapping**: `@Get("/api/meal-pairing")` maps GET requests to this endpoint
- **Query Parameters**: `AbstractRequest<unknown, MealPairingQuery>` defines expected query parameters
- **Response Types**: The `Promise<MealPairing>` return type helps with OpenAPI schema generation
- **Static Response**: For now, we return hardcoded values

3. **Test the endpoint:**
```bash
# Start the development server
yarn alliage:run:dev web

# Visit: http://localhost:8080/api/meal-pairing?ingredient=pepperoni
```

Expected response:
```json
{
   "meal": "Pizza",
   "cocktail": "Mojito"
}
```

**Note**: The endpoint returns static data at this stage. Real meal data will be integrated in the next step.

---

### Step 3: Create Meal Service (Commit: f6aff8d)

Now we'll create a service to fetch real meal data from an external API and integrate it with our controller.

**Purpose**: Create the `MealService` to find a random meal according to an ingredient, replacing the static responses with real data from TheMealDB API.

**What you'll accomplish in this step:**
- Update the `config/parameters.yaml` config file to add the Meals API URL
- Create the `MealService` with a method calling the meal API to find a random meal corresponding to a given ingredient
- Inject that service in the `MealPairingController` and use it to find a meal corresponding to the ingredient passed in the query params
- Add error handling for when no meal is returned by throwing an HTTP error using the `createHttpError` function (which will contribute to populating the OpenAPI spec errors part of this endpoint)

**What you'll do:**

1. **Update configuration (`config/parameters.yaml`):**
```yaml
apis:
  meals:
    url: https://www.themealdb.com/api/json/v1/1/filter.php
```

2. **Create the meal service (`src/services/meal.service.ts`):**

```typescript
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

export interface Meal {
  name: string;
  category?: string;
  area?: string;
}

interface MealApiResponse {
  meals: {
    strCategory?: string;
    strArea?: string;
    strMeal: string;
  }[] | null;
}

@Service("meal_service", [parameter("parameters.apis.meals.url")])
export default class MealService {
  constructor(private readonly mealApiUrl: string) {}

  async getRandomMealWithIngredient(ingredient: string): Promise<Meal | null> {
    const url = `${this.mealApiUrl}?i=${ingredient}`;
    const response = await fetch(url);
    const data = await response.json() as MealApiResponse;
    if (data.meals === null) {
      return null;
    }
    const meal = data.meals[Math.floor(Math.random() * data.meals.length)];
    return {
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
    };
  }
}
```

**Key concepts:**
- **Dependency Injection**: `@Service("meal_service", [parameter("parameters.apis.meals.url")])` injects the API URL from configuration
- **External API Integration**: Uses `fetch()` to call TheMealDB API
- **Error Handling**: Returns `null` when no meals are found
- **Random Selection**: Picks a random meal from the API results

3. **Update the controller (`src/controllers/meal-pairing.controller.ts`):**

```typescript
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";
import MealService from "../services/meal.service.js";
import { createHttpError } from "@alliage/rest-api";

// ... interfaces remain the same ...

// We inject the meal service in the controller
@Service("meal_pairing_controller", [instanceOf(MealService)])
export default class MealPairingController extends AbstractController {
  constructor(private readonly mealService: MealService) {
    super();
  }

  @Get("/api/meal-pairing")
  async getMealPairing(
    request: AbstractRequest<unknown, MealPairingQuery>
  ): Promise<MealPairing> {
    const { ingredient } = request.getQuery();
    const meal = await this.mealService.getRandomMealWithIngredient(ingredient);
    if (meal === null) {
      /**
       * Error thrown when no ingredient is found in the meal database
       */
      throw createHttpError(404, {
        message: `No meal found with provided ingredient`,
        ingredient,
      });
    }
    return {
      meal: meal.name,
      cocktail: "Mojito", // Still hardcoded
    };
  }
}
```

**Key concepts:**
- **Service Injection**: `[instanceOf(MealService)]` injects the meal service into the controller
- **HTTP Error Handling**: `createHttpError()` creates proper HTTP errors with structured error responses
- **OpenAPI Error Documentation**: The `createHttpError()` function automatically contributes to populating the OpenAPI spec errors section for this endpoint
- **Structured Error Responses**: Error responses include both the message and the ingredient that caused the error
- **Error Documentation**: Comments above `createHttpError()` help document the error scenarios in the API specs

4. **Test with real data:**
```bash
# Visit: http://localhost:8080/api/meal-pairing?ingredient=chicken
```

Expected response (will vary due to randomization):
```json
{
  "meal": "Chicken Handi",
  "cocktail": "Mojito"
}
```

---

### Step 4: Create Cocktail Service (Commit: 1781cbe)

Similar to the meal service, we'll create a cocktail service to fetch cocktail data from an external API.

**Purpose**: Create the `CocktailService` on the same principle as we did for the `MealService`. We'll also inject it in the controller to use it to produce the API response.

**What you'll do:**

1. **Update configuration (`config/parameters.yaml`):**
```yaml
apis:
  meals:
    url: https://www.themealdb.com/api/json/v1/1/filter.php
  cocktails:
    url: https://www.thecocktaildb.com/api/json/v1/1/filter.php
```

2. **Create the cocktail service (`src/services/cocktail.service.ts`):**

```typescript
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

interface CocktailApiResponse {
  drinks: {
    strDrink: string;
  }[] | null;
};

export interface Cocktail {
  name: string;
}

@Service("cocktail_service", [parameter("parameters.apis.cocktails.url")])
export default class CocktailService {
  constructor(private readonly cocktailApiUrl: string) {}

  async getRandomCocktailWithIngredient(ingredient: string): Promise<Cocktail | null> {
    const url = `${this.cocktailApiUrl}?i=${ingredient}`;
    const response = await fetch(url);
    const data = await response.json() as CocktailApiResponse;
    if (data.drinks === null) {
      return null;
    }
    const cocktail = data.drinks[Math.floor(Math.random() * data.drinks.length)];
    return {
      name: cocktail.strDrink,
    };
  }
}
```

3. **Update the controller to use both services:**

```typescript
// Add cocktail service import
import CocktailService from "../services/cocktail.service.js";

// Inject both services
@Service("meal_pairing_controller", [instanceOf(MealService), instanceOf(CocktailService)])
export default class MealPairingController extends AbstractController {
  constructor(
    private readonly mealService: MealService, 
    private readonly cocktailService: CocktailService
  ) {
    super();
  }

  @Get("/api/meal-pairing")
  async getMealPairing(
    request: AbstractRequest<unknown, MealPairingQuery>
  ): Promise<MealPairing> {
    const { ingredient } = request.getQuery();
    const meal = await this.mealService.getRandomMealWithIngredient(ingredient);
    const cocktail = await this.cocktailService.getRandomCocktailWithIngredient("Rum");
    
    if (meal === null || cocktail === null) {
      throw createHttpError(404, {
        message: `No meal found with provided ingredient`,
        ingredient,
      });
    }
    return {
      meal: meal.name,
      cocktail: cocktail.name,
    };
  }
}
```

Note: At this point, cocktails are fetched using a hardcoded "Rum" ingredient. The smart pairing logic comes in the next step.

---

### Step 5: Create Meal Pairing Service (Commit: 48bcd87)

This step introduces the core business logic by creating a service that intelligently pairs meals with cocktails based on cuisine and meal characteristics.

**Purpose**: Create the `MealPairingService` which will use both `MealService` and `CocktailService` and implement the logic of finding the good meal/cocktail association. We'll replace the controller's dependency on `MealService` and `CocktailService` with the `MealPairingService` on which it can now rely to produce the API's response.

**What you'll do:**

1. **Create the meal pairing service (`src/services/meal-pairing.service.ts`):**

```typescript
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import MealService, { Meal } from "./meal.service.js";
import CocktailService from "./cocktail.service.js";

export interface MealPairing {
  meal: string;
  cocktail: string;
}

@Service("meal_pairing_service", [
  instanceOf(MealService),
  instanceOf(CocktailService),
])
export default class MealPairingService {
  constructor(
    private readonly mealService: MealService,
    private readonly cocktailService: CocktailService
  ) {}

  private getIngredientFromMeal(meal: Meal) {
    const category = meal.category?.toLowerCase();
    const area = meal.area?.toLowerCase();

    // Area-based ingredient mappings
    const areaIngredientMap: Record<string, string> = {
      mexican: "Tequila",
      italian: "Campari",
      russian: "Vodka",
      japanese: "Sake",
      chinese: "Baijiu",
      indian: "Gin",
      thai: "Baijiu",
      vietnamese: "Baijiu",
      korean: "Soju",
      malaysian: "Baijiu",
      filipino: "Baijiu",
      french: "Cognac",
    };

    // Category-based ingredient mappings
    const categoryIngredientMap: Record<string, string> = {
      seafood: "Gin",
      dessert: "Brandy",
      beef: "Whisky",
    };

    // Check area first, then category, then default
    if (area && areaIngredientMap[area]) {
      return areaIngredientMap[area];
    }

    if (category && categoryIngredientMap[category]) {
      return categoryIngredientMap[category];
    }

    // Default fallback
    return "Vodka";
  }

  async getMealPairing(ingredient: string): Promise<MealPairing | null> {
    const meal = await this.mealService.getRandomMealWithIngredient(ingredient);
    if (meal == null) {
      return null;
    }

    const cocktail = await this.cocktailService.getRandomCocktailWithIngredient(
      this.getIngredientFromMeal(meal)
    );
    if (cocktail == null) {
      return null;
    }

    return {
      meal: meal.name,
      cocktail: cocktail.name,
    };
  }
}
```

**Key concepts:**
- **Service Orchestration**: This service coordinates both meal and cocktail services
- **Business Logic**: The `getIngredientFromMeal()` method implements pairing rules
- **Intelligent Matching**: Maps meal cuisines (Mexican → Tequila, Italian → Campari) and categories (Seafood → Gin, Beef → Whisky)
- **Fallback Strategy**: Provides defaults when specific mappings aren't found

2. **Simplify the controller (`src/controllers/meal-pairing.controller.ts`):**

```typescript
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";
import { createHttpError } from "@alliage/rest-api";
import MealPairingService from "../services/meal-pairing.service.js";

// ... interfaces remain the same ...

@Service("meal_pairing_controller", [instanceOf(MealPairingService)])
export default class MealPairingController extends AbstractController {
  constructor(private readonly mealPairingService: MealPairingService) {
    super();
  }

  @Get("/api/meal-pairing")
  async getMealPairing(
    request: AbstractRequest<unknown, MealPairingQuery>
  ): Promise<MealPairing> {
    const { ingredient } = request.getQuery();
    const mealPairing = await this.mealPairingService.getMealPairing(ingredient);
    if (mealPairing === null) {
      throw createHttpError(404, {
        message: `No meal found with provided ingredient`,
        ingredient,
      });
    }
    return {
      meal: mealPairing.meal,
      cocktail: mealPairing.cocktail,
    };
  }
}
```

**Key concepts:**
- **Single Responsibility**: Controller now focuses only on HTTP concerns
- **Clean Architecture**: Business logic is properly separated into the service layer
- **Simplified Dependencies**: Controller only depends on one service instead of two

3. **Test intelligent pairing:**
```bash
# Try different ingredients to see intelligent pairing
curl "http://localhost:8080/api/meal-pairing?ingredient=beef"
```

---

### Step 6: Add Integration Tests (Commit: 9aae1b4)

Integration tests ensure your API works correctly end-to-end, including all external dependencies.

**Purpose**: Add integration tests for our API by updating the configuration to use environment variables for third-party API URLs, allowing us to use different values in integration test contexts.

**Detailed integration test process:**
1. Create a mock server to mock the meals and cocktails API
2. Create a sandbox to run the Alliage application
3. Use the webserver sandbox wrapper to run the webserver
4. Start the mock server
5. Initialize the sandbox
6. Start the webserver and set the environment variables to the mock server URLs
7. Mock the meals API to return a pizza with pepperoni
8. Mock the cocktails API to return a spritz
9. Make a request to the meal pairing API
10. Expect the response to be a 200 status code and the meal pairing to be a pizza with pepperoni and a spritz

**What you'll do:**

1. **Update configuration to use environment variables (`config/parameters.yaml`):**
```yaml
apis:
  meals:
    url: $(MEALS_API_URL?https://www.themealdb.com/api/json/v1/1/filter.php)
  cocktails:
    url: $(COCKTAILS_API_URL?https://www.thecocktaildb.com/api/json/v1/1/filter.php)
```

**Key concepts:**
- **Environment Variables**: `$(MEALS_API_URL?default_value)` allows overriding URLs in tests
- **Configuration Flexibility**: Same code works with real APIs in production and mock APIs in tests

2. **Create comprehensive integration tests (`integration-tests/main-scenario/index.test.ts`):**

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Sandbox } from "@alliage/sandbox";
import { WebserverSandbox } from "@alliage/webserver-sandbox";
import { getLocal } from "mockttp";

describe("Main scenario", () => {
  // We create a mock server to mock the meals and cocktails API
  const mockServer = getLocal();

  // We create a sandbox to run the alliage application
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  // We use the webserver sandbox wrapper to run the webserver
  const webserverSandbox = new WebserverSandbox(sandbox);

  beforeAll(async () => {
    try {
      // We start the mock server
      await mockServer.start(8880);
      // We initialize the sandbox
      await sandbox.init();
      // We start the webserver
      await webserverSandbox.start({
        commandOptions: {
          env: {
            // We set the meals and cocktails API URLs to the mock server
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
      it("should return a meal pairing corresponding to the given ingredient", async () => {
        // We mock the meals API to return a pizza with pepperoni
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

        // We mock the cocktails API to return a spritz
        mockServer
          .forGet("/cocktails")
          .withQuery({ i: "Campari" })
          .thenJson(200, {
            drinks: [
              {
                strDrink: "Spritz",
              },
            ],
          });

        // We make a request to the meal pairing API
        const res = await webserverSandbox
          .getClient()
          .get("/api/meal-pairing?ingredient=pepperoni", {
            validateStatus: () => true,
          });

        // We expect the response to be a 200 status code and the meal pairing to be a pizza with pepperoni and a spritz
        expect(res.status).toBe(200);
        expect(res.data).toEqual({
          meal: "Pizza with Pepperoni",
          cocktail: "Spritz",
        });
      });

      it("should return an error if the ingredient is not allowed", async () => {
        const res = await webserverSandbox
          .getClient()
          .get("/api/meal-pairing?ingredient=tomato", {
            validateStatus: () => true,
          });

        expect(res.status).toBe(400);
        expect(res.data).toEqual([
          {
            source: "query",
            errors: [
              {
                instancePath: "/ingredient",
                schemaPath: "#/properties/ingredient/enum",
                keyword: "enum",
                params: {
                  allowedValues: ["pepperoni", "lettuce", "rice"],
                },
                message: "must be equal to one of the allowed values",
              },
            ],
          },
        ]);
      });
    });
  });
});
```

**Key integration testing concepts:**

- **Mock Server Setup**: 
  - Uses `mockttp` library to create a local mock server
  - Starts on port 8880 to simulate external APIs
  - Allows precise control over API responses

- **Alliage Sandbox**:
  - `Sandbox` class provides an isolated environment for testing
  - `WebserverSandbox` wraps the sandbox to test HTTP endpoints
  - Environment variables override the real API URLs

- **Test Lifecycle**:
  - `beforeAll()`: Starts mock server, initializes sandbox, starts webserver
  - `afterAll()`: Cleanup - stops mock server, webserver, and clears sandbox

- **Mock API Responses**:
  - **Meals API Mock**: Returns a Pizza with Italian area (triggers Campari pairing)
  - **Cocktails API Mock**: Returns a Spritz when queried with "Campari"
  - **Validation Test**: Tests that invalid ingredients return proper 400 errors

- **End-to-End Testing**:
  - Tests the complete flow: HTTP request → Controller → Services → External APIs → Response
  - Verifies both success and error scenarios
  - Validates the intelligent pairing logic (Italian meal → Campari → Spritz)

3. **Run integration tests:**
```bash
yarn test:integration
```

---

### Step 7: Add Validation (Commit: c3cd9db)

Adding validation ensures your API only accepts valid data and provides clear error messages.

**Purpose**: Add validation to the ingredient parameter by updating the `MealPairingQuery` interface to limit the allowed values to `pepperoni`, `lettuce` and `rice`. When we run the application, we can see that the ingredient parameter is validated and the API returns a 400 error if the ingredient is not allowed.

**What you'll accomplish:**
- Add TypeScript union type validation to restrict ingredient values
- Automatic validation by Alliage REST API framework
- Clear, structured error messages for invalid inputs
- Integration test coverage for validation scenarios

**What you'll do:**

1. **Update the controller with validation (`src/controllers/meal-pairing.controller.ts`):**

```typescript
export interface MealPairingQuery {
  // Limit the ingredient to specific values
  // This creates automatic validation with clear error messages
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}
```

**Key concepts:**
- **TypeScript Union Types**: `'pepperoni' | 'lettuce' | 'rice'` creates enum-like validation
- **Automatic Validation**: Alliage REST API automatically validates based on TypeScript types
- **OpenAPI Schema**: The validation rules are automatically added to your API documentation

2. **Test validation:**
```bash
# Valid request
curl "http://localhost:8080/api/meal-pairing?ingredient=pepperoni"

# Invalid request - returns 400 error
curl "http://localhost:8080/api/meal-pairing?ingredient=invalidingredient"
```

Expected error response:
```json
[
  {
    "source": "query",
    "errors": [
      {
        "instancePath": "/ingredient",
        "schemaPath": "#/properties/ingredient/enum",
        "keyword": "enum",
        "params": {
          "allowedValues": ["pepperoni", "lettuce", "rice"]
        },
        "message": "must be equal to one of the allowed values"
      }
    ]
  }
]
```

3. **Update integration tests:**

The integration tests (`integration-tests/main-scenario/index.test.ts`) are automatically updated to include a test that checks the API returns a 400 error if the ingredient is not allowed. The test passes and the API returns the correct structured error message.

---

### Step 8: Use GET with URL Parameters (Commit: d7ea176)

This step demonstrates how to move from query parameters to URL path parameters for RESTful design.

**Purpose**: Update the controller to expect the ingredient inside of the URL parameters instead of the query parameters, making the API more RESTful.

**What you'll do:**

1. **Update the controller to use URL parameters:**

```typescript
interface MealPairingParams {
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

@Service("meal_pairing_controller", [instanceOf(MealPairingService)])
export default class MealPairingController extends AbstractController {
  @Get("/api/meal-pairing/:ingredient")
  async getMealPairing(
    request: AbstractRequest<MealPairingParams, unknown>
  ): Promise<MealPairing> {
    const { ingredient } = request.getParams(); // Changed from getQuery()
    // ... rest remains the same
  }
}
```

**Key concepts:**
- **URL Parameters**: `:ingredient` in the route defines a URL parameter
- **RESTful Design**: `GET /api/meal-pairing/pepperoni` is more RESTful than query parameters
- **Type Safety**: `AbstractRequest<MealPairingParams, unknown>` provides type safety for params

2. **Test the new endpoint:**
```bash
# New URL structure
curl "http://localhost:8080/api/meal-pairing/pepperoni"
```

---

### Step 9: Use POST with Request Body (Commit: 35b28b8)

The final step demonstrates using POST requests with JSON body, which is common for more complex APIs.

**Purpose**: Use a POST request and get the ingredient from the request body instead of URL parameters, demonstrating how to handle JSON payloads.

**What you'll do:**

1. **Update to POST with body (`src/controllers/meal-pairing.controller.ts`):**

```typescript
import { Post } from "@alliage/webserver"; // Changed from Get

export interface MealPairingBody {
  // We limit the ingredient to a few values
  // This will be automatically validated by @alliage/rest-api
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

@Service("meal_pairing_controller", [instanceOf(MealPairingService)])
export default class MealPairingController extends AbstractController {
  @Post("/api/meal-pairing") // Changed to POST
  async getMealPairing(
    request: AbstractRequest<unknown, unknown, MealPairingBody>
  ): Promise<MealPairing> {
    const { ingredient } = request.getBody(); // Changed to getBody()
    // ... rest remains the same
  }
}
```

**Key concepts:**
- **POST Method**: `@Post()` decorator for POST requests
- **Request Body**: `getBody()` extracts data from the JSON request body
- **Type Safety**: `AbstractRequest<unknown, unknown, MealPairingBody>` defines the body type
- **JSON Validation**: The body structure is automatically validated

2. **Test the POST endpoint:**
```bash
# POST request with JSON body
curl -X POST "http://localhost:8080/api/meal-pairing" \
  -H "Content-Type: application/json" \
  -d '{"ingredient": "pepperoni"}'
```

Expected response:
```json
{
  "meal": "Pepperoni Pizza",
  "cocktail": "Aperol Spritz"
}
```

---

## 🎉 Congratulations!

You've successfully built a complete REST API using the Alliage framework! Your API now includes:

- ✅ **Modular Architecture** - Clean separation of controllers, services, and business logic
- ✅ **External API Integration** - Fetching data from TheMealDB and TheCocktailDB
- ✅ **Intelligent Business Logic** - Smart meal-to-cocktail pairing based on cuisine and category
- ✅ **Automatic Documentation** - OpenAPI specs generated from TypeScript types
- ✅ **Comprehensive Testing** - Both unit and integration tests
- ✅ **Input Validation** - Automatic validation with clear error messages
- ✅ **Type Safety** - Full TypeScript support throughout the application
- ✅ **Dependency Injection** - Clean, testable service architecture
- ✅ **Configuration Management** - Environment-based configuration
- ✅ **Error Handling** - Proper HTTP error responses

## Next Steps

- 🔧 **Add Authentication** - Secure your API with JWT or OAuth
- 📊 **Add Database Integration** - Store and retrieve data from a database
- 🧪 **Expand Testing** - Add more test scenarios and edge cases
- 📈 **Add Monitoring** - Implement logging and metrics
- 🚀 **Deploy to Production** - Deploy your API to your favorite cloud platform

---

<div align="center">

**Happy coding with Alliage! 🎉**

*You've mastered the fundamentals of building REST APIs with the Alliage framework*

</div>

--- 