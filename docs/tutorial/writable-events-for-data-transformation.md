---
sidebar_position: 11
---

# Writable events for data transformation

**The challenge**: Sometimes observing events isn't enough. What if you want to transform data as it flows through your application? Add timestamps, filter content, or implement complex business rules?

**The solution**: Writable events that allow controlled modification of data as it passes through the system.

## Understanding writable events

Writable events let listeners modify the event payload before it returns to the original caller. This creates a pipeline where multiple services can transform data in sequence.

## Step 1: Updating imports for writable events

Let's update `src/services/message-factory.ts` to use writable events. First, change the import:

```typescript
// Change this import to include writable events
import { AbstractWritableEvent, EventManager } from "@alliage/lifecycle";
```

**What this import change provides**:
- **`AbstractWritableEvent`**: Base class for events that can be modified by listeners
- **Writable functionality**: Allows event payload to be changed during event processing

## Step 2: Adding message to the payload interface

Update the payload interface to include the message that can be modified:

```typescript
export interface CreateHelloMessageEventPayload {
  availableLanguages: string[];
  usedLanguage: string;
  parameters: {
    name: string;
  };
  message: string;
}
```

**What this addition provides**:
- **Mutable data**: The message is now part of the event payload and can be modified
- **Pipeline support**: Services can transform the message as it flows through the event system

## Step 3: Converting to AbstractWritableEvent

Update the event class to extend the writable event base class:

```typescript
export class CreateHelloMessageEvent
  extends AbstractWritableEvent<
    MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE,
    CreateHelloMessageEventPayload
  > {
    constructor(payload: CreateHelloMessageEventPayload) {
      super(MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE, payload);
    }

    // We'll update the existing methods and add new ones next
  }
```

**What this conversion does**:
- **Writable functionality**: The event can now be modified by listeners
- **Same interface**: Existing getter methods continue to work as before

## Step 4: Updating existing convenience methods

The existing getter methods can stay the same since they read from the payload:

```typescript
getUsedLanguage() {
  return this.getPayload().usedLanguage;
}

getAvailableLanguages() {
  return this.getPayload().availableLanguages;
}

getParameters() {
  return this.getPayload().parameters;
}
```

**What these methods continue to provide**:
- **Read access**: Services can still read event data as before
- **Type safety**: All existing functionality remains intact

## Step 5: Adding message manipulation methods

Add new methods for reading and writing the message using writable payload access:

```typescript
// New methods for message manipulation
getMessage() {
  return this.getWritablePayload().message;
}

setMessage(message: string) {
  this.getWritablePayload().message = message;
}
```

**What these new methods provide**:
- **`getMessage()`**: Reads the current message (potentially modified by previous listeners)
- **`setMessage()`**: Allows listeners to modify the message content
- **`getWritablePayload()`**: Provides write access to the event payload

## Step 6: Updating the service method to include the message

Update the `createHelloMessage` method to include the message in the event payload:

```typescript
async createHelloMessage(language: string, name: string) {
  const availableLanguages = Object.keys(this.messages);
  const usedLanguage = availableLanguages.includes(language) ? language : "en";
  const message = this.messages[usedLanguage].helloMessage.replace("{name}", name);

  const event = new CreateHelloMessageEvent({
    availableLanguages,
    usedLanguage,
    parameters: { name },
    message,
  });
  
  // We'll add event emission and return the modified message next
}
```

**What this update does**:
- **Message inclusion**: The generated message is now part of the event payload
- **Pipeline preparation**: The message is ready to be modified by event listeners

## Step 7: Emitting and returning the modified message

Complete the method by emitting the event and returning the potentially modified message:

```typescript
async createHelloMessage(language: string, name: string) {
  const availableLanguages = Object.keys(this.messages);
  const usedLanguage = availableLanguages.includes(language) ? language : "en";
  const message = this.messages[usedLanguage].helloMessage.replace("{name}", name);

  const event = new CreateHelloMessageEvent({
    availableLanguages,
    usedLanguage,
    parameters: { name },
    message,
  });
  await this.eventManager.emit(event.getType(), event);

  // Return the potentially modified message
  return event.getMessage();
}
```

**What this completion provides**:
- **Event emission**: Notifies all listeners, allowing them to modify the message
- **Modified result**: Returns the final message after all transformations

## Step 8: Creating a message transformer service

Now let's create a service that modifies messages as they're created. Create `src/services/message-decorator.ts`:

```typescript
import { AbstractEventsListener, EventHandlers } from "@alliage/events-listener-loader";
import { Service } from "@alliage/service-loader";
import { CreateHelloMessageEvent, MESSAGE_FACTORY_EVENTS } from "./message-factory.js";

@Service("message_decorator")
export default class MessageDecorator extends AbstractEventsListener {
  getEventHandlers(): EventHandlers {
    return {
      [MESSAGE_FACTORY_EVENTS.CREATE_HELLO_MESSAGE]: this.handleCreateHelloMessage,
    };
  }

  handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
    const message = event.getMessage();
    // Transform the message by adding a timestamp
    event.setMessage(`[${new Date().toISOString()}] ${message}`);
  };
}
```

**What this decorator accomplishes**:
- **Message transformation**: Adds a timestamp prefix to every generated message
- **Non-intrusive modification**: Changes behavior without touching the original MessageFactory
- **Pipeline participation**: Can be one of many services that modify the message

## Understanding the transformation pipeline

**How the pipeline works**:
1. MessageFactory creates the base message
2. MessageFactory emits a writable event containing the message
3. All registered listeners (like MessageDecorator) can modify the message
4. MessageFactory returns the final, potentially transformed message

**Benefits of this approach**:
- **Composable transformations**: Multiple decorators can be applied in sequence
- **Configurable behavior**: You can enable/disable decorators without code changes
- **Type safety**: All modifications go through typed methods
- **Testable components**: Each decorator can be tested independently

## Testing the transformation pipeline

```bash
yarn alliage:run:dev say-hello David --language=fr
```

**Expected output**: `[2025-06-07T17:40:43.000Z] Bonjour David !`

**What happened**: The MessageFactory created "Bonjour David !", then the MessageDecorator added the timestamp prefix, and the final transformed message was output.

## Possibilities for extension

You could now easily add:

```typescript
// Emoji decorator
@Service("emoji_decorator")
export default class EmojiDecorator extends AbstractEventsListener {
  handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
    const message = event.getMessage();
    event.setMessage(`🎉 ${message} 🎉`);
  };
}

// Length limiter
@Service("message_length_limiter")
export default class MessageLengthLimiter extends AbstractEventsListener {
  handleCreateHelloMessage = (event: CreateHelloMessageEvent) => {
    const message = event.getMessage();
    if (message.length > 50) {
      event.setMessage(message.substring(0, 47) + "...");
    }
  };
}
```

**The power of composition**: Each service has a single responsibility, but together they create sophisticated behavior through the event pipeline.

## Key benefits

### 1. **Flexible data transformation**
Multiple services can modify data as it flows through your application.

### 2. **Configurable processing pipelines**
Features can be enabled/disabled through configuration without code changes.

### 3. **Composable functionality** 
Transformations can be combined in different ways to create complex behaviors.

### 4. **Testable components**
Each transformation can be unit tested in isolation.

### 5. **Non-breaking extensibility**
New transformations can be added without modifying existing code.

## Next steps

You've learned how to create writable events that enable powerful data transformation pipelines. This completes the core tutorial on building applications with the Alliage Framework.
