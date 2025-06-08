---
sidebar_position: 3
---

# Making meaningful command names

**The challenge**: Generic names like "main" don't tell you what a command actually does. Clear naming makes code self-documenting.

**The solution**: Alliage makes it easy to give commands descriptive names.

## Renaming the command

Let's give our command a more descriptive name. We only need to change the return value of the `getName()` method:

```typescript title="src/processes/main.ts"
export default class MainProcess extends AbstractProcess {
   getName() {
-    return "main";
+    return "say-hello";
   }
```

**What this change does**: The command name is now `say-hello` instead of `main`. This makes it immediately clear what the command does when someone looks at available commands or reads documentation.

## Testing the renamed command

Test the renamed command:

```bash
# Old name would no longer work
# yarn alliage:run:dev main

# New descriptive name
yarn alliage:run:dev say-hello
```

**Expected output**: `Hello, Alliage!`

## Developer experience improvement

Command names now clearly indicate their purpose, making the CLI self-documenting. When users run your application with `--help` or list available commands, they'll immediately understand what each command does.

### Benefits of descriptive naming

**For users**: They can guess what commands do without reading documentation
**For developers**: Code becomes self-documenting and easier to navigate
**For teams**: Clear intentions reduce misunderstandings and onboarding time

## Best practices for command naming

When naming commands in Alliage applications:

- **Use verb-noun patterns**: `create-user`, `send-email`, `backup-database`
- **Be specific**: `deploy-staging` instead of `deploy`
- **Use kebab-case**: Words separated by hyphens for readability
- **Avoid abbreviations**: `generate-report` instead of `gen-rpt`

## Next steps

Now that our command has a clear name, we'll make it interactive by adding user input. The next step will show you how to handle command line arguments and options.

**[Continue to adding user interaction →](/docs/tutorial/adding-user-interaction)** 