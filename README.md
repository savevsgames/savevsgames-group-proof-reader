
# Welcome to your Lovable project

## Project info

**URL**: https://savevsgames-group-proof-reader.vercel.app/

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
- Choice-based navigation (`*` for basic choices, `+` for sticky choices that remain available)
- Conditional content with logic branching
- Variables and state tracking through the Ink runtime
- Content tagging with `#tag` syntax
- Nested choice structures and gathering points

The Ink parser converts from Ink's JSON runtime format to our custom story structure, maintaining the narrative flow while adapting it to our application's architecture.

#### Story Navigation

Navigation through story nodes is handled by:
- `useNavigation` hook - Core navigation logic for traversing the story graph
- `navigationSlice.ts` - State management for navigation actions
- `StoryNavigationHandler` - UI component for node selection and page transitions
- Node-to-page mapping system for pagination and linear reading experience

The navigation system supports:
- Moving forward through choices
- Going back to previous nodes
- Jumping directly to specific pages
- Tracking reading history

#### Story Rendering and Reading Experience

The reading experience is implemented through several interrelated components:
- `StoryPage.tsx` - Container for the reading experience
- `BookLayout.tsx` - Overall layout with visual book styling
- `StoryDisplay.tsx` - Renders text and choice UI
- `StoryText.tsx` - Handles text formatting and image integration
- `StoryChoices.tsx` - Displays interactive choice buttons

#### Editing Features

The editor supports multiple views of the same story:

- **Text Editor View**: Simple text editing for non-technical users
  - Direct editing of node text
  - Minimal interface for content creators
  - Support for basic formatting with newlines

- **JSON View**: Direct editing of the underlying story structure
  - Full control over story nodes and connections
  - Ability to modify choices, add metadata
  - Monaco code editor with syntax highlighting

- **Ink View**: Visualization of the story in Ink format
  - Syntax highlighting for Ink markup
  - Read-only reference for understanding story structure
  - Toggle between compiled and source views

- **Reader View**: Preview the story from a reader's perspective
  - Test narrative flow and choices
  - Verify page breaks and content rendering
  - Simulate reader experience

#### Commenting System

Integrated commenting allows readers and editors to:
- Add comments on specific pages/nodes
- Categorize comments (editorial, continuity, etc.)
- Track and respond to feedback
- Filter and sort comments by type
- Use feedback to improve story content

### LLM-Assisted Editing

The platform incorporates AI-powered assistance for story editing through:

#### Supabase Edge Functions for AI Integration

- **Secure API Communication**: Edge functions handle all communication with AI services, keeping API keys secure
  - The `generate-story-content` function processes all story-related AI requests
  - Tokenization and proper context management is handled server-side
  - Multiple AI models are supported through model switching

- **Content Generation Types**:
  - **JSON Editing**: Directly suggests structural changes to story nodes
  - **Creative Suggestions**: Provides alternative plot directions and writing improvements

- **Implementation Details**:
  - Edge functions proxy requests to OpenAI with appropriate credentials
  - Response formatting and error handling are managed server-side
  - Usage monitoring and rate limiting prevent excessive costs

#### Context-Aware AI System

- **Story Context Collection**:
  - Current node text and metadata
  - Previous and next page content
  - Story structure and relationships
  - Navigation history and user reading patterns

- **Community Comments Integration**:
  - Comments are categorized and processed as context for AI
  - Editorial suggestions can be directly added to AI context
  - Comment sentiment and frequency guides AI recommendations
  - Users can selectively include specific comments in AI prompts

- **Document and Reference Knowledge**:
  - RAG (Retrieval-Augmented Generation) system pulls relevant information from uploaded documents
  - Character descriptions, world-building details, and style guides inform AI responses
  - Document content is embedded for semantic search capabilities

#### User Interface for AI Collaboration

- **AI Settings Management**:
  - Model selection (gpt-4o, gpt-4o-mini, etc.)
  - Temperature adjustment for creative vs. precise outputs
  - System prompt customization for tailored assistance

- **Multi-modal Interaction**:
  - Text-based story editing suggestions
  - JSON structural recommendations
  - Writing style and tone adjustments
  - Plot consistency verification

- **Feedback Loop**:
  - Users can accept, modify, or reject AI suggestions
  - Rating system improves future recommendations
  - AI learns from editorial decisions over time

### Editing Page Architecture

The story editing page (`StoryEditPage.tsx`) orchestrates the editing experience with these key components:

1. **Editor Header**:
   - Page navigation controls
   - Save functionality
   - Story title display
   - Editing status indicators
   
2. **Editor Content Area**:
   - Tab-based interface for switching between views
   - Content editors for different formats
   - Live preview of changes

3. **State Management**:
   - Tracks unsaved changes
   - Manages current node and page
   - Handles story data persistence

4. **Data Flow**:
   - Loads story from database
   - Parses and normalizes different formats
   - Maps nodes to pages for navigation
   - Saves changes back to storage

### Reading/Proofreading Page Architecture

The story reading page (`StoryPage.tsx`) provides an immersive reading experience:

1. **Book Layout**:
   - Two-page spread design
   - Left side for story content
   - Right side for comments and annotations
   
2. **Story Display**:
   - Renders formatted text
   - Presents choices to readers
   - Supports images and rich media

3. **Navigation Controls**:
   - Page turning
   - Choice selection
   - History navigation (back button)
   - Restart functionality

4. **Commenting Interface**:
   - Add comments on specific passages
   - View others' feedback
   - Categorize and filter comments

### Technical Implementation

#### Parsers and Converters

- `inkParser.ts`: Converts Ink JSON runtime format to our custom story format
  - Extracts text, choices, and metadata
  - Maps divert targets to node identifiers
  - Handles special Ink constructs like glue and tags

- `nodeExtraction.ts`: Extracts node content from complex Ink structures
  - Processes arrays and objects into coherent text
  - Reconstructs choice structures
  - Maintains narrative flow

- `constants.ts`: Defines Ink syntax symbols
  - Choice markers (* and +)
  - Navigation symbols (->)
  - Evaluation markers
  - Special characters

- `conversion.ts`: Bidirectional conversion between formats
  - JSON to Ink conversion
  - Ink to JSON conversion
  - Format normalization

#### Type System

The type system provides interfaces for:
- Basic story structures (nodes, choices)
- Enhanced Ink format features (tags, glue, diverts)
- Parsing context tracking
- Node-to-page mappings
- UI component props

#### State Management

The application uses Zustand for state management with several slices:
- `storySlice.ts`: Core story data management
- `navigationSlice.ts`: Navigation state and actions
- `commentsSlice.ts`: Comment functionality
- `editorSlice.ts`: Editor-specific state
- `uiSlice.ts`: UI-related state

#### Data Flow

1. Story data is loaded from Supabase storage or database
2. Format-specific parsers process the data into our common format
3. Node mappings are generated to support pagination
4. State is maintained in the Zustand store
5. UI components react to state changes
6. User actions trigger navigation or edits
7. Changes are persisted back to storage

#### Supabase Edge Functions for LLM Integration

1. **Content Generation Pipeline**:
   - The `generate-story-content` edge function serves as the interface to AI systems
   - Client preparation of context data through `preparePromptData` function
   - Full story context, including neighboring nodes, is included in prompts
   - Comments are formatted and categorized to provide editorial guidance

2. **Data Security and Performance**:
   - API keys and credentials are stored securely in Supabase environment
   - Edge functions provide server-side processing to reduce client load
   - Response caching and optimization for faster subsequent requests
   - Rate limiting and usage tracking prevent excessive costs

3. **Implementation Details**:
   ```typescript
   // Client-side request to edge function
   const { data, error } = await supabase.functions.invoke('generate-story-content', {
     body: JSON.stringify({
       systemPrompt,
       prompt: fullPrompt,
       contentType: llmType,
       model,
       temperature
     })
   });
   
   // Edge function processing
   // 1. Extract parameters
   // 2. Validate inputs
   // 3. Call OpenAI API
   // 4. Process and return results
   ```

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

This project is built with:

- Vite - Fast build tool and development server
- TypeScript - Strongly typed JavaScript
- React - UI component library
- shadcn-ui - Accessible component system
- Tailwind CSS - Utility-first CSS framework
- inkjs - Interactive fiction runtime for Ink stories
- Supabase - Backend services for storage and authentication
- Zustand - Lightweight state management
- React Router - Client-side routing
- Monaco Editor - Code editing component for JSON view

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/734d2606-1eaf-497a-83c1-099a3175b9d0) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

