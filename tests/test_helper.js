const Blog = require('../models/Blog')
const User = require('../models/User')

const newBlogMaker = (userId) => {
  return {
    title: 'New blog post',
    user: userId,
    url: 'https://example.com',
    likes: 0,
  }
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map((user) => user.toJSON())
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map((blog) => blog.toJSON())
}

const endpoints = {
  blog: '/api/blog',
  user: '/api/users',
  login: '/api/login',
}

const loggedinUserData = async (api) => {
  const { body: userLoggedIn } = await api
    .post(endpoints.login)
    .send({ username: 'root', password: 'sekret' })
    .expect(200)

  return { userId: userLoggedIn.id, userToken: userLoggedIn.token }
}

module.exports = {
  usersInDb,
  blogsInDb,
  newBlogMaker,
  loggedinUserData,
  endpoints,
}
