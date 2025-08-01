//connect to server and retain the socket
//connect to same host that served the document

//const socket = io('http://' + window.document.location.host)
const socket = io() //by default connects to same server that served the page
let username = ''
let currentUsers = []

//Messages only be delivered to clients who have successfully registered
socket.on('serverSays', function(data) {
  let msgDiv = document.createElement('div')
  if (data.private) {
    msgDiv.className = 'private'
    //private message, self view
    if (data.username == username) {
      //group
      if (Array.isArray(data.receivers) && data.receivers.length>0) {
        msgDiv.textContent = `Me {to: ${data.receivers.join(', ')}}: ${data.message}`
      } 
      //1 to 1
      else {
        msgDiv.textContent = `Me {to: ${data.receivers}}: ${data.message}`
      }
    }
    //receiver/other's view
    else {
      msgDiv.textContent = `${data.username}: ${data.message}`
    }
  }
  //public
  else if (data.username == username) {
    msgDiv.className = 'selfmessage'
    msgDiv.textContent = `Me: ${data.message}`
  } else {
    msgDiv.className = 'othermessage'
    msgDiv.textContent = `${data.username}: ${data.message}`
  }
    
    document.getElementById('messages').appendChild(msgDiv)
  
  
  /*
  What is the distinction among the following options to set
  the content? That is, the difference among:
  .innerHTML, .innerText, .textContent
  */
  //msgDiv.innerHTML = message
  //msgDiv.innerText = message
  
})


function sendMessage() {
  if (!username) {
    return
  }
  let message = document.getElementById('msgBox').value.trim()
  if(message === '') return //do nothing

  //find 1st colon
  let colon = message.indexOf(':')
  if (colon>-1) {
    let receiver = message.substring(0, colon).trim()
    let msg = message.substring(colon+1).trim()

    //if group, split names, put in array
    let splitted = receiver.split(',')
    let recearray = []
    for (let i = 0; i < splitted.length; i++) {
      if (splitted[i].trim().length>0) {
        recearray.push(splitted[i].trim())
      } 
    }
    //if exist, put exist ones in new array
    let exist = [] 
    for (let i = 0; i < recearray.length; i++) {
      if (currentUsers.includes(recearray[i])) {
        exist.push(recearray[i]) 
      }
    }

    //send group msg
    if (exist.length != 0) {
      socket.emit('clientSays', {
        username: username, receivers: exist,
        message: msg, private: true  
      })
    } else {
      socket.emit('clientSays', {
        username: username, message: message, private: false
      })
    }  
  }
  
  else {
    socket.emit('clientSays', {
      username: username, message: message, private: false
    })
  }
  
  
  document.getElementById('msgBox').value = ''
}

function handleKeyDown(event) {
  const ENTER_KEY = 13 //keycode for enter key
  if (event.keyCode === ENTER_KEY) {
    sendMessage()
    return false //don't propogate event
  }
}

//Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  //This function is called after the browser has loaded the web page

  //add listener to buttons
  document.getElementById('send_button').addEventListener('click', sendMessage)

  //add keyboard handler for the document as a whole, not separate elements.
  document.addEventListener('keydown', handleKeyDown)
  //document.addEventListener('keyup', handleKeyUp)

  document.getElementById('clear_button').addEventListener('click', function() {
    document.getElementById('messages').innerHTML = ''
  })


  document.getElementById('register').addEventListener('click', function() {
    let enter = document.getElementById('uname').value.trim()
    let vaildname = /^[A-Za-z][A-Za-z0-9]*(\s[A-Za-z0-9]+)*$/
    if (!vaildname.test(enter) || /^(Me|me|ME)$/.test(enter)) {
      document.getElementById('messages').innerHTML += `<div>ERROR: ${enter} IS NOT A VALID USER NAME</div>`
      document.getElementById('uname').value = ''
      return
    }
    username = enter
    socket.emit('registeruser', username)

    document.getElementById('uname').setAttribute('disabled', '')
    document.getElementById('register').setAttribute('disabled', '')

  })
})


socket.on('registerSuccess', function() {
  document.getElementById('msgBox').removeAttribute('disabled')
  document.getElementById('send_button').removeAttribute('disabled')
  document.getElementById('messages').innerHTML += `<div>Connect As ${username}</div>`
})

socket.on('registerfail', function(err) {
  document.getElementById('messages').innerHTML += `<div>${err}</div>`
  document.getElementById('uname').value = ''
  document.getElementById('uname').removeAttribute('disabled')
  document.getElementById('register').removeAttribute('disabled')
})

socket.on('userslist', function(users) {
  currentUsers = users
})

