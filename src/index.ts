import type { IndexItem } from './types'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getDocsPath, getSections, readFileContent, removeNumericPrefix } from './fileUtils'
import { extractHeadings, generateHeadingHierarchies } from './markdownUtils'
import { generateUrl } from './urlUtils'

const EXCLUDED_EXTENSIONS = ['.yml', 'index.md'] as const

/**
 * Checks if a file should be processed
 * @param filename - Name of the file to check
 */
function shouldProcessFile(filename: string): boolean {
  return !EXCLUDED_EXTENSIONS.some(ext => filename.endsWith(ext))
}

/**
 * Processes a single markdown file
 * @param section - The documentation section
 * @param filePath - Path to the markdown file
 * @param parts - Array of path segments
 */
async function processFile(section: string, filePath: string, parts: string[]): Promise<IndexItem[]> {
  const fileName = removeNumericPrefix(path.basename(filePath))
  const fileContent = await readFileContent(filePath)
  const headings = extractHeadings(fileContent)

  const headingHierarchies = generateHeadingHierarchies(headings, fileContent.data.title)
  headingHierarchies.unshift([fileContent.data.title])

  return headingHierarchies.map((hierarchy) => {
    const title = hierarchy.pop() ?? ''
    const subtitle = hierarchy.join(' > ')
    const url = generateUrl(section, [...parts, fileName], subtitle && title)

    return { title, subtitle, url, section }
  })
}

/**
 * Walks through directory and processes all markdown files
 * @param section - The documentation section
 * @param dir - Directory to process
 * @param parts - Array of path segments
 */
async function walkDir(section: string, dir: string, parts: string[] = []): Promise<IndexItem[]> {
  const items = (await fs.readdir(dir))
    .filter(shouldProcessFile)

  const results = await Promise.all(items.map(async (item) => {
    const fullPath = path.join(dir, item)
    const stats = await fs.stat(fullPath)

    if (stats.isDirectory()) {
      return walkDir(section, fullPath, [...parts, removeNumericPrefix(item)])
    }

    return processFile(section, fullPath, parts)
  }))

  return results.flat()
}

/**
 * Generates documentation index
 */
export async function generateIndex(): Promise<IndexItem[]> {
  const sections = await getSections()
  console.log(JSON.stringify(sections, null, 2))
  const index: IndexItem[] = []

  for (const section of sections) {
    const sectionName = removeNumericPrefix(section)
    const results = await walkDir(sectionName, path.join(getDocsPath(), section))
    index.push(...results)
  }

  return index
}
