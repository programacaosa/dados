const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 4000;

app.use(express.static('public')); // Sirva os arquivos estáticos do diretório 'public'

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('move', (data) => {
        console.log('Move:', data);
        socket.broadcast.emit('move', data); // Envie o movimento para todos os outros clientes
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
