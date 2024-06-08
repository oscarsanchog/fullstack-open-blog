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

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', name: 'rootly', passwordHash })

  await user.save()

  await api
    .post(helper.endpoints.login)
    .send({ username: 'root', password: 'sekret' })
})

describe('Users Testing', () => {
  describe('When there is initially one user in db', () => {
    test('Creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }

      await api
        .post(helper.endpoints.user)
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

      const usernames = usersAtEnd.map((user) => user.username)
      assert(usernames.includes(newUser.username))
    })

    test('New user can login Properly. It responds with a 200 status and it creates a token', async () => {
      const userLoggedIn = await api
        .post(helper.endpoints.login)
        .send({ username: 'root', password: 'sekret' })
        .expect(200)

      assert.strictEqual(userLoggedIn.body.hasOwnProperty('token'), true)
    })

    test('Creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Superuser',
        password: 'salainen',
      }

      const result = await api
        .post(helper.endpoints.user)
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

      await api
        .post(helper.endpoints.user)
        .send(newUserWithoutUsername)
        .expect(400)
      await api
        .post(helper.endpoints.user)
        .send(newUserWithoutPassword)
        .expect(400)

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
        password: 'ht',
      }

      await api
        .post(helper.endpoints.user)
        .send(newUserWithShortUsername)
        .expect(400)
      await api
        .post(helper.endpoints.user)
        .send(newUserWithShortPassword)
        .expect(400)

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

      await api
        .post(helper.endpoints.user)
        .send(newUserWithThreeCharacterUsername)
        .expect(201)
      await api
        .post(helper.endpoints.user)
        .send(newUserWithThreeCharacterPassword)
        .expect(201)
    })
  })
})

describe('Blogs testing', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    const { id } = await User.findOne({ username: 'root' })

    const initialBlogs = [helper.newBlogMaker(id), helper.newBlogMaker(id)]

    for (const blog of initialBlogs) {
      await new Blog(blog).save()
    }
  })

  test('1. Blogs are retourned as json', async () => {
    await api
      .get(helper.endpoints.blog)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('2. There are 2 blogs', async () => {
    const response = await api.get(helper.endpoints.blog)
    assert.strictEqual(response.body.length, 2)
  })

  test('3. Unique identifier property is named "id" and not "_id"', async () => {
    const response = await api.get(helper.endpoints.blog)
    const firstBlog = response.body[0]
    assert.strictEqual(firstBlog.hasOwnProperty('id'), true)
    assert.notStrictEqual(firstBlog.hasOwnProperty('_id'), true)
  })

  test('4. Creating a new blog post. Increases blog count and saves content', async () => {
    const initialBlogCount = await Blog.countDocuments({})

    const userLoggedIn = await helper.loggedinUserData(api)

    const newBlog = helper.newBlogMaker(userLoggedIn.userId)

    await api
      .post(helper.endpoints.blog)
      .send(newBlog)
      .set('Authorization', `Bearer ${userLoggedIn.userToken}`)
      .expect(201)

    const updatedBlogs = await Blog.find({})
    assert.strictEqual(updatedBlogs.length, initialBlogCount + 1)

    const createdBlog = updatedBlogs[updatedBlogs.length - 1]
    assert.deepStrictEqual(createdBlog.title, newBlog.title)
    assert.deepStrictEqual(createdBlog.user.toString(), newBlog.user)
    assert.deepStrictEqual(createdBlog.url, newBlog.url)
    assert.deepStrictEqual(createdBlog.likes, newBlog.likes)
  })

  test('5. Creating a new blog post with missing likes property sets likes to 0', async () => {
    const userLoggedIn = await helper.loggedinUserData(api)

    const { likes, ...newBlogWithoutLikes } = helper.newBlogMaker(
      userLoggedIn.userId
    )

    await api
      .post(helper.endpoints.blog)
      .send(newBlogWithoutLikes)
      .set('Authorization', `Bearer ${userLoggedIn.userToken}`)
      .expect(201)

    const updatedBlogs = await Blog.find({})
    const createdBlog = updatedBlogs[updatedBlogs.length - 1]

    assert.strictEqual(createdBlog.likes, 0)
  })

  test('6. Creating a new blog post without title or url resulst in 400 Bad Request', async () => {
    const userLoggedIn = await helper.loggedinUserData(api)

    const { title, ...newBlogWithoutTitle } = helper.newBlogMaker(
      userLoggedIn.userId
    )
    const { url, ...newBlogWithoutUrl } = helper.newBlogMaker(
      userLoggedIn.userId
    )

    await api
      .post(helper.endpoints.blog)
      .send(newBlogWithoutTitle)
      .set('Authorization', `Bearer ${userLoggedIn.userToken}`)
      .expect(400)

    await api
      .post(helper.endpoints.blog)
      .send(newBlogWithoutUrl)
      .set('Authorization', `Bearer ${userLoggedIn.userToken}`)
      .expect(400)
  })

  test('7. Deleting a blog by ID: removes the blog and returns a 204 status', async () => {
    const responseBefore = await api.get(helper.endpoints.blog)
    const initialBlogsCount = responseBefore.body.length

    const blogToDeleteId = responseBefore.body[0].id

    const { userToken } = await helper.loggedinUserData(api)

    await api
      .delete(`${helper.endpoints.blog}/${blogToDeleteId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204)

    const responseAfter = await api.get(helper.endpoints.blog)
    assert.strictEqual(responseAfter.body.length, initialBlogsCount - 1)
  })

  test('8. Updating a blog post: updates the "likes" property and returns a 200 status code', async () => {
    const responseBefore = await api.get(helper.endpoints.blog)
    const blogToUpdateId = responseBefore.body[0].id
    const initialLikes = responseBefore.body[0].likes

    const updatedBlog = {
      ...responseBefore.body[0],
      likes: initialLikes + 1,
    }

    await api
      .put(`${helper.endpoints.blog}/${blogToUpdateId}`)
      .send(updatedBlog)
      .expect(200)

    const updatedBlogResponse = await api.get(helper.endpoints.blog)

    const likesAfter = updatedBlogResponse.body[0].likes

    assert.strictEqual(likesAfter, updatedBlog.likes)
  })

  test('9. creating a blog fails with status code 401 Unauthorized if no token is provided', async () => {
    const initialBlogCount = await Blog.countDocuments({})

    const userLoggedIn = await helper.loggedinUserData(api)

    const newBlog = helper.newBlogMaker(userLoggedIn.userId)

    await api
      .post(helper.endpoints.blog)
      .send(newBlog)
      .set('Authorization', '')
      .expect(401)
      
    const finalBlogCount = await Blog.countDocuments({})
    assert.strictEqual(initialBlogCount, finalBlogCount)
  })
})

after(async () => {
  await mongoose.connection.close()
})
