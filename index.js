const fs = require('fs')
const path = require('path')

const config = require('./config')
const io = require('socket.io')(config.port)

const moment = require('moment')

let acl = {
  users: [],
}

const reservedTopics = ['connect', 'connection', 'disconnect', 'publish', 'subscribe', 'unsubscribe']

io.on('connection', socket => {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'CONNECTED, client=', socket.id)
  
  socket.on('signin', auth => {
    if (!acl.users.some(u => u.user === auth.user && u.pass === auth.pass)) {
      return console.log('INVALID USER/PASS')
    }
    socket.user = auth.user
  })
  
  socket.on('subscribe', topic => {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'SUBSCRIBE, client=', socket.id, ', topic=', topic)
    
    if (!topic || !socket.user) {
      return console.log('NOT_AUTHORIZED')
    }

    socket.join(topic)
  })

  socket.on('unsubscribe', (topic) => {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'UNSUBSCRIBE, client=', socket.id, ', topic=', topic)
    if (topic) {
      socket.leave(topic)
    }
  })

  socket.on('publish', (topic, data) => {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'PUBLISH, client=', socket.id, ', topic=', topic, ', payload=', data)
    if (reservedTopics.indexOf(topic) !== -1) {
      console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'ERROR=RESERVED_TOPIC')
      return
    }
    if (!topic || !socket.user) {
      return console.log('NOT_AUTHORIZED')
    }
    io.sockets.in(topic).emit(topic, data)
  })

  socket.on('disconnect', () => {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'DISCONNECTED, client=', socket.id)
  })
})

console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'READY ON', config.port)

function loadAcl() {
  try {
    acl = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'acl.json'), 'utf8'))
  } catch (e) {
    console.log('sorry')
  }
}
