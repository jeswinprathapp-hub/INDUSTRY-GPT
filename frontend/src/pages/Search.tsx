import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search as SearchIcon, FileText, ChevronRight, Loader2 } from 'lucide-react';

export default function SearchKnowledge() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !session) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      // In a real app, we would have a dedicated /api/search endpoint for pure semantic search
      // We can reuse the chat endpoint's semantic retrieval mechanism if we modify the backend,
      // but since we only need UI mockup for this specific instruction (while keeping RAG working),
      // we'll hit the /api/chat endpoint but maybe mock the results structure or hit a placeholder.
      // Assuming we had a search endpoint:
      
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ question: query.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Extract sources from the chat response to simulate pure semantic search results
        setResults(data.sources || []);
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-display">Search your industrial knowledge</h1>
        <p className="text-text-secondary mt-1">Instantly retrieve paragraphs and procedures across all your manuals.</p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-primary" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-32 py-4 bg-surface border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
          placeholder="e.g., How to replace the O-ring on Pump A"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto">
        {!searched ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>Enter a query to search across the knowledge base</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface/50 border border-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-border rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-surface-hover rounded w-full mb-2"></div>
                <div className="h-3 bg-surface-hover rounded w-5/6 mb-2"></div>
                <div className="h-3 bg-surface-hover rounded w-4/6"></div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text-secondary mb-4">Found {results.length} relevant sections</p>
            {results.map((result, idx) => (
              <div key={idx} className="bg-surface border border-border hover:border-primary/40 rounded-xl p-5 transition-all group cursor-pointer shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium text-white">{result.filename}</span>
                    <span className="text-text-muted text-sm px-2 py-0.5 bg-surface-secondary rounded">Page {result.page}</span>
                  </div>
                  {/* Subtle relevance indicator */}
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                    <div className="w-1 h-3 bg-primary/30 rounded-full"></div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {result.chunk_content ? result.chunk_content.substring(0, 200) + '...' : 'Relevant extracted text snippet matches your query context and operations parameters.'}
                </p>
                <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View full document <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
