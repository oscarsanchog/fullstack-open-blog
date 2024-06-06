const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')
const Blog = require('../models/Blog')
const User = require('../models/User')

const endpoint = '/api/blog'
const userEndpoint = '/api/users'
const initialBlogs = [
  {
    title: 'My life',
    author: 'Óscar Sancho',
    url: 'dsad',
    likes: 4,
  },
  {
    title: 'Another life',
    author: 'Alejandro',
    url: 'dasd',
    likes: 5,
  },
]
const newBlog = {
  title: 'New blog post',
  author: 'John Doe',
  url: 'https://example.com',
  likes: 0,
}

describe('Blogs testing', () => {
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
      url: 'gyhug',
    }
    await api.post(endpoint).send(newBlogWithoutLikes).expect(201)

    const updatedBlogs = await Blog.find({})
    const createdBlog = updatedBlogs[updatedBlogs.length - 1]

    assert.strictEqual(createdBlog.likes, 0)
  })

  test('Creating a new blog post without title or url resulst in 400 Bad Request', async () => {
    const newBlogWithoutTitle = {
      author: 'John Doe',
      url: 'https://example.com',
      likes: 0,
    }
    const newBlogWithoutUrl = {
      title: 'New blog post',
      author: 'John Doe',
      likes: 0,
    }

    await api.post(endpoint).send(newBlogWithoutTitle).expect(400)
    await api.post(endpoint).send(newBlogWithoutUrl).expect(400)
  })

  test('Deleting a blog by ID: removes the blog and returns a 204 status', async () => {
    const responseBefore = await api.get(endpoint)
    const initialBlogsCount = responseBefore.body.length

    const blogToDeleteId = responseBefore.body[0].id

    await api.delete(`${endpoint}/${blogToDeleteId}`).expect(204)

    const responseAfter = await api.get(endpoint)
    assert.strictEqual(responseAfter.body.length, initialBlogsCount - 1)
  })

  test('Updating a blog post: updates the "likes" property and returns a 200 status code', async () => {
    const responseBefore = await api.get(endpoint)
    const blogToUpdateId = responseBefore.body[0].id
    const initialLikes = responseBefore.body[0].likes

    const updatedBlog = {
      ...responseBefore.body[0],
      likes: initialLikes + 1,
    }

    await api.put(`${endpoint}/${blogToUpdateId}`).send(updatedBlog).expect(200)

    const updatedBlogResponse = await api.get(endpoint)

    const likesAfter = updatedBlogResponse.body[0].likes

    assert.strictEqual(likesAfter, updatedBlog.likes)
  })
})

describe('Users Testing', () => {
  describe('When there is initially one user in db', () => {
    beforeEach(async () => {
      await User.deleteMany({})

      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'root', passwordHash})

      await user.save()
    })

    test('Creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen'
      }

      await api
        .post(userEndpoint)
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

        const usernames = usersAtEnd.map(user => user.username)
        assert(usernames.includes(newUser.username))
    })

    test('Creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Superuser',
        password: 'salainen'
      }

      const result = await api
        .post(userEndpoint)
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('Expected "username" to be unique'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
  })

  describe('HTTP requests', async () => {
    test('Creating a new user without username or password results in 400 Bad Request', async () => {
      const usersAtStart = await helper.usersInDb()
      
      const newUserWithoutUsername = {
        name: 'John Doe',
        password: 'https://example.com',
      }
      const newUserWithoutPassword = {
        username: 'JDoe',
        name: 'John Doe',
      }
  
      await api.post(userEndpoint).send(newUserWithoutUsername).expect(400)
      await api.post(userEndpoint).send(newUserWithoutPassword).expect(400)

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('Creating a username or password with less than 3 characters results in 400 Bad Request', async () => {
      const usersAtStart = await helper.usersInDb()
      
      const newUserWithShortUsername = {
        username: 'JD',
        name: 'John Doe',
        password: 'https://example.com',
      }
      const newUserWithShortPassword = {
        username: 'JDoe',
        name: 'John Doe',
        password: 'ht'
      }
  
      await api.post(userEndpoint).send(newUserWithShortUsername).expect(400)
      await api.post(userEndpoint).send(newUserWithShortPassword).expect(400)

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('Creating a username or password with just 3 characters results in 201 Created', async () => {
      
      const newUserWithThreeCharacterUsername = {
        username: 'JDd',
        name: 'John Doe',
        password: 'https://example.com',
      }
      const newUserWithThreeCharacterPassword = {
        username: 'JDoe',
        name: 'John Doe',
        password: 'htt',
      }
  
      await api.post(userEndpoint).send(newUserWithThreeCharacterUsername).expect(201)
      await api.post(userEndpoint).send(newUserWithThreeCharacterPassword).expect(201)
    })
  })
})



after(async () => {
  await mongoose.connection.close()
})
