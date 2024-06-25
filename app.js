const express = require('express')
const app = express()
const config = require('./utils/config')
const cors = require('cors')
const blogRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const testingRouter = require('./controllers/testing')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const morgan = require('morgan')
const Blog = require('./models/Blog')
const User = require('./models/User')

mongoose.set('strictQuery', false)

logger.info('Connecting to', config.MONGODB_URL)

mongoose
  .connect(config.MONGODB_URL)
  .then(async () => {
    logger.info('Conected to MongoDB')

    /* await Blog.deleteMany({});
    logger.info('All Blog records have been deleted');

    await User.deleteMany({});
    logger.info('All User records have been deleted'); */
  })
  .catch((error) => {
    logger.error('Error connecting to MongoDB', error.message)
  })

app
  .use(cors())
  .use(express.static('dist'))
  .use(express.json())
  .use(morgan('dev'))
  .use(middleware.requestLogger)
  .use(middleware.tokenExtractor)
  .use('/api/blog', middleware.userExtractor, blogRouter)
  .use('/api/users', usersRouter)
  .use('/api/login', loginRouter)

if (process.env.NODE_ENV === 'test') app.use('/api/testing', testingRouter)

app
  .use(middleware.unknownEndpoint)
  .use(middleware.errorHandler)

module.exports = app
