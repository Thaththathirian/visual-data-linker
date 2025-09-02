import fs from 'fs'
import path from 'path'

export function generateDataIndex() {
  const dataPath = path.join(process.cwd(), 'public', 'data')
  const outputPath = path.join(process.cwd(), 'src', 'data', 'folderStructure.json')
  
  // Types for the generated tree
  type FileNode = {
    type: 'file'
    name: string
    path: string
    extension: string
  }
  type FolderNode = {
    type: 'folder'
    name: string
    path: string
    itemCount: number
    children: TreeNode[]
  }
  type TreeNode = FileNode | FolderNode
  
  function scanDirectory(dirPath: string, relativePath: string = ''): TreeNode[] {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    
    return items.map((item: fs.Dirent): TreeNode => {
      const itemPath = path.join(relativePath, item.name)
      const fullItemPath = path.join(dirPath, item.name)
      
      if (item.isDirectory()) {
        return {
          type: 'folder',
          name: item.name,
          path: itemPath,
          itemCount: fs.readdirSync(fullItemPath).length,
          children: scanDirectory(fullItemPath, itemPath)
        }
      } else {
        return {
          type: 'file',
          name: item.name,
          path: itemPath,
          extension: path.extname(item.name).toLowerCase()
        }
      }
    })
  }
  
  const folderStructure = scanDirectory(dataPath)
  
  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  
  // Write the generated JSON
  fs.writeFileSync(outputPath, JSON.stringify(folderStructure, null, 2))
  console.log('✅ Folder structure generated successfully!')
}
