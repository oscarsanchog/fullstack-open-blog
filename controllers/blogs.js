const blogsRouter = require('express').Router()
const Blog = require('../models/Blog')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

const getTokenFrom = (request) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

blogsRouter
  .get('/', async (request, response, next) => {
    try {
      const blogs = await Blog.find({}).populate('user', { blogs: false })
      response.json(blogs)
    } catch (error) {
      next(error)
    }
  })
  .post('/', async (request, response, next) => {
    try {
      const { body, user } = request

      if (!user) return response.status(401).json({ error: 'Invalid token. Please login again.' })

      const blog = new Blog({
        ...body,
        user: user.id,
      })

      const savedBlog = await blog.save()
      user.blogs = user.blogs.concat(savedBlog.id)
      await user.save()

      response.status(201).json(savedBlog)
    } catch (error) {
      next(error)
    }
  })
  .delete('/:id', async (request, response, next) => {
    try {
      const { id } = request.params
      const { user } = request

      if (!user) return response.status(401).json({ error: 'Invalid token' })

      const blog = await Blog.findById(id)
      if (!blog) {
        return response
          .status(404)
          .json({ message: 'Blog not found, please reload' })
      }

      if (blog.user.toString() !== decodedToken.id.toString()) {
        return response
          .status(403)
          .json({ error: 'You do not have permission to delete this blog' })
      }

      await Blog.findByIdAndDelete(id)

      response.status(204).end()
    } catch (error) {
      next(error)
    }
  })
  .put('/:id', async (req, res, next) => {
    try {
      const { body } = req
      const { id } = req.params

      const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { likes: body.likes },
        {
          new: true,
          runValidators: true,
          context: 'query',
        }
      )
      res.json(updatedBlog)
    } catch (error) {
      next(error)
    }
  })

module.exports = blogsRouter
