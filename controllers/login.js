const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/User')

loginRouter.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body

    const user = await User.findOne({ username })

    const passwordCorrect =
      user === null ? false : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
      return res.status(404).json({ message: 'Invalid username or password' })
    }

    const userForToken = {
      username: user.username,
      id: user.id,
    }

    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: 60 * 60})

    res.status(200).send({ token, username: user.username, name: user.name, id: user.id })
  } catch (error) {
    next(error)
  }
})

module.exports = loginRouter
