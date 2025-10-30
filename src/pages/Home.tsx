
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CategorySidebar } from '@/components/Sidebar';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductFilter, BrandFilter } from '@/components/Filter';
import { 
  readIntelliPartsFromLocal, 
  groupIntelliPartsByCategory, 
  getIntelliPartsBySubcategory, 
  buildIntelliPartsCategoryTree,
  getIntelliPartsByMachine,
  getIntelliPartsByCategory
} from '@/utils/intelliPartsReader';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IntelliPartsItem } from '@/types';
import dataCache from '@/utils/dataCache';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [filteredItems, setFilteredItems] = useState<IntelliPartsItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Fetch IntelliParts data from local folder
  const { data: intelliPartsItems, isLoading, error } = useQuery({
    queryKey: ['intelliPartsData'],
    queryFn: readIntelliPartsFromLocal,
    staleTime: 30 * 60 * 1000, // 30 minutes - longer since we have our own cache
  });

  // Hide the global footer while Home is loading
  useEffect(() => {
    if (isLoading) {
      document.body.classList.add('hide-footer');
    } else {
      document.body.classList.remove('hide-footer');
    }
    return () => {
      document.body.classList.remove('hide-footer');
    };
  }, [isLoading]);

  const categories = React.useMemo(() => 
    intelliPartsItems ? groupIntelliPartsByCategory(intelliPartsItems) : [], 
    [intelliPartsItems]
  );
  const categoryTree = React.useMemo(() => 
    intelliPartsItems ? buildIntelliPartsCategoryTree(intelliPartsItems) : undefined, 
    [intelliPartsItems]
  );
  
  // Use only IntelliParts items - memoized to prevent recreation
  const allItems = React.useMemo(() => [...(intelliPartsItems || [])], [intelliPartsItems]);
  
  // Get items for the selected category/subcategory/machine with strict filtering
  const getItemsForSelection = () => {
    if (!selectedCategory) {
      console.log('[Filter] No category selected, returning empty array');
      return [];
    }
    
    console.log('[Filter] Filtering for category:', selectedCategory);
    console.log('[Filter] Selected subcategory:', selectedSubcategory);
    console.log('[Filter] Selected machine:', selectedMachine);
    console.log('[Filter] Selected path:', selectedPath);
    
    if (selectedPath && selectedPath.length > 0) {
      const targetLevels = selectedPath;
      const filtered = allItems.filter((item: IntelliPartsItem) => {
        const levels = [item.category, item.sub_category, item.machine_name].filter(Boolean);
        if (targetLevels.length === 1) {
          // Category clicked: include everything under that category
          const matches = levels[0] === targetLevels[0];
          if (!matches) {
            console.log('[Filter] Item rejected - category mismatch:', {
              itemCategory: levels[0],
              targetCategory: targetLevels[0],
              itemName: item.sparepartspage_name
            });
          }
          return matches;
        } else if (targetLevels.length === 2) {
          // Subcategory clicked: include everything under that subcategory
          const matches = levels[0] === targetLevels[0] && levels[1] === targetLevels[1];
          if (!matches) {
            console.log('[Filter] Item rejected - subcategory mismatch:', {
              itemCategory: levels[0],
              itemSubcategory: levels[1],
              targetCategory: targetLevels[0],
              targetSubcategory: targetLevels[1],
              itemName: item.sparepartspage_name
            });
          }
          return matches;
        } else if (targetLevels.length === 3) {
          // Machine clicked: show only items from that machine
          const matches = levels[0] === targetLevels[0] && levels[1] === targetLevels[1] && levels[2] === targetLevels[2];
          if (!matches) {
            console.log('[Filter] Item rejected - machine mismatch:', {
              itemCategory: levels[0],
              itemSubcategory: levels[1],
              itemMachine: levels[2],
              targetCategory: targetLevels[0],
              targetSubcategory: targetLevels[1],
              targetMachine: targetLevels[2],
              itemName: item.sparepartspage_name
            });
          }
          return matches;
        }
        return false;
      });
      
      // Remove duplicates based on a combination of fields to handle empty values
      const uniqueFiltered = filtered.filter((item, index, self) => {
        const itemKey = `${item.category}-${item.sub_category}-${item.machine_name}-${item.sparepartspage_name || 'unnamed'}-${item.sparepartspage_path || 'no-path'}`;
        return index === self.findIndex(t => {
          const tKey = `${t.category}-${t.sub_category}-${t.machine_name}-${t.sparepartspage_name || 'unnamed'}-${t.sparepartspage_path || 'no-path'}`;
          return tKey === itemKey;
        });
      });
      
      console.log('[Filter] Path-based filtering result:', uniqueFiltered.length, 'items (after deduplication)');
      return uniqueFiltered;
    } else if (selectedMachine) {
      // If machine is selected, show items from that machine
      const filtered = getIntelliPartsByMachine(allItems, selectedMachine);
      console.log('[Filter] Machine-based filtering result:', filtered.length, 'items');
      return filtered;
    } else if (selectedSubcategory) {
      // If subcategory is selected, show items from that subcategory
      const filtered = getIntelliPartsBySubcategory(allItems, selectedCategory, selectedSubcategory);
      
      // Remove duplicates based on a combination of fields to handle empty values
      const uniqueFiltered = filtered.filter((item, index, self) => {
        const itemKey = `${item.category}-${item.sub_category}-${item.machine_name}-${item.sparepartspage_name || 'unnamed'}-${item.sparepartspage_path || 'no-path'}`;
        return index === self.findIndex(t => {
          const tKey = `${t.category}-${t.sub_category}-${t.machine_name}-${t.sparepartspage_name || 'unnamed'}-${t.sparepartspage_path || 'no-path'}`;
          return tKey === itemKey;
        });
      });
      
      console.log('[Filter] Subcategory-based filtering result:', uniqueFiltered.length, 'items (after deduplication)');
      return uniqueFiltered;
    } else {
      // If only category is selected, show ALL items from that category with strict matching
      const filtered = allItems.filter((item: IntelliPartsItem) => {
        const matches = item.category === selectedCategory;
        if (!matches) {
          console.log('[Filter] Item rejected - category mismatch:', {
            itemCategory: item.category,
            targetCategory: selectedCategory,
            itemName: item.sparepartspage_name,
            itemSubcategory: item.sub_category,
            itemMachine: item.machine_name
          });
        }
        return matches;
      });
      
      // Remove duplicates based on a combination of fields to handle empty values
      const uniqueFiltered = filtered.filter((item, index, self) => {
        const itemKey = `${item.category}-${item.sub_category}-${item.machine_name}-${item.sparepartspage_name || 'unnamed'}-${item.sparepartspage_path || 'no-path'}`;
        return index === self.findIndex(t => {
          const tKey = `${t.category}-${t.sub_category}-${t.machine_name}-${t.sparepartspage_name || 'unnamed'}-${t.sparepartspage_path || 'no-path'}`;
          return tKey === itemKey;
        });
      });
      
      console.log('[Filter] Category-based filtering result:', uniqueFiltered.length, 'items (after deduplication)');
      console.log('[Filter] Filtered items:', uniqueFiltered.map(item => ({
        name: item.sparepartspage_name,
        category: item.category,
        subcategory: item.sub_category,
        machine: item.machine_name
      })));
      return uniqueFiltered;
    }
  };

  const categoryFilteredItems = React.useMemo(() => {
    return getItemsForSelection();
  }, [selectedCategory, selectedSubcategory, selectedMachine, selectedPath, allItems]);

  // Update filteredItems when category changes
  React.useEffect(() => {
    setFilteredItems(categoryFilteredItems);
  }, [categoryFilteredItems]);
  
  // Apply brand filter to category filtered items
  const brandFilteredItems = React.useMemo(() => {
    if (!selectedBrand) return categoryFilteredItems;
    return categoryFilteredItems.filter(item => item.brand === selectedBrand);
  }, [categoryFilteredItems, selectedBrand]);

  // Final filtered items - start with brand filtered items, then apply ProductFilter
  const finalFilteredItems = React.useMemo(() => {
    return filteredItems.length > 0 ? filteredItems : brandFilteredItems;
  }, [filteredItems, brandFilteredItems]);

  // Handle URL query parameters for navigation
  useEffect(() => {
    const pathParam = searchParams.get('path');
    const qCategory = searchParams.get('category');
    const qSubcategory = searchParams.get('subcategory');
    const qMachine = searchParams.get('machine');
    const catPath = searchParams.get('catpath');
    const qBrand = searchParams.get('brand');
    
    console.log('Home: URL params changed:', { pathParam, qCategory, qSubcategory, qMachine, catPath, qBrand });

    // Set brand filter
    if (qBrand && qBrand !== selectedBrand) {
      setSelectedBrand(qBrand);
    }

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
      if ((parts[2] || '') !== selectedMachine) {
        setSelectedMachine(parts[2] || '');
      }
      return;
    }

    if (qCategory) {
      if (qCategory !== selectedCategory) setSelectedCategory(qCategory);
      if ((qSubcategory || '') !== selectedSubcategory) setSelectedSubcategory(qSubcategory || '');
      if ((qMachine || '') !== selectedMachine) setSelectedMachine(qMachine || '');
      const nextPath = [qCategory, qSubcategory, qMachine].filter(Boolean);
      if (JSON.stringify(nextPath) !== JSON.stringify(selectedPath)) setSelectedPath(nextPath);
      return;
    }

    if (pathParam) {
      // Find the item that matches this path
      const source = allItems || [];
      const matchingItem = source.find(item => {
        return item.sparepartspage_path === pathParam;
      });
      
      if (matchingItem) {
        if (matchingItem.category !== selectedCategory) setSelectedCategory(matchingItem.category);
        if (matchingItem.sub_category !== selectedSubcategory) setSelectedSubcategory(matchingItem.sub_category);
        if (matchingItem.machine_name !== selectedMachine) setSelectedMachine(matchingItem.machine_name);
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
      if (selectedMachine) newBreadcrumbs.push(selectedMachine);
    }
    setBreadcrumbs(newBreadcrumbs);
    
    console.log('Home: Selection state changed:', {
      selectedPath,
      selectedCategory,
      selectedSubcategory,
      selectedMachine,
      newBreadcrumbs
    });
  }, [selectedPath, selectedCategory, selectedSubcategory, selectedMachine]);

  const handleCategorySelect = React.useCallback((category: string) => {
    if (category !== selectedCategory) setSelectedCategory(category);
    if (selectedSubcategory !== '') setSelectedSubcategory('');
    if (selectedMachine !== '') setSelectedMachine('');
    if (selectedPath.length !== 0) setSelectedPath([]);
    const qs = new URLSearchParams({ category }).toString();
    if (qs !== searchParams.toString()) navigate(`/?${qs}`);
  }, [selectedCategory, selectedSubcategory, selectedMachine, selectedPath, searchParams, navigate]);

  const handleSubcategorySelect = React.useCallback((category: string, subcategory: string) => {
    if (category !== selectedCategory) setSelectedCategory(category);
    if (subcategory !== selectedSubcategory) setSelectedSubcategory(subcategory);
    if (selectedMachine !== '') setSelectedMachine('');
    if (selectedPath.length !== 0) setSelectedPath([]);
    const qs = new URLSearchParams({ category, subcategory }).toString();
    if (qs !== searchParams.toString()) navigate(`/?${qs}`);
  }, [selectedCategory, selectedSubcategory, selectedMachine, selectedPath, searchParams, navigate]);

  const handleMachineSelect = React.useCallback((category: string, subcategory: string, machine: string) => {
    if (category !== selectedCategory) setSelectedCategory(category);
    if (subcategory !== selectedSubcategory) setSelectedSubcategory(subcategory);
    if (machine !== selectedMachine) setSelectedMachine(machine);
    if (selectedPath.length !== 0) setSelectedPath([]);
    const qs = new URLSearchParams({ category, subcategory, machine }).toString();
    if (qs !== searchParams.toString()) navigate(`/?${qs}`);
  }, [selectedCategory, selectedSubcategory, selectedMachine, selectedPath, searchParams, navigate]);

  const handleSelectPath = React.useCallback((path: string[]) => {
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
  }, [selectedPath, selectedCategory, selectedSubcategory, searchParams, navigate]);

  const handleItemClick = React.useCallback((item: IntelliPartsItem) => {
    // Navigate directly to the coordinate view using the sparepartspage_path
    const productPath = item.sparepartspage_path;
    
    if (!productPath) {
      console.error('No sparepartspage_path found for item:', item);
      toast.error('No coordinate data available for this item');
      return;
    }
    
    console.log('Navigating to coordinate view for folder:', productPath);
    console.log('Using sparepartspage_path:', productPath);
    
    // Preload product data if not already cached
    if (!dataCache.hasProductData(productPath)) {
      console.log(`[Cache] Preloading data for ${productPath}`);
      // The ImageDetail page will handle the actual loading
    }
    
    // Navigate to the ImageDetail page using the product path
    const query = new URLSearchParams({
      category: item.category || '',
      subcategory: item.sub_category || '',
      machine: item.machine_name || '',
      name: item.sparepartspage_name || '',
      brand: item.brand || ''
    }).toString();
    navigate(`/${encodeURIComponent(productPath)}?${query}`);
  }, [navigate]);

  const handleBreadcrumbClick = (index: number) => {
    const crumbs = selectedPath && selectedPath.length > 0
      ? selectedPath
      : [selectedCategory, selectedSubcategory, selectedMachine].filter(Boolean) as string[];

    const newPath = crumbs.slice(0, index + 1);

    if (JSON.stringify(newPath) !== JSON.stringify(selectedPath)) setSelectedPath(newPath);
    const nextCat = newPath[0] || '';
    const nextSub = newPath[1] || '';
    const nextMachine = newPath[2] || '';
    if (nextCat !== selectedCategory) setSelectedCategory(nextCat);
    if (nextSub !== selectedSubcategory) setSelectedSubcategory(nextSub);
    if (nextMachine !== selectedMachine) setSelectedMachine(nextMachine);

    if (newPath.length === 0) {
      if (searchParams.toString() !== '') navigate('/');
    } else if (newPath.length === 1) {
      const qs = new URLSearchParams({ category: newPath[0], catpath: newPath.join('>') }).toString();
      if (qs !== searchParams.toString()) navigate(`/?${qs}`);
    } else if (newPath.length === 2) {
      const qs = new URLSearchParams({ category: newPath[0], subcategory: newPath[1], catpath: newPath.join('>') }).toString();
      if (qs !== searchParams.toString()) navigate(`/?${qs}`);
    } else {
      const qs = new URLSearchParams({ category: newPath[0], subcategory: newPath[1], machine: newPath[2], catpath: newPath.join('>') }).toString();
      if (qs !== searchParams.toString()) navigate(`/?${qs}`);
    }
  };

  const handleBrandSelect = React.useCallback((brand: string) => {
    setSelectedBrand(brand);
    const currentParams = new URLSearchParams(searchParams);
    if (brand) {
      currentParams.set('brand', brand);
    } else {
      currentParams.delete('brand');
    }
    const newQuery = currentParams.toString();
    if (newQuery !== searchParams.toString()) {
      navigate(`/?${newQuery}`);
    }
  }, [searchParams, navigate]);

  const handleHomeClick = () => {
    if (selectedCategory !== '') setSelectedCategory('');
    if (selectedSubcategory !== '') setSelectedSubcategory('');
    if (selectedMachine !== '') setSelectedMachine('');
    if (selectedPath.length !== 0) setSelectedPath([]);
    if (selectedBrand !== '') setSelectedBrand('');
    // Clear any query params and navigate to true Home
    if (searchParams.toString() !== '') navigate('/');
  };



  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="flex items-center bg-white/70 rounded-md px-3 py-2 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading categories...</span>
        </div>
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
        selectedMachine={selectedMachine}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
        onMachineSelect={handleMachineSelect}
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
                    : (selectedMachine || selectedSubcategory || selectedCategory);
                  const brandLabel = selectedBrand ? ` (${selectedBrand} brand)` : '';
                  return finalFilteredItems.length > 0
                    ? `Showing ${finalFilteredItems.length} results`
                    : `No results found`;
                })()}
              </p>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          {selectedCategory ? (
            <div>
              {/* Brand Filter */}
              <BrandFilter 
                items={categoryFilteredItems} 
                selectedBrand={selectedBrand}
                onBrandSelect={handleBrandSelect}
              />
              
              {/* Product Filter - only apply additional filters, not category filtering */}
              <ProductFilter 
                items={brandFilteredItems} 
                onFilterChange={setFilteredItems} 
              />
              
              {/* Show the actual items/products, not just category info */}
              {finalFilteredItems.length > 0 ? (
                <ProductGrid items={finalFilteredItems} onItemClick={handleItemClick} />
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    No items found for {selectedMachine || selectedSubcategory || selectedCategory}
                    {selectedBrand && ` (${selectedBrand} brand)`}
                  </h2>
                  <p className="text-gray-600">
                    This category doesn't have any items yet.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Swastik</h1>
              <p className="text-gray-600 mb-8">
                Select a category from the sidebar to browse available parts and components.

              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 h-36 flex items-center justify-center"
                    onClick={() => handleCategorySelect(category.name)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug">{category.name}</h3>
                    </div>
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
