import z from 'zod'

const movieSchema = z.object({
  title: z.string({
    invalid_type_error: 'La peli debe ser un string',
    required_error: 'El titulo de la peli es requerido'
  }),
  genre: z.array(z.enum(['Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Thriller', 'Sci-Fi'])),
  year: z.number().int().min(1900).max(2004),
  duration: z.number().int().positive(),
  rate: z.number().min(0).max(10),
  poster: z.string().url({ message: 'url del poster no válida' })
})

function validateMovie (object) {
  return movieSchema.safeParse(object)
}

function patchValidation (input) {
  return movieSchema.partial().safeParse(input)
}

export { validateMovie, patchValidation }
