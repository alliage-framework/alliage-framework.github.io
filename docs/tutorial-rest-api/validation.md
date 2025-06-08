---
sidebar_position: 8
title: 'Input validation'
---

# Implement validation

Add input validation to ensure your API only accepts valid data with clear, structured error messages.

## Understanding Alliage validation

Alliage REST API provides **automatic validation** based on your TypeScript types. This means:

- **Type-safe by design** - Validation rules come from your interfaces
- **Automatic error responses** - Invalid requests return structured error messages
- **OpenAPI integration** - Validation rules appear in your API documentation
- **Zero additional code** - No separate validation libraries needed

## Add validation to query parameters

Update your controller to restrict ingredient values:

```typescript title="src/controllers/meal-pairing.controller.ts"
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";
import { createHttpError } from "@alliage/rest-api";
import MealPairingService from "../services/meal-pairing.service.js";

export interface MealPairing {
  meal: string;
  cocktail: string;
}

export interface MealPairingQuery {
  // Restrict ingredient to specific values
  // This creates automatic validation with clear error messages
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

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

## How TypeScript types create validation

The TypeScript union type `'pepperoni' | 'lettuce' | 'rice'` automatically creates validation:

### Valid requests
```bash
curl "http://localhost:8080/api/meal-pairing?ingredient=pepperoni"  # ✅ Valid
curl "http://localhost:8080/api/meal-pairing?ingredient=lettuce"    # ✅ Valid  
curl "http://localhost:8080/api/meal-pairing?ingredient=rice"       # ✅ Valid
```

### Invalid requests
```bash
curl "http://localhost:8080/api/meal-pairing?ingredient=invalidvalue"  # ❌ Invalid
```

Invalid requests return structured error responses:
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

## Understanding validation error structure

### Error response format
```json
[
  {
    "source": "query",           // Where the error occurred (query, body, params)
    "errors": [                  // Array of validation errors
      {
        "instancePath": "/ingredient",              // Path to the invalid field
        "schemaPath": "#/properties/ingredient/enum", // JSON Schema path
        "keyword": "enum",                          // Validation rule that failed
        "params": {                                 // Additional validation info
          "allowedValues": ["pepperoni", "lettuce", "rice"]
        },
        "message": "must be equal to one of the allowed values"
      }
    ]
  }
]
```

### Error response fields
- **`source`**: Indicates where validation failed (`query`, `body`, `params`)
- **`instancePath`**: JSON path to the field that failed validation
- **`schemaPath`**: JSON Schema path for debugging
- **`keyword`**: Type of validation rule (enum, required, pattern, etc.)
- **`params`**: Additional context about the validation rule
- **`message`**: Human-readable error description

## Update integration tests

Add validation testing to your integration test suite:

```typescript title="integration-tests/main-scenario/index.test.ts"
// ... existing imports and setup ...

describe("Main scenario", () => {
  // ... existing beforeAll, afterAll, and other tests ...

  describe("Webserver", () => {
    describe("GET /api/meal-pairing", () => {
      // ... existing tests ...

      it("should return validation error for invalid ingredient", async () => {
        const res = await webserverSandbox
          .getClient()
          .get("/api/meal-pairing?ingredient=invalidingredient", {
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

## Advanced validation patterns

### Pattern validation
```typescript
export interface MealPairingQuery {
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
  
  // Optional field with pattern validation
  /**
   * @pattern "^[a-zA-Z0-9]{3,20}$"
   */
  userId?: string;
}
```

### Number validation
```typescript
export interface MealPairingQuery {
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
  
  // Optional numeric constraints
  /**
   * @min 1
   * @max 10
   */
  limit?: number;
}
```

### Array validation
```typescript
export interface MealPairingQuery {
  // Multiple ingredients
  ingredients: ('pepperoni' | 'lettuce' | 'rice')[];
}
```

## OpenAPI documentation impact

Your validation rules automatically appear in the OpenAPI documentation:

Visit http://localhost:8080/api/specs to see:
- **Enum values** listed in the parameter description
- **Required fields** marked as required
- **Pattern constraints** documented
- **Type information** clearly specified

## Test validation

Start your development server:

```bash
yarn alliage:run:dev web
```

Test validation with different requests:

```bash
# Valid requests
curl "http://localhost:8080/api/meal-pairing?ingredient=pepperoni"
curl "http://localhost:8080/api/meal-pairing?ingredient=lettuce"
curl "http://localhost:8080/api/meal-pairing?ingredient=rice"

# Invalid requests - should return 400 errors
curl "http://localhost:8080/api/meal-pairing?ingredient=chicken"
curl "http://localhost:8080/api/meal-pairing?ingredient=beef"
curl "http://localhost:8080/api/meal-pairing"  # Missing ingredient
```

## Validation benefits

### Type safety
- **Compile-time checking** - TypeScript catches type mismatches during development
- **Runtime validation** - Alliage validates incoming requests against your types
- **IDE support** - Autocomplete and error highlighting in your editor

### Automatic documentation
- **OpenAPI generation** - Validation rules appear in API documentation
- **Self-documenting** - Types serve as both validation and documentation
- **Always up-to-date** - Documentation updates automatically with code changes

### Clear error messages
- **Structured responses** - Consistent error format across all endpoints
- **Specific error details** - Precise information about what went wrong
- **Client-friendly** - Easy for frontend applications to parse and display

### Zero maintenance
- **No separate validation layer** - Validation rules come from your types
- **No schema drift** - Validation always matches your actual interfaces
- **Automatic updates** - Change your types, validation updates automatically

## What we've accomplished

✅ **Added automatic validation** using TypeScript union types  
✅ **Implemented structured error responses** with detailed validation information  
✅ **Updated integration tests** to verify validation behavior  
✅ **Generated automatic documentation** with validation rules  
✅ **Ensured type safety** throughout the request/response cycle  
✅ **Created client-friendly error messages** for invalid requests  

## Next steps

Our API now validates input and provides clear error messages! Let's explore different ways to structure API endpoints by moving from query parameters to URL parameters for more RESTful design.

**[RESTful URL parameters →](/docs/tutorial-rest-api/url-parameters)** 