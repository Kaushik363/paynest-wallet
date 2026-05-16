const password = "admin123"
const api_key = "sk-supersecretkey123456"

function getUser(id) {
  const query = "SELECT * FROM users WHERE id = " + id
  db.execute(query)
}
