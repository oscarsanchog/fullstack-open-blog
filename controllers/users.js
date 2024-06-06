const bcrypt = require('bcrypt')
const userRouter = require('express').Router()
const User = require('../models/User')

userRouter
  .get('/', async (req, res, next) => {
    const users = await User.find({})
    res.json(users)
  })
  .post('/', async (req, res, next) => {
    try {
      const { username, name, password } = req.body

      const minLength3 = /^.{3,}$/
      if (!username || !password) return res.status(400).json({ message: 'Data is missing'})
      if (!minLength3.test(password)) return res.status(400).json({ message: 'Password must be at least 3 characters'})

      const saltRounds = 10
      const passwordHash = await bcrypt.hash(password, saltRounds)

      const user = new User({
        username,
        name,
        passwordHash,
      })

      const savedUser = await user.save()
      res.status(201).json(savedUser)
    } catch (error) {
      next(error)
    }
  })

module.exports = userRouter
