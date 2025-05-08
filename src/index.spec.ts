import { expect, it } from 'vitest'
import { generateIndex } from './index'

it('generateIndex', async () => {
  const result = await generateIndex()
  expect(result).toMatchSnapshot()
})
