import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('Rise and Shine Gamers!')
})

app.listen(3000)