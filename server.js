const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const fs = require('fs') //file system to server static files
const url = require('url') //to parse url strings
const PORT = process.argv[2] || process.env.PORT || 3000 //useful if you want to specify port through environment variable
                                                         //or command-line arguments

const ROOT_DIR = 'html' //dir to serve static files from

const MIME_TYPES = {
  'css': 'text/css',
  'gif': 'image/gif',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

const connectRegiU = new Set()

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES['txt']
}

server.listen(PORT) //start http server listening on PORT

function handler(request, response) {
  //handler for http server requests including static files
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}



//Socket Server
io.on('connection', function(socket) {
  console.log('client connected')
  //console.dir(socket)

  socket.on('registeruser', function(username) {
    if (connectRegiU.has(username)) {
      socket.emit('registerfail', 'Username already in use, please use another one')
      return
    }
    socket.username = username
    connectRegiU.add(username)
    socket.emit('registerSuccess')
    console.log(`register: ${username}`)
    io.emit('userslist', Array.from(connectRegiU))
  })

  socket.emit('serverSays', {username: 'SERVER', message: 'You are connected to CHAT SERVER'})

  

  socket.on('clientSays', function(data) {
    if (!socket.username || !connectRegiU.has(socket.username)) {
      console.log(`shouldn't send message`)
      return
    }
    console.log(`${data.username}: ${data.message}`)

    if (data.private) {
      let allusers = [...io.sockets.sockets.values()]
      

      for (let i = 0; i < data.receivers.length; i++) {
        let receiver = null

        for (let j = 0; j < allusers.length; j++) {
          if (allusers[j].username == data.receivers[i]) {
            receiver = allusers[j]
            break
          }
        }
        if (receiver) {
          //if not message to self, msg appears on both the sender and receiver
          //if message self, msg only appears once
          if (receiver != socket) {
            receiver.emit('serverSays', {
              username: socket.username, message: data.message, private: true
            })
          }
        }
      }

      socket.emit('serverSays', {
        username: socket.username, receivers: data.receivers,
        message: data.message, private: true
      })
      

      /*if (receiver) {
        //user message to self
        if (receiver == socket) {
          socket.emit('serverSays', {
            username: socket.username,  receiver: data.receiver,
            message: data.message, private: true
          })
        } 
        //private msg to other
        else {
          receiver.emit('serverSays', {
            username: socket.username, receiver: data.receiver,
            message: data.message, private: true
          })
          socket.emit('serverSays', {
            username: socket.username,  receiver: data.receiver,
            message: data.message, private: true
          })
        }
      }*/
    }

    //public
    else {
      io.sockets.sockets.forEach(s => {
        if (s.username && connectRegiU.has(s.username)) {
          s.emit('serverSays', {
            username: socket.username, message: data.message, private: false
          })
        }
      })
    }
    //console.log('RECEIVED: ' + data)
    //to broadcast message to everyone including sender:
    //io.emit('serverSays', data) broadcast to everyone including sender
    //alternatively to broadcast to everyone except the sender
    //socket.broadcast.emit('serverSays', data)
  })

  socket.on('disconnect', function(data) {
    //event emitted when a client disconnects
    if (socket.username) {
      connectRegiU.delete(socket.username)
      console.log(`client disconnected: ${socket.username}`)
      io.emit('userslist', Array.from(connectRegiU))
    }
    
  })
})

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:${PORT}/chatClient.html`)

