
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/734d2606-1eaf-497a-83c1-099a3175b9d0

## Story Engine Documentation

### Overview

This project implements an interactive story engine capable of rendering and navigating through branching narratives. The system supports both custom JSON story formats and the Ink narrative scripting language through the inkjs library.

### Key Components

#### Story Data Structure

Stories are represented using a tree-like structure:

```typescript
interface StoryNode {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
  metadata?: Record<string, any>;
}

interface StoryChoice {
  text: string;
  nextNode: string;
}

interface CustomStory {
  [key: string]: StoryNode | any;
  root?: StoryNode;
  start?: StoryNode;
}
```

#### Ink Format Support

The system parses and supports the Ink narrative format with features including:
- Choice-based navigation (`*`, `+` for sticky choices)
- Conditional content
- Variables and state tracking
- Content tagging

#### Story Navigation

Navigation through story nodes is handled by:
- `useNavigation` hook - Core navigation logic
- `StoryNavigationHandler` - Manages node selection and page transitions
- Node-to-page mapping system for pagination

#### Editing Features

The editor supports multiple views of the same story:
- **JSON View**: Direct editing of the underlying story structure
- **Ink View**: Visualization of the story in Ink format
- **Text Editor**: WYSIWYG editing for non-technical users
- **Reader View**: Preview the story from a reader's perspective

#### Commenting System

Integrated commenting allows readers and editors to:
- Add comments on specific pages/nodes
- Categorize comments (editorial, continuity, etc.)
- Track and respond to feedback

### Technical Implementation

#### Parsers and Converters

- `inkParser.ts`: Converts Ink JSON format to our custom story format
- `nodeExtraction.ts`: Extracts node content from complex Ink structures
- `constants.ts`: Defines Ink syntax symbols
- `conversion.ts`: Bidirectional conversion between formats

#### Type System

The type system in `types.ts` provides interfaces for:
- Basic story structures
- Enhanced Ink format features
- Parsing context tracking
- Node-to-page mappings

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/734d2606-1eaf-497a-83c1-099a3175b9d0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- inkjs (for interactive fiction)
- Supabase (for backend and storage)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/734d2606-1eaf-497a-83c1-099a3175b9d0) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
