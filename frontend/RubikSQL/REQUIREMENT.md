# UI/UX Design Specification: NL2SQL Client

**Version:** 1.0
**Theme:** "Ollama Minimalist"
**Target Platforms:** Web, macOS (DMG), Windows (EXE)

-----

## 1\. Design Philosophy

The interface follows a **"Invisible UI"** philosophy. The design should recede, highlighting the data and the conversation.

  * **Aesthetic:** Stark white, high contrast text, subtle borders, soft shadows.
  * **Motion:** Kinetic but restrained. Elements should glide, not jump.
  * **Texture:** Matte surfaces. No glassmorphism or heavy gradients.

## 2\. Visual Style Guide

### 2.1 Color Palette

  * **Canvas:** `#FFFFFF` (Pure White)
  * **Sidebar/Surface:** `#FAFAFA` (Off-white/Light Grey)
  * **Text Primary:** `#171717` (Near Black - Softened)
  * **Text Secondary:** `#737373` (Neutral Grey)
  * **Accent/Action:** `#000000` (Black) or `#2563EB` (Subtle Corporate Blue - Optional)
  * **Borders:** `#E5E7EB` (Very light grey)

### 2.2 Typography

  * **Font Family:** System Stack (*San Francisco* for macOS, *Segoe UI* for Windows, *Inter* for Web).
  * **Code Font:** *JetBrains Mono* or *Fira Code* (Essential for SQL display).
  * **Sizing:** Large headers (24px+), readable body (16px), distinct metadata (12px).

### 2.3 Spacing & Radius

  * **Corner Radius:**
      * Standard: `8px` (Inputs, Buttons)
      * Panels/Modals: `12px`
  * **Padding:** Generous whitespace (e.g., `p-6` or `24px`) to prevent clutter.

-----

## 3\. Layout & Navigation Structure

The application uses a **Two-Column Resizable Layout**.

### 3.1 The Sidebar (Left)

  * **Behavior:** Collapsible (Toggable). When collapsed, shows icons only.
  * **Width:** 260px (Expanded) / 64px (Collapsed).
  * **Background:** `#FAFAFA`.
  * **Content Hierarchy:**
    1.  **App Header:** Logo + "New Chat" Icon.
    2.  **Primary Actions:**
          * `[Icon] Connect Database` (Opens Modal)
          * `[Icon] Knowledge Management`
    3.  **History Scroll:** A vertically scrollable list of previous sessions (grouped by "Today", "Yesterday").
    4.  **Footer (Fixed at bottom):**
          * Settings
          * About
          * Exit

### 3.2 The Main Panel (Right)

  * **Behavior:** Operates as a **Tabbed Workspace** (Similar to a browser or VS Code).
  * **Top Bar:** Contains tabs for active sessions (e.g., "Chat: Sales Data", "DB Viewer: Postgres Local", "Knowledge Graph").
  * **Content Area:** White background. This is where the Query Interface lives.

-----

## 4\. Component Design: The Query Interface

This is the core view. It must handle high information density without looking cluttered.

### 4.1 The Input Area (Bottom or Center)

  * **Style:** A clean input box with a subtle shadow, floating slightly above the bottom edge.
  * **Placeholder:** "Ask a question about your data..."
  * **Send Button:** Minimalist arrow icon.
  * **Transition:** When focusing, the border darkens smoothly (`transition-colors duration-200`).

### 4.2 The Conversation Stream

  * **User Message:** Aligned right (or labeled "You"), simple text.

  * **Agent Response (The Complex Requirement):**
    Instead of a simple text block, every Agent Response is a **Card** containing internal tabs.

    **The Agent Card Structure:**

      * **Header:** Agent Icon + "Thinking..." or "Completed in 1.2s"
      * **Internal Tabs (Pills):**
        1.  **Analysis (Default):** The natural language explanation.
        2.  **Tasks/SQL:** The reasoning trace or generated SQL code.
        3.  **Results:** The data grid/table.
      * **Body Content:** Changes based on the selected internal tab.

    > **Interaction Note:** If the agent is streaming, the "Tasks/SQL" tab might pulse or show a live log. Once finished, it auto-switches to "Analysis" or "Results" based on user preference settings.

### 4.3 Streaming Behavior (Performance UX)

To prevent "flashing":

1.  **Optimistic UI:** Immediately show the User Message.
2.  **Skeleton Loading:** Do not use a spinning wheel. Use a "shimmer" effect on the Agent Card while initiating.
3.  **Token Streaming:** Text should appear character-by-character with a cursor, but **tables** should render row-by-row to avoid layout jumping.

-----

## 5\. Functionality Modules (Tabs)

### 5.1 Database Viewer Tab

  * **Layout:** Split pane.
      * *Left:* Tree view of Tables/Schemas.
      * *Right:* Data Grid (Excel-like view).
  * **Style:** Minimalist grid lines. Alternating row colors are too heavy—use hover effects on rows instead.

### 5.2 Knowledge Configuration Tab

  * **UI:** A list of documents/schemas uploaded.
  * **Actions:** Drag-and-drop zone for files. Simple toggle switches for "Active/Inactive".

-----

## 6\. Technical Implementation Recommendations (for Engineers)

To achieve the "Cross-platform" and "Modular" requirements:

### 6.1 Tech Stack

  * **Core:** **Tauri** (Rust) or **Electron**.
      * *Why:* Tauri is lighter and smaller (imitates native apps better). Electron is easier if the team is purely JS-based.
  * **Frontend:** **React** or **Vue 3**.
  * **Styling:** **Tailwind CSS**.
      * *Why:* Essential for the "white and simplistic" look without writing custom CSS.
  * **State Management:** **Zustand** or **Redux Toolkit**.
      * *Why:* Needed to manage the "Global Tabs" state independent of the Sidebar state.

### 6.2 Component Architecture (Modularity)

Ask the engineers to structure the folder hierarchy by **Domain**:

```text
/src
  /components
    /ui           (Atomic elements: Buttons, Inputs)
    /layout       (Sidebar, MainPanel, TabBar)
    /features
      /chat       (ChatBubble, StreamRenderer)
      /database   (TableViewer, SchemaTree)
      /settings   (ConfigForms)
```

### 6.3 Animation Library

  * **Framer Motion (React):** Use this for the specific "subtle smooth transition effects."
      * *Use case:* Sidebar sliding in/out.
      * *Use case:* Tab switching fade-in.
      * *Use case:* The "Ripple" effect when connecting to a database.

-----

## 7\. Interaction Flows

**Scenario: User Connects DB and Asks Question**

1.  **Connect:** User clicks "Connect Database" in Sidebar.
      * *Effect:* A modal fades in (center screen). Backdrop blur (`backdrop-blur-sm`).
2.  **Input:** User enters credentials and clicks "Connect".
      * *Effect:* Button shows a spinner. On success, modal shrinks and disappears; a Toast notification slides in top-right: "Postgres Connected".
3.  **New Tab:** User clicks "+" on the Tab Bar. A blank "New Chat" pane appears.
4.  **Query:** User types "Show me top sales."
5.  **Response:**
      * Agent Card appears immediately.
      * "Tasks" tab is active (showing SQL generation text streaming).
      * Once SQL executes, the Card auto-switches to the "Results" tab (showing the table).
      * Finally, the "Analysis" text streams in below or in a separate tab.
