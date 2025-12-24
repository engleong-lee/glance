# Changelog

All notable changes to Glance will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-12-24

### Fixed
- 🔧 **Windows Build**: Fixed Windows integrated authentication support
  - Enabled `winauth` feature in tiberius crate for SSPI-based authentication
  - Windows users can now authenticate using their logged-in Windows credentials

---

## [1.0.0] - 2024-12-24

### Added
- **Core Features**
  - 🔍 Fuzzy search across tables and columns
  - 📊 Schema browsing with primary/foreign key display
  - 🔗 Relationship navigation via FK links
  - 📋 One-click SQL copying
  - 🏗️ JOIN query builder for multi-table queries

- **User Interface**
  - 🎨 Modern, responsive design
  - 🌙 Dark mode support (auto/manual)
  - 📱 Sidebar with groups and history
  - ⌨️ Comprehensive keyboard shortcuts
  - 💾 Preview panel for table details

- **Database Support**
  - SQL Server Authentication
  - Windows Authentication
  - Multiple connection management
  - Schema caching for offline browsing

- **Settings**
  - Theme preferences (Light/Dark/System)
  - Copy behavior customization
  - Row limit configuration
  - Auto-refresh schema options

### Technical
- Built with Tauri 2.0 for cross-platform support
- React + TypeScript frontend
- Zustand state management
- Fuse.js for fuzzy matching
- Tiberius for SQL Server connectivity

---

## Future Releases

### Planned Features
- [ ] Support for other databases (PostgreSQL, MySQL)
- [ ] Export schema documentation
- [ ] Query history with favorites
- [ ] Column statistics and data preview
