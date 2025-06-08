// Importa o framework Express, usado para criar o servidor web e definir rotas
const express = require('express');

// Importa o módulo sqlite3 com mensagens detalhadas de erro
const sqlite3 = require('sqlite3').verbose();

// Importa o body-parser, que interpreta o corpo das requisições como JSON
const bodyParser = require('body-parser');

// Cria uma instância da aplicação Express
const app = express();

// Define a porta que o servidor irá escutar
const PORT = 2229;

// Middleware que faz o Express entender JSON no corpo das requisições
app.use(bodyParser.json());

// Conecta (ou cria) um banco de dados SQLite chamado registros.db
const db = new sqlite3.Database('./registros.db', (err) => {
  if (err) return console.error(err.message); // Mostra erro, se houver
  console.log('Conectado ao banco SQLite.'); // Confirma conexão com o banco
});

// Cria a tabela 'registros' no banco, caso ainda não exista
db.run(`CREATE TABLE IF NOT EXISTS registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- ID único que é incrementado automaticamente
  titulo TEXT NOT NULL,                   -- Título do registro (campo obrigatório)
  descricao TEXT,                         -- Descrição opcional
  concluida INTEGER DEFAULT 0             -- Estado de conclusão (0 = não concluído, 1 = concluído)
)`);

//////////////////////////////////////////////////////////////////////////////////////////
// ROTAS DA API
//////////////////////////////////////////////////////////////////////////////////////////

// Rota GET /registros - Retorna todos os registros do banco
app.get('/registros', (req, res) => {
  db.all('SELECT * FROM registros', [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message }); // Erro no banco
    res.json(rows); // Retorna todos os registros encontrados em JSON
  });
});

// Rota GET /registros/:id - Retorna um registro específico pelo ID
app.get('/registros/:id', (req, res) => {
  const { id } = req.params; // Extrai o ID da URL
  db.get('SELECT * FROM registros WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ erro: err.message }); // Erro ao buscar no banco
    if (!row) return res.status(404).json({ erro: 'Registro não encontrado' }); // Nenhum registro com esse ID
    res.json(row); // Retorna o registro encontrado
  });
});

// Rota POST /registros - Cria um novo registro no banco
app.post('/registros', (req, res) => {
  const { titulo, descricao } = req.body; // Extrai os dados enviados no corpo da requisição

  // Verifica se o campo 'titulo' foi fornecido
  if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório' });

  // Insere novo registro no banco
  db.run('INSERT INTO registros (titulo, descricao) VALUES (?, ?)', [titulo, descricao], function(err) {
    if (err) return res.status(500).json({ erro: err.message }); // Erro ao inserir no banco

    // Retorna o novo registro criado com ID gerado automaticamente
    res.status(201).json({ id: this.lastID, titulo, descricao, concluida: 0 });
  });
});

// Rota PUT /registros/:id - Atualiza um registro existente
app.put('/registros/:id', (req, res) => {
  const { id } = req.params; // ID do registro a ser atualizado
  const { titulo, descricao, concluida } = req.body; // Dados a serem atualizados

  // Atualiza os dados no banco com base no ID
  db.run(
    'UPDATE registros SET titulo = ?, descricao = ?, concluida = ? WHERE id = ?',
    [titulo, descricao, concluida, id],
    function(err) {
      if (err) return res.status(500).json({ erro: err.message }); // Erro no banco
      if (this.changes === 0) return res.status(404).json({ erro: 'Registro não encontrado' }); // Nenhuma linha alterada

      // Retorna os dados atualizados
      res.json({ id, titulo, descricao, concluida });
    }
  );
});

// Rota DELETE /registros/:id - Remove um registro do banco
app.delete('/registros/:id', (req, res) => {
  const { id } = req.params; // ID do registro a ser deletado

  // Deleta o registro com base no ID
  db.run('DELETE FROM registros WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ erro: err.message }); // Erro no banco
    if (this.changes === 0) return res.status(404).json({ erro: 'Registro não encontrado' }); // Nada foi deletado

    // Confirma a exclusão
    res.json({ mensagem: 'Registro removido com sucesso' });
  });
});

// Inicia o servidor web na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
