---
sidebar_position: 4
title: 'Integrating with an API'
---

# Integrate external APIs

Create a dedicated service to fetch real meal data from TheMealDB API and integrate it with dependency injection.

## Update configuration

First, add the external API URL to your application configuration:

```yaml title="config/parameters.yaml"
apis:
  meals:
    url: https://www.themealdb.com/api/json/v1/1/filter.php
```

This configuration approach keeps external URLs separate from your code, making it easy to use different endpoints for development, testing, and production.

## Create the meal service

Create a new service directory and add the meal service:

```bash
mkdir -p src/services
```

```typescript title="src/services/meal.service.ts"
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

// Define what a meal looks like in our application
export interface Meal {
  name: string;
  category?: string;
  area?: string;
}

// Define the structure of TheMealDB API response
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
    
    try {
      const response = await fetch(url);
      const data = await response.json() as MealApiResponse;
      
      // TheMealDB returns { meals: null } when no meals are found
      if (data.meals === null) {
        return null;
      }
      
      // Pick a random meal from the results
      const meal = data.meals[Math.floor(Math.random() * data.meals.length)];
      
      // Transform the API response to our internal format
      return {
        name: meal.strMeal,
        category: meal.strCategory,
        area: meal.strArea,
      };
    } catch (error) {
      console.error('Error fetching meal data:', error);
      return null;
    }
  }
}
```

## Understanding dependency injection

Let's break down the key concepts:

### Service registration with dependencies

```typescript
@Service("meal_service", [parameter("parameters.apis.meals.url")])
```

This registers the service with Alliage's DI container and injects the meal API URL from configuration:
- `"meal_service"` - Unique identifier for this service
- `[parameter("parameters.apis.meals.url")]` - Injects the value from `config/parameters.yaml`

### Constructor injection

```typescript
constructor(private readonly mealApiUrl: string) {}
```

The constructor receives the injected dependencies. TypeScript's `private readonly` syntax automatically creates and assigns the property.

### External API integration

The service encapsulates all external API interaction:
- **URL Construction**: Builds the query URL with the ingredient parameter
- **HTTP Request**: Uses the native `fetch()` API
- **Response Transformation**: Converts external API format to internal interfaces
- **Error Handling**: Returns `null` for both API errors and "no results" scenarios

## Update the controller

Now inject the meal service into your controller:

```typescript title="src/controllers/meal-pairing.controller.ts"
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";
import { createHttpError } from "@alliage/rest-api";
import MealService from "../services/meal.service.js";

export interface MealPairing {
  meal: string;
  cocktail: string;
}

export interface MealPairingQuery {
  ingredient: string;
}

// Inject the meal service into the controller
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
    
    // Use the meal service to fetch real data
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
      cocktail: "Mojito", // Still hardcoded for now
    };
  }
}
```

## Understanding service injection

### Instance injection

```typescript
@Service("meal_pairing_controller", [instanceOf(MealService)])
```

`instanceOf(MealService)` tells Alliage to inject an instance of the `MealService` class. Alliage automatically resolves the service's dependencies (the API URL) and creates the instance.

### HTTP error handling

```typescript
throw createHttpError(404, {
  message: `No meal found with provided ingredient`,
  ingredient,
});
```

`createHttpError()` creates structured HTTP error responses that:
- Return proper HTTP status codes (404 Not Found)
- Include detailed error information in the response body
- Automatically contribute to OpenAPI error documentation
- Maintain consistent error response format across your API

## Test with real data

Start your development server:

```bash
yarn alliage:run:dev web
```

Test with different ingredients:

```bash
# Should return real meal data
curl "http://localhost:8080/api/meal-pairing?ingredient=chicken"

# Try different ingredients
curl "http://localhost:8080/api/meal-pairing?ingredient=beef"
curl "http://localhost:8080/api/meal-pairing?ingredient=rice"

# This should return a 404 error
curl "http://localhost:8080/api/meal-pairing?ingredient=invalidingredient"
```

Example successful response:
```json
{
  "meal": "Chicken Handi",
  "cocktail": "Mojito"
}
```

Example error response:
```json
{
  "message": "No meal found with provided ingredient",
  "ingredient": "invalidingredient"
}
```

## Configuration benefits

By using configuration injection, you can easily:

**Override for testing:**
```yaml title="config/parameters.test.yaml"
apis:
  meals:
    url: http://localhost:3001/mock-meals
```

**Use environment variables:**
```yaml title="config/parameters.yaml"
apis:
  meals:
    url: $(MEALS_API_URL?https://www.themealdb.com/api/json/v1/1/filter.php)
```

## What we've accomplished

✅ **Created a dedicated service** for external API integration  
✅ **Implemented dependency injection** with configuration parameters  
✅ **Added proper error handling** with structured HTTP errors  
✅ **Separated concerns** - controller handles HTTP, service handles business logic  
✅ **Made the system configurable** for different environments  
✅ **Integrated real external data** from TheMealDB API  

## Next steps

We now have real meal data, but cocktails are still hardcoded. Let's create a cocktail service to fetch cocktail information from TheCocktailDB API.

**[Add cocktail integration →](/docs/tutorial-rest-api/cocktail-service)** 