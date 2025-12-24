# Glance - Product Requirements Document (PRD)

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Status:** Draft  
> **Author:** Eng Leong  

---

## 1. Overview

### 1.1 Product Summary

**Glance** is a cross-platform desktop application that provides instant, fuzzy search across database schemas. It serves as a lightweight companion to existing database tools (DBeaver, DataGrip, SSMS), enabling developers to quickly find tables, understand relationships, and generate SQL queries without navigating complex tree views or memorizing thousands of table names.

### 1.2 Problem Statement

Enterprise applications often have databases with hundreds or thousands of tables. Developers working with these databases face several challenges:

1. **Discovery:** Finding the right table requires scrolling through alphabetical lists or guessing naming conventions
2. **Context:** Understanding how tables relate to each other requires manual foreign key tracing
3. **Knowledge silos:** Tribal knowledge about the schema lives in people's heads, not in tooling
4. **Onboarding friction:** New team members take weeks to become productive with unfamiliar schemas

Current tools (DBeaver, DataGrip) are powerful but optimized for query execution, not schema discovery.

### 1.3 Solution

Glance provides:

- **Spotlight-style search:** Global hotkey opens instant fuzzy search across all tables and columns
- **One-click SQL:** Select a result and get a ready-to-run SELECT query copied to clipboard
- **Relationship visualization:** See foreign key connections at a glance
- **Team knowledge base:** Shared JSON configuration with table groupings and annotations

### 1.4 Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| Backend Developer | Works with database daily | Fast table/column lookup |
| Full-stack Developer | Occasional database work | Quick answers without deep exploration |
| New Team Member | Onboarding to unfamiliar codebase | Guided schema learning |
| Tech Lead | Maintains team standards | Shared schema documentation |

### 1.5 Success Criteria

| Metric | Current State | Target |
|--------|---------------|--------|
| Time to find table | 3-5 minutes | < 10 seconds |
| Questions to teammates about schema | 5-10 per week | < 2 per week |
| New developer schema onboarding | 2-4 weeks | 1 week |

---

## 2. Requirements

### 2.1 Functional Requirements

#### 2.1.1 Database Connection (P0 - Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| DB-01 | Connect to SQL Server | Support SQL Server 2016+ |
| DB-02 | Windows Authentication | Use current Windows credentials |
| DB-03 | SQL Authentication | Username/password authentication |
| DB-04 | Connection testing | Verify connection before saving |
| DB-05 | Connection persistence | Save connection to config file |
| DB-06 | Multiple connections | Support switching between databases (Phase 2) |

**Config file format:**
```json
{
  "connections": [
    {
      "name": "mosaic-dev",
      "server": "localhost\\SQLEXPRESS",
      "database": "Mosaic",
      "authType": "windows",
      "isDefault": true
    }
  ]
}
```

**Location:** 
- Windows: `%APPDATA%/glance/config.json`
- macOS: `~/Library/Application Support/glance/config.json`
- Linux: `~/.config/glance/config.json`

#### 2.1.2 Schema Indexing (P0 - Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| IDX-01 | Load all tables | Query INFORMATION_SCHEMA.TABLES |
| IDX-02 | Load all columns | Query INFORMATION_SCHEMA.COLUMNS |
| IDX-03 | Load foreign keys | Query sys.foreign_keys and related views |
| IDX-04 | Load primary keys | Identify PK columns for smart SQL generation |
| IDX-05 | Cache schema locally | Store in local SQLite or JSON for fast startup |
| IDX-06 | Refresh schema | Manual refresh button + auto-refresh option |
| IDX-07 | Index progress | Show progress during initial indexing |

**SQL for schema extraction:**
```sql
-- Tables
SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'

-- Columns
SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, 
       IS_NULLABLE, COLUMN_DEFAULT, ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS

-- Foreign Keys
SELECT 
    fk.name AS constraint_name,
    tp.name AS parent_table,
    cp.name AS parent_column,
    tr.name AS referenced_table,
    cr.name AS referenced_column
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id

-- Primary Keys
SELECT 
    t.name AS table_name,
    c.name AS column_name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.is_primary_key = 1
```

#### 2.1.3 Search (P0 - Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| SRC-01 | Fuzzy search | Match partial strings, handle typos |
| SRC-02 | Search tables | Match against table names |
| SRC-03 | Search columns | Match against column names |
| SRC-04 | Combined results | Show tables and columns in unified list |
| SRC-05 | Result ranking | Prioritize exact > starts with > contains |
| SRC-06 | Recency boost | Recently accessed items rank higher |
| SRC-07 | Column prefix | `:col` prefix limits search to columns |
| SRC-08 | Table prefix | `:table` prefix limits search to tables |
| SRC-09 | Real-time results | Update results as user types (< 50ms) |
| SRC-10 | Result limit | Show top 20 results, scrollable |

**Fuzzy search library:** Fuse.js (JavaScript) with configuration:
```javascript
{
  keys: [
    { name: 'name', weight: 2 },
    { name: 'description', weight: 1 }
  ],
  threshold: 0.4,
  distance: 100,
  includeScore: true
}
```

#### 2.1.4 SQL Generation (P0 - Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| SQL-01 | Table SELECT | `SELECT TOP {limit} * FROM {table}` |
| SQL-02 | Column SELECT | `SELECT TOP {limit} {pk}, {column} FROM {table}` |
| SQL-03 | Configurable limit | User setting: 10, 50, 100, 500 |
| SQL-04 | Copy to clipboard | Single action copies SQL |
| SQL-05 | Toast notification | Confirm "Copied to clipboard" |

#### 2.1.5 Global Hotkey (P0 - Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| HK-01 | Register global hotkey | System-wide, works from any app |
| HK-02 | Default hotkey | Ctrl+Shift+Space (Win/Linux), Cmd+Shift+Space (Mac) |
| HK-03 | Customizable hotkey | User can change in settings |
| HK-04 | Show/hide toggle | Hotkey toggles window visibility |
| HK-05 | Focus search | Window opens with search bar focused |

#### 2.1.6 Preview Panel (P1 - Should Have)

| ID | Requirement | Details |
|----|-------------|---------|
| PRV-01 | Show columns | List all columns with types |
| PRV-02 | Show primary key | Indicate PK column(s) |
| PRV-03 | Show foreign keys | Indicate FK columns with referenced table |
| PRV-04 | Show relationships | List tables that reference this table |
| PRV-05 | SQL preview | Show generated SQL before copying |
| PRV-06 | Keyboard navigation | Tab to open preview, arrow keys to navigate |

#### 2.1.7 Table Groups (P1 - Should Have)

| ID | Requirement | Details |
|----|-------------|---------|
| GRP-01 | Load groups from JSON | Read from config file |
| GRP-02 | Display in sidebar | Collapsible group list |
| GRP-03 | Group descriptions | Show on hover/expand |
| GRP-04 | Entry point marker | Highlight recommended starting table |
| GRP-05 | Table annotations | Show team notes for tables |
| GRP-06 | Column annotations | Show team notes for specific columns |
| GRP-07 | Multiple config sources | Local file + team shared file |

#### 2.1.8 Recent History (P1 - Should Have)

| ID | Requirement | Details |
|----|-------------|---------|
| HST-01 | Track recent searches | Store last 20 selected items |
| HST-02 | Display in sidebar | "Recent" section below groups |
| HST-03 | Click to search | Clicking recent item populates search |
| HST-04 | Clear history | Option to clear recent items |
| HST-05 | Persist across sessions | Save to local storage |

#### 2.1.9 Settings (P1 - Should Have)

| ID | Requirement | Details |
|----|-------------|---------|
| SET-01 | Connection management | Add/edit/remove connections |
| SET-02 | Hotkey customization | Change global hotkey |
| SET-03 | Row limit setting | Default SELECT row limit |
| SET-04 | Theme selection | Light / Dark / System |
| SET-05 | Auto-refresh schema | Enable/disable + frequency |
| SET-06 | Copy behavior | SQL only vs SQL + close window |
| SET-07 | Groups file path | Point to shared team JSON |

### 2.2 Non-Functional Requirements

#### 2.2.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-01 | App startup time | < 2 seconds |
| PERF-02 | Hotkey response | < 100ms to show window |
| PERF-03 | Search response | < 50ms for results update |
| PERF-04 | Schema indexing | < 30 seconds for 2000 tables |
| PERF-05 | Memory usage | < 200MB idle |

#### 2.2.2 Compatibility

| ID | Requirement | Details |
|----|-------------|---------|
| CMP-01 | Windows 10+ | Full support |
| CMP-02 | macOS 11+ | Full support |
| CMP-03 | Linux (Ubuntu 20.04+) | Full support |
| CMP-04 | SQL Server 2016+ | Full support |
| CMP-05 | Azure SQL Database | Support (Phase 2) |

#### 2.2.3 Security

| ID | Requirement | Details |
|----|-------------|---------|
| SEC-01 | No credential storage in plaintext | Encrypt SQL auth passwords |
| SEC-02 | Windows credential manager | Use OS secure storage for passwords |
| SEC-03 | No telemetry | No data sent to external servers |
| SEC-04 | Local-only operation | All data stays on user's machine |

#### 2.2.4 Usability

| ID | Requirement | Details |
|----|-------------|---------|
| USE-01 | Keyboard-first design | All actions accessible via keyboard |
| USE-02 | Minimal clicks | Core workflow: hotkey → type → enter |
| USE-03 | System tray | Minimize to tray, not taskbar |
| USE-04 | Auto-start option | Launch on system startup |

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Framework | Tauri 2.0 | Cross-platform, small bundle (~15MB), Rust performance |
| Frontend | React 18 + TypeScript | Component-based, strong typing |
| Styling | Tailwind CSS | Utility-first, consistent design |
| State | Zustand | Lightweight, simple API |
| Search | Fuse.js | Proven fuzzy search library |
| Backend | Rust | Native performance, SQL Server support via tiberius |
| Database Driver | tiberius | Rust SQL Server driver |
| Local Cache | SQLite (rusqlite) | Fast local queries |

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    React Frontend                        │   │
│   │                                                         │   │
│   │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  │   │
│   │  │ Search  │  │ Results  │  │ Preview │  │ Sidebar  │  │   │
│   │  │   Bar   │  │   List   │  │  Panel  │  │ (Groups) │  │   │
│   │  └────┬────┘  └────┬─────┘  └────┬────┘  └────┬─────┘  │   │
│   │       │            │             │            │         │   │
│   │       └────────────┴──────┬──────┴────────────┘         │   │
│   │                           │                             │   │
│   │                    ┌──────┴──────┐                      │   │
│   │                    │   Zustand   │                      │   │
│   │                    │    Store    │                      │   │
│   │                    └──────┬──────┘                      │   │
│   │                           │                             │   │
│   └───────────────────────────┼─────────────────────────────┘   │
│                               │                                 │
│                        Tauri IPC                                │
│                               │                                 │
│   ┌───────────────────────────┼─────────────────────────────┐   │
│   │                    Rust Backend                          │   │
│   │                           │                             │   │
│   │  ┌──────────┐  ┌─────────┴────────┐  ┌──────────────┐  │   │
│   │  │  Global  │  │     Commands     │  │    Schema    │  │   │
│   │  │  Hotkey  │  │  ───────────────  │  │    Cache     │  │   │
│   │  │  Handler │  │  • connect       │  │   (SQLite)   │  │   │
│   │  │          │  │  • get_schema    │  │              │  │   │
│   │  │          │  │  • search        │  │              │  │   │
│   │  │          │  │  • copy_to_clip  │  │              │  │   │
│   │  └──────────┘  └─────────┬────────┘  └──────┬───────┘  │   │
│   │                          │                  │          │   │
│   └──────────────────────────┼──────────────────┼──────────┘   │
│                              │                  │               │
└──────────────────────────────┼──────────────────┼───────────────┘
                               │                  │
                               ▼                  ▼
                    ┌──────────────────┐  ┌──────────────┐
                    │   SQL Server     │  │  Config File │
                    │   (tiberius)     │  │    (JSON)    │
                    └──────────────────┘  └──────────────┘
```

### 3.3 Data Flow

#### 3.3.1 Initial Connection Flow

```
User enters connection details
         │
         ▼
┌─────────────────────┐
│ Frontend validates  │
│ form inputs         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Tauri command:      │
│ test_connection()   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Rust: Connect to    │
│ SQL Server          │
└─────────┬───────────┘
          │
          ├──── Failure ────▶ Return error message
          │
          ▼ Success
┌─────────────────────┐
│ Tauri command:      │
│ save_connection()   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Write to config.json│
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Tauri command:      │
│ index_schema()      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Query SQL Server    │
│ for all metadata    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Cache in SQLite     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Return schema to    │
│ frontend            │
└─────────────────────┘
```

#### 3.3.2 Search Flow

```
User types in search bar
         │
         ▼
┌─────────────────────┐
│ Debounce input      │
│ (100ms)             │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Fuse.js fuzzy       │
│ search on cached    │
│ schema (in memory)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Rank results:       │
│ 1. Exact match      │
│ 2. Starts with      │
│ 3. Contains         │
│ 4. Recent boost     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Display top 20      │
│ results             │
└─────────────────────┘
```

### 3.4 File Structure

```
glance/
├── src/                          # React frontend
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── ResultsList.tsx
│   │   ├── ResultItem.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── Sidebar.tsx
│   │   ├── GroupList.tsx
│   │   ├── RecentList.tsx
│   │   ├── ConnectionForm.tsx
│   │   ├── Settings.tsx
│   │   └── Toast.tsx
│   ├── hooks/
│   │   ├── useSearch.ts
│   │   ├── useSchema.ts
│   │   ├── useClipboard.ts
│   │   ├── useHotkey.ts
│   │   └── useSettings.ts
│   ├── stores/
│   │   ├── schemaStore.ts
│   │   ├── searchStore.ts
│   │   ├── settingsStore.ts
│   │   └── historyStore.ts
│   ├── lib/
│   │   ├── fuzzySearch.ts
│   │   ├── sqlGenerator.ts
│   │   ├── tauri.ts            # Tauri IPC wrappers
│   │   └── types.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs     # connect, test_connection
│   │   │   ├── schema.rs         # get_schema, refresh_schema
│   │   │   └── clipboard.rs      # copy_to_clipboard
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── sqlserver.rs      # SQL Server connection
│   │   │   └── cache.rs          # SQLite cache
│   │   ├── config/
│   │   │   ├── mod.rs
│   │   │   └── settings.rs       # Load/save config
│   │   └── hotkey/
│   │       └── mod.rs            # Global hotkey registration
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
│
├── config/
│   └── schema-groups.example.json
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 4. Development Phases

### Phase 1: Core MVP (Weeks 1-2)

**Goal:** Working search + copy SQL

| Task | Priority | Estimate |
|------|----------|----------|
| Project setup (Tauri + React + TypeScript) | P0 | 2 hours |
| Connection form UI | P0 | 4 hours |
| SQL Server connection (Rust) | P0 | 8 hours |
| Schema extraction queries | P0 | 4 hours |
| Local SQLite cache | P0 | 4 hours |
| Search bar component | P0 | 4 hours |
| Fuzzy search with Fuse.js | P0 | 4 hours |
| Results list component | P0 | 4 hours |
| SQL generation | P0 | 2 hours |
| Copy to clipboard | P0 | 2 hours |
| Global hotkey (basic) | P0 | 4 hours |
| Basic styling | P0 | 4 hours |

**Deliverable:** App that connects to SQL Server, indexes schema, searches tables/columns, copies SELECT query.

### Phase 2: Enhanced UX (Week 3)

**Goal:** Preview panel + relationship view + groups

| Task | Priority | Estimate |
|------|----------|----------|
| Preview panel component | P1 | 6 hours |
| Column list view | P1 | 2 hours |
| Foreign key display | P1 | 4 hours |
| Relationship tree view | P1 | 6 hours |
| Groups sidebar | P1 | 4 hours |
| JSON config parser | P1 | 2 hours |
| Recent history | P1 | 3 hours |
| Keyboard navigation polish | P1 | 4 hours |

**Deliverable:** Full preview panel with relationships, sidebar with groups and recents.

### Phase 3: Polish + Settings (Week 4)

**Goal:** Production-ready UX

| Task | Priority | Estimate |
|------|----------|----------|
| Settings screen | P1 | 4 hours |
| Theme support (dark/light) | P2 | 4 hours |
| System tray integration | P2 | 4 hours |
| Auto-start option | P2 | 2 hours |
| Error handling polish | P1 | 4 hours |
| Loading states | P1 | 2 hours |
| Toast notifications | P1 | 2 hours |
| Build + distribution setup | P1 | 4 hours |

**Deliverable:** Polished app ready for team use.

---

## 5. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SQL Server driver issues in Rust | High | Medium | Test early; fallback to native Node addon |
| Large schema performance | Medium | Medium | Pagination; lazy loading; background indexing |
| Global hotkey conflicts | Low | Medium | Allow customization; detect conflicts |
| Cross-platform inconsistencies | Medium | Medium | Test on all platforms each phase |
| Team adoption resistance | Medium | Medium | Dogfood internally first; iterate on feedback |

---

## 6. Open Questions

1. **Multiple connections:** Should we support multiple database connections in Phase 1, or defer?
   - *Recommendation:* Defer to Phase 2, support single connection in MVP

2. **Query execution:** Should Glance also run queries and show results, or only generate SQL?
   - *Recommendation:* Generate SQL only in MVP; keeps scope small and avoids duplicating DBeaver

3. **Schema diffing:** Should we detect schema changes automatically?
   - *Recommendation:* Manual refresh in MVP; auto-detect as future enhancement

4. **Team sync:** How should teams share group configurations?
   - *Recommendation:* JSON file in Git repo; point to file path in settings

---

## 7. Appendices

### Appendix A: Competitive Analysis

| Tool | Strengths | Weaknesses | Glance Differentiator |
|------|-----------|------------|----------------------|
| DBeaver | Full-featured, free | Slow navigation, complex UI | Fast search, keyboard-first |
| DataGrip | Excellent code completion | $229/year, heavy | Lightweight, free, focused |
| Azure Data Studio | Modern UI, extensions | Microsoft-focused | Cross-platform, simpler |
| TablePlus | Clean UI, fast | $89 license, limited search | Better fuzzy search, groups |

### Appendix B: Keyboard Shortcuts Reference

| Context | Shortcut | Action |
|---------|----------|--------|
| Global | Ctrl+Shift+Space | Open Glance |
| App | Escape | Close / clear search |
| App | Ctrl+, | Open settings |
| Search | Enter | Copy SQL for selected |
| Search | Ctrl+Enter | Copy SQL and close |
| Search | Tab | Show preview |
| Search | ↑/↓ | Navigate results |
| Search | Ctrl+C | Copy name only |
| Preview | ← | Back to results |
| Preview | Ctrl+Click on FK | Add to JOIN query |

### Appendix C: Config File Schemas

**config.json:**
```json
{
  "connections": [
    {
      "id": "uuid",
      "name": "Display Name",
      "server": "localhost\\SQLEXPRESS",
      "database": "DatabaseName",
      "authType": "windows|sql",
      "username": "optional",
      "isDefault": true
    }
  ],
  "settings": {
    "hotkey": "Ctrl+Shift+Space",
    "rowLimit": 100,
    "theme": "system",
    "autoRefresh": false,
    "copyBehavior": "copyOnly",
    "groupsFilePath": "./schema-groups.json"
  },
  "recent": [
    {
      "type": "table",
      "name": "PERSON",
      "timestamp": "2024-12-19T10:00:00Z"
    }
  ]
}
```

**schema-groups.json:**
```json
{
  "version": "1.0",
  "groups": [
    {
      "id": "group-id",
      "name": "Group Name",
      "description": "Description",
      "icon": "📁",
      "entryPoint": "MAIN_TABLE",
      "tables": [
        {
          "name": "TABLE_NAME",
          "description": "Human-readable description",
          "tips": "Usage tips",
          "columns": {
            "column_name": {
              "description": "Column description"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 8. Implementation Status (Phase 1 - MVP Complete)

### 8.1 Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Database Connection** | ✅ Complete | SQL Server authentication working |
| **Schema Indexing** | ✅ Complete | Tables, columns, PKs, FKs extracted |
| **Local Schema Cache** | ✅ Complete | SQLite cache for offline use |
| **Fuzzy Search** | ✅ Complete | Multi-word, lenient matching |
| **SQL Generation** | ✅ Complete | Simplified output without TOP clause |
| **Clipboard Integration** | ✅ Complete | Using arboard crate |
| **Global Hotkey** | ✅ Complete | Cmd/Ctrl+Shift+Space |
| **Connection Persistence** | ✅ Complete | Auto-loads cached schema on restart |

### 8.2 Enhancements Implemented

| Enhancement | Description |
|-------------|-------------|
| **Lenient Fuzzy Search** | Multi-word queries ("lac status" finds "MO_CPIS_LAC_LEGAL_STATUS_CODES"), underscore-to-space conversion, higher threshold (0.5) |
| **Debounced Search** | 50ms debounce on keystroke to improve performance |
| **Cached Fuse Index** | Fuse.js index is cached and reused, not recreated on each search |
| **Simplified SQL Output** | No TOP clause; Column selection: `SELECT <column>, * FROM table` |
| **Auto-dismiss on Select** | Window hides and search clears after selecting an item |
| **Escape to Dismiss** | Global Escape key handler hides window |
| **Scroll-into-view** | Arrow key navigation auto-scrolls to keep selected item visible |
| **Compact Font Size** | Base font reduced to 13px for denser UI |
| **Disabled Autocorrect** | macOS text suggestions disabled on search input |
| **Password Pass-through** | Password passed directly to SQL Server (not stored in config) |

### 8.3 SQL Generation Behavior

**Table Selection:**
```sql
SELECT * FROM dbo.PERSON
```

**Column Selection:**
```sql
SELECT email, * FROM PERSON
```

### 8.4 Keyboard Shortcuts (Current)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+Space` | Show Glance window (global) |
| `Escape` | Hide window + clear search |
| `↑` / `↓` | Navigate results (with auto-scroll) |
| `Enter` | Copy SQL + hide window |
| `Cmd/Ctrl+1-9` | Quick select result 1-9 |

---

## 9. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Eng Leong | Initial draft |
| 1.1 | Dec 20, 2024 | Eng Leong | Added Phase 1 implementation status, documented enhancements |

---

*End of document*
