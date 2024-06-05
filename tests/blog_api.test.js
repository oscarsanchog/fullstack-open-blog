const { test, after, beforeEach} = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/Blog')

const endpoint = '/api/blog'
const initialBlogs = [
  {
    title: "My life",
    author: "Óscar Sancho",
    url: "dsad",
    likes: 4,
    
  },
  {
    title: "Another life",
    author: "Alejandro",
    url: "dasd",
    likes: 5,
  }
]
const newBlog = {
  title: "New blog post",
  author: "John Doe",
  url: "https://example.com",
  likes: 0,
}

beforeEach(async () => {
  await Blog.deleteMany({})

  for (const blog of initialBlogs) {
    await new Blog(blog).save()
  }
})

test('Blogs are retourned as json', async () => {
  await api
    .get(endpoint)
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('There are 2 blogs', async () => {
  const response = await api.get(endpoint)  
  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('Unique identifier property is named "id" and not "_id"', async () => {
  const response = await api.get(endpoint)
  const firstBlog = response.body[0]
  assert.strictEqual(firstBlog.hasOwnProperty('id'), true)
  assert.notStrictEqual(firstBlog.hasOwnProperty('_id'), true)
})

test('Creating a new blog post. Increases blog count and saves content', async () => {
  const initialBlogCount = await Blog.countDocuments({})

  await api.post(endpoint).send(newBlog).expect(201)

  const updatedBlogs = await Blog.find({})
  assert.strictEqual(updatedBlogs.length, initialBlogCount + 1)
  
  const createdBlog = updatedBlogs[updatedBlogs.length - 1]
  assert.deepStrictEqual(createdBlog.title, newBlog.title)
  assert.deepStrictEqual(createdBlog.author, newBlog.author)
  assert.deepStrictEqual(createdBlog.url, newBlog.url)
  assert.deepStrictEqual(createdBlog.likes, newBlog.likes)  
})

test('Creating a new blog post with missing likes property sets likes to 0', async () => {
  const newBlogWithoutLikes = {
    title: 'New blog post without likes',
    author: 'John',
    url: 'gyhug'
  }
  await api.post(endpoint).send(newBlogWithoutLikes).expect(201)

  const updatedBlogs = await Blog.find({})
  const createdBlog = updatedBlogs[updatedBlogs.length - 1]
  
  assert.strictEqual(createdBlog.likes, 0)
})

test('Creating a new blog post without title or url resulst in 400 Bad Request', async () => {
  const newBlogWithoutTitle = {
    author: "John Doe",
    url: "https://example.com",
    likes: 0,
  }
  const newBlogWithoutUrl = {
    title: "New blog post",
    author: "John Doe",
    likes: 0,
  }

  await api.post(endpoint).send(newBlogWithoutTitle).expect(400)
  await api.post(endpoint).send(newBlogWithoutUrl).expect(400)
})

after(async () => {
  await mongoose.connection.close()
})
