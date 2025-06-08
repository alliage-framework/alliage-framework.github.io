import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Tutorial: Build a CLI Application',
      collapsible: true,
      items: [
        'tutorial/overview',
        'tutorial/setting-up-foundation',
        'tutorial/meaningful-command-names',
        'tutorial/adding-user-interaction',
        'tutorial/separating-concerns-with-services',
        'tutorial/external-configuration',
        'tutorial/unit-testing',
        'tutorial/integration-testing',
        'tutorial/event-driven-architecture',
        'tutorial/custom-events-for-extensibility',
        'tutorial/writable-events-for-data-transformation',
        'tutorial/conclusion',
      ],
    },
    {
      type: 'category',
      label: 'Tutorial: Build a REST API',
      collapsible: true,
      items: [
        'tutorial-rest-api/overview',
        'tutorial-rest-api/setup',
        'tutorial-rest-api/meal-pairing-controller',
        'tutorial-rest-api/meal-service',
        'tutorial-rest-api/cocktail-service',
        'tutorial-rest-api/meal-pairing-service',
        'tutorial-rest-api/integration-tests',
        'tutorial-rest-api/validation',
        'tutorial-rest-api/url-parameters',
        'tutorial-rest-api/post-requests',
        'tutorial-rest-api/production-and-customization',
        'tutorial-rest-api/conclusion',
      ],
    },
    {
      type: 'category',
      label: 'Tutorial: Create an Alliage Module',
      collapsible: true,
      items: [
        'tutorial-module/overview',
        'tutorial-module/setup',
        'tutorial-module/configuration',
        'tutorial-module/mongodb-service',
        'tutorial-module/testing',
        'tutorial-module/distribution',
      ],
    },
  ],
};

export default sidebars;
