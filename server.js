import express from 'express'
import fs from 'node:fs'
import crypto from 'node:crypto'
import cors from 'cors'
import { validateMovie, patchValidation } from './schemas/movies.js'

const app = express()
app.use(cors())
app.disable('x-powered-by')

const movies = JSON.parse(fs.readFileSync('./movies.json'))

const ACCEPTED_ORIGINS = [
  'http://localhost:64955',
  'http://localhost:53136',
  'http://movies.com:', // deproduccion
  'http://midu.dev'
]

app.use(express.json())

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  }
  res.send(200)
})

const getMoviesById = (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).send('No se encontro esa peli')
}
const getMoviesByGenere = (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g =>
        g.toLowerCase() === genre.toLowerCase()
      ))
    return res.json(filteredMovies)
  }
  res.status(200).json(movies)
}
const postMovie = (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(422).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), // crea un id v4
    ...result.data // aqui si se puede usar estpo porque para este punto la info ya esta validada por zod
  }
  // Esto no sigue principiios REST porque esta guardando el estado en la aplicacion y esto no deberia ser asi
  movies.push(newMovie)
  res.status(201).json(newMovie)
}
const patchMovies = (req, res) => {
  const validatedMovie = patchValidation(req.body)

  if (validatedMovie.error) {
    return res.status(400).json({ error: JSON.parse(validatedMovie.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie no encontrada ni modo' })
  }

  const updatedMovie = {
    ...movies[movieIndex],
    ...validatedMovie.data
  }

  movies[movieIndex] = updatedMovie
  res.json(updatedMovie)
}
const deleteMovies = (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  const { id } = req.params
  console.log(id)
  const movieIndex = movies.findIndex(movie => movie.id === id)
  console.log(movieIndex)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie no encontrada srry' })
  }

  movies.splice(movieIndex, 1)
  return res.json({ message: 'Movie borrada' })
}

app.get('/movies', getMoviesByGenere)
app.get('/movies/:id', getMoviesById)

app.post('/movies', postMovie)

app.patch('/movies/:id', patchMovies)

app.delete('/movies/:id', deleteMovies)

app.use((req, res) => {
  res.status(404).send('404 no existe eso no manches')
})

const PORT = process.env.PORT ?? 5003
app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`)
})
