import type { FileContent, FrontMatterData } from './types'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import matter from 'gray-matter'

const DOCS_PATH = path.join(os.homedir(), 'dev/forks/nuxt/docs')
const SECTIONS = ['1.getting-started', '2.guide', '3.api']

/**
 * Reads file content and processes front matter
 * @param filePath - Path to the markdown file
 */
export async function readFileContent(filePath: string): Promise<FileContent> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const result = matter(content)

    if (!result.data.title) {
      throw new Error('Missing title in front matter')
    }

    return {
      data: result.data as FrontMatterData,
      content: result.content,
    }
  }
  catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`)
  }
}

/**
 * Gets the documentation path
 */
export function getDocsPath(): string {
  return DOCS_PATH
}

/**
 * Gets a list of documentation sections
 */
export async function getSections(): Promise<string[]> {
  return SECTIONS
}
