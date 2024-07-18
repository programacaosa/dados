const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Verificar se a pasta 'uploads' existe, senão criar
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Servir arquivos estáticos (CSS, JS)
app.use(express.static(__dirname));

// Array para armazenar as postagens
let postsArray = [];

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para enviar postagens atuais para o cliente
app.get('/posts', (req, res) => {
    res.json(postsArray);
});

// Rota para upload de arquivos
app.post('/upload', upload.single('file'), (req, res) => {
    // Salvar os detalhes do post (como comentário e caminho do arquivo) no array
    const post = {
        id: Date.now(), // Adicionar um ID único para cada postagem
        caption: req.body.caption,
        file: req.file.path,
        likes: 0, // Inicializar o contador de curtidas
        comments: [] // Inicializar o array de comentários
    };
    postsArray.push(post); // Adicionar ao array de postagens

    // Emitir o novo post para todos os clientes conectados via WebSocket
    io.emit('newPost', post);

    res.status(200).send('Arquivo enviado com sucesso!');
});

// Rota para curtir uma postagem
app.post('/like/:postId', (req, res) => {
    const postId = req.params.postId;
    const post = postsArray.find(p => p.id == postId);
    if (post) {
        post.likes++; // Incrementar o contador de curtidas
        io.emit('postLiked', { postId: post.id, likes: post.likes });
        res.status(200).send(`Post ${postId} curtido!`);
    } else {
        res.status(404).send(`Post ${postId} não encontrado.`);
    }
});

// Rota para comentar uma postagem
app.post('/comment/:postId', express.json(), (req, res) => {
    const postId = req.params.postId;
    const { comment } = req.body;
    const post = postsArray.find(p => p.id == postId);
    if (post) {
        post.comments.push(comment); // Adicionar o comentário ao array de comentários
        io.emit('postCommented', { postId: post.id, comment });
        res.status(200).send(`Comentário adicionado ao post ${postId}.`);
    } else {
        res.status(404).send(`Post ${postId} não encontrado.`);
    }
});

// Configuração do Socket.io para comunicação em tempo real
io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    // Enviar postagens iniciais para o cliente ao conectar
    socket.emit('initialPosts', postsArray);

    // Escutar evento de curtir postagem
    socket.on('likePost', (postId) => {
        const post = postsArray.find(p => p.id == postId);
        if (post) {
            post.likes++;
            io.emit('postLiked', { postId: post.id, likes: post.likes });
        }
    });

    // Escutar evento de comentar postagem
    socket.on('commentPost', ({ postId, comment }) => {
        const post = postsArray.find(p => p.id == postId);
        if (post) {
            post.comments.push(comment);
            io.emit('postCommented', { postId: post.id, comment });
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

// Inicialização do servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});
