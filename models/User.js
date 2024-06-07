const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: 3
  },
  name: String,
  passwordHash: { type: String, required: true },
  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
})

userSchema.set('toJSON', {
  transform: (document, retournedObject) => {
    retournedObject.id = retournedObject._id.toString()
    delete retournedObject._id
    delete retournedObject.__v
    delete retournedObject.passwordHash
  },
})

const User = mongoose.model('User', userSchema)

module.exports = User
