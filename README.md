# 📚 Book Store — AngularJS

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D8.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v3.6%2B-green.svg)
![Angular](https://img.shields.io/badge/Angular-7%2B-red.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**A full-stack Single Page Application for browsing, buying, and reviewing books — built with Angular, Node.js, Express & MongoDB.**

</div>

---

## ✨ Features

### 👤 Anonymous Users
- Browse all available books
- View book details, ratings & comments
- Register / Login

### 🔐 Authenticated Users
- 🛒 Purchase books
- ⭐ Rate & review books
- 💬 Comment on books
- 📜 View personal purchase history
- ❤️ Create a favorites list
- 🖼️ Change personal avatar

### 🛡️ Admin Users
- ➕ Add new books to the store
- ✏️ Edit & 🗑️ Delete books
- 🚫 Block / Unblock users from commenting
- 🛠️ Manage inappropriate comments & avatars

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | [Angular](https://angular.io) |
| **Backend** | [Node.js](https://nodejs.org) + [Express.js](https://expressjs.com) |
| **Database** | [MongoDB](https://www.mongodb.com) + [Mongoose](http://mongoosejs.com) |
| **Auth** | [JWT (JSON Web Tokens)](https://jwt.io) |

---

## 🏗️ Architecture Highlights

- 📦 **Feature Modules** — each major feature wrapped in its own module
- ⚡ **Lazy Loading** — faster initial load with on-demand module loading
- 🔄 **Preloading Strategy** — pre-fetches lazy modules post-startup
- 🔗 **Shared Module** — reusable components, directives & pipes
- 🛡️ **Route Guards** — protects authenticated & admin-only routes
- 🔌 **HTTP Interceptors** — JWT injection, response notifications & error handling
- 📋 **Reactive Forms** — robust form handling with validation
- 🏷️ **Custom Directives & Pipes**
- 📐 **TypeScript Models**

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) `v8+`
- [MongoDB](https://www.mongodb.com/download-center#community) `v3.6+`

---

### 1️⃣ Start the Database

Install MongoDB, then open a terminal in the project root:

```sh
cd server
start-mongodb
```

> Default port: **27017**

---

### 2️⃣ Seed the Database *(First time only)*

After MongoDB is running, open a new terminal:

```sh
cd server
seedBooks
```

---

### 3️⃣ Start the Backend Server

```sh
cd server
npm install     # only on first run
npm start
```

> Runs on **http://localhost:8000**

---

### 4️⃣ Start the Frontend Client

```sh
cd client
npm install     # only on first run
ng serve
```

> Runs on **http://localhost:4200**

---

## 📁 Project Structure

```
Book-Store-AngularJS/
├── client/          # Angular frontend
│   ├── src/
│   │   ├── app/     # Feature modules, components, services
│   │   └── assets/  # Static assets
├── server/          # Node.js + Express backend
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API routes
│   └── config/      # DB & app configuration
├── LICENSE
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 👨‍💻 Author

**vijaymahes9080**
- GitHub: [@vijaymahes9080](https://github.com/vijaymahes9080)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/vijaymahes9080">vijaymahes9080</a>
</div>