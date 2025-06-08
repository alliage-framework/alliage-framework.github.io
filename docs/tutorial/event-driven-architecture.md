---
sidebar_position: 9
---

# Event-driven architecture

**The challenge**: Cross-cutting concerns like logging, monitoring, and analytics often end up scattered throughout business logic, making code harder to maintain and test.

**The solution**: Event-driven architecture that allows you to add features without modifying existing code.

## Understanding Alliage's event system

Alliage provides a built-in event system where services can listen to events without being directly coupled to the services that emit them. This allows for clean separation of concerns.

## Creating a system logger

Let's create a system logger that records when processes start and finish. Create `src/services/system-logger.ts`:

```typescript title="src/services/system-logger.ts"
import fs from "fs";
import path from "path";
import {
  AbstractEventsListener,
  EventHandlers,
} from "@alliage/events-listener-loader";
import {
  PROCESS_EVENTS,
  PostTerminateEvent,
  PreExecuteEvent,
} from "@alliage/process-manager";
import { parameter } from "@alliage/di";
import { Service } from "@alliage/service-loader";

@Service("system_logger", [parameter("parameters.systemLogger.filePath")])
export default class SystemLogger extends AbstractEventsListener {
  private logFileDescriptor: number;

  constructor(filePath: string) {
    super();
    this.logFileDescriptor = fs.openSync(
      path.resolve(filePath),
      fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT
    );
  }

  getEventHandlers(): EventHandlers {
    return {
      [PROCESS_EVENTS.PRE_EXECUTE]: this.handlePreExecute,
      [PROCESS_EVENTS.POST_TERMINATE]: this.handlePostTerminate,
    };
  }

  handlePreExecute = (event: PreExecuteEvent) => {
    const processName = event.getProcess().getName();
    this.writeLog(
      `[Process - ${processName}] Executing with arguments: Name = ${event
        .getArgs()
        .get("name")}, Language = ${event.getArgs().get("language")}`
    );
  };

  handlePostTerminate = (event: PostTerminateEvent) => {
    const processName = event.getProcess().getName();
    const signal = event.getSignal();
    this.writeLog(`[Process - ${processName}] Terminated with signal: ${signal}`);
    fs.closeSync(this.logFileDescriptor);
  };

  private writeLog(message: string) {
    fs.writeSync(
      this.logFileDescriptor,
      `[${new Date().toISOString()}] ${message}\n`
    );
  }
}
```

**What this implementation provides**:

### Event listener foundation
- **`AbstractEventsListener`**: Base class for services that respond to events
- **`@Service("system_logger")`**: Registers this as a service that can be discovered automatically

### Configuration injection
- **`parameter("parameters.systemLogger.filePath")`**: Injects the log file path from configuration
- **File handling**: Opens a file descriptor for efficient logging

### Event handling
- **`getEventHandlers()`**: Required method that tells Alliage which events to listen for
- **`PROCESS_EVENTS.PRE_EXECUTE`**: Built-in event fired before any process executes
- **`PROCESS_EVENTS.POST_TERMINATE`**: Built-in event fired after process completion

### Event handlers
- **`handlePreExecute`**: Logs when processes start with their arguments
- **`handlePostTerminate`**: Logs when processes finish with their exit status
- **`writeLog`**: Private utility that adds timestamps and writes to the file

## Adding logger configuration

Update `config/parameters.yaml` to include the log file location:

```yaml title="config/parameters.yaml"
messages:
  en:
    helloMessage: "Hello, {name}!"
  fr:
    helloMessage: "Bonjour {name} !"
  es:
    helloMessage: "¡Hola {name}!"
systemLogger:
  filePath: "./system.log"
```

**Configuration explanation**:
- **`systemLogger.filePath`**: Defines where log entries will be written
- **External configuration**: Log location can be changed without code modifications

## Understanding the zero-coupling approach

**What's remarkable about this implementation**: You added comprehensive logging to your application without:
- Modifying the existing MainProcess or MessageFactory
- Adding any dependencies to your business logic  
- Writing complex wiring or setup code
- Creating tight coupling between components

**The event system provides**: Clean separation where the logger responds to events but doesn't know about the specific processes or services that trigger them.

## Testing the event-driven logging

Run your application and check the log output:

```bash
yarn alliage:run:dev say-hello Alice --language=fr
cat system.log
```

**You'll see output like**:
```
[2025-06-07T16:51:58.000Z] [Process - say-hello] Executing with arguments: Name = Alice, Language = fr
[2025-06-07T16:51:58.001Z] [Process - say-hello] Terminated with signal: 0
```

**What this demonstrates**: The logger captured the process lifecycle without any explicit connection to your business logic. This is the power of event-driven architecture for cross-cutting concerns.

## Benefits of event-driven architecture

### Separation of concerns
- **Core logic remains focused**: Business logic doesn't need to know about logging
- **Cross-cutting concerns are isolated**: Logging, monitoring, and analytics live in dedicated services

### Extensibility without modification
- **Open/Closed principle**: Open for extension, closed for modification
- **Add new features**: Create new event listeners without touching existing code

### Testability
- **Independent testing**: Test business logic and cross-cutting concerns separately
- **Event simulation**: Trigger events directly in tests to verify listener behavior

## Event-driven patterns

### Audit logging
```typescript
@Service("audit_logger")
export default class AuditLogger extends AbstractEventsListener {
  getEventHandlers(): EventHandlers {
    return {
      [PROCESS_EVENTS.PRE_EXECUTE]: this.logProcessStart,
      [PROCESS_EVENTS.POST_TERMINATE]: this.logProcessEnd,
    };
  }
}
```

### Performance monitoring
```typescript
@Service("performance_monitor")
export default class PerformanceMonitor extends AbstractEventsListener {
  private startTimes = new Map<string, number>();

  getEventHandlers(): EventHandlers {
    return {
      [PROCESS_EVENTS.PRE_EXECUTE]: this.startTimer,
      [PROCESS_EVENTS.POST_TERMINATE]: this.endTimer,
    };
  }
}
```

## Next steps

You've seen how to listen to built-in framework events. The next step will show you how to create your own custom events for even more extensibility.

**[Continue to custom events for extensibility →](/docs/tutorial/custom-events-for-extensibility)** 