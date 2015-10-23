var express = require('express')
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
app.use(express.static('public'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/pubic/index.html')
})

io.on('connection', function (socket) {
  console.log('hey')
  socket.on('message', function (msg) {
    console.log('message: ' + msg)
    socket.broadcast.emit('message', msg)
  })
})

http.listen(3000, function () {
  console.log('listening on *:3000')
})


