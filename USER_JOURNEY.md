# Glance - User Journey & UX Design

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Status:** Draft

---

## Executive Summary

Glance is a fast, lightweight database companion app that helps developers instantly find tables, understand relationships, and generate queries — without memorizing massive schemas. It works alongside existing tools (DBeaver, DataGrip, SSMS) rather than replacing them.

**Core value proposition:** "Cmd+K for your database"

---

## Target Users

### Primary Persona: The Overwhelmed Developer

**Name:** Sarah, Backend Developer  
**Context:** Works on a large enterprise application with 500+ database tables  
**Current tools:** DBeaver, VS Code, Slack  

**Pain points:**
- Spends 10-15 minutes per day searching for the right table
- Constantly asks teammates "which table has X?"
- Writes queries from memory, often with wrong column names
- New team members take weeks to understand the schema

**Goals:**
- Find any table/column in seconds
- Generate correct SQL without guessing
- Understand how tables relate to each other
- Onboard new team members faster

### Secondary Persona: The New Team Member

**Name:** Alex, Junior Developer (3 months on the team)  
**Context:** Just joined a team working on a legacy system  

**Pain points:**
- No documentation for the database
- Doesn't know where to start when given a task
- Afraid to ask "dumb questions" about which tables to use
- Makes mistakes due to misunderstanding the schema

**Goals:**
- Self-serve answers about the database
- Learn the schema progressively
- Build confidence through exploration

---

## User Journeys

### Journey 1: Quick Table Lookup

**Scenario:** Sarah needs to find the table that stores customer addresses.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CURRENT STATE                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Open DBeaver                                                 │
│ 2. Expand database tree                                         │
│ 3. Scroll through 500+ tables alphabetically                    │
│ 4. Try to guess: CUSTOMER_ADDRESS? ADDRESS? CLIENT_ADDR?        │
│ 5. Open each one to check columns                               │
│ 6. Finally find it (3-5 minutes)                                │
│                                                                 │
│ Frustration: HIGH                                               │
│ Time: 3-5 minutes                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     WITH GLANCE (Implemented)                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. Press Cmd+Shift+Space (global hotkey)                        │
│ 2. Type: "cust addr" (multi-word fuzzy search)                  │
│ 3. See fuzzy-matched results instantly:                         │
│    • CUSTOMER_ADDRESS (table)                                   │
│    • CUSTOMER.address_line_1 (column)                           │
│    • ADDRESS_TYPE (table)                                       │
│ 4. Press ↓/↑ to navigate (auto-scrolls into view)               │
│ 5. Press Enter on CUSTOMER_ADDRESS                              │
│ 6. SQL copied: SELECT * FROM dbo.CUSTOMER_ADDRESS               │
│ 7. Window automatically hides                                   │
│ 8. Paste into DBeaver, run                                      │
│                                                                 │
│ Frustration: NONE                                               │
│ Time: 5-10 seconds                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Implemented UX Flow:**

```
[Cmd+Shift+Space] → [Window Shows + Search Focused]
                              ↓
                    [Type Query - 50ms debounced]
                              ↓
                    [Results Update Live - Cached Fuse Index]
                              ↓
         [↑/↓ Keys Navigate + Auto-scroll into View]
                              ↓
              [Enter: SQL Copied + Window Hides]
                              ↓
                    [Paste in DBeaver]
```

**Key UX Features Implemented:**
- Window appears instantly after hotkey
- Search results update with 50ms debounce for performance
- Multi-word fuzzy matching (e.g., "lac status" finds "MO_CPIS_LAC_LEGAL_STATUS_CODES")
- Arrow key navigation with auto-scroll-into-view
- Single Enter copies SQL AND hides window
- Escape key hides window from anywhere

---

### Journey 2: Find a Column Across All Tables

**Scenario:** Sarah needs to find which tables have an "email" column.

```
┌─────────────────────────────────────────────────────────────────┐
│                        WITH GLANCE                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Press Ctrl+Shift+Space                                       │
│ 2. Type: "email" or ":col email" (column-specific search)       │
│ 3. See all columns containing "email":                          │
│    • PERSON.email_address                                       │
│    • CUSTOMER.email                                             │
│    • EMPLOYEE.work_email                                        │
│    • CONTACT.email_primary                                      │
│ 4. Select PERSON.email_address                                  │
│ 5. SQL copied: SELECT TOP 100 id, email_address FROM PERSON     │
└─────────────────────────────────────────────────────────────────┘
```

**UX Flow:**

```
[Search] → [Prefix with :col for column-only search]
                         ↓
            [Results show table.column format]
                         ↓
              [Select column → Smart SQL generated]
              (includes id + selected column)
```

**Key UX Requirements:**
- Column results clearly show parent table
- Generated SQL includes primary key + selected column
- User can customize default SELECT behavior in settings

---

### Journey 3: Explore Table Relationships

**Scenario:** Sarah selected CARE_PACKAGE and wants to understand what it connects to.

```
┌─────────────────────────────────────────────────────────────────┐
│                        WITH GLANCE                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Search and select CARE_PACKAGE                               │
│ 2. Preview panel shows:                                         │
│    • Column list                                                │
│    • Foreign key relationships:                                 │
│      → PERSON (person_id → id)                                  │
│      → PROVIDER (provider_id → id)                              │
│      ← CARE_PACKAGE_ITEM (package_id → id)                      │
│ 3. Click on PROVIDER to see its columns                         │
│ 4. Ctrl+Click to add to query builder                          │
│ 5. Generated: SELECT ... FROM CARE_PACKAGE JOIN PROVIDER...    │
└─────────────────────────────────────────────────────────────────┘
```

**UX Flow:**

```
[Select Table] → [Preview Panel Shows Details]
                           ↓
         [Relationships Section with → and ← indicators]
         (→ = this table references, ← = referenced by)
                           ↓
              [Click relationship to explore]
              [Ctrl+Click to add to JOIN]
```

**Key UX Requirements:**
- Clear visual distinction between outgoing (→) and incoming (←) relationships
- Clicking a relationship navigates to that table
- Ctrl+Click builds up a JOIN query incrementally

---

### Journey 4: Browse by Logical Groups

**Scenario:** Alex (new team member) wants to understand tables related to "Care Packages".

```
┌─────────────────────────────────────────────────────────────────┐
│                        WITH GLANCE                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Open Glance                                                  │
│ 2. Look at left sidebar "Groups"                                │
│ 3. Click "📁 Care Packages"                                     │
│ 4. See grouped tables with descriptions:                        │
│    • CARE_PACKAGE - Main package record                         │
│    • CARE_PACKAGE_ITEM - Individual services in package         │
│    • CARE_PACKAGE_STATUS - Status lookup                        │
│    • PROVIDER - Service providers                               │
│ 5. Entry point highlighted: "Start with CARE_PACKAGE"           │
│ 6. Click to explore each table                                  │
└─────────────────────────────────────────────────────────────────┘
```

**UX Flow:**

```
[Sidebar Groups] → [Click Group] → [See Curated Table List]
                                            ↓
                            [Each table has description]
                            [Entry point marked with ⭐]
                                            ↓
                                [Click to explore]
```

**Key UX Requirements:**
- Groups loaded from shared JSON config file
- Each group can have a description and "entry point" table
- Individual tables can have team-written notes
- Groups collapsible to reduce clutter

---

### Journey 5: First-Time Setup

**Scenario:** Sarah installs Glance and connects to her database for the first time.

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIRST-TIME EXPERIENCE                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Launch Glance                                                │
│ 2. Welcome screen: "Let's connect to your database"             │
│ 3. Form:                                                        │
│    • Server: localhost\SQLEXPRESS                               │
│    • Database: Mosaic                                           │
│    • Authentication: Windows Auth / SQL Auth                    │
│    • [Test Connection]                                          │
│ 4. "Connection successful! Indexing schema..."                  │
│ 5. Progress bar: "Found 2,147 tables, 28,493 columns"           │
│ 6. "Ready! Press Ctrl+Shift+Space anytime to search"            │
│ 7. Optional: "Import table groupings?" [Browse for JSON]        │
└─────────────────────────────────────────────────────────────────┘
```

**UX Flow:**

```
[First Launch] → [Welcome Screen] → [Connection Form]
                                          ↓
                               [Test Connection Button]
                                          ↓
                    [Success] → [Schema Indexing Progress]
                                          ↓
                         [Ready State + Hotkey Reminder]
                                          ↓
                     [Optional: Import Groups JSON]
```

**Key UX Requirements:**
- Test connection before saving
- Show indexing progress (users expect delay for large schemas)
- Clear success state with next-step guidance
- Connection saved to config file for next launch

---

## Screen Designs

### Main Window States

#### State 1: Empty/Ready State
```
┌─────────────────────────────────────────────────────────────────┐
│  Glance                                             [—] [□] [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍  Search tables or columns...                     ⌘⇧Space│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Groups          │  │                                     │  │
│  │                 │  │     Type to search 2,147 tables     │  │
│  │ 📁 Person       │  │     and 28,493 columns              │  │
│  │ 📁 Care Package │  │                                     │  │
│  │ 📁 Finance      │  │     💡 Tips:                        │  │
│  │ 📁 Providers    │  │     • Type table or column name     │  │
│  │                 │  │     • Use :col to search columns    │  │
│  │ ─────────────── │  │     • Press Enter to copy SQL       │  │
│  │ Recent          │  │                                     │  │
│  │                 │  │                                     │  │
│  │ 🕐 CARE_PACKAGE │  │                                     │  │
│  │ 🕐 PERSON       │  │                                     │  │
│  │                 │  │                                     │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
│                                                                 │
│  Connected: mosaic-dev (2,147 tables)               [⚙ Settings]│
└─────────────────────────────────────────────────────────────────┘
```

#### State 2: Search Results
```
┌─────────────────────────────────────────────────────────────────┐
│  Glance                                             [—] [□] [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍  person addr                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Groups          │  │ Results (4)                         │  │
│  │                 │  │                                     │  │
│  │ 📁 Person       │  │ ▶ 📋 PERSON_ADDRESS                 │  │
│  │ 📁 Care Package │  │   Address records for persons       │  │
│  │ 📁 Finance      │  │                                     │  │
│  │ 📁 Providers    │  │   📋 PERSON_ADDRESS_HISTORY         │  │
│  │                 │  │   Historical address changes        │  │
│  │ ─────────────── │  │                                     │  │
│  │ Recent          │  │   📄 PERSON.address_line_1          │  │
│  │                 │  │   Column in PERSON                  │  │
│  │ 🕐 CARE_PACKAGE │  │                                     │  │
│  │ 🕐 PERSON       │  │   📄 PERSON.address_line_2          │  │
│  │                 │  │   Column in PERSON                  │  │
│  │                 │  │                                     │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
│                                                                 │
│  ↑↓ Navigate  ⏎ Copy SQL  ⇥ Preview  Esc Close                 │
└─────────────────────────────────────────────────────────────────┘
```

#### State 3: Table Preview
```
┌─────────────────────────────────────────────────────────────────┐
│  Glance                                             [—] [□] [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍  person addr                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Results (4)     │  │ PERSON_ADDRESS                      │  │
│  │                 │  │ Address records for persons         │  │
│  │ ▶📋 PERSON_ADDR │  │                                     │  │
│  │  📋 PERSON_ADD… │  │ Columns (8):                        │  │
│  │  📄 PERSON.add… │  │ ├─ id (int, PK)                     │  │
│  │  📄 PERSON.add… │  │ ├─ person_id (int, FK → PERSON)     │  │
│  │                 │  │ ├─ address_line_1 (varchar)         │  │
│  │                 │  │ ├─ address_line_2 (varchar)         │  │
│  │                 │  │ ├─ city (varchar)                   │  │
│  │                 │  │ ├─ postcode (varchar)               │  │
│  │                 │  │ ├─ address_type_id (int, FK)        │  │
│  │                 │  │ └─ created_at (datetime)            │  │
│  │                 │  │                                     │  │
│  │                 │  │ Relationships:                      │  │
│  │                 │  │ → PERSON (person_id)                │  │
│  │                 │  │ → ADDRESS_TYPE (address_type_id)    │  │
│  │                 │  │                                     │  │
│  │                 │  │ ┌─────────────────────────────────┐ │  │
│  │                 │  │ │SELECT TOP 100 * FROM            │ │  │
│  │                 │  │ │PERSON_ADDRESS                   │ │  │
│  │                 │  │ └─────────────────────────────────┘ │  │
│  │                 │  │                        [Copy SQL]   │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
│                                                                 │
│  ↑↓ Navigate  ⏎ Copy SQL  ← Back  Esc Close                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

### Implemented Shortcuts

| Shortcut | Action | Status |
|----------|--------|--------|
| `Cmd+Shift+Space` | Show Glance window (global, macOS) | ✅ Implemented |
| `Ctrl+Shift+Space` | Show Glance window (global, Windows/Linux) | ✅ Implemented |
| `Escape` | Hide window + clear search | ✅ Implemented |
| `↑` / `↓` | Navigate results (with auto-scroll) | ✅ Implemented |
| `Enter` | Copy SQL + hide window | ✅ Implemented |
| `Cmd/Ctrl+1-9` | Quick select result 1-9 | ✅ Implemented |

### Planned Shortcuts (Phase 2)

| Shortcut | Action |
|----------|--------|
| `Tab` | Show preview panel |
| `Ctrl+Enter` | Copy SQL without closing |
| `Ctrl+C` | Copy table/column name only |
| `Ctrl+G` | Toggle groups sidebar |
| `Ctrl+,` | Open settings |

---

## Search Behavior

### Fuzzy Matching Rules

1. **Partial matching:** "cust addr" matches "CUSTOMER_ADDRESS"
2. **Word boundary boost:** "person" ranks "PERSON" higher than "PERSON_ROLE"
3. **Recency boost:** Recently accessed tables rank higher
4. **Column prefix:** `:col email` searches only columns

### Result Ranking (Priority Order)

1. Exact table name match
2. Table name starts with query
3. Table name contains query
4. Column name match (with parent table)
5. Table/column description match (from JSON annotations)

### Search Prefixes

| Prefix | Behavior | Example |
|--------|----------|---------|
| (none) | Search tables and columns | `person` |
| `:col` | Search columns only | `:col email` |
| `:table` | Search tables only | `:table care` |
| `:group` | Search within groups | `:group finance` |

---

## Interaction Patterns

### Copy SQL Behavior (Implemented)

When user presses Enter on a **table**:
```sql
SELECT * FROM dbo.PERSON_ADDRESS
```
*(No TOP clause - simplified for flexibility)*

When user presses Enter on a **column**:
```sql
SELECT email_address, * FROM PERSON
```
*(Selected column first, then all columns)*

When user builds a **JOIN** (Phase 2 - Planned):
```sql
SELECT 
    cp.id,
    cp.start_date,
    p.first_name,
    p.last_name
FROM CARE_PACKAGE cp
JOIN PERSON p ON p.id = cp.person_id
```

### Settings (Configurable)

| Setting | Options | Default |
|---------|---------|---------|
| Default row limit | 10, 50, 100, 500 | 100 |
| SQL style | TOP N / LIMIT N | TOP N (SQL Server) |
| Copy behavior | SQL only / SQL + close window | SQL only |
| Theme | Light / Dark / System | System |
| Hotkey | Customizable | Ctrl+Shift+Space |
| Show descriptions | Yes / No | Yes |

---

## Error States

### Connection Failed
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Unable to connect to database                              │
│                                                                 │
│  Error: Login failed for user 'sa'                              │
│                                                                 │
│  [Try Again]  [Edit Connection]  [Work Offline]                 │
└─────────────────────────────────────────────────────────────────┘
```

### No Results
```
┌─────────────────────────────────────────────────────────────────┐
│  🔍  xyznonexistent                                             │
│                                                                 │
│  No tables or columns match "xyznonexistent"                    │
│                                                                 │
│  Try:                                                           │
│  • Using fewer characters                                       │
│  • Checking for typos                                           │
│  • Searching by column with :col                                │
└─────────────────────────────────────────────────────────────────┘
```

### Schema Refresh Needed
```
┌─────────────────────────────────────────────────────────────────┐
│  ℹ️  Schema may be outdated (last updated 7 days ago)           │
│                                                                 │
│  [Refresh Now]  [Remind Later]  [Dismiss]                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### Quantitative
- Time to find a table: < 10 seconds (vs 3-5 minutes)
- Daily active usage: > 5 searches per developer
- Schema indexed in < 30 seconds for 2000+ tables

### Qualitative
- "I don't ask teammates for table names anymore"
- "New developers onboard faster"
- "I write fewer wrong queries"

---

## Appendix: Group Configuration JSON Schema

```json
{
  "$schema": "https://glance.dev/schema/groups.json",
  "version": "1.0",
  "database": "Mosaic",
  "groups": [
    {
      "id": "person-management",
      "name": "Person Management",
      "description": "Core person/client records and related data",
      "icon": "👤",
      "entryPoint": "PERSON",
      "tables": [
        {
          "name": "PERSON",
          "description": "Core client record - one row per person",
          "tips": "Always check status_id before assuming active",
          "commonJoins": ["PERSON_ADDRESS", "CARE_PACKAGE"]
        },
        {
          "name": "PERSON_ADDRESS",
          "description": "Address history for persons"
        },
        {
          "name": "PERSON_CONTACT",
          "description": "Phone numbers, emails, etc."
        }
      ]
    },
    {
      "id": "care-packages",
      "name": "Care Packages",
      "description": "Service packages and allocations",
      "icon": "📦",
      "entryPoint": "CARE_PACKAGE",
      "tables": [
        {
          "name": "CARE_PACKAGE",
          "description": "Main care package record",
          "columns": {
            "status_id": {
              "description": "1=Draft, 2=Active, 3=Ended, 4=Cancelled"
            }
          }
        }
      ]
    }
  ]
}
```

---

## Implementation Status

### Phase 1 MVP - Complete ✅

| Journey | Status | Notes |
|---------|--------|-------|
| Journey 1: Quick Table Lookup | ✅ Complete | Full fuzzy search, auto-dismiss, clipboard |
| Journey 2: Find Column | ✅ Complete | `:col` prefix, column-first SQL output |
| Journey 3: Table Relationships | 🔲 Phase 2 | Preview panel planned |
| Journey 4: Browse by Groups | 🔲 Phase 2 | Sidebar groups planned |
| Journey 5: First-Time Setup | ✅ Complete | Connection form, schema indexing |

### UX Enhancements Implemented

| Enhancement | Description |
|-------------|-------------|
| Multi-word Fuzzy Search | "lac status" matches "MO_CPIS_LAC_LEGAL_STATUS_CODES" |
| Auto-scroll Navigation | ↑/↓ keys scroll selected item into view |
| Auto-dismiss on Select | Enter copies SQL AND hides window |
| Escape to Dismiss | Press Escape anywhere to hide |
| Compact UI | 13px base font for denser information |
| Disabled Autocorrect | No macOS text suggestions in search |
| Connection Persistence | Auto-loads cached schema on restart |
| Debounced Search | 50ms debounce for performance |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial draft |
| 1.1 | Dec 20, 2024 | Updated with Phase 1 implementation status, current UX behavior |

---

*Document end*
