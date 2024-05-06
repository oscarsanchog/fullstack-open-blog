const express = require('express')
const app = express()
const config = require('./utils/config')
const cors = require('cors')
const blogRouter = require('./controllers/blogs')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const morgan = require('morgan')

mongoose.set('strictQuery', false)

logger.info('Connecting to', config.MONGODB_URL)

mongoose
  .connect(config.MONGODB_URL)
  .then(() => {
    logger.info('Conected to MongoDB')
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
  .use('/api/blog', blogRouter)
  .use(middleware.unknownEndpoint)
  .use(middleware.errorHandler)

module.exports = app
