# Glance - Implementation Tasks

> **Project:** Glance - Database Schema Explorer  
> **Started:** _____________  
> **Target Completion:** 4 weeks  
> **Status:** Not Started

---

## Progress Overview

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Phase 0: Setup | 8 | 8 | ✅✅✅✅✅✅✅✅ 100% |
| Phase 1: Core MVP | 37 | 37 | ✅✅✅✅✅✅✅✅ 100% |
| Phase 2: Enhanced UX | 28 | 28 | ✅✅✅✅✅✅✅✅ 100% |
| Phase 3: Polish | 15 | 15 | ✅✅✅✅✅✅✅✅ 100% |
| **Total** | **88** | **88** | **100%** |

---

## Phase 0: Project Setup
**Goal:** Development environment ready, project scaffolded  
**Estimated Time:** 2-3 hours

### Environment Setup

- [x] **0.1** Install Rust via rustup
  - [x] Run: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
  - [x] Verify: `rustc --version` ✓ (rustc 1.86.0)

- [x] **0.2** Install Tauri CLI
  - [x] Run: `cargo install tauri-cli`
  - [x] Verify: `cargo tauri --version` ✓ (tauri-cli 2.9.6)

- [x] **0.3** Verify Node.js installation
  - [x] Check Node: `node --version` ✓ (v22.12.0)
  - [x] Check npm: `npm --version` ✓ (10.9.0)

### Project Scaffolding

- [x] **0.4** Create Tauri + React + TypeScript project
  - [x] Run: `npm create tauri-app@latest glance-app -m npm -t react-ts -y`
  - [x] Navigate: `cd glance-app`

- [x] **0.5** Install frontend dependencies
  - [x] Run: `npm install zustand fuse.js @tauri-apps/api`
  - [x] Run: `npm install -D tailwindcss postcss autoprefixer @tailwindcss/vite`
  - [x] Tailwind CSS v4 configured with Vite plugin

- [x] **0.6** Configure Tailwind CSS
  - [x] Updated `vite.config.ts` with tailwindcss plugin
  - [x] Add Tailwind directives to `src/App.css`

- [x] **0.7** Add Rust dependencies to `src-tauri/Cargo.toml`
  - [x] Add tiberius (SQL Server driver)
  - [x] Add tokio (async runtime)
  - [x] Add rusqlite (local cache)
  - [x] Add serde + serde_json (serialization)
  - [x] Add dirs (OS paths)

- [x] **0.8** Verify project runs
  - [x] Run: `npm run tauri dev`
  - [x] Verify window opens with React app ✓

---

## Phase 1: Core MVP
**Goal:** Connect to SQL Server, search tables/columns, copy SQL  
**Estimated Time:** 2 weeks

### 1A. Project Structure

- [x] **1.1** Create frontend folder structure
  - [x] Create `src/components/`
  - [x] Create `src/hooks/`
  - [x] Create `src/stores/`
  - [x] Create `src/lib/`

- [x] **1.2** Create Rust backend folder structure
  - [x] Create `src-tauri/src/commands/`
  - [x] Create `src-tauri/src/db/`
  - [x] Create `src-tauri/src/config/`
  - [x] Create `src-tauri/src/hotkey/`

- [x] **1.3** Create TypeScript types file (`src/lib/types.ts`)
  - [x] Define `Connection` interface
  - [x] Define `Table` interface
  - [x] Define `Column` interface
  - [x] Define `ForeignKey` interface
  - [x] Define `SearchResult` interface

- [x] **1.4** Create Tauri IPC wrapper (`src/lib/tauri.ts`)
  - [x] Create wrapper functions for all Rust commands

### 1B. Connection Management

- [x] **1.5** Create Rust config module (`src-tauri/src/config/mod.rs`)
  - [x] Implement `get_config_path()`
  - [x] Implement `load_config()`
  - [x] Implement `save_config()`

- [x] **1.6** Create Rust connection command (`src-tauri/src/commands/connection.rs`)
  - [x] Implement `test_connection(server, database, auth_type, username, password)`
  - [x] Return `Result<String, String>`

- [x] **1.7** Create Rust save connection command
  - [x] Implement `save_connection(connection: Connection)`
  - [x] Write to config.json

- [x] **1.8** Register commands in `main.rs`
  - [x] Add commands to `tauri::Builder`

- [x] **1.9** Create ConnectionForm component (`src/components/ConnectionForm.tsx`)
  - [x] Add Server input field
  - [x] Add Database input field
  - [x] Add Auth Type selector (Windows/SQL)
  - [x] Add Username input field (conditional)
  - [x] Add Password input field (conditional)
  - [x] Add Test Connection button
  - [x] Add Save & Connect button

- [x] **1.10** Create connection store (`src/stores/connectionStore.ts`)
  - [x] Add state: `connection`, `isConnected`, `isConnecting`, `error`
  - [x] Add action: `testConnection()`
  - [x] Add action: `saveConnection()`
  - [x] Add action: `disconnect()`

- [x] **1.11** Wire up ConnectionForm to Tauri commands
  - [x] Call `test_connection` on button click
  - [x] Show success/error feedback

### 1C. Schema Indexing

- [x] **1.12** Create SQL Server connection module (`src-tauri/src/db/sqlserver.rs`)
  - [x] Implement `connect(connection: &Connection)`
  - [x] Handle Windows authentication
  - [x] Handle SQL authentication

- [x] **1.13** Create schema extraction queries
  - [x] Query to get all tables
  - [x] Query to get all columns
  - [x] Query to get foreign keys
  - [x] Query to get primary keys

- [x] **1.14** Create SQLite cache module (`src-tauri/src/db/cache.rs`)
  - [x] Implement `init_cache()`
  - [x] Create `tables` table schema
  - [x] Create `columns` table schema
  - [x] Create `foreign_keys` table schema

- [x] **1.15** Create cache write functions
  - [x] Implement `cache_tables(tables: Vec<Table>)`
  - [x] Implement `cache_columns(columns: Vec<Column>)`
  - [x] Implement `cache_foreign_keys(fks: Vec<ForeignKey>)`

- [x] **1.16** Create schema indexing command (`src-tauri/src/commands/schema.rs`)
  - [x] Implement `index_schema(connection_id: String)`
  - [x] Connect to SQL Server
  - [x] Extract schema metadata
  - [x] Cache in SQLite
  - [x] Emit progress events

- [x] **1.17** Create get_schema command
  - [x] Implement `get_schema()`

- [x] **1.18** Create schema store (`src/stores/schemaStore.ts`)
  - [x] Add state: `tables`, `columns`, `foreignKeys`, `isIndexing`, `progress`
  - [x] Add action: `indexSchema()`
  - [x] Add action: `loadSchema()`

- [x] **1.19** Add indexing progress UI
  - [x] Create progress bar component
  - [x] Show "Indexing X of Y tables..."

### 1D. Search

- [x] **1.20** Create fuzzy search utility (`src/lib/fuzzySearch.ts`)
  - [x] Configure Fuse.js options
  - [x] Implement `searchSchema(query, tables, columns)`
  - [x] Return ranked results

- [x] **1.21** Create SearchBar component (`src/components/SearchBar.tsx`)
  - [x] Add input field with search icon
  - [x] Add placeholder text
  - [x] Add keyboard shortcut hint

- [x] **1.22** Create ResultsList component (`src/components/ResultsList.tsx`)
  - [x] Render list of search results
  - [x] Implement keyboard navigation
  - [x] Highlight selected item

- [x] **1.23** Create ResultItem component (`src/components/ResultItem.tsx`)
  - [x] Add icon (📋 table, 📄 column)
  - [x] Show name with match highlighting
  - [x] Show description if available

- [x] **1.24** Create search store (`src/stores/searchStore.ts`)
  - [x] Add state: `query`, `results`, `selectedIndex`
  - [x] Add action: `search(query)`
  - [x] Add action: `selectNext()`
  - [x] Add action: `selectPrev()`
  - [x] Add action: `selectCurrent()`

- [x] **1.25** Create useSearch hook (`src/hooks/useSearch.ts`)
  - [x] Implement debounced search (100ms)
  - [x] Add keyboard handlers

### 1E. SQL Generation & Clipboard

- [x] **1.26** Create SQL generator utility (`src/lib/sqlGenerator.ts`)
  - [x] Implement `generateTableSelect(table, limit)`
  - [x] Implement `generateColumnSelect(table, column, limit)`

- [x] **1.27** Create clipboard command (`src-tauri/src/commands/clipboard.rs`)
  - [x] Implement `copy_to_clipboard(text: String)` (placeholder)

- [x] **1.28** Create Toast component (`src/components/Toast.tsx`)
  - [x] Show "Copied to clipboard" message
  - [x] Auto-dismiss after 2 seconds

- [x] **1.29** Wire up Enter key to copy SQL
  - [x] Generate SQL on Enter
  - [x] Copy to clipboard
  - [x] Show toast notification

### 1F. Global Hotkey

- [x] **1.30** Create hotkey module (`src-tauri/src/hotkey/mod.rs`)
  - [x] Register global hotkey on app start (placeholder - Tauri 2 handles via config)
  - [x] Default: Ctrl+Shift+Space / Cmd+Shift+Space

- [x] **1.31** Handle hotkey event
  - [x] Show window if hidden (via Tauri commands)
  - [x] Hide window if shown
  - [x] Focus search bar when shown

- [x] **1.32** Add window visibility commands
  - [x] Implement `show_window()` (via Tauri API)
  - [x] Implement `hide_window()`

- [x] **1.33** Configure Tauri window settings
  - [x] Set `decorations` in tauri.conf.json
  - [x] Set `transparent` if needed
  - [x] Set `alwaysOnTop` option

### 1G. Basic Styling

- [x] **1.34** Style SearchBar component
  - [x] Large input with rounded corners
  - [x] Subtle shadow
  - [x] Focus state

- [x] **1.35** Style ResultsList and ResultItem
  - [x] Hover states
  - [x] Selected state
  - [x] Scrollable list

- [x] **1.36** Style main window layout
  - [x] Two-column layout
  - [x] Appropriate padding and spacing

- [x] **1.37** Add loading states
  - [x] Spinner while connecting
  - [x] Skeleton while loading schema

---

## Phase 2: Enhanced UX
**Goal:** Preview panel, relationships, groups, recent history  
**Estimated Time:** 1 week

### 2A. Preview Panel

- [x] **2.1** Create PreviewPanel component (`src/components/PreviewPanel.tsx`)
  - [x] Show details for selected table/column
  - [x] Split view: Results | Preview

- [x] **2.2** Create ColumnList sub-component
  - [x] List all columns with types
  - [x] Indicate PK with 🔑 icon
  - [x] Indicate FK with 🔗 icon

- [x] **2.3** Create RelationshipList sub-component
  - [x] Show outgoing FKs (→)
  - [x] Show incoming FKs (←)

- [x] **2.4** Add Tab key to toggle preview
  - [x] Tab: Show/expand preview
  - [x] Shift+Tab: Hide preview

- [x] **2.5** Add SQL preview box
  - [x] Show generated SQL
  - [x] Copy button

- [x] **2.6** Style preview panel
  - [x] Consistent typography
  - [x] Appropriate hierarchy

### 2B. Relationship Navigation

- [x] **2.7** Make relationship items clickable
  - [x] Click: Navigate to that table
  - [x] Update search and preview

- [x] **2.8** Add breadcrumb navigation
  - [x] Show navigation path
  - [x] Click to go back

- [x] **2.9** Add back button / keyboard shortcut
  - [x] ← arrow or Backspace
  - [x] Maintain navigation history

### 2C. Table Groups

- [x] **2.10** Create groups JSON parser (`src/lib/groupsParser.ts`)
  - [x] Load from configured file path
  - [x] Validate schema

- [x] **2.11** Create Sidebar component (`src/components/Sidebar.tsx`)
  - [x] Groups section (collapsible)
  - [x] Recent section

- [x] **2.12** Create GroupList component (`src/components/GroupList.tsx`)
  - [x] Expandable groups with icons
  - [x] Table list within each group
  - [x] Entry point highlighted with ⭐

- [x] **2.13** Add group descriptions on hover
  - [x] Tooltip or inline description

- [x] **2.14** Click group table to search/preview
  - [x] Clicking populates search
  - [x] Shows preview

- [x] **2.15** Add table annotations display
  - [x] Show team notes in preview
  - [x] Show column-specific notes

### 2D. Recent History

- [x] **2.16** Create history store (`src/stores/historyStore.ts`)
  - [x] Track last 20 selected items
  - [x] Persist to localStorage

- [x] **2.17** Create RecentList component (`src/components/RecentList.tsx`)
  - [x] Show recent items in sidebar
  - [x] Click to search/preview

- [x] **2.18** Add clear history option
  - [x] Button or context menu

### 2E. JOIN Query Builder

- [x] **2.19** Create JOIN query state store (`src/stores/joinQueryStore.ts`)
  - [x] Track selected tables in JOIN chain
  - [x] Track selected columns per table
  - [x] Track join conditions (FK relationships)
  - [x] Add/remove tables from query
  - [x] Clear query builder

- [x] **2.20** Create JoinQueryBuilder component (`src/components/JoinQueryBuilder.tsx`)
  - [x] Show current tables in JOIN chain
  - [x] Visual representation of table connections
  - [x] Remove table button (X)
  - [x] Clear all button

- [x] **2.21** Add Ctrl+Click to add table to JOIN
  - [x] In PreviewPanel relationship items
  - [x] Detect Ctrl/Cmd modifier on click
  - [x] Add table to JOIN chain instead of navigating
  - [x] Show visual feedback (toast or highlight)

- [x] **2.22** Create column selector for JOIN query
  - [x] Show columns for each table in chain
  - [x] Toggle column selection (checkbox)
  - [x] Select all / select none shortcuts
  - [x] Show PK/FK indicators

- [x] **2.23** Update SQL generation for JOINs (`src/lib/sqlGenerator.ts`)
  - [x] Generate multi-table JOIN SQL
  - [x] Use proper aliases (e.g., cp, p, pr)
  - [x] Include selected columns from each table
  - [x] Handle FK→PK join conditions correctly

- [x] **2.24** Add JOIN SQL preview
  - [x] Show live preview of generated JOIN SQL
  - [x] Syntax highlighting
  - [x] Copy button

- [x] **2.25** Integrate JoinQueryBuilder with Preview Panel
  - [x] Show builder below relationships section
  - [x] Or as a separate collapsible panel
  - [x] Toggle visibility with keyboard shortcut

- [x] **2.26** Add keyboard shortcuts for JOIN builder
  - [x] `Ctrl+Enter` or `Cmd+Enter`: Copy JOIN SQL
  - [x] `Ctrl+Shift+C`: Clear JOIN builder
  - [x] `Shift+Click` on relationship: Add to JOIN

- [x] **2.27** Add JOIN builder visual indicators
  - [x] Highlight tables already in JOIN chain
  - [x] Show connection lines between joined tables
  - [x] Badge showing number of tables in query

- [x] **2.28** Smart alias generation
  - [x] Generate meaningful aliases (first letters, abbreviations)
  - [x] Handle conflicts (e.g., PERSON and PROVIDER both start with P)
  - [x] Use table_alias convention

---

## Phase 3: Polish & Settings
**Goal:** Production-ready experience  
**Estimated Time:** 1 week

### 3A. Settings

- [x] **3.1** Create Settings component (`src/components/Settings.tsx`)
  - [x] Modal or separate view

- [x] **3.2** Add connection management section
  - [x] List saved connections
  - [x] Add/edit/delete connections
  - [x] Set default connection

- [x] **3.3** Add hotkey customization
  - [x] Current hotkey display
  - [x] "Record new hotkey" button

- [x] **3.4** Add appearance settings
  - [x] Theme: Light / Dark / System
  - [x] Row limit: 10, 50, 100, 500

- [x] **3.5** Add behavior settings
  - [x] Copy behavior: Copy only / Copy and close
  - [x] Auto-refresh schema

- [x] **3.6** Add groups file path setting
  - [x] File picker for JSON path
  - [x] "Reload groups" button

### 3B. Theme Support

- [x] **3.7** Create theme CSS variables
  - [x] Light theme colors
  - [x] Dark theme colors

- [x] **3.8** Implement theme toggle
  - [x] Respect system preference
  - [x] Allow manual override

- [x] **3.9** Style all components for both themes
  - [x] Verify contrast
  - [x] Check hover/focus states

### 3C. System Tray

- [x] **3.10** Add system tray icon
  - [x] Configure in tauri.conf.json
  - [x] Custom icon

- [x] **3.11** Add tray menu
  - [x] Show/Hide Glance
  - [x] Settings
  - [x] Quit

- [x] **3.12** Minimize to tray behavior
  - [x] Close button minimizes to tray

### 3D. Error Handling & Polish

- [x] **3.13** Add comprehensive error handling
  - [x] Connection errors
  - [x] Query errors
  - [x] File errors

- [x] **3.14** Add empty states
  - [x] No search results
  - [x] No groups configured
  - [x] No recent history

- [x] **3.15** Add keyboard shortcut help
  - [x] Footer or help modal

---

## Deployment Tasks

### Build & Distribution

- [x] **D.1** Configure app icons
  - [x] Windows: .ico
  - [x] macOS: .icns
  - [x] Linux: .png

- [x] **D.2** Configure app metadata
  - [x] Name, version, description
  - [x] Copyright, license

- [ ] **D.3** Build for Windows
  - [ ] Run: `npm run tauri build`
  - [ ] Test installer

- [x] **D.4** Build for macOS
  - [x] Run: `npm run tauri build`
  - [x] Test .app bundle
  - [ ] Code signing (optional)

- [ ] **D.5** Build for Linux
  - [ ] Run: `npm run tauri build`
  - [ ] Test .deb / .AppImage

- [x] **D.6** Create GitHub releases
  - [x] Automate with GitHub Actions

- [x] **D.7** Write user documentation
  - [x] README with features and installation
  - [x] CHANGELOG with v1.0.0 release notes
  - [x] LICENSE (MIT)
  - [x] Getting started guide

---

## Bug Fixes & Issues

| ID | Description | Status | Fixed Date |
|----|-------------|--------|------------|
| BUG-001 | | ⬜ Open | |
| | | | |

---

## Notes & Decisions

| Date | Decision/Note |
|------|---------------|
| | |

---

## Daily Log

| Date | Tasks Completed | Time Spent | Notes |
|------|-----------------|------------|-------|
| Dec 20, 2024 | Phase 2: Enhanced UX (2.1-2.28) | - | PreviewPanel, Sidebar, GroupList, RecentList, historyStore, breadcrumb navigation, JoinQueryBuilder, joinQueryStore, Ctrl+Click JOIN |
| Dec 24, 2024 | Phase 3: Polish & Settings (3.1-3.15) | - | Settings modal with tabs, settingsStore, theme CSS variables, system tray, EmptyState, KeyboardShortcutsHelp, error handling components |
| Dec 24, 2024 | Deployment (D.1-D.7) | - | App icons, metadata, macOS build, GitHub Actions workflow, README, CHANGELOG, LICENSE |

---

## Resources & References

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [tiberius (SQL Server driver)](https://docs.rs/tiberius/latest/tiberius/)
- [Fuse.js Documentation](https://fusejs.io/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

*Last updated: Dec 24, 2024*
