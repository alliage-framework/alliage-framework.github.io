---
sidebar_position: 9
title: 'URL parameters'
---

# RESTful URL parameters

Transform your API from query parameters to URL path parameters for more RESTful design and better user experience.

## From query parameters to URL parameters

Let's evolve our API from:
```bash
# Query parameter approach
GET /api/meal-pairing?ingredient=pepperoni
```

To:
```bash
# RESTful URL parameter approach  
GET /api/meal-pairing/pepperoni
```

This change makes the API more intuitive and follows REST conventions where resources are identified by their path.

## Update the controller

Modify your controller to use URL parameters instead of query parameters:

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

// Define URL parameters interface
interface MealPairingParams {
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

@Service("meal_pairing_controller", [instanceOf(MealPairingService)])
export default class MealPairingController extends AbstractController {
  constructor(private readonly mealPairingService: MealPairingService) {
    super();
  }

  // Updated route with URL parameter
  @Get("/api/meal-pairing/:ingredient")
  async getMealPairing(
    // Changed from query parameters to URL parameters
    request: AbstractRequest<MealPairingParams, unknown>
  ): Promise<MealPairing> {
    // Extract from URL parameters instead of query parameters
    const { ingredient } = request.getParams();
    
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

## Understanding URL parameter changes

### Route definition
```typescript
@Get("/api/meal-pairing/:ingredient")
```
- **`:ingredient`** defines a URL parameter placeholder
- The parameter name must match the interface property name
- Supports validation through TypeScript types

### Type definition changes
```typescript
// Before: Query parameter interface
interface MealPairingQuery {
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

// After: URL parameter interface
interface MealPairingParams {
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

// Request type change
AbstractRequest<MealPairingParams, unknown>
//                    ↑ First generic = URL params
//                              ↑ Second generic = Query params
```

### Parameter extraction
```typescript
// Before: Query parameters
const { ingredient } = request.getQuery();

// After: URL parameters  
const { ingredient } = request.getParams();
```

## Test the RESTful endpoints

Start your development server:

```bash
yarn alliage:run:dev web
```

Test the new URL structure:

```bash
# Valid requests with URL parameters
curl "http://localhost:8080/api/meal-pairing/pepperoni"
curl "http://localhost:8080/api/meal-pairing/lettuce"
curl "http://localhost:8080/api/meal-pairing/rice"

# Invalid ingredient - should return 400 validation error
curl "http://localhost:8080/api/meal-pairing/invalidingredient"
```

## URL parameters vs query parameters

### When to use URL parameters
- **Resource identification**: When the parameter identifies a specific resource
- **Required parameters**: Parameters that are essential to the endpoint
- **SEO-friendly URLs**: Better for caching and bookmarking
- **REST conventions**: Following standard REST patterns

Examples:
```bash
GET /api/users/123           # User ID is part of the resource identity
GET /api/meal-pairing/rice   # Ingredient identifies the specific pairing
GET /api/categories/italian  # Category is the resource being accessed
```

### When to use query parameters
- **Optional filters**: Parameters that modify the response but aren't essential
- **Pagination**: Page numbers, limits, offsets
- **Search criteria**: Multiple optional search parameters
- **Configuration options**: Sort order, format options

Examples:
```bash
GET /api/users?page=2&limit=10&sort=name    # Pagination and sorting
GET /api/meals?category=italian&area=rome   # Optional filters
GET /api/search?q=pizza&maxResults=20       # Search with options
```

## Update integration tests

Update your integration tests to use the new URL structure:

```typescript title="integration-tests/main-scenario/index.test.ts"
// ... existing imports and setup ...

describe("Main scenario", () => {
  // ... existing beforeAll, afterAll setup ...

  describe("Webserver", () => {
    describe("GET /api/meal-pairing/:ingredient", () => {
      it("should return intelligent meal pairing for Italian cuisine", async () => {
        // ... existing mock setup ...

        // Updated URL structure - ingredient in path instead of query
        const res = await webserverSandbox
          .getClient()
          .get("/api/meal-pairing/pepperoni", {
            validateStatus: () => true,
          });

        expect(res.status).toBe(200);
        expect(res.data).toEqual({
          meal: "Pizza with Pepperoni",
          cocktail: "Aperol Spritz",
        });
      });

      it("should return validation error for invalid ingredient", async () => {
        const res = await webserverSandbox
          .getClient()
          .get("/api/meal-pairing/invalidingredient", {
            validateStatus: () => true,
          });

        expect(res.status).toBe(400);
        expect(res.data).toEqual([
          {
            source: "params",  // Changed from "query" to "params"
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

      it("should test different cuisine pairings", async () => {
        // ... existing mock setup for avocado/Mexican cuisine ...

        const res = await webserverSandbox
          .getClient()
          .get("/api/meal-pairing/rice", {  // Using rice ingredient
            validateStatus: () => true,
          });

        expect(res.status).toBe(200);
        // Response will vary based on mock setup
      });
    });
  });
});
```

## Multiple URL parameters

You can define multiple URL parameters for more complex resource hierarchies:

```typescript
// Example: Nested resource structure
@Get("/api/restaurants/:restaurantId/meals/:ingredient")
async getMealFromRestaurant(
  request: AbstractRequest<{
    restaurantId: string;
    ingredient: 'pepperoni' | 'lettuce' | 'rice';
  }, unknown>
): Promise<MealPairing> {
  const { restaurantId, ingredient } = request.getParams();
  // ... implementation
}
```

## Combining URL parameters with query parameters

You can use both URL parameters and query parameters together:

```typescript
interface MealPairingParams {
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

interface MealPairingQuery {
  limit?: number;
  format?: 'json' | 'xml';
}

@Get("/api/meal-pairing/:ingredient")
async getMealPairing(
  request: AbstractRequest<MealPairingParams, MealPairingQuery>
): Promise<MealPairing> {
  const { ingredient } = request.getParams();     // From URL
  const { limit, format } = request.getQuery();   // From query string
  
  // ... implementation
}
```

Usage:
```bash
GET /api/meal-pairing/pepperoni?limit=5&format=json
```

## OpenAPI documentation impact

The OpenAPI documentation automatically updates to reflect URL parameters:

Visit http://localhost:8080/api/specs to see:
- **Path parameters** section showing the ingredient parameter
- **Updated URL structure** in the endpoint documentation
- **Validation rules** applied to URL parameters
- **Example requests** using the new URL format

## Benefits of RESTful URL design

### Better user experience
- **Intuitive URLs**: Clear, readable URLs that make sense to users
- **Bookmarkable**: Users can bookmark specific resources easily
- **SEO-friendly**: Search engines better understand resource structure

### REST compliance  
- **Resource-oriented**: URLs represent resources, not actions
- **Hierarchical**: Clear resource hierarchy and relationships
- **Standard conventions**: Follows widely-accepted REST patterns

### Developer experience
- **Predictable patterns**: Consistent URL structures across endpoints
- **Clear semantics**: URL structure indicates resource relationships
- **Framework integration**: Better integration with REST clients and tools

## What we've accomplished

✅ **Converted to RESTful URL parameters** from query parameters  
✅ **Maintained full validation** with TypeScript types  
✅ **Updated integration tests** to use new URL structure  
✅ **Preserved error handling** with clear validation messages  
✅ **Improved API design** following REST conventions  
✅ **Enhanced documentation** with automatic OpenAPI updates  

## Next steps

Our API now uses RESTful URL parameters! For the final step, let's explore using POST requests with JSON request bodies, which is essential for more complex APIs that need to handle structured data.

**[POST with request body →](/docs/tutorial-rest-api/post-requests)** 