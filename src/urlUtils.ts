import string from '@poppinss/string'

export const BASE_URL = 'https://nuxt.com/docs'
const SLUG_OPTIONS = { lower: true, strict: true } as const

/**
 * Generates URL for a documentation item
 * @param section - The documentation section
 * @param pathSegments - Array of path segments
 * @param headingText - Optional heading text to use as fragment
 */
export function generateUrl(section: string, pathSegments: string[], headingText?: string): string {
  const path = `${BASE_URL}/${section}/${pathSegments.join('/')}`

  if (!headingText) {
    return path
  }

  const fragment = string.slug(headingText, SLUG_OPTIONS)
  return `${path}#${fragment}`
}
