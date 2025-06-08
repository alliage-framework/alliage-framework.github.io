---
sidebar_position: 10
---

# Custom events for extensibility

**The challenge**: Your application needs to be extensible, but you don't want to break existing code when adding new features. How do you create extension points that feel natural?

**The solution**: Create your own events that other services can listen to, making your services as extensible as the framework itself.

## Understanding custom event design

We'll modify the MessageFactory to emit events when it creates messages. This allows other services to react to message creation without the MessageFactory needing to know about them.

## Step 1: Adding event system imports

First, let's update `src/services/message-factory.ts` to add the necessary imports for custom events:

```typescript
import { instanceOf, parameter } from "@alliage/di";
import { AbstractEvent, EventManager } from "@alliage/lifecycle";
import { Service } from "@alliage/service-loader";
```

**What these new imports provide**:
- **`AbstractEvent`**: Base class for creating custom event types
- **`EventManager`**: Service for emitting events to the application event system

## Step 2: Defining the event type

Add an enum to define your custom event types:

```typescript
export enum MESSAGE_FACTORY_EVENTS {
  CREATE_HELLO_MESSAGE = "message_factory/create_hello_message",
}
```

**What this enum provides**:
- **Type safety**: Ensures event names are consistent across your application
- **Namespacing**: The `message_factory/` prefix prevents conflicts with other services
- **Discoverability**: Makes it easy to see what events this service emits

## Step 3: Creating the event payload interface

Define what data your event will carry:

```typescript
export interface CreateHelloMessageEventPayload {
  availableLanguages: string[];
  usedLanguage: string;
  parameters: {
    name: string;
  };
}
```

**What this interface provides**:
- **Structured data**: Defines exactly what information the event contains
- **Type safety**: Ensures listeners receive the expected data structure
- **Documentation**: Makes it clear what data is available to event handlers

## Step 4: Creating the event class

Add the event class that wraps the payload:

```typescript
export class CreateHelloMessageEvent
  extends AbstractEvent<
    MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE,
    CreateHelloMessageEventPayload
  > {
    constructor(payload: CreateHelloMessageEventPayload) {
      super(MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE, payload);
    }

    // We'll add convenience methods in the next step
  }
```

**What this event class provides**:
- **Type safety**: Generic parameters ensure the event type and payload match
- **Event wrapping**: Follows Alliage's event pattern for consistency
- **Base functionality**: Inherits standard event behavior from `AbstractEvent`

## Step 5: Adding convenience methods

Add helper methods to make the event easier to use:

```typescript
export class CreateHelloMessageEvent
  extends AbstractEvent<
    MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE,
    CreateHelloMessageEventPayload
  > {
    constructor(payload: CreateHelloMessageEventPayload) {
      super(MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE, payload);
    }

    getUsedLanguage() {
      return this.getPayload().usedLanguage;
    }

    getAvailableLanguages() {
      return this.getPayload().availableLanguages;
    }

    getParameters() {
      return this.getPayload().parameters;
    }
  }
```

**What these convenience methods provide**:
- **Clean API**: Event listeners can call `event.getUsedLanguage()` instead of `event.getPayload().usedLanguage`
- **Encapsulation**: Hides the internal payload structure
- **Type safety**: Each method returns properly typed data

## Step 6: Adding EventManager dependency

Update the service registration to include the EventManager:

```typescript
@Service("message_factory", [parameter("parameters.messages"), instanceOf(EventManager)])
export default class MessageFactory {
  constructor(private readonly messages: Messages, private readonly eventManager: EventManager) {}
  
  // We'll update the method next
}
```

**What this dependency addition does**:
- **Event emission capability**: The service can now emit events to the application
- **Dependency injection**: Alliage automatically provides the EventManager instance

## Step 7: Adding event emission to the method

Update the `createHelloMessage` method to emit events:

```typescript
async createHelloMessage(language: string, name: string) {
  const availableLanguages = Object.keys(this.messages);
  const usedLanguage = availableLanguages.includes(language) ? language : "en";
  const message = this.messages[usedLanguage].helloMessage.replace("{name}", name);
  
  const event = new CreateHelloMessageEvent({
    availableLanguages,
    usedLanguage,
    parameters: { name },
  });
  await this.eventManager.emit(event.getType(), event);

  return message;
}
```

**What this event emission provides**:
- **Custom event creation**: Creates an instance of your custom event with relevant data
- **Event broadcasting**: Notifies all registered listeners about the message creation
- **Async emission**: Allows event handlers to perform complex operations without blocking

## Step 8: Listening to custom events in SystemLogger

Now let's update the SystemLogger to listen to our custom event. Add these imports to `src/services/system-logger.ts`:

```typescript
// Add these imports to your existing imports
import {
  CreateHelloMessageEvent,
  MESSAGE_FACTORY_EVENTS,
} from "./message-factory.js";
```

## Step 9: Adding the custom event handler

Update the `getEventHandlers` method to include your custom event:

```typescript
getEventHandlers(): EventHandlers {
  return {
    [PROCESS_EVENTS.PRE_EXECUTE]: this.handlePreExecute,
    [PROCESS_EVENTS.POST_TERMINATE]: this.handlePostTerminate,
    [MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE]: this.handleCreateHelloMessage,
  };
}
```

## Step 10: Implementing the custom event handler

Add the handler method for the message creation event:

```typescript
handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
  const usedLanguage = event.getUsedLanguage();
  const parameters = event.getParameters();

  this.writeLog(
    `[Message Factory] Create "Hello Message": Available languages = ${event
      .getAvailableLanguages()
      .join(", ")}, Used language = ${usedLanguage}, Parameters = ${JSON.stringify(parameters)}`
  );
};
```

**What this event handling provides**:
- **Event subscription**: The logger now responds to message creation events
- **Typed access**: Event methods provide type-safe access to event data
- **Detailed logging**: Captures information about message creation decisions

## Step 11: Updating the process for async support

Since the MessageFactory now emits events asynchronously, update `src/processes/main.ts`:

```typescript
async execute(args: Arguments) {
  const message = await this.messageFactory.createHelloMessage(
    args.get("language"),
    args.get("name")
  );

  process.stdout.write(message);
  return true;
}
```

**Why async matters**: Event emission is asynchronous to allow event handlers to perform complex operations without blocking the main business logic.

## Understanding the extensibility you've created

**What you accomplished**: You created a framework within your application. Other developers can now:
- Add analytics tracking by listening to message creation events
- Implement custom validation or filtering
- Add caching layers that respond to message creation
- Create audit trails for business operations

All without modifying your core MessageFactory code.

## Testing the custom events

```bash
yarn alliage:run:dev say-hello Emma --language=fr
cat system.log
```

**You'll see expanded logging**:
```
[2025-06-07T17:19:19.000Z] [Process - say-hello] Executing with arguments: Name = Emma, Language = fr
[2025-06-07T17:19:19.001Z] [Message Factory] Create "Hello Message": Available languages = en, fr, Used language = fr, Parameters = {"name":"Emma"}
[2025-06-07T17:19:19.002Z] [Process - say-hello] Terminated with signal: 0
```

**What this demonstrates**: Your MessageFactory is now open for extension while remaining closed for modification. Other services can observe and react to its behavior without coupling.

## Key takeaways

Custom events transform your application from a rigid structure to a flexible, extensible platform:

- **Business logic stays focused**: Core services do one thing well
- **Features are additive**: New functionality through new listeners
- **Zero coupling**: Services don't depend on each other directly
- **Easy testing**: Each component can be tested in isolation
