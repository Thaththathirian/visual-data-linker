import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderIcon, FileIcon, ChevronRightIcon, HomeIcon } from 'lucide-react';
import { FolderItem, FileItem } from '@/types';
import { getFolderContents } from '@/utils/folderUtils';
import { toast } from 'sonner';
import { folderHasWorkingCoordinates } from '@/utils/folderUtils';

interface FolderExplorerProps {
  onFolderSelect?: (path: string) => void;
  onFileSelect?: (file: FileItem) => void;
  initialPath?: string;
}

const FolderExplorer: React.FC<FolderExplorerProps> = ({ 
  onFolderSelect, 
  onFileSelect,
  initialPath
}) => {
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState<string>(initialPath || '');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [items, setItems] = useState<(FolderItem | FileItem)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedFolders, setHighlightedFolders] = useState<Record<string, boolean>>({});

  const loadFolderContents = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const contents = await getFolderContents(path);
      setItems(contents);
      
      // Update breadcrumbs
      const pathParts = path.split('/').filter(part => part.length > 0);
      setBreadcrumbs(pathParts);
      
      // Determine which immediate child folders have working coordinates
      const folderItems = contents.filter(item => item.type === 'folder') as FolderItem[];
      // Defer highlighting checks; don't block main list rendering
      (async () => {
        const results = await Promise.all(
          folderItems.map(async f => {
            const childPath = path ? `${path}/${f.name}` : f.name;
            const has = await folderHasWorkingCoordinates(childPath);
            return [childPath, has] as const;
          })
        );
        const map: Record<string, boolean> = {};
        for (const [p, has] of results) map[p] = has;
        setHighlightedFolders(map);
      })();
      
      // Check if this folder has a complete set based on base name matching
      const files = contents.filter(item => item.type !== 'folder') as FileItem[];
      const toBase = (name: string) => name
        .replace(/\.(json|csv|png|jpe?g|webp|gif)$/i, '')
        .replace(/-coordinates$/i, '');
      const jsonBases = new Set(files.filter(f => f.type === 'json').map(f => toBase(f.name)));
      const csvBases = new Set(files.filter(f => f.type === 'csv').map(f => toBase(f.name)));
      const imageBases = new Set(files.filter(f => ['png','jpg','jpeg','webp','gif'].includes(f.type)).map(f => toBase(f.name)));
      const completeBase = Array.from(jsonBases).find(b => csvBases.has(b) && imageBases.has(b));
      if (completeBase) {
        navigate(`/${encodeURIComponent(path)}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
      toast.error('Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolderContents(currentPath);
  }, [currentPath]);

  // Handle initialPath changes
  useEffect(() => {
    if (initialPath && initialPath !== currentPath) {
      setCurrentPath(initialPath);
    }
  }, [initialPath]);

  const handleFolderClick = (folder: FolderItem) => {
    const newPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
    setCurrentPath(newPath);
    onFolderSelect?.(newPath);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = breadcrumbs.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
    onFolderSelect?.(newPath);
  };

  const handleFileClick = (file: FileItem) => {
    onFileSelect?.(file);
  };

  const handleHomeClick = () => {
    setCurrentPath('');
    setBreadcrumbs([]);
    onFolderSelect?.('');
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'json') return '📄';
    if (file.type === 'csv') return '📊';
    if (file.type === 'png' || file.type === 'jpg' || file.type === 'jpeg') return '🖼️';
    return '📄';
  };

  const getFileBadgeColor = (file: FileItem) => {
    if (file.type === 'json') return 'bg-blue-100 text-blue-800';
    if (file.type === 'csv') return 'bg-green-100 text-green-800';
    if (file.type === 'png' || file.type === 'jpg' || file.type === 'jpeg') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg overflow-x-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHomeClick}
          className="flex items-center space-x-1 min-w-fit"
        >
          <HomeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center space-x-2 min-w-fit">
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBreadcrumbClick(index)}
              className="text-sm hover:bg-gray-200 min-w-fit"
            >
              {crumb}
            </Button>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadFolderContents(currentPath)}
              className="mt-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Folder and File List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Folders */}
          {items
            .filter(item => item.type === 'folder')
            .map((item) => (
              <Card 
                key={item.name} 
                className={`hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300 ${highlightedFolders[currentPath ? `${currentPath}/${item.name}` : item.name] ? 'border-indigo-400 bg-indigo-50' : 'border-blue-100'}`}
                onClick={() => handleFolderClick(item as FolderItem)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <FolderIcon className={`h-8 w-8 ${highlightedFolders[currentPath ? `${currentPath}/${item.name}` : item.name] ? 'text-indigo-600' : 'text-blue-600'}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500">
                        {(item as FolderItem).itemCount} items
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {/* Files */}
          {items
            .filter(item => item.type !== 'folder')
            .map((item) => (
              <Card 
                key={item.name} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-100 hover:border-gray-300"
                onClick={() => handleFileClick(item as FileItem)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(item as FileItem)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getFileBadgeColor(item as FileItem)}`}
                      >
                        {(item as FileItem).type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Folder</h3>
            <p className="text-gray-500">This folder contains no files or subfolders.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FolderExplorer;
