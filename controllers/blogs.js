const blogsRouter = require('express').Router()
const Blog = require('../models/Blog')

blogsRouter
  .get('/', async (request, response, next) => {
    try {
      const blogs = await Blog.find({})
      response.json(blogs)
    } catch (error) {
      next(error)
    }
  })
  .post('/', async (request, response, next) => {
    try {
      const blog = new Blog(request.body)
      const savedBlog = await blog.save()
      response.status(201).json(savedBlog)
    } catch (error) {
      next(error)
    }
  })
  .delete('/:id', async (request, response, next) => {
    try {
      const { id } = request.params
      const deletedBlog = await Blog.findByIdAndDelete(id)

      if (!deletedBlog) {
        return response
          .status(404)
          .json({ message: 'Blog not found, please reload' })
      }

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
