import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    // 1. Initial Books Loading
    if (!localStorage.getItem('mock_books')) {
      const request = new XMLHttpRequest();
      // Try path with repository subfolder (GitHub Pages)
      request.open('GET', '/Book-Store-AngularJS/assets/books.json', false);
      request.send(null);
      let rawText = '';
      if (request.status === 200) {
        rawText = request.responseText;
      } else {
        // Fallback for local serving
        request.open('GET', '/assets/books.json', false);
        request.send(null);
        if (request.status === 200) {
          rawText = request.responseText;
        }
      }

      if (rawText) {
        try {
          const books = rawText.split('\n')
            .filter(line => line.trim())
            .map(line => {
              const parsed = JSON.parse(line);
              if (parsed._id && parsed._id.$oid) {
                parsed._id = parsed._id.$oid;
              }
              if (parsed.creationDate && parsed.creationDate.$date) {
                parsed.creationDate = parsed.creationDate.$date;
              }
              return parsed;
            });
          localStorage.setItem('mock_books', JSON.stringify(books));
        } catch (e) {
          console.error('Failed to parse books.json', e);
          localStorage.setItem('mock_books', '[]');
        }
      } else {
        localStorage.setItem('mock_books', '[]');
      }
    }

    // 2. Initial Users
    if (!localStorage.getItem('mock_users')) {
      // Seed default admin and user to match server/models/Role.js seeds
      const defaultAdmin = {
        _id: 'admin_123',
        username: 'admin',
        email: 'admin@admin.com',
        isAdmin: true,
        isBlocked: false,
        avatar: 'https://i.imgur.com/7m7fOma.jpg',
        favorites: []
      };
      const defaultUser = {
        _id: 'user_123',
        username: 'jeliozver',
        email: 'jeliozver@gmail.com',
        isAdmin: false,
        isBlocked: false,
        avatar: 'https://i.imgur.com/7m7fOma.jpg',
        favorites: []
      };
      localStorage.setItem('mock_users', JSON.stringify([defaultAdmin, defaultUser]));
      localStorage.setItem('mock_passwords', JSON.stringify({
        'admin': 'admin',
        'jeliozver': '123'
      }));
    }

    // 3. Initial Carts, Comments, Receipts
    if (!localStorage.getItem('mock_carts')) {
      localStorage.setItem('mock_carts', JSON.stringify({
        'admin_123': { user: 'admin_123', books: [], totalPrice: 0 },
        'user_123': { user: 'user_123', books: [], totalPrice: 0 }
      }));
    }
    if (!localStorage.getItem('mock_comments')) {
      localStorage.setItem('mock_comments', '[]');
    }
    if (!localStorage.getItem('mock_receipts')) {
      localStorage.setItem('mock_receipts', '[]');
    }
  }

  // Helper getters/setters for LocalStorage data
  private getBooks(): any[] {
    return JSON.parse(localStorage.getItem('mock_books') || '[]');
  }
  private saveBooks(books: any[]) {
    localStorage.setItem('mock_books', JSON.stringify(books));
  }
  private getUsers(): any[] {
    return JSON.parse(localStorage.getItem('mock_users') || '[]');
  }
  private saveUsers(users: any[]) {
    localStorage.setItem('mock_users', JSON.stringify(users));
  }
  private getPasswords(): { [key: string]: string } {
    return JSON.parse(localStorage.getItem('mock_passwords') || '{}');
  }
  private savePasswords(passwords: any) {
    localStorage.setItem('mock_passwords', JSON.stringify(passwords));
  }
  private getCarts(): any {
    return JSON.parse(localStorage.getItem('mock_carts') || '{}');
  }
  private saveCarts(carts: any) {
    localStorage.setItem('mock_carts', JSON.stringify(carts));
  }
  private getComments(): any[] {
    return JSON.parse(localStorage.getItem('mock_comments') || '[]');
  }
  private saveComments(comments: any[]) {
    localStorage.setItem('mock_comments', JSON.stringify(comments));
  }
  private getReceipts(): any[] {
    return JSON.parse(localStorage.getItem('mock_receipts') || '[]');
  }
  private saveReceipts(receipts: any[]) {
    localStorage.setItem('mock_receipts', JSON.stringify(receipts));
  }

  // Get current user from JWT authorization header
  private getCurrentUser(request: HttpRequest<any>): any {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payloadPart = token.split('.')[1];
        const payload = JSON.parse(atob(payloadPart));
        // Reload from local storage to get most up-to-date state
        const users = this.getUsers();
        return users.find(u => u._id === payload.sub._id) || payload.sub;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private createToken(user: any): string {
    const payload = {
      sub: user,
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };
    // Format: header.payload.signature
    return 'mockheader.' + btoa(JSON.stringify(payload)) + '.mocksignature';
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, method, body } = request;

    // Direct match static assets pass-through
    if (url.includes('/assets/')) {
      return next.handle(request);
    }

    console.log(`Mocking Request: [${method}] ${url}`, body);

    // ----------------------------------------------------
    // USER ROUTES
    // ----------------------------------------------------

    // REGISTER
    if (url.endsWith('/user/register') && method === 'POST') {
      const users = this.getUsers();
      const passwords = this.getPasswords();
      const { username, password, email } = body;

      if (users.find(u => u.username === username)) {
        return throwError(new HttpErrorResponse({
          status: 400,
          error: { message: 'Username is already taken', errors: { username: 'Username is already taken' } }
        }));
      }

      const newUser = {
        _id: 'user_' + Date.now(),
        username,
        email,
        isAdmin: false,
        isBlocked: false,
        avatar: 'https://i.imgur.com/7m7fOma.jpg',
        favorites: []
      };

      users.push(newUser);
      passwords[username] = password;

      // Init Cart
      const carts = this.getCarts();
      carts[newUser._id] = { user: newUser._id, books: [], totalPrice: 0 };

      this.saveUsers(users);
      this.savePasswords(passwords);
      this.saveCarts(carts);

      const token = this.createToken(newUser);
      return of(new HttpResponse({
        status: 200,
        body: { message: 'Registration successful!', data: token }
      })).pipe(delay(200));
    }

    // LOGIN
    if (url.endsWith('/user/login') && method === 'POST') {
      const users = this.getUsers();
      const passwords = this.getPasswords();
      const { username, password } = body;

      const user = users.find(u => u.username === username);
      if (!user || passwords[username] !== password) {
        return throwError(new HttpErrorResponse({
          status: 400,
          error: { message: 'Invalid username or password' }
        }));
      }

      const token = this.createToken(user);
      return of(new HttpResponse({
        status: 200,
        body: { message: 'Login successful!', data: token }
      })).pipe(delay(200));
    }

    // PROFILE
    if (url.includes('/user/profile/') && method === 'GET') {
      const username = url.split('/user/profile/')[1];
      const users = this.getUsers();
      const user = users.find(u => u.username === username);

      if (!user) {
        return throwError(new HttpErrorResponse({
          status: 404,
          error: { message: 'User not found' }
        }));
      }

      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: user }
      }));
    }

    // CHANGE AVATAR
    if (url.endsWith('/user/changeAvatar') && method === 'POST') {
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const users = this.getUsers();
      const user = users.find(u => u._id === currentUser._id);
      if (user) {
        user.avatar = body.avatar;
        this.saveUsers(users);
      }

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Avatar changed successfully!', data: {} }
      }));
    }

    // BLOCK COMMENTS
    if (url.includes('/user/blockComments/') && method === 'POST') {
      const id = url.split('/user/blockComments/')[1];
      const users = this.getUsers();
      const user = users.find(u => u._id === id);
      if (user) {
        user.isBlocked = true;
        this.saveUsers(users);
      }
      return of(new HttpResponse({
        status: 200,
        body: { message: 'User blocked from commenting successfully!', data: {} }
      }));
    }

    // UNBLOCK COMMENTS
    if (url.includes('/user/unlockComments/') && method === 'POST') {
      const id = url.split('/user/unlockComments/')[1];
      const users = this.getUsers();
      const user = users.find(u => u._id === id);
      if (user) {
        user.isBlocked = false;
        this.saveUsers(users);
      }
      return of(new HttpResponse({
        status: 200,
        body: { message: 'User unblocked successfully!', data: {} }
      }));
    }

    // PURCHASE HISTORY
    if (url.endsWith('/user/purchaseHistory') && method === 'GET') {
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }
      const receipts = this.getReceipts().filter(r => r.user === currentUser._id || (r.user && r.user._id === currentUser._id));
      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: receipts }
      }));
    }

    // ----------------------------------------------------
    // CART ROUTES
    // ----------------------------------------------------

    // GET SIZE
    if (url.endsWith('/cart/getSize') && method === 'GET') {
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return of(new HttpResponse({ status: 200, body: { message: '', data: 0 } }));
      }
      const carts = this.getCarts();
      const cart = carts[currentUser._id] || { books: [] };
      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: cart.books.length }
      }));
    }

    // GET CART DETAILS
    if (url.endsWith('/user/cart') && method === 'GET') {
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }
      const carts = this.getCarts();
      const cart = carts[currentUser._id] || { user: currentUser._id, books: [], totalPrice: 0 };
      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: cart }
      }));
    }

    // ADD TO CART
    if (url.includes('/user/cart/add/') && method === 'POST') {
      const bookId = url.split('/user/cart/add/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const books = this.getBooks();
      const book = books.find(b => b._id === bookId);
      if (!book) {
        return throwError(new HttpErrorResponse({ status: 404, error: { message: 'Book not found' } }));
      }

      const carts = this.getCarts();
      const cart = carts[currentUser._id] || { user: currentUser._id, books: [], totalPrice: 0 };
      cart.books.push(book);
      cart.totalPrice = Number((cart.totalPrice + book.price).toFixed(2));
      carts[currentUser._id] = cart;
      this.saveCarts(carts);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Book added to cart successfully!', data: cart }
      }));
    }

    // REMOVE FROM CART
    if (url.includes('/user/cart/delete/') && method === 'DELETE') {
      const bookId = url.split('/user/cart/delete/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const carts = this.getCarts();
      const cart = carts[currentUser._id];
      if (cart) {
        const index = cart.books.findIndex((b: any) => b._id === bookId);
        if (index > -1) {
          const removedBook = cart.books[index];
          cart.books.splice(index, 1);
          cart.totalPrice = Number((cart.totalPrice - removedBook.price).toFixed(2));
          if (cart.totalPrice < 0) cart.totalPrice = 0;
          carts[currentUser._id] = cart;
          this.saveCarts(carts);
        }
      }

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Book removed from cart successfully!', data: cart }
      }));
    }

    // CHECKOUT
    if (url.endsWith('/user/cart/checkout') && method === 'POST') {
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const carts = this.getCarts();
      const cart = carts[currentUser._id];
      if (!cart || cart.books.length === 0) {
        return throwError(new HttpErrorResponse({ status: 400, error: { message: 'Cart is empty' } }));
      }

      // Create Receipt
      const receipts = this.getReceipts();
      const newReceipt = {
        _id: 'receipt_' + Date.now(),
        user: currentUser,
        books: [...cart.books],
        totalPrice: cart.totalPrice,
        creationDate: new Date().toISOString()
      };
      receipts.push(newReceipt);
      this.saveReceipts(receipts);

      // Update purchasesCount for books
      const books = this.getBooks();
      cart.books.forEach((cartBook: any) => {
        const b = books.find(x => x._id === cartBook._id);
        if (b) {
          b.purchasesCount = (b.purchasesCount || 0) + 1;
        }
      });
      this.saveBooks(books);

      // Clear Cart
      cart.books = [];
      cart.totalPrice = 0;
      carts[currentUser._id] = cart;
      this.saveCarts(carts);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Books purchased successfully!', data: newReceipt }
      }));
    }

    // ----------------------------------------------------
    // COMMENT ROUTES
    // ----------------------------------------------------

    // GET BOOK COMMENTS
    if (url.includes('/comment/') && method === 'GET') {
      const parts = url.split('/comment/')[1].split('/');
      const bookId = parts[0];
      const page = parseInt(parts[1] || '1', 10);
      const comments = this.getComments().filter(c => c.book === bookId || (c.book && c.book._id === bookId));

      // Sort descending by date
      comments.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

      // Paginate 10 comments per page
      const limit = 10;
      const skip = (page - 1) * limit;
      const paginatedComments = comments.slice(skip, skip + limit);

      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: paginatedComments }
      }));
    }

    // GET LATEST 5 COMMENTS BY USER
    if (url.includes('/comment/getLatestFiveByUser/') && method === 'GET') {
      const userId = url.split('/comment/getLatestFiveByUser/')[1];
      const comments = this.getComments().filter(c => c.user && (c.user === userId || c.user._id === userId));
      comments.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
      const latestFive = comments.slice(0, 5);
      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: latestFive }
      }));
    }

    // ADD COMMENT
    if (url.includes('/comment/add/') && method === 'POST') {
      const bookId = url.split('/comment/add/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }
      if (currentUser.isBlocked) {
        return throwError(new HttpErrorResponse({ status: 403, error: { message: 'You are blocked from posting comments.' } }));
      }

      const books = this.getBooks();
      const book = books.find(b => b._id === bookId);
      if (!book) {
        return throwError(new HttpErrorResponse({ status: 404, error: { message: 'Book not found' } }));
      }

      const comments = this.getComments();
      const newComment = {
        _id: 'comment_' + Date.now(),
        user: currentUser,
        content: body.content,
        book: book,
        creationDate: new Date().toISOString()
      };

      comments.push(newComment);
      this.saveComments(comments);

      // Add comment reference to book
      book.comments = book.comments || [];
      book.comments.push(newComment._id);
      this.saveBooks(books);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Comment posted successfully!', data: newComment }
      }));
    }

    // EDIT COMMENT
    if (url.includes('/comment/edit/') && method === 'PUT') {
      const commentId = url.split('/comment/edit/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const comments = this.getComments();
      const comment = comments.find(c => c._id === commentId);
      if (!comment) {
        return throwError(new HttpErrorResponse({ status: 404, error: { message: 'Comment not found' } }));
      }

      // Check permissions
      if (comment.user._id !== currentUser._id && !currentUser.isAdmin) {
        return throwError(new HttpErrorResponse({ status: 403, error: { message: 'Unauthorized to edit this comment' } }));
      }

      comment.content = body.content;
      this.saveComments(comments);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Comment edited successfully!', data: comment }
      }));
    }

    // DELETE COMMENT
    if (url.includes('/comment/delete/') && method === 'DELETE') {
      const commentId = url.split('/comment/delete/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const comments = this.getComments();
      const commentIndex = comments.findIndex(c => c._id === commentId);
      if (commentIndex === -1) {
        return throwError(new HttpErrorResponse({ status: 404, error: { message: 'Comment not found' } }));
      }

      const comment = comments[commentIndex];
      if (comment.user._id !== currentUser._id && !currentUser.isAdmin) {
        return throwError(new HttpErrorResponse({ status: 403, error: { message: 'Unauthorized to delete this comment' } }));
      }

      comments.splice(commentIndex, 1);
      this.saveComments(comments);

      // Clean reference in book
      const books = this.getBooks();
      const book = books.find(b => b._id === (comment.book._id || comment.book));
      if (book && book.comments) {
        const index = book.comments.indexOf(commentId);
        if (index > -1) {
          book.comments.splice(index, 1);
          this.saveBooks(books);
        }
      }

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Comment deleted successfully!', data: {} }
      }));
    }

    // ----------------------------------------------------
    // BOOK ROUTES
    // ----------------------------------------------------

    // DETAILS
    if (url.includes('/book/details/') && method === 'GET') {
      const bookId = url.split('/book/details/')[1];
      const books = this.getBooks();
      const book = books.find(b => b._id === bookId);

      if (!book) {
        return throwError(new HttpErrorResponse({
          status: 404,
          error: { message: 'Book not found' }
        }));
      }

      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: book }
      }));
    }

    // CREATE BOOK
    if (url.endsWith('/book/add') && method === 'POST') {
      const currentUser = this.getCurrentUser(request);
      if (!currentUser || !currentUser.isAdmin) {
        return throwError(new HttpErrorResponse({ status: 403, error: { message: 'Unauthorized admin action' } }));
      }

      const books = this.getBooks();
      const newBook = {
        ...body,
        _id: 'book_' + Date.now(),
        currentRating: 0,
        ratingPoints: 0,
        ratedCount: 0,
        ratedBy: [],
        purchasesCount: 0,
        comments: [],
        creationDate: new Date().toISOString()
      };

      books.push(newBook);
      this.saveBooks(books);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Book created successfully!', data: newBook }
      })).pipe(delay(200));
    }

    // EDIT BOOK
    if (url.includes('/book/edit/') && method === 'PUT') {
      const bookId = url.split('/book/edit/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser || !currentUser.isAdmin) {
        return throwError(new HttpErrorResponse({ status: 403, error: { message: 'Unauthorized admin action' } }));
      }

      const books = this.getBooks();
      const bookIndex = books.findIndex(b => b._id === bookId);
      if (bookIndex === -1) {
        return throwError(new HttpErrorResponse({ status: 404, error: { message: 'Book not found' } }));
      }

      const updatedBook = {
        ...books[bookIndex],
        ...body
      };
      books[bookIndex] = updatedBook;
      this.saveBooks(books);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Book updated successfully!', data: updatedBook }
      }));
    }

    // DELETE BOOK
    if (url.includes('/book/delete/') && method === 'DELETE') {
      const bookId = url.split('/book/delete/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser || !currentUser.isAdmin) {
        return throwError(new HttpErrorResponse({ status: 403, error: { message: 'Unauthorized admin action' } }));
      }

      const books = this.getBooks();
      const bookIndex = books.findIndex(b => b._id === bookId);
      if (bookIndex === -1) {
        return throwError(new HttpErrorResponse({ status: 404, error: { message: 'Book not found' } }));
      }

      books.splice(bookIndex, 1);
      this.saveBooks(books);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Book deleted successfully!', data: {} }
      }));
    }

    // RATE BOOK
    if (url.includes('/book/rate/') && method === 'POST') {
      const bookId = url.split('/book/rate/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const books = this.getBooks();
      const book = books.find(b => b._id === bookId);
      if (!book) {
        return throwError(new HttpErrorResponse({ status: 404, error: { message: 'Book not found' } }));
      }

      book.ratedBy = book.ratedBy || [];
      if (book.ratedBy.includes(currentUser._id)) {
        return throwError(new HttpErrorResponse({ status: 400, error: { message: 'You have already rated this book!' } }));
      }

      const score = body.rating;
      book.ratingPoints = (book.ratingPoints || 0) + score;
      book.ratedCount = (book.ratedCount || 0) + 1;
      book.currentRating = Number((book.ratingPoints / book.ratedCount).toFixed(2));
      book.ratedBy.push(currentUser._id);
      this.saveBooks(books);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Rating submitted successfully!', data: book }
      }));
    }

    // FAVORITES
    if (url.includes('/book/addToFavorites/') && method === 'POST') {
      const bookId = url.split('/book/addToFavorites/')[1];
      const currentUser = this.getCurrentUser(request);
      if (!currentUser) {
        return throwError(new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
      }

      const users = this.getUsers();
      const user = users.find(u => u._id === currentUser._id);
      let msg = '';
      if (user) {
        user.favorites = user.favorites || [];
        const index = user.favorites.indexOf(bookId);
        if (index > -1) {
          user.favorites.splice(index, 1);
          msg = 'Removed from favorites!';
        } else {
          user.favorites.push(bookId);
          msg = 'Added to favorites!';
        }
        this.saveUsers(users);
      }

      return of(new HttpResponse({
        status: 200,
        body: { message: msg, data: {} }
      }));
    }

    // SEARCH, SORT & PAGINATE
    if (url.includes('/book/search') && method === 'GET') {
      const queryStr = url.split('/book/search')[1];
      let books = this.getBooks();

      // 1. Filter by Search Query
      const queryParamMatch = queryStr.match(/[?&]query=([^&]*)/);
      if (queryParamMatch) {
        try {
          const queryObj = JSON.parse(decodeURIComponent(queryParamMatch[1]));
          if (queryObj.searchTerm) {
            const term = queryObj.searchTerm.toLowerCase().trim();
            books = books.filter(b => 
              b.title.toLowerCase().includes(term) ||
              b.author.toLowerCase().includes(term) ||
              b.genre.toLowerCase().includes(term) ||
              b.isbn.toLowerCase().includes(term)
            );
          }
        } catch (e) {}
      }

      // 2. Sort
      const sortParamMatch = queryStr.match(/[?&]sort=([^&]*)/);
      if (sortParamMatch) {
        try {
          const sortObj = JSON.parse(decodeURIComponent(sortParamMatch[1]));
          const sortKey = Object.keys(sortObj)[0];
          const sortVal = sortObj[sortKey];

          books.sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];

            if (sortKey === 'creationDate') {
              valA = new Date(valA).getTime();
              valB = new Date(valB).getTime();
            }

            if (valA < valB) return sortVal === 1 ? -1 : 1;
            if (valA > valB) return sortVal === 1 ? 1 : -1;
            return 0;
          });
        } catch (e) {}
      }

      const totalItems = books.length;

      // 3. Skip / Limit
      const skipMatch = queryStr.match(/[?&]skip=([0-9]*)/);
      const limitMatch = queryStr.match(/[?&]limit=([0-9]*)/);
      
      const skip = skipMatch ? parseInt(skipMatch[1], 10) : 0;
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : books.length;

      books = books.slice(skip, skip + limit);

      return of(new HttpResponse({
        status: 200,
        body: { message: '', data: books, itemsCount: totalItems }
      }));
    }

    // Default: pass through (e.g. if we missed any unknown routes, though this should handle everything)
    return next.handle(request);
  }
}
