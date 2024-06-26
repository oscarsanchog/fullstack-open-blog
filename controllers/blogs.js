const blogsRouter = require('express').Router()
const Blog = require('../models/Blog')
const User = require('../models/User')

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

      if (!user)
        return response
          .status(401)
          .json({ message: 'Invalid token. Please login again.' })

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

      if (!user) return response.status(401).json({ message: 'Invalid token' })

      const blog = await Blog.findById(id)
      if (!blog) {
        return response
          .status(404)
          .json({ message: 'Blog not found, please reload' })
      }

      if (blog.user.toString() !== user.id.toString()) {
        return response
          .status(403)
          .json({ message: 'You do not have permission to delete this blog' })
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
      updatedBlog !== null
        ? res.json(updatedBlog)
        : res.status(400).json({ message: 'User with such ID does not exist' })
    } catch (error) {
      next(error)
    }
  })

module.exports = blogsRouter
