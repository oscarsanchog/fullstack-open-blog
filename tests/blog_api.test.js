const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/Blog')

const initialBlogs = [
  {
    _id: "665e43879ca61f586e580d66",
    title: "My life",
    author: "Óscar Sancho",
    url: "",
    likes: 4,
    __v: 0
  },
  {
    _id: "665e4943fe58772d1ec7640d",
    title: "Another life",
    author: "Alejandro",
    url: "",
    likes: 5,
    __v: 0
  }
]

beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[1])
  await blogObject.save()
})

test('Blogs are retourned as json', async () => {
  await api
    .get('/api/blog')
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
})

test('There are 2 blogs', async () => {
  const response = await api.get('/api/blog')  

  assert.strictEqual(response.body.length, initialBlogs.length)
})

after(async () => {
  await mongoose.connection.close()
})
