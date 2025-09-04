import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { CategoryGroup, CategoryNode } from '@/utils/indexReader';

interface CategorySidebarProps {
  categories?: CategoryGroup[]; // legacy two-level mode
  tree?: CategoryNode; // new hierarchical mode
  selectedPath?: string[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategorySelect?: (category: string) => void;
  onSubcategorySelect?: (category: string, subcategory: string) => void;
  onSelectPath?: (path: string[]) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  tree,
  selectedPath,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  onSelectPath
}) => {
  console.log('CategorySidebar render:', {
    selectedPath,
    selectedCategory,
    selectedSubcategory,
    hasTree: !!tree,
    hasCategories: !!categories
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Auto-expand categories based on current selection
  useEffect(() => {
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
    
    console.log('CategorySidebar: Auto-expanding categories:', {
      selectedPath,
      selectedCategory,
      selectedSubcategory,
      newExpanded: Array.from(newExpanded)
    });
    
    setExpandedCategories(newExpanded);
  }, [tree, categories, selectedPath, selectedCategory]);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const isExpanded = (categoryName: string) => expandedCategories.has(categoryName);

  const renderNode = (node: CategoryNode, path: string[] = []) => {
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
                onClick={() => {
                  const next = new Set(expandedCategories);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  setExpandedCategories(next);
                  if (onSelectPath) onSelectPath(childPath);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="truncate">{child.name}</span>
                {child.children.size > 0 ? (
                  isOpen ? <ChevronDownIcon className="h-4 w-4 flex-shrink-0" /> : <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                ) : null}
              </button>
              {isOpen && child.children.size > 0 && (
                <div className="ml-4">
                  {renderNode(child, childPath)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-2">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
      {tree ? (
        renderNode(tree, [])
      ) : categories ? (
      categories.map((category) => (
        <div key={category.name} className="space-y-1">
          {/* Main Category */}
          <button
            onClick={() => toggleCategory(category.name)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedCategory === category.name
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="truncate">{category.name}</span>
            {isExpanded(category.name) ? (
              <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
            )}
          </button>

          {/* Subcategories */}
          {isExpanded(category.name) && (
            <div className="ml-4 space-y-1">
              {category.subcategories.map((subcategory) => (
                <button
                  key={subcategory}
                  onClick={() => onSubcategorySelect && onSubcategorySelect(category.name, subcategory)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors ${
                    selectedCategory === category.name && selectedSubcategory === subcategory
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  {subcategory}
                </button>
              ))}
            </div>
          )}
        </div>
      ))
      ) : null}
    </div>
  );
};

export default CategorySidebar;

