const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const blogsSeed = require('../utils/seed')
const emptyBlogs = []

describe('Dummy', () => {
  test('dummy returns 1', () => {
    const result = listHelper.dummy(emptyBlogs)
    assert.strictEqual(result, 1)
  })
})

describe('Total likes', () => {
  const listWithOneBlog = [
    {
      _id: '5a422aa71b54a676234d17f8',
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
      likes: 5,
      __v: 0,
    },
  ]

  test('of empty list is zero', () => {
    const result = listHelper.totalLikes(emptyBlogs)
    assert.strictEqual(result, 0)
  })

  test('when list has only one blog, equals the likes of that', () => {
    const result = listHelper.totalLikes(listWithOneBlog)
    assert.strictEqual(result, 5)
  })

  test('of a bigger list is calculated right', () => {
    const result = listHelper.totalLikes(blogsSeed)
    assert.strictEqual(result, 36)
  })
})

describe('Favorite', () => {
  test('Favorite blog', () => {
    const result = listHelper.favoriteBlog(blogsSeed)
    const exampleResult = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      likes: 12,
    }
    assert.deepStrictEqual(result, exampleResult)
  })
})

describe('Most blogs', () => {
  test('The author most prolific', () => {
    const result = listHelper.mostBlogs(blogsSeed)
    const exampleResult = {
      author: "Robert C. Martin",
      blogs: 3
    }
    assert.deepStrictEqual(result, exampleResult)
  })
})
