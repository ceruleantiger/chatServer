# Chat Server with Private Messaging
Real-time chat server that allows multiple browser clients to chat with each other, 
supports private messaging, username validation, group messaging, interactive client-side features,
built with socket.io library

## Features
- Real-time public chat between registered users
- Private messaging between individuals
- Group private messaging sent to people selected by the user
- "Connect As" field to register a username
- Username rules:
  - cannot be "Me", "me", or "ME"
  - start with a letter, contain only letters and numbers and single spaces between words
  - end with a letter or number
- Message coloring using CSS:
  - Blue: messages from self
  - Black: public messages from others
  - Green: private messages
- "Clear" button clears local chat window only
- Built with socket.io

## Run
npm install socket.io

npm install

node server.js

http://localhost:3000/chatClient.html


