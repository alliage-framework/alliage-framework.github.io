---
sidebar_position: 5
title: 'Adding a second service'
---

# Add cocktail integration

Create a cocktail service to fetch real cocktail data and integrate both meal and cocktail services in your controller.

## Update configuration

Add the cocktail API URL to your configuration:

```yaml title="config/parameters.yaml"
apis:
  meals:
    url: https://www.themealdb.com/api/json/v1/1/filter.php
  cocktails:
    url: https://www.thecocktaildb.com/api/json/v1/1/filter.php
```

## Create the cocktail service

Following the same pattern as the meal service, create a cocktail service:

```typescript title="src/services/cocktail.service.ts"
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

// Define what a cocktail looks like in our application
export interface Cocktail {
  name: string;
}

// Define the structure of TheCocktailDB API response
interface CocktailApiResponse {
  drinks: {
    strDrink: string;
  }[] | null;
}

@Service("cocktail_service", [parameter("parameters.apis.cocktails.url")])
export default class CocktailService {
  constructor(private readonly cocktailApiUrl: string) {}

  async getRandomCocktailWithIngredient(ingredient: string): Promise<Cocktail | null> {
    const url = `${this.cocktailApiUrl}?i=${ingredient}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json() as CocktailApiResponse;
      
      // TheCocktailDB returns { drinks: null } when no cocktails are found
      if (data.drinks === null) {
        return null;
      }
      
      // Pick a random cocktail from the results
      const cocktail = data.drinks[Math.floor(Math.random() * data.drinks.length)];
      
      // Transform the API response to our internal format
      return {
        name: cocktail.strDrink,
      };
    } catch (error) {
      console.error('Error fetching cocktail data:', error);
      return null;
    }
  }
}
```

## Understanding the service pattern

Notice how the cocktail service follows the same pattern as the meal service:

### Consistent structure
- **Service registration** with dependency injection
- **Configuration injection** for external API URLs
- **Type definitions** for both internal and external API formats
- **Error handling** that returns `null` for failures
- **Random selection** from API results

### API differences
Different APIs have different response structures:
- **TheMealDB**: `{ meals: [...] }` with `strMeal`, `strCategory`, `strArea`
- **TheCocktailDB**: `{ drinks: [...] }` with `strDrink`

Our services abstract these differences and provide consistent interfaces to the rest of the application.

## Update the controller

Now inject both services into your controller:

```typescript title="src/controllers/meal-pairing.controller.ts"
import { instanceOf } from "@alliage/di";
import { Service } from "@alliage/service-loader";
import { AbstractController, AbstractRequest, Get } from "@alliage/webserver";
import { createHttpError } from "@alliage/rest-api";
import MealService from "../services/meal.service.js";
import CocktailService from "../services/cocktail.service.js";

export interface MealPairing {
  meal: string;
  cocktail: string;
}

export interface MealPairingQuery {
  ingredient: string;
}

// Inject both meal and cocktail services
@Service("meal_pairing_controller", [
  instanceOf(MealService), 
  instanceOf(CocktailService)
])
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
    
    // Fetch both meal and cocktail data
    const meal = await this.mealService.getRandomMealWithIngredient(ingredient);
    // For now, we'll use a hardcoded ingredient for cocktails
    // Smart pairing logic comes in the next section
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

## Understanding multiple service injection

### Dependency array
```typescript
@Service("meal_pairing_controller", [
  instanceOf(MealService), 
  instanceOf(CocktailService)
])
```

You can inject multiple services by adding them to the dependency array. The order matters - they'll be injected in the same order to the constructor.

### Constructor parameters
```typescript
constructor(
  private readonly mealService: MealService,
  private readonly cocktailService: CocktailService
) {
  super();
}
```

The constructor receives injected services in the same order as specified in the dependency array.

### Parallel API calls
Currently, we're making API calls sequentially, but we could optimize this with parallel calls:

```typescript
// Sequential (current approach)
const meal = await this.mealService.getRandomMealWithIngredient(ingredient);
const cocktail = await this.cocktailService.getRandomCocktailWithIngredient("Rum");

// Parallel (faster)
const [meal, cocktail] = await Promise.all([
  this.mealService.getRandomMealWithIngredient(ingredient),
  this.cocktailService.getRandomCocktailWithIngredient("Rum")
]);
```

## Test the integration

Start your development server:

```bash
yarn alliage:run:dev web
```

Test with different ingredients:

```bash
# Should return real meal and cocktail data
curl "http://localhost:8080/api/meal-pairing?ingredient=chicken"
```

Example response:
```json
{
  "meal": "Chicken Parmesan",
  "cocktail": "Rum Punch"
}
```

## Current limitations

Our API now fetches real data from both external APIs, but there are some limitations:

1. **Hardcoded cocktail ingredient**: We always search for "Rum" cocktails, regardless of the meal
2. **No intelligent pairing**: There's no logic connecting meal characteristics to appropriate cocktails
3. **Error handling**: We return the same error for both meal and cocktail failures

These limitations will be addressed in the next section when we implement intelligent pairing logic.

## Service layer benefits

By creating dedicated services, we've achieved:

### Separation of concerns
- **Controllers** handle HTTP requests/responses
- **Services** handle business logic and external API integration
- **Configuration** manages environment-specific values

### Testability
Each service can be tested independently:
- Mock the external APIs
- Test error scenarios
- Verify data transformation

### Reusability
Services can be used across multiple controllers or other services.

### Maintainability
Changes to external API integration are isolated to specific services.

## What we've accomplished

✅ **Created a cocktail service** following the same pattern as the meal service  
✅ **Integrated multiple external APIs** in a single controller  
✅ **Implemented consistent error handling** across services  
✅ **Demonstrated service composition** with dependency injection  
✅ **Maintained separation of concerns** between HTTP handling and business logic  

## Next steps

We now have both meal and cocktail data, but the pairing is random. Let's create a dedicated service that implements intelligent meal-to-cocktail pairing logic based on cuisine type and meal characteristics.

**[Implement smart pairing →](/docs/tutorial-rest-api/meal-pairing-service)** 