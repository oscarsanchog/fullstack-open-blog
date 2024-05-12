const dummy = (blogs) => 1

const totalLikes = (blogs) =>
  blogs.length === 0 ? 0 : blogs.reduce((sum, blog) => sum + blog.likes, 0)

const favoriteBlog = (blogs) => {
  const plainFavorite = blogs.reduce((previous, current) =>
    current.likes > previous.likes ? current : previous
  )

  const formattedFavoriteBlog = {
    title: plainFavorite.title,
    author: plainFavorite.author,
    likes: plainFavorite.likes,
  }
  return formattedFavoriteBlog
}

const mostBlogs = (blogs) => {
  const authorBlogs = blogs.reduce((acc, blog) => {
    acc[blog.author] = (acc[blog.author] || 0) + 1
    return acc
  }, {})

  const mostProlificAuthor = Object.entries(authorBlogs).reduce(
    (previous, current) => {
      return previous[1] > current[1] ? previous : current
    },
    [null, 0]
  )

  return {
    author: mostProlificAuthor[0],
    blogs: mostProlificAuthor[1],
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}
