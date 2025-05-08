import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import string from '@poppinss/string'
import matter from 'gray-matter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

const docsPath = path.join(os.homedir(), 'dev/forks/nuxt/docs')

function getSections(): string[] {
  try {
    return fs.readdirSync(docsPath).filter((item) => {
      const fullPath = path.join(docsPath, item)
      return fs.statSync(fullPath).isDirectory()
    })
  }
  catch (error) {
    throw new Error('Chyba při čtení adresáře:', error.message)
  }
}

async function walkDir(section: string, dir: string, parts: string[] = []): Promise<void> {
  const items = fs.readdirSync(dir).filter(item => !item.endsWith('.yml')).filter(item => !item.endsWith('index.md'))

    for (const item of items) {
    const fullPath = path.join(dir, item)
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(section, fullPath, [...parts, item.split('.')[1]])
    }
    else {
      const filename = path.basename(fullPath).split('.')[1]
      const content = fs.readFileSync(fullPath, 'utf8')

      const { data, content: fileContent } = matter(content)
      const tree = unified().use(remarkParse, { fragment: true }).parse(fileContent)
      const headings: any[] = []
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
      console.log(JSON.stringify(result, null, 2))
    }
  }
}

const sections = getSections()

sections.forEach((section) => {
    const sectionName = section.split('.')[1]
  walkDir(sectionName, path.join(docsPath, section))
})

function generateHeadingHierarchies(headings: any[], rootName: string): string[][] {
  const result: string[][] = []
  const stack: string[][] = [[rootName]]

  for (const heading of headings) {
    const depth = heading.depth
    const title = heading.children.map((child: any) => child.value).join("")

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
