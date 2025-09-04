
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CategorySidebar } from '@/components/Sidebar';
import { ProductGrid } from '@/components/ProductGrid';
import { readIndexFromDrive, groupByCategory, getItemsBySubcategory, buildCategoryTree } from '@/utils/indexReader';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);


  // Fetch index data from Google Drive
  const { data: indexItems, isLoading, error } = useQuery({
    queryKey: ['indexData'],
    queryFn: readIndexFromDrive,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categories = indexItems ? groupByCategory(indexItems) : [];
  const categoryTree = indexItems ? buildCategoryTree(indexItems) : undefined;
  
  // Use only index.csv items - memoized to prevent recreation
  const allItems = React.useMemo(() => [...(indexItems || [])], [indexItems]);
  
  // Get items for the selected category/subcategory
  const getItemsForSelection = () => {
    if (!selectedCategory) return [];
    
    if (selectedPath && selectedPath.length > 0) {
      const targetLevels = selectedPath;
      return allItems.filter((item: any) => {
        const levels = item.category_path
          ? String(item.category_path)
              .split('>')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [item.category, item.subcategory].filter(Boolean);
        if (targetLevels.length === 1) {
          // Category clicked: include everything under that category (with or without subcategory)
          return levels[0] === targetLevels[0];
        }
        // For deeper nodes, require exact match
        return levels.join('>') === targetLevels.join('>');
      });
    } else if (selectedSubcategory) {
      // If subcategory is selected, show items from that subcategory
      return getItemsBySubcategory(allItems, selectedCategory, selectedSubcategory);
    } else {
      // If only category is selected, show ALL items from that category (all subcategories)
      return allItems.filter(item => item.category === selectedCategory);
    }
  };

  const filteredItems = getItemsForSelection();



  // Handle URL query parameters for navigation (path or category/subcategory or hierarchical catpath)
  useEffect(() => {
    const pathParam = searchParams.get('path');
    const qCategory = searchParams.get('category');
    const qSubcategory = searchParams.get('subcategory');
    const catPath = searchParams.get('catpath');
    
    console.log('Home: URL params changed:', { pathParam, qCategory, qSubcategory, catPath });

    // Highest priority: explicit hierarchical category path
    if (catPath) {
      const parts = catPath.split('>')
        .map(s => s.trim())
        .filter(Boolean);
      if (JSON.stringify(parts) !== JSON.stringify(selectedPath)) {
        setSelectedPath(parts);
      }
      if ((parts[0] || '') !== selectedCategory) {
        setSelectedCategory(parts[0] || '');
      }
      if ((parts[1] || '') !== selectedSubcategory) {
        setSelectedSubcategory(parts[1] || '');
      }
      return;
    }

    if (qCategory) {
      if (qCategory !== selectedCategory) setSelectedCategory(qCategory);
      if ((qSubcategory || '') !== selectedSubcategory) setSelectedSubcategory(qSubcategory || '');
      const nextPath = qSubcategory ? [qCategory, qSubcategory] : [qCategory];
      if (JSON.stringify(nextPath) !== JSON.stringify(selectedPath)) setSelectedPath(nextPath);
      return;
    }

    if (pathParam) {
      // Find the item that matches this path
      const source = allItems || [];
      const matchingItem = source.find(item => {
        const itemPath = item.coordinates_path || item.data_path;
        if (!itemPath) return false;
        const folderPath = itemPath.split('/').slice(0, -1).join('/');
        return folderPath === pathParam;
      });
      
      if (matchingItem) {
        if (matchingItem.category !== selectedCategory) setSelectedCategory(matchingItem.category);
        if ((matchingItem.subcategory || '') !== selectedSubcategory) setSelectedSubcategory(matchingItem.subcategory);
      }
    }
  }, [searchParams.toString()]);

  // Update breadcrumbs when selection changes
  useEffect(() => {
    let newBreadcrumbs: string[] = [];
    if (selectedPath && selectedPath.length > 0) {
      newBreadcrumbs = [...selectedPath];
    } else if (selectedCategory) {
      newBreadcrumbs = [selectedCategory];
      if (selectedSubcategory) newBreadcrumbs.push(selectedSubcategory);
    }
    setBreadcrumbs(newBreadcrumbs);
    
    console.log('Home: Selection state changed:', {
      selectedPath,
      selectedCategory,
      selectedSubcategory,
      newBreadcrumbs
    });
  }, [selectedPath, selectedCategory, selectedSubcategory]);

  const handleCategorySelect = (category: string) => {
    if (category !== selectedCategory) setSelectedCategory(category);
    if (selectedSubcategory !== '') setSelectedSubcategory('');
    if (selectedPath.length !== 0) setSelectedPath([]);
    const qs = new URLSearchParams({ category }).toString();
    if (qs !== searchParams.toString()) navigate(`/?${qs}`);
  };

  const handleSubcategorySelect = (category: string, subcategory: string) => {
    if (category !== selectedCategory) setSelectedCategory(category);
    if (subcategory !== selectedSubcategory) setSelectedSubcategory(subcategory);
    if (selectedPath.length !== 0) setSelectedPath([]);
    const qs = new URLSearchParams({ category, subcategory }).toString();
    if (qs !== searchParams.toString()) navigate(`/?${qs}`);
  };

  const handleSelectPath = (path: string[]) => {
    if (JSON.stringify(path) !== JSON.stringify(selectedPath)) setSelectedPath(path);
    // Also update legacy selections for breadcrumb display
    const nextCat = path[0] || '';
    const nextSub = path[1] || '';
    if (nextCat !== selectedCategory) setSelectedCategory(nextCat);
    if (nextSub !== selectedSubcategory) setSelectedSubcategory(nextSub);
    if (path.length === 0) {
      if (searchParams.toString() !== '') navigate('/');
    } else if (path.length === 1) {
      const qs = new URLSearchParams({ category: path[0], catpath: path.join('>') }).toString();
      if (qs !== searchParams.toString()) navigate(`/?${qs}`);
    } else if (path.length >= 2) {
      const qs = new URLSearchParams({ category: path[0], subcategory: path[1], catpath: path.join('>') }).toString();
      if (qs !== searchParams.toString()) navigate(`/?${qs}`);
    }
  };

  const handleItemClick = (item: any) => {
    // Navigate directly to the coordinate view using the coordinates_path
    const coordinatesPath = item.coordinates_path;
    
    if (!coordinatesPath) {
      console.error('No coordinates_path found for item:', item);
      toast.error('No coordinate data available for this item');
      return;
    }
    
    // Extract the folder path from the coordinates_path (remove the filename)
    const pathParts = coordinatesPath.split('/');
    const folderPath = pathParts.slice(0, -1).join('/');
    
    console.log('Navigating to coordinate view for folder:', folderPath);
    console.log('Using coordinates_path:', coordinatesPath);
    
    // Navigate to the ImageDetail page using the folder path
    const query = new URLSearchParams({
      category: item.category || '',
      subcategory: item.subcategory || '',
      name: item.file_name || ''
    }).toString();
    navigate(`/${encodeURIComponent(folderPath)}?${query}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    const crumbs = selectedPath && selectedPath.length > 0
      ? selectedPath
      : [selectedCategory, selectedSubcategory].filter(Boolean) as string[];

    const newPath = crumbs.slice(0, index + 1);

    if (JSON.stringify(newPath) !== JSON.stringify(selectedPath)) setSelectedPath(newPath);
    const nextCat = newPath[0] || '';
    const nextSub = newPath[1] || '';
    if (nextCat !== selectedCategory) setSelectedCategory(nextCat);
    if (nextSub !== selectedSubcategory) setSelectedSubcategory(nextSub);

    if (newPath.length === 0) {
      if (searchParams.toString() !== '') navigate('/');
    } else if (newPath.length === 1) {
      const qs = new URLSearchParams({ category: newPath[0], catpath: newPath.join('>') }).toString();
      if (qs !== searchParams.toString()) navigate(`/?${qs}`);
    } else {
      const qs = new URLSearchParams({ category: newPath[0], subcategory: newPath[1], catpath: newPath.join('>') }).toString();
      if (qs !== searchParams.toString()) navigate(`/?${qs}`);
    }
  };

  const handleHomeClick = () => {
    if (selectedCategory !== '') setSelectedCategory('');
    if (selectedSubcategory !== '') setSelectedSubcategory('');
    if (selectedPath.length !== 0) setSelectedPath([]);
    // Clear any query params and navigate to true Home
    if (searchParams.toString() !== '') navigate('/');
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">
            Failed to load the index data. Please check your Google Drive configuration.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <CategorySidebar
        tree={categoryTree}
        categories={categories}
        selectedPath={selectedPath}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
        onSelectPath={handleSelectPath}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header with Breadcrumbs */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHomeClick}
                className="flex items-center space-x-1 p-0 h-auto text-gray-600 hover:text-gray-900"
              >
                <HomeIcon className="h-4 w-4" />
                <span>Home</span>
              </Button>
              
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBreadcrumbClick(index)}
                    className="p-0 h-auto text-gray-600 hover:text-gray-900"
                  >
                    {crumb}
                  </Button>
                </div>
              ))}
            </div>


          </div>

          {/* Results Info */}
          {selectedCategory && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {(() => {
                  const displayLabel = selectedPath && selectedPath.length > 0
                    ? selectedPath[selectedPath.length - 1]
                    : (selectedSubcategory || selectedCategory);
                  return filteredItems.length > 0
                    ? `Showing ${filteredItems.length} results for ${displayLabel}`
                    : `No results found for ${displayLabel}`;
                })()}

              </p>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          {selectedCategory ? (
            <div>
              {/* Show the actual items/products, not just category info */}
              {filteredItems.length > 0 ? (
                <ProductGrid items={filteredItems} onItemClick={handleItemClick} />
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    No items found for {selectedSubcategory || selectedCategory}
                  </h2>
                  <p className="text-gray-600">
                    This category doesn't have any items yet.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Visual Data Linker</h1>
              <p className="text-gray-600 mb-8">
                Select a category from the sidebar to browse available parts and components.

              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => handleCategorySelect(category.name)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {category.subcategories.length} subcategories
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.items.length} total items
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
