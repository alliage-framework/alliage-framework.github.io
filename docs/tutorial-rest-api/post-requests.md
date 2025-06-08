---
sidebar_position: 10
title: 'POST requests'
---

# POST with request body

Complete your REST API knowledge by implementing POST requests with JSON request bodies, essential for handling complex data submissions.

## From GET to POST

Let's evolve our API to use POST requests with JSON bodies, which is more appropriate for:
- **Complex data submission** - Multiple fields and nested objects
- **Secure data handling** - Request bodies aren't logged in URLs
- **Standard practices** - POST for operations that change state or submit data

Transform from:
```bash
# URL parameter approach
GET /api/meal-pairing/pepperoni
```

To:
```bash
# POST with JSON body approach
POST /api/meal-pairing
Content-Type: application/json

{
  "ingredient": "pepperoni"
}
```

## Update the controller

Modify your controller to use POST with request body:

```typescript title="src/controllers/meal-pairing.controller.ts"
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Post } from "@alliage/webserver";
import { createHttpError } from "@alliage/rest-api";
import MealPairingService from "../services/meal-pairing.service.js";

export interface MealPairing {
  meal: string;
  cocktail: string;
}

// Define request body interface
export interface MealPairingBody {
  // Validation works the same way with request bodies
  ingredient: 'pepperoni' | 'lettuce' | 'rice';
}

@Service("meal_pairing_controller", [instanceOf(MealPairingService)])
export default class MealPairingController extends AbstractController {
  constructor(private readonly mealPairingService: MealPairingService) {
    super();
  }

  // Changed from @Get to @Post, removed URL parameter
  @Post("/api/meal-pairing")
  async getMealPairing(
    // Changed to use request body instead of URL parameters
    request: AbstractRequest<unknown, unknown, MealPairingBody>
  ): Promise<MealPairing> {
    // Extract from request body instead of URL parameters
    const { ingredient } = request.getBody();
    
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

## Understanding request body changes

### HTTP method change
```typescript
// Before: GET request
@Get("/api/meal-pairing/:ingredient")

// After: POST request
@Post("/api/meal-pairing")
```

### Type parameter changes
```typescript
// Request type generics: <URLParams, QueryParams, RequestBody>

// Before: URL parameters
AbstractRequest<MealPairingParams, unknown, unknown>

// After: Request body
AbstractRequest<unknown, unknown, MealPairingBody>
```

### Data extraction
```typescript
// Before: URL parameters
const { ingredient } = request.getParams();

// After: Request body
const { ingredient } = request.getBody();
```

## Test POST requests

Start your development server:

```bash
yarn alliage:run:dev web
```

Test with POST requests and JSON body:

```bash
# Valid requests with JSON bodies
curl -X POST "http://localhost:8080/api/meal-pairing" \
  -H "Content-Type: application/json" \
  -d '{"ingredient": "pepperoni"}'
```

## What we've accomplished

✅ **Implemented POST requests** with JSON request bodies  
✅ **Maintained full validation** for complex nested data structures  
✅ **Updated integration tests** for POST request patterns  
✅ **Demonstrated advanced validation** with nested objects and arrays  
✅ **Completed all major HTTP patterns** for REST API development  
✅ **Built a fully functional API** with intelligent meal-cocktail pairing  

## Next steps

You've mastered all the core REST API development patterns! Now let's learn how to prepare your API for production deployment and customize the documentation.

**[Production and customization →](/docs/tutorial-rest-api/production-and-customization)**

---

**You've mastered building REST APIs with Alliage! 🎉**

*Your journey into clean, maintainable, and production-ready API development starts here.* 