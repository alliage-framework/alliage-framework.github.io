---
sidebar_position: 6
title: 'Implementing business logic'
---

# Implement smart pairing

Create a service that orchestrates meal and cocktail services to implement intelligent pairing logic based on cuisine and meal characteristics.

## Create the meal pairing service

Create a new service that combines our existing services with business logic:

```typescript title="src/services/meal-pairing.service.ts"
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

  // Business logic: determine the best cocktail ingredient based on meal characteristics
  private getIngredientFromMeal(meal: Meal): string {
    const category = meal.category?.toLowerCase();
    const area = meal.area?.toLowerCase();

    // Area-based ingredient mappings (cuisine-specific pairings)
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

    // Category-based ingredient mappings (meal type pairings)
    const categoryIngredientMap: Record<string, string> = {
      seafood: "Gin",
      dessert: "Brandy",
      beef: "Whisky",
    };

    // Check area first (cuisine has priority), then category, then default
    if (area && areaIngredientMap[area]) {
      return areaIngredientMap[area];
    }

    if (category && categoryIngredientMap[category]) {
      return categoryIngredientMap[category];
    }

    // Default fallback for unmatched meals
    return "Vodka";
  }

  async getMealPairing(ingredient: string): Promise<MealPairing | null> {
    // First, get a meal based on the ingredient
    const meal = await this.mealService.getRandomMealWithIngredient(ingredient);
    if (meal == null) {
      return null;
    }

    // Use business logic to determine the appropriate cocktail ingredient
    const cocktailIngredient = this.getIngredientFromMeal(meal);
    
    // Fetch a cocktail based on the intelligent pairing
    const cocktail = await this.cocktailService.getRandomCocktailWithIngredient(
      cocktailIngredient
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

## Understanding service composition

This service demonstrates several important architectural patterns:

### Service orchestration
```typescript
@Service("meal_pairing_service", [
  instanceOf(MealService),
  instanceOf(CocktailService),
])
```

The meal pairing service doesn't make external API calls directly. Instead, it **orchestrates** other services to achieve its business goals.

### Business logic encapsulation
```typescript
private getIngredientFromMeal(meal: Meal): string {
  // Complex pairing logic based on cuisine and meal type
}
```

The service encapsulates all the intelligence about how meals should be paired with cocktails:
- **Cuisine-based pairing**: Mexican food → Tequila cocktails
- **Category-based pairing**: Seafood → Gin cocktails  
- **Fallback logic**: Default to Vodka for unknown combinations

### Clean interfaces
The service provides a simple, clean interface (`getMealPairing`) while hiding the complexity of:
- Multiple API calls
- Business logic decisions
- Error handling coordination

## Intelligent pairing logic

Our pairing algorithm considers two factors:

### Cuisine area (priority 1)
Matches the geographical origin of the meal to traditional spirits:
- **Mexican** → Tequila (Margaritas, Palomas)
- **Italian** → Campari (Negronis, Spritzes)
- **Russian** → Vodka (Moscow Mules, Bloody Marys)
- **French** → Cognac (Sidecars, French 75s)
- **Asian cuisines** → Regional spirits when available

### Meal category (priority 2)
Matches meal characteristics to complementary spirits:
- **Seafood** → Gin (light, botanical flavors)
- **Beef** → Whisky (bold, robust flavors)
- **Desserts** → Brandy (sweet, warming)

### Fallback strategy
When no specific pairing rule applies, defaults to Vodka (the most versatile cocktail base).

## Update the controller

Simplify your controller to use the new orchestration service:

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
  ingredient: string;
}

// Now we only need to inject one service
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
    
    // Let the meal pairing service handle all the complexity
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

## Benefits of this architecture

### Clean controller
The controller is now focused purely on HTTP concerns:
- Extract parameters from requests
- Handle HTTP errors
- Return responses

### Testable business logic
The pairing logic is isolated and easily testable:
- Mock the underlying services
- Test different meal characteristics
- Verify pairing decisions

### Service composition
Services can depend on other services, creating a natural hierarchy:
```
Controller
    ↓
MealPairingService
    ↓                ↓
MealService    CocktailService
```

### Single responsibility
Each service has one clear responsibility:
- **MealService**: Fetch meal data
- **CocktailService**: Fetch cocktail data
- **MealPairingService**: Implement pairing logic
- **Controller**: Handle HTTP requests

## Test the intelligent pairing

Start your development server:

```bash
yarn alliage:run:dev web
```

Test different ingredients to see intelligent pairing in action:

```bash
# Italian cuisine should pair with Campari cocktails
curl "http://localhost:8080/api/meal-pairing?ingredient=tomato"

# Seafood should pair with Gin cocktails  
curl "http://localhost:8080/api/meal-pairing?ingredient=salmon"

# Mexican cuisine should pair with Tequila cocktails
curl "http://localhost:8080/api/meal-pairing?ingredient=chicken" 
# (if you get Mexican chicken dishes)
```

Example responses showing intelligent pairing:
```json
// Italian meal → Campari cocktail
{
  "meal": "Spaghetti Bolognese",
  "cocktail": "Negroni"
}

// Seafood → Gin cocktail
{
  "meal": "Grilled Salmon",
  "cocktail": "Gin and Tonic"
}
```

## Extending the pairing logic

You can easily extend the pairing rules by modifying the mapping objects:

```typescript
// Add more sophisticated rules
const advancedAreaMap: Record<string, string> = {
  // European cuisines
  italian: "Campari",
  french: "Cognac", 
  german: "Schnapps",
  
  // Asian cuisines
  japanese: "Sake",
  chinese: "Baijiu",
  thai: "Rum", // For tropical cocktails
  
  // Americas
  mexican: "Tequila",
  peruvian: "Pisco",
  brazilian: "Cachaça",
};

// Time-based pairing (if you had meal timing data)
const timeBasedMap: Record<string, string> = {
  breakfast: "Champagne", // Mimosas, Bellinis
  brunch: "Gin",         // Bloody Marys, Gin Fizz
  dinner: "Whisky",      // Old Fashioneds, Manhattans
};
```

## What we've accomplished

✅ **Created service orchestration** - Higher-level services compose lower-level ones  
✅ **Implemented business logic** - Intelligent meal-to-cocktail pairing algorithm  
✅ **Separated concerns cleanly** - Controller handles HTTP, service handles business logic  
✅ **Made the system extensible** - Easy to add new pairing rules  
✅ **Improved testability** - Business logic is isolated and mockable  
✅ **Demonstrated clean architecture** - Clear service hierarchy and dependencies  

## Next steps

Our API now provides intelligent meal-cocktail pairings! Next, let's add comprehensive testing to ensure our logic works correctly across different scenarios and external API conditions.

**[Add comprehensive testing →](/docs/tutorial-rest-api/integration-tests)** 