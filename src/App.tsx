import { useState, useEffect, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { ResultsList } from './components/ResultsList';
import { PreviewPanel } from './components/PreviewPanel';
import { Sidebar } from './components/Sidebar';
import { ConnectionForm } from './components/ConnectionForm';
import { Settings } from './components/Settings';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { ToastManager, useToast } from './components/Toast';
import { useSearch } from './hooks/useSearch';
import { useSearchStore } from './stores/searchStore';
import { useConnectionStore } from './stores/connectionStore';
import { useHistoryStore } from './stores/historyStore';
import { useJoinQueryStore } from './stores/joinQueryStore';
import { useSettingsStore } from './stores/settingsStore';
import { generateSqlFromResult } from './lib/sqlGenerator';
import { copyToClipboard, hideWindow } from './lib/tauri';
import type { SearchResult, Connection } from './lib/types';
import './App.css';

type View = 'search' | 'connection';

function App() {
  const [view, setView] = useState<View>('connection');
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'connections' | 'appearance' | 'shortcuts'>('general');
  const [showHelp, setShowHelp] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [cameFromSettings, setCameFromSettings] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const { showError, showSuccess, toasts, removeToast } = useToast();
  const { copyBehavior } = useSettingsStore();

  const {
    isConnected,
    currentConnection,
    schema,
    loadConnections,
    connect
  } = useConnectionStore();

  const { setTables, setColumns, clearSearch } = useSearchStore();
  const { recentItems, groups, addRecentItem, clearHistory } = useHistoryStore();
  const { isBuilding: isJoinBuilding, clearQuery: clearJoinQuery, getGeneratedSQL } = useJoinQueryStore();

  // Load connections and cached schema on mount
  useEffect(() => {
    const initApp = async () => {
      await loadConnections();

      // Check if we have a current connection and try to load cached schema
      const state = useConnectionStore.getState();
      if (state.currentConnection) {
        console.log('Found saved connection, loading cached schema...');
        try {
          const { getSchema } = await import('./lib/tauri');
          const cachedSchema = await getSchema();
          if (cachedSchema && cachedSchema.tables.length > 0) {
            console.log('Loaded cached schema:', cachedSchema.tables.length, 'tables');
            useConnectionStore.setState({
              schema: cachedSchema,
              isConnected: true
            });
          }
        } catch (e) {
          console.log('No cached schema available:', e);
        }
      }
    };
    initApp();
  }, [loadConnections]);

  // Update search store when schema changes
  useEffect(() => {
    if (schema) {
      setTables(schema.tables);
      setColumns(schema.columns);
    }
  }, [schema, setTables, setColumns]);

  // Switch to search view when connected and have schema
  useEffect(() => {
    if (isConnected && schema && schema.tables.length > 0) {
      setView('search');
    }
  }, [isConnected, schema]);

  const { query, results, selectedIndex, setQuery, setSelectedIndex, handleKeyDown, selectResult } = useSearch({
    onSelect: handleSelectResult,
  });

  // Handle going back in navigation
  const handleGoBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const newHistory = [...navigationHistory];
      const previousQuery = newHistory.pop()!;
      setNavigationHistory(newHistory);
      setQuery(previousQuery);
    }
  }, [navigationHistory, setQuery]);

  // Global Escape key handler to hide window
  const handleGlobalKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      // Reset all state
      clearSearch();
      clearJoinQuery();
      setSelectedIndex(0);
      setShowPreview(false);
      setNavigationHistory([]);
      try {
        await hideWindow();
      } catch (e) {
        console.error('Failed to hide window:', e);
      }
    }
    // Tab to toggle preview
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        setShowPreview(false);
      } else {
        setShowPreview(prev => !prev);
      }
    }
    // Ctrl+G to toggle sidebar
    if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
      event.preventDefault();
      setShowSidebar(prev => !prev);
    }
    // Backspace to go back when preview is shown and search is empty
    if (event.key === 'Backspace' && showPreview && navigationHistory.length > 0) {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput && searchInput.selectionStart === 0 && searchInput.selectionEnd === 0) {
        event.preventDefault();
        handleGoBack();
      }
    }
    // Left arrow to go back when preview is shown
    if (event.key === 'ArrowLeft' && showPreview && event.altKey) {
      event.preventDefault();
      handleGoBack();
    }
    // Ctrl+Shift+C to clear JOIN query
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      clearJoinQuery();
      showSuccess('JOIN query cleared');
    }
    // Ctrl+Enter to copy JOIN SQL (when building)
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && isJoinBuilding) {
      event.preventDefault();
      const joinSQL = getGeneratedSQL();
      if (joinSQL) {
        copyToClipboard(joinSQL).then(() => {
          showSuccess('JOIN SQL copied to clipboard');
        });
      }
    }
    // Cmd/Ctrl+, to open settings
    if ((event.ctrlKey || event.metaKey) && event.key === ',') {
      event.preventDefault();
      setShowSettings(true);
    }
    // ? to show help (when not typing in search)
    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      if (!isTyping) {
        event.preventDefault();
        setShowHelp(prev => !prev);
      }
    }
  }, [clearSearch, showPreview, navigationHistory.length, handleGoBack, clearJoinQuery, setSelectedIndex, isJoinBuilding, getGeneratedSQL, showSuccess, setShowSettings, setShowHelp]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  async function handleSelectResult(result: SearchResult) {
    try {
      const primaryKeys = schema?.primaryKeys || [];
      const sql = generateSqlFromResult(result, primaryKeys);
      await copyToClipboard(sql);

      // Add to recent items
      addRecentItem(result.displayName);

      // Show feedback
      showSuccess(`Copied SQL for ${result.displayName}`);

      // Handle copy behavior based on settings
      if (copyBehavior === 'copyAndClose') {
        clearSearch();
        setSelectedIndex(0);
        setShowPreview(false);
        setNavigationHistory([]);
        try {
          await hideWindow();
        } catch (e) {
          console.error('Failed to hide window:', e);
        }
      }
    } catch (err) {
      showError(`Failed to copy: ${err}`);
    }
  }

  // Get selected result for preview
  const selectedResult = results[selectedIndex] || null;

  // Navigate to table from sidebar or preview panel
  const handleNavigateToTable = (tableName: string) => {
    // Save current query to history if we have one
    if (query) {
      setNavigationHistory(prev => [...prev, query]);
    }
    setQuery(tableName);
    setShowPreview(true); // Auto-show preview when navigating from relationships
  };

  // Handle selecting from sidebar (without navigation history)
  const handleSidebarSelect = (tableName: string) => {
    setQuery(tableName);
    setNavigationHistory([]); // Clear navigation when selecting from sidebar
  };

  // Handle SQL copy from preview
  const handleCopySqlFromPreview = () => {
    showSuccess('SQL copied to clipboard');
  };

  const handleConnectionSaved = async (connection: Connection, password?: string) => {
    console.log('handleConnectionSaved called', connection.name);
    // Reload connections first (fast) so the list updates immediately
    await loadConnections();
    console.log('loadConnections completed, now connecting...');
    // Then connect and index schema (slow operation)
    await connect(connection, password);
    console.log('connect completed');
    setEditingConnection(null);
    setView('search');
  };

  return (
    <div className="app min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              ✨ Glance
            </h1>
            {view === 'search' && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${showSidebar ? 'text-blue-500' : 'text-gray-400'}`}
                title="Toggle sidebar (Ctrl+G)"
              >
                ☰
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentConnection && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentConnection.name}
              </span>
            )}
            {view === 'connection' ? (
              <button
                onClick={() => setView('search')}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                disabled={!isConnected}
              >
                Back to Search
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingConnection(null);
                    setView('connection');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title="Edit connection"
                >
                  🔗
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Settings
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - hidden when preview is shown for more space */}
        {view === 'search' && showSidebar && !showPreview && (
          <Sidebar
            groups={groups}
            recentItems={recentItems}
            onSelectTable={handleSidebarSelect}
            onClearHistory={clearHistory}
          />
        )}

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-5xl mx-auto">
            {view === 'connection' ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-xl mx-auto">
                <ConnectionForm
                  onConnectionSaved={handleConnectionSaved}
                  existingConnection={editingConnection || undefined}
                  onBack={(isConnected || cameFromSettings) ? () => {
                    if (cameFromSettings) {
                      // Return to Settings -> Connections tab
                      setEditingConnection(null);
                      setCameFromSettings(false);
                      setSettingsInitialTab('connections');
                      setShowSettings(true);
                      setView('search');
                    } else {
                      // Normal back to search
                      setEditingConnection(null);
                      setView('search');
                    }
                  } : undefined}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Breadcrumb Navigation */}
                {navigationHistory.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={handleGoBack}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                    >
                      <span>←</span>
                      <span>Back</span>
                    </button>
                    <nav className="flex items-center gap-1 text-gray-500 dark:text-gray-400 overflow-x-auto">
                      {navigationHistory.map((historyItem, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const newHistory = navigationHistory.slice(0, index);
                              setNavigationHistory(newHistory);
                              setQuery(historyItem);
                            }}
                            className="hover:text-blue-500 truncate max-w-[100px]"
                            title={historyItem}
                          >
                            {historyItem}
                          </button>
                          <span className="text-gray-400">→</span>
                        </span>
                      ))}
                      <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[150px]" title={query}>
                        {query}
                      </span>
                    </nav>
                  </div>
                )}

                {/* Search Bar */}
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onKeyDown={handleKeyDown}
                  placeholder={`Search ${schema?.tables.length || 0} tables, ${schema?.columns.length || 0} columns...`}
                />

                {/* Results and Preview Layout - each panel scrolls independently */}
                <div className={`flex gap-4 ${showPreview && results.length > 0 ? '' : ''}`} style={{ height: 'calc(100vh - 180px)' }}>
                  {/* Results Panel */}
                  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col ${showPreview && results.length > 0 ? 'w-1/2' : 'w-full'}`}>
                    {query.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-lg font-medium mb-2">Search your database</p>
                        <p className="text-sm">
                          Type to search {schema?.tables.length || 0} tables and {schema?.columns.length || 0} columns
                        </p>
                        <div className="mt-4 text-xs space-y-1">
                          <p><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">:col email</kbd> Search columns only</p>
                          <p><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">:table person</kbd> Search tables only</p>
                          <p><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">↑↓</kbd> Navigate • <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Enter</kbd> Copy SQL • <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Tab</kbd> Preview</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto">
                        <ResultsList
                          results={results}
                          selectedIndex={selectedIndex}
                          onSelect={selectResult}
                          onSelectionChange={setSelectedIndex}
                          query={query}
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview Panel - scrolls independently */}
                  {showPreview && results.length > 0 && (
                    <div className="w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto">
                        <PreviewPanel
                          result={selectedResult}
                          columns={schema?.columns || []}
                          foreignKeys={schema?.foreignKeys || []}
                          primaryKeys={schema?.primaryKeys || []}
                          onNavigateToTable={handleNavigateToTable}
                          onCopySQL={handleCopySqlFromPreview}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>⏎ Copy SQL</span>
            <span className={showPreview ? 'text-blue-500' : ''}>⇥ Preview {showPreview ? '(On)' : '(Off)'}</span>
            <span className={showSidebar ? 'text-blue-500' : ''}>⌘G Sidebar</span>
            {navigationHistory.length > 0 && <span>⌥← Back</span>}
            <span>⌘, Settings</span>
            <span>? Help</span>
            <span>Esc Close</span>
          </div>
          <div>
            {isConnected ? (
              <span className="text-green-500">● Connected</span>
            ) : (
              <span className="text-gray-400">○ Not connected</span>
            )}
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => {
            setShowSettings(false);
            setSettingsInitialTab('general'); // Reset to default for next open
          }}
          onEditConnection={(connection) => {
            setEditingConnection(connection);
            setCameFromSettings(true);
            setShowSettings(false);
            setView('connection');
          }}
          initialTab={settingsInitialTab}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowHelp(false)} />
      )}

      {/* Toasts */}
      <ToastManager toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
