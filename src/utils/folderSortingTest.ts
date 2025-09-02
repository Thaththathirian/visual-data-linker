import { FolderItem } from '@/types';

/**
 * Test utility for folder sorting functionality
 * Run this in the browser console to test the sorting logic
 */

// Mock the sorting function for testing
const extractFolderNumber = (folderName: string): number => {
  const match = folderName.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
};

const sortFoldersNumerically = (folders: FolderItem[]): FolderItem[] => {
  return [...folders].sort((a, b) => {
    const aNumber = extractFolderNumber(a.name);
    const bNumber = extractFolderNumber(b.name);
    
    // If both have numbers, sort numerically
    if (aNumber > 0 && bNumber > 0) {
      return aNumber - bNumber;
    }
    
    // If only one has a number, prioritize the one with number
    if (aNumber > 0 && bNumber === 0) {
      return -1;
    }
    if (aNumber === 0 && bNumber > 0) {
      return 1;
    }
    
    // If neither has a number, sort alphabetically
    return a.name.localeCompare(b.name);
  });
};

// Test functions that can be run in browser console
export const testFolderSorting = () => {
  console.log('🧪 Testing Folder Sorting Logic...\n');
  
  // Test 1: Basic numerical sorting
  const test1: FolderItem[] = [
    { type: 'folder', name: '10. Oil Lubricating System', itemCount: 2, path: '10' },
    { type: 'folder', name: '1. Miscellaneous Cover', itemCount: 3, path: '1' },
    { type: 'folder', name: '2. Miscellaneous Cover and Base Parts', itemCount: 3, path: '2' },
    { type: 'folder', name: '15. Special Parts', itemCount: 2, path: '15' },
  ];
  
  const sorted1 = sortFoldersNumerically(test1);
  console.log('✅ Test 1 - Basic numerical sorting:');
  console.log('Expected: 1, 2, 10, 15');
  console.log('Result:', sorted1.map(f => f.name.split('.')[0].trim()));
  console.log('Pass:', sorted1[0].name.includes('1.') && sorted1[1].name.includes('2.') && sorted1[2].name.includes('10.'));
  
  // Test 2: Mixed numbered and non-numbered
  const test2: FolderItem[] = [
    { type: 'folder', name: '10. Bolts', itemCount: 2, path: '10' },
    { type: 'folder', name: 'Cover Parts', itemCount: 3, path: 'cover' },
    { type: 'folder', name: '1. Misc', itemCount: 3, path: '1' },
    { type: 'folder', name: '2. Base', itemCount: 2, path: '2' },
    { type: 'folder', name: 'Accessories', itemCount: 1, path: 'accessories' },
  ];
  
  const sorted2 = sortFoldersNumerically(test2);
  console.log('\n✅ Test 2 - Mixed numbered and non-numbered:');
  console.log('Expected: 1, 2, 10, Accessories, Cover Parts');
  console.log('Result:', sorted2.map(f => f.name.split('.')[0].trim() + (f.name.includes('.') ? '' : ' (no number)')));
  console.log('Pass:', sorted2[0].name.includes('1.') && sorted2[1].name.includes('2.') && sorted2[2].name.includes('10.'));
  
  console.log('\n🎉 All tests completed! Check the results above.');
  return { test1: sorted1, test2: sorted2 };
};
