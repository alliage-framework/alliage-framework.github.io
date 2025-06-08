---
sidebar_position: 1
---

# Creating an Alliage module

This tutorial will guide you through the process of creating a module for the Alliage framework. We'll create a MongoDB module that will provide database connectivity to Alliage applications.

## What we'll build

In this tutorial, we will:
- Create a new Alliage module from scratch
- Add MongoDB connectivity features
- Set up configuration management
- Create a service to interact with MongoDB
- Write integration tests
- Prepare the module for distribution

## Prerequisites

Before starting this tutorial, make sure you have:
- Node.js installed (version 16 or higher)
- Basic understanding of TypeScript
- MongoDB installed locally or Docker to run MongoDB in a container
- Basic understanding of the Alliage framework concepts

## Project structure

By the end of this tutorial, our project will have the following structure:

```
mongodb-module/
├── src/
│   ├── index.ts           # Main module file
│   ├── config.ts          # Configuration schema
│   └── mongodb-service.ts # MongoDB service implementation
├── base-files/
│   └── config.yaml        # Default configuration
├── integration-tests/
│   └── main-scenario/     # Integration test files
├── package.json
└── tsconfig.json
```

Let's get started by setting up our development environment and creating the basic module structure. 