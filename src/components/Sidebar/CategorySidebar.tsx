import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { IntelliPartsCategoryGroup, IntelliPartsCategoryNode } from '@/utils/intelliPartsReader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CategorySidebarProps {
  categories?: IntelliPartsCategoryGroup[]; // IntelliParts category mode
  tree?: IntelliPartsCategoryNode; // new hierarchical mode
  selectedPath?: string[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  selectedMachine?: string;
  onCategorySelect?: (category: string) => void;
  onSubcategorySelect?: (category: string, subcategory: string) => void;
  onMachineSelect?: (category: string, subcategory: string, machine: string) => void;
  onSelectPath?: (path: string[]) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  tree,
  selectedPath,
  selectedCategory,
  selectedSubcategory,
  selectedMachine,
  onCategorySelect,
  onSubcategorySelect,
  onMachineSelect,
  onSelectPath
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Memoize the expanded categories calculation to prevent infinite loops
  const autoExpandedCategories = useMemo(() => {
    const newExpanded = new Set<string>();
    
    if (tree && selectedPath && selectedPath.length > 0) {
      // For hierarchical tree mode, expand all parent nodes
      for (let i = 0; i < selectedPath.length; i++) {
        const path = selectedPath.slice(0, i + 1);
        newExpanded.add(path.join(' / '));
      }
    } else if (categories && selectedCategory) {
      // For legacy two-level mode, expand the selected category
      newExpanded.add(selectedCategory);
    }
    
    return newExpanded;
  }, [tree, categories, selectedPath, selectedCategory]);

  // Auto-expand categories based on current selection
  useEffect(() => {
    setExpandedCategories(autoExpandedCategories);
  }, [autoExpandedCategories]);

  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryName)) {
        newExpanded.delete(categoryName);
      } else {
        newExpanded.add(categoryName);
      }
      return newExpanded;
    });
  }, []);

  const isExpanded = useCallback((categoryName: string) => expandedCategories.has(categoryName), [expandedCategories]);

  const handleNodeClick = useCallback((key: string, childPath: string[]) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    if (onSelectPath) onSelectPath(childPath);
  }, [onSelectPath]);

  const renderNode = useCallback((node: IntelliPartsCategoryNode, path: string[] = []) => {
    const children = Array.from(node.children.values());
    return (
      <div className="space-y-1">
        {children.map((child) => {
          const childPath = [...path, child.name];
          const key = childPath.join(' / ');
          const isOpen = expandedCategories.has(key);
          const isSelected = selectedPath && selectedPath.join(' / ') === key;
          return (
            <div key={key} className="space-y-1">
              <button
                onClick={() => handleNodeClick(key, childPath)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate">{child.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{child.name}</p>
                  </TooltipContent>
                </Tooltip>
                {child.children.size > 0 ? (
                  <div className="transition-transform duration-200 ease-in-out">
                    {isOpen ? <ChevronDownIcon className="h-4 w-4 flex-shrink-0" /> : <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />}
                  </div>
                ) : null}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen && child.children.size > 0 ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="ml-4 pt-1 max-h-72 overflow-y-auto">
                  {renderNode(child, childPath)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [expandedCategories, selectedPath, handleNodeClick]);

  return (
    <TooltipProvider>
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
      {tree ? (
        renderNode(tree, [])
      ) : categories ? (
      categories.map((category) => (
        <div key={category.name} className="space-y-1">
          {/* Main Category */}
          <button
            onClick={() => {
              // First select the category (this will filter the products)
              if (onCategorySelect) {
                onCategorySelect(category.name);
              }
              // Then toggle the expansion state
              toggleCategory(category.name);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedCategory === category.name
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate">{category.name}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{category.name}</p>
              </TooltipContent>
            </Tooltip>
            <div className="transition-transform duration-200 ease-in-out">
              {isExpanded(category.name) ? (
                <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
              )}
            </div>
          </button>

          {/* Subcategories and Machines */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded(category.name) ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="ml-4 space-y-1 pt-1 max-h-72 overflow-y-auto">
              {category.subcategories.map((subcategory) => (
                <div key={subcategory} className="space-y-1">
                  <button
                    onClick={() => onSubcategorySelect && onSubcategorySelect(category.name, subcategory)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors duration-200 ${
                      selectedCategory === category.name && selectedSubcategory === subcategory
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block">{subcategory}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{subcategory}</p>
                      </TooltipContent>
                    </Tooltip>
                  </button>
                  
                  {/* Show machines for this subcategory */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    selectedCategory === category.name && selectedSubcategory === subcategory 
                      ? 'max-h-60 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 space-y-1 pt-1 max-h-48 overflow-y-auto">
                      {category.machines
                        .filter(machine => 
                          category.items.some(item => 
                            item.sub_category === subcategory && item.machine_name === machine
                          )
                        )
                        .map((machine) => (
                        <button
                          key={machine}
                          onClick={() => onMachineSelect && onMachineSelect(category.name, subcategory, machine)}
                          className={`w-full text-left px-3 py-1 text-xs rounded-md transition-colors duration-200 ${
                            selectedCategory === category.name && selectedSubcategory === subcategory && selectedMachine === machine
                              ? 'bg-green-100 text-green-800 font-medium'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block">{machine}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{machine}</p>
                            </TooltipContent>
                          </Tooltip>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))
      ) : null}
      </div>
    </TooltipProvider>
  );
};

export default CategorySidebar;

