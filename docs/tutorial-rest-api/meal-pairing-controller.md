---
sidebar_position: 3
title: 'Creating a controller'
---

# Create your first controller

Replace the default controller with our meal pairing functionality and understand Alliage's controller architecture.

## Remove the default controller

Start by removing the generated example files:

```bash
rm src/controllers/__tests__/main.test.ts
rm src/controllers/main.ts
```

## Create the meal pairing controller

Create a new controller that will handle meal pairing requests:

```typescript title="src/controllers/meal-pairing.controller.ts"
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";

// Define the structure of our API response
export interface MealPairing {
  meal: string;
  cocktail: string;
}

// Define the query parameters our endpoint expects
export interface MealPairingQuery {
  ingredient: string;
}

@Service("meal_pairing_controller")
export default class MealPairingController extends AbstractController {
  @Get("/api/meal-pairing")
  async getMealPairing(
    // We expect a query parameter called 'ingredient'
    request: AbstractRequest<unknown, MealPairingQuery>
    // We return a MealPairing object
  ): Promise<MealPairing> {
    // For now, we'll return static data
    // Real meal data integration comes in the next section
    return {
      meal: "Pizza",
      cocktail: "Mojito",
    };
  }
}
```

## Understanding the controller structure

Let's break down the key components:

### Service registration

```typescript
@Service("meal_pairing_controller")
```

This decorator registers the controller in Alliage's dependency injection container. The string identifier `"meal_pairing_controller"` is unique and will be used if you need to inject this controller elsewhere.

### Route mapping

```typescript
@Get("/api/meal-pairing")
```

Maps HTTP GET requests to `/api/meal-pairing` to this method. Alliage supports all HTTP verbs:
- `@Get()` - GET requests
- `@Post()` - POST requests  
- `@Put()` - PUT requests
- `@Delete()` - DELETE requests
- `@Patch()` - PATCH requests

### Type-safe request handling

```typescript
request: AbstractRequest<unknown, MealPairingQuery>
```

The `AbstractRequest` type provides type safety with three generic parameters:
- **First**: Route parameters (e.g., `/users/:id` → `{ id: string }`)
- **Second**: Query parameters (e.g., `?ingredient=chicken` → `{ ingredient: string }`)
- **Third**: Request body (for POST/PUT requests)

We use `unknown` for route parameters since we don't have any (yet), and `MealPairingQuery` for query parameters.

### Response types

```typescript
): Promise<MealPairing>
```

The return type helps TypeScript understand your API structure and automatically generates OpenAPI documentation. You can return:
- **Scalars**: `string`, `number`, `boolean`
- **Objects**: Automatically serialized to JSON
- **Arrays**: Automatically serialized to JSON
- **Promises**: For async operations

## Test your controller

Start the development server:

```bash
yarn alliage:run:dev web
```

Test your new endpoint:

```bash
# Visit in browser or use curl
curl "http://localhost:8080/api/meal-pairing?ingredient=pepperoni"
```

Expected response:
```json
{
  "meal": "Pizza",
  "cocktail": "Mojito"
}
```

## Check the OpenAPI documentation

Visit http://localhost:8080/api/specs to see the automatically generated API documentation. Notice how:

- The `/api/meal-pairing` endpoint is documented
- The `ingredient` query parameter is specified as required
- The response schema matches your `MealPairing` interface
- The documentation updates automatically as you modify your TypeScript types

## Understanding query parameters

The current implementation extracts the ingredient from query parameters:

```typescript
const { ingredient } = request.getQuery();
```

Try different ingredients in your requests:
```bash
curl "http://localhost:8080/api/meal-pairing?ingredient=chicken"
curl "http://localhost:8080/api/meal-pairing?ingredient=beef"
curl "http://localhost:8080/api/meal-pairing?ingredient=vegetables"
```

All requests currently return the same static response. In the next section, we'll integrate with real external APIs to fetch dynamic meal data.

## What we've accomplished

✅ **Created a dedicated controller** for meal pairing functionality  
✅ **Defined TypeScript interfaces** for request/response types  
✅ **Mapped HTTP endpoints** to controller methods  
✅ **Implemented type-safe request handling** with query parameters  
✅ **Generated automatic API documentation** from TypeScript types  

## Next steps

Our controller currently returns static data. Let's integrate with TheMealDB API to fetch real meal information based on the ingredient parameter.

**[Integrate external APIs →](/docs/tutorial-rest-api/meal-service)** 