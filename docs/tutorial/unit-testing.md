---
sidebar_position: 7
---

# Unit testing

**The challenge**: Most developers find testing difficult because their code is tightly coupled and hard to test in isolation.

**How Alliage helps**: When your code uses dependency injection properly, testing becomes natural because you can easily provide test doubles.

## Testing business logic in isolation

Let's create a unit test for our MessageFactory. Create `src/services/__tests__/message-factory.test.ts`:

```typescript title="src/services/__tests__/message-factory.test.ts"
import { describe, it, expect } from "vitest";
import MessageFactory from "../message-factory";

describe("MessageFactory", () => {
  const messages = {
    en: { helloMessage: "Hello, {name}!" },
    fr: { helloMessage: "Bonjour {name} !" },
    es: { helloMessage: "¡Hola {name}!" },
  };
  const messageFactory = new MessageFactory(messages);

  describe("#createHelloMessage", () => {
    it("creates messages in different languages", () => {
      expect(messageFactory.createHelloMessage("en", "John")).toBe("Hello, John!");
      expect(messageFactory.createHelloMessage("fr", "Jean")).toBe("Bonjour Jean !");
      expect(messageFactory.createHelloMessage("es", "Carlos")).toBe("¡Hola Carlos!");
    });

    it("gracefully handles unsupported languages", () => {
      expect(messageFactory.createHelloMessage("de", "Hans")).toBe("Hello, Hans!");
    });
  });
});
```

**What this test demonstrates**:
- **Direct instantiation**: We can create the MessageFactory directly with test data
- **No framework dependencies**: The test doesn't need to bootstrap the entire application
- **Focused testing**: Each test validates one specific behavior
- **Fast execution**: No file system, network, or database dependencies

**Why this is effective**: Because MessageFactory takes its configuration as a constructor parameter, we can easily provide test data and verify behavior in isolation.

## Testing the process with dependencies

Now let's test the process. Create `src/processes/__tests__/main.test.ts`:

```typescript title="src/processes/__tests__/main.test.ts"
import { describe, it, expect, vi } from "vitest";
import MainProcess from "../main";
import MessageFactory from "../../services/message-factory";
import { Arguments } from "@alliage/framework";

describe("MainProcess", () => {
  const messageFactory = new MessageFactory({
    en: { helloMessage: "Hello, {name}!" },
    fr: { helloMessage: "Bonjour {name} !" },
  });
  const mainProcess = new MainProcess(messageFactory);

  describe("#execute", () => {
    it("outputs the correct message", async () => {
      const writeSpy = vi.spyOn(process.stdout, "write");
      
      const args = Arguments.create({
        language: "fr",
        name: "Marie",
      });
      
      const result = await mainProcess.execute(args);
      
      expect(writeSpy).toHaveBeenCalledWith("Bonjour Marie !");
      expect(result).toBe(true);
    });
  });
});
```

**What this test approach accomplishes**:
- **Integration testing**: Verifies that the process correctly uses the MessageFactory
- **Mocked I/O**: Uses a spy to capture output without actually writing to stdout
- **Controlled input**: Creates Arguments objects with specific test data
- **Clear assertions**: Verifies both the output content and the return value

**The dependency injection advantage**: Because the process receives its dependencies through the constructor, we can easily provide a real MessageFactory with test configuration instead of complex mocking.

## Running the tests

Execute your unit tests to verify everything works:

```bash
yarn test:unit
```

**Expected output**: All tests should pass, showing that your business logic and process coordination work correctly.

## Benefits of this testing approach

**Fast feedback**: Unit tests run in milliseconds, giving you immediate feedback during development

**Reliable**: Tests don't depend on external systems, so they won't fail due to network issues or database problems

**Focused**: Each test validates one specific piece of behavior, making it easy to identify what broke when tests fail

**Documentation**: Well-written tests serve as executable documentation of how your code should behave

## Testing best practices

### Write tests first (or at least early)
```typescript
// Write the test before implementing the feature
it("should format currency with proper locale", () => {
  expect(formatCurrency(1234.56, "en-US")).toBe("$1,234.56");
});
```

### Test behavior, not implementation
```typescript
// Good: Tests the expected outcome
it("should greet users in their preferred language", () => {
  const result = messageFactory.createHelloMessage("fr", "Alice");
  expect(result).toBe("Bonjour Alice !");
});

// Avoid: Tests internal implementation details
it("should call the correct message template function", () => {
  // This test is too coupled to implementation
});
```

### Use descriptive test names
```typescript
// Good: Clearly describes the scenario and expectation
it("should default to English when unsupported language is requested", () => {
  // Test implementation
});

// Avoid: Vague or implementation-focused names
it("should work correctly", () => {
  // What does "work correctly" mean?
});
```

## Next steps

Unit tests verify individual components, but they can't catch issues that occur when all parts of your application work together. The next step will show you how to write integration tests.

**[Continue to integration testing →](/docs/tutorial/integration-testing)** 