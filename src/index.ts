import type { Heading } from 'mdast'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import string from '@poppinss/string'
import matter from 'gray-matter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

interface IndexItem {
  title: string
  subtitle: string
  url: string
  section: string
}

const docsPath = path.join(os.homedir(), 'dev/forks/nuxt/docs')

async function getSections(): Promise<string[]> {
  try {
    const items = await fs.readdir(docsPath)
    const sections: string[] = []
    for (const item of items) {
      const fullPath = path.join(docsPath, item)
      const stats = await fs.stat(fullPath)
      if (stats.isDirectory()) {
        sections.push(item)
      }
    }
    return sections
  }
  catch (error) {
    throw new Error('Chyba při čtení adresáře:', error.message)
  }
}

async function walkDir(section: string, dir: string, parts: string[] = []): Promise<IndexItem[]> {
  const items = (await fs.readdir(dir))
    .filter(item => !item.endsWith('.yml'))
    .filter(item => !item.endsWith('index.md'))

  const results: IndexItem[] = []
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stats = await fs.stat(fullPath)

    if (stats.isDirectory()) {
      const subResults = await walkDir(section, fullPath, [...parts, item.split('.')[1]])
      results.push(...subResults)
    }
    else {
      const filename = path.basename(fullPath).split('.')[1]
      const content = await fs.readFile(fullPath, 'utf8')

      const { data, content: fileContent } = matter(content)
      const tree = unified().use(remarkParse, { fragment: true }).parse(fileContent)
      const headings: Heading[] = []
      visit(tree, 'heading', (node) => {
        if (node.depth <= 3) {
          headings.push(node)
        }
      })

      const headingHierarchies = generateHeadingHierarchies(headings, data.title)
      headingHierarchies.unshift([data.title])

      const result = headingHierarchies.map((hierarchy) => {
        const title = hierarchy.pop() ?? ''
        const subtitle = hierarchy.join(' > ')
        const url = generateUrl(section, [...parts, filename], subtitle && title)

        return {
          title,
          subtitle,
          url,
          section,
        }
      })
      results.push(...result)
    }
  }
  return results
}

export async function generateIndex(): Promise<IndexItem[]> {
  const sections = await getSections()
  const index: IndexItem[] = []
  for (const section of sections) {
    const sectionName = section.split('.')[1]
    const results = await walkDir(sectionName, path.join(docsPath, section))
    index.push(...results)
  }
  return index
}

function generateHeadingHierarchies(headings: Heading[], rootName: string): string[][] {
  const result: string[][] = []
  const stack: string[][] = [[rootName]]

  for (const heading of headings) {
    const depth = heading.depth
    const title = heading.children.map(child => 'value' in child ? child.value : '').join('')

    while (stack.length > depth - 1) {
      stack.pop()
    }

    const lastPath = stack[stack.length - 1] || []
    const currentPath = [...lastPath, title]
    result.push(currentPath)
    stack.push(currentPath)
  }

  return result
}

function generateUrl(section: string, pathSegments: string[], headingText?: string): string {
  const path = pathSegments.join('/')
  const baseUrl = 'https://nuxt.com/docs'

  if (!headingText) {
    return `${baseUrl}/${section}/${path}`
  }

  const fragment = string.slug(headingText, { lower: true, strict: true })
  return `${baseUrl}/${section}/${path}#${fragment}`
}
