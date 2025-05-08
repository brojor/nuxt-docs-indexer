import type { Heading } from 'mdast'
import type { FileContent } from './types'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

const MAX_HEADING_DEPTH = 3

/**
 * Extracts headings from markdown content
 * @param fileContent - The parsed markdown file content
 * @param section - The section of the documentation (e.g. 'api', 'guide')
 */
export function extractHeadings(fileContent: FileContent, section: string): Heading[] {
  const tree = unified()
    .use(remarkParse, { fragment: true })
    .parse(fileContent.content)

  const headings: Heading[] = []

  visit(tree, 'heading', (node) => {
    const isWithinDepthLimit = node.depth <= MAX_HEADING_DEPTH
    const isNotApiSection = section !== 'api'

    if (isWithinDepthLimit && isNotApiSection) {
      headings.push(node)
    }
  })

  return headings
}

/**
 * Extracts text content from a heading node
 * @param heading - The heading node to extract text from
 */
function extractHeadingText(heading: Heading): string {
  return heading.children
    .map(child => 'value' in child ? child.value : '')
    .join('')
}

/**
 * Generates heading hierarchies
 * @param headings - Array of headings to process
 * @param rootName - The root title to use as the base of the hierarchy
 */
export function generateHeadingHierarchies(headings: Heading[], rootName: string): string[][] {
  const result: string[][] = []
  const stack: string[][] = [[rootName]]

  for (const heading of headings) {
    const title = extractHeadingText(heading)

    // Pop stack until we reach the correct depth
    while (stack.length > heading.depth - 1) {
      stack.pop()
    }

    const currentPath = [...(stack[stack.length - 1] || []), title]
    result.push(currentPath)
    stack.push(currentPath)
  }

  return result
}
