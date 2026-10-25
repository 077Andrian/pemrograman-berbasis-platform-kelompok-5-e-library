import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000/api',
);

void main() {
  runApp(const ELibraryApp());
}

class ELibraryApp extends StatelessWidget {
  const ELibraryApp({super.key});

  @override
  Widget build(BuildContext context) {
    const primary = Color(0xFF1E3A5F);
    const accent = Color(0xFF14B8A6);
    return MaterialApp(
      title: 'E-Library',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          primary: primary,
          secondary: accent,
          surface: const Color(0xFFF8FAFC),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: accent, width: 2),
          ),
        ),
      ),
      home: const LoginPage(),
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _searchController = TextEditingController();

  bool _loading = false;
  bool _hidePassword = true;
  bool _loadingLibrary = false;
  String? _errorMessage;
  String? _libraryError;
  String? _successMessage;
  String? _accessTokenInMemory;
  Map<String, dynamic>? _currentUser;
  List<Map<String, dynamic>> _books = [];
  List<Map<String, dynamic>> _loans = [];

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    final email = (value ?? '').trim();
    if (email.isEmpty) return 'Email wajib diisi.';
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      return 'Masukkan format email yang benar.';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if ((value ?? '').isEmpty) return 'Kata sandi wajib diisi.';
    return null;
  }

  Future<void> _login() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final base = apiBaseUrl.replaceFirst(RegExp(r'/+$'), '');
      final response = await http
          .post(
            Uri.parse(base + '/auth/login'),
            headers: const {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'email': _emailController.text.trim(),
              'password': _passwordController.text,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = _decodeResponse(response);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final error = data['error'];
        final message = error is Map<String, dynamic>
            ? error['message']?.toString()
            : data['message']?.toString();
        throw Exception(
          message?.isNotEmpty == true
              ? message!
              : 'Login gagal. Periksa email dan kata sandi.',
        );
      }

      final token = data['accessToken'];
      if (token is! String || token.isEmpty) {
        throw Exception(
          'Respons login belum memuat accessToken sesuai kontrak API.',
        );
      }

      final user = data['user'] is Map<String, dynamic>
          ? data['user'] as Map<String, dynamic>
          : <String, dynamic>{};

      if (!mounted) return;
      setState(() {
        _accessTokenInMemory = token;
        _currentUser = user;
        _passwordController.clear();
        _successMessage = null;
        _errorMessage = null;
      });
      await _refreshLibrary();
    } on Exception catch (error) {
      if (!mounted) return;
      final text = error.toString().replaceFirst('Exception: ', '');
      setState(() {
        _errorMessage = text.contains('SocketException') ||
                text.contains('ClientException') ||
                text.contains('TimeoutException')
            ? 'Tidak dapat terhubung ke API. Periksa backend, alamat API, koneksi perangkat, dan konfigurasi jaringan.'
            : text;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _decodeResponse(http.Response response) {
    if (response.body.trim().isEmpty) return <String, dynamic>{};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Respons JSON bukan object.');
      }
      return decoded;
    } on FormatException {
      throw Exception('Respons API bukan JSON yang valid.');
    }
  }

  Future<Map<String, dynamic>> _apiRequest(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final base = apiBaseUrl.replaceFirst(RegExp(r'/+$'), '');
    final headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (_accessTokenInMemory != null)
        'Authorization': 'Bearer ' + _accessTokenInMemory!,
    };
    final uri = Uri.parse(base + path);
    late http.Response response;

    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers)
            .timeout(const Duration(seconds: 15));
        break;
      case 'POST':
        response = await http.post(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        ).timeout(const Duration(seconds: 15));
        break;
      case 'PATCH':
        response = await http.patch(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        ).timeout(const Duration(seconds: 15));
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: headers)
            .timeout(const Duration(seconds: 15));
        break;
      default:
        throw Exception('Metode HTTP tidak didukung.');
    }

    if (response.statusCode == 204) return <String, dynamic>{};
    final data = _decodeResponse(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = data['error'];
      final detail = error is Map<String, dynamic>
          ? error['message']?.toString()
          : data['message']?.toString();
      throw Exception(
        detail?.isNotEmpty == true
            ? detail!
            : 'Permintaan API gagal dengan HTTP ' +
                response.statusCode.toString() + '.',
      );
    }
    return data;
  }

  Future<void> _refreshLibrary({String? query}) async {
    if (_accessTokenInMemory == null) return;
    setState(() {
      _loadingLibrary = true;
      _libraryError = null;
    });

    try {
      final profile = await _apiRequest('GET', '/auth/me');
      final profileData = profile['data'];
      final current = profileData is Map<String, dynamic>
          ? profileData
          : (_currentUser ?? <String, dynamic>{});
      final search = (query ?? _searchController.text).trim();
      final path = '/books' +
          (search.isEmpty ? '' : '?q=' + Uri.encodeQueryComponent(search));
      final booksResponse = await _apiRequest('GET', path);
      final role = current['role']?.toString() ?? 'member';
      final loansResponse = await _apiRequest(
        'GET',
        role == 'admin' ? '/admin/loans' : '/loans/my',
      );
      final rawBooks = booksResponse['data'];
      final rawLoans = loansResponse['data'];

      if (!mounted) return;
      setState(() {
        _currentUser = current;
        _books = rawBooks is List
            ? rawBooks.whereType<Map<String, dynamic>>().toList()
            : <Map<String, dynamic>>[];
        _loans = rawLoans is List
            ? rawLoans.whereType<Map<String, dynamic>>().toList()
            : <Map<String, dynamic>>[];
      });
    } on Exception catch (error) {
      if (mounted) {
        setState(() {
          _libraryError = error.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) setState(() => _loadingLibrary = false);
    }
  }

  void _notify(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _borrowBook(int bookId) async {
    try {
      await _apiRequest('POST', '/loans', body: {'bookId': bookId});
      _notify('Buku berhasil dipinjam.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _returnLoan(int loanId) async {
    try {
      final isAdmin = _currentUser?['role'] == 'admin';
      if (isAdmin) {
        await _apiRequest(
          'PATCH',
          '/admin/loans/' + loanId.toString() + '/status',
          body: {'status': 'returned'},
        );
      } else {
        await _apiRequest('POST', '/loans/' + loanId.toString() + '/return');
      }
      _notify('Status peminjaman diperbarui.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _logout() {
    setState(() {
      _accessTokenInMemory = null;
      _currentUser = null;
      _books = [];
      _loans = [];
      _libraryError = null;
      _errorMessage = null;
      _successMessage = null;
      _passwordController.clear();
      _searchController.clear();
    });
  }

  Future<void> _showAddBookDialog() async {
    final titleController = TextEditingController();
    final authorController = TextEditingController();
    final stockController = TextEditingController(text: '1');
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Tambah buku'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Judul buku'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: authorController,
                decoration: const InputDecoration(labelText: 'Penulis'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: stockController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Stok tersedia'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );

    final title = titleController.text.trim();
    final author = authorController.text.trim();
    final stock = int.tryParse(stockController.text.trim());
    titleController.dispose();
    authorController.dispose();
    stockController.dispose();
    if (result != true) return;
    if (title.length < 2 || author.length < 2 || stock == null || stock < 0) {
      _notify('Isi judul, penulis, dan stok dengan benar.');
      return;
    }
    try {
      await _apiRequest('POST', '/admin/books', body: {
        'title': title,
        'author': author,
        'stock': stock,
        'description': '',
      });
      _notify('Buku baru berhasil ditambahkan.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _editBook(Map<String, dynamic> book) async {
    final controller = TextEditingController(
      text: book['title']?.toString() ?? '',
    );
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Ubah judul buku'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Judul buku'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
    final title = controller.text.trim();
    controller.dispose();
    if (result != true || title.isEmpty) return;
    try {
      await _apiRequest(
        'PATCH',
        '/admin/books/' + book['id'].toString(),
        body: {'title': title},
      );
      _notify('Judul buku diperbarui.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _deleteBook(int bookId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Hapus buku?'),
        content: const Text(
          'Buku yang memiliki riwayat peminjaman tidak dapat dihapus.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _apiRequest('DELETE', '/admin/books/' + bookId.toString());
      _notify('Buku berhasil dihapus.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Widget _buildLibrary() {
    final isAdmin = _currentUser?['role'] == 'admin';
    final username = _currentUser?['name']?.toString() ?? 'Pengguna';
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('E-Library'),
        actions: [
          if (isAdmin)
            IconButton(
              tooltip: 'Tambah buku',
              onPressed: _showAddBookDialog,
              icon: const Icon(Icons.add),
            ),
          IconButton(
            tooltip: 'Keluar',
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _refreshLibrary(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Halo, ' + username,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1E3A5F),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              isAdmin
                  ? 'Admin · kelola katalog dan peminjaman'
                  : 'Member · temukan buku dan kelola pinjaman',
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: (value) => _refreshLibrary(query: value),
              decoration: InputDecoration(
                hintText: 'Cari judul atau penulis',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  tooltip: 'Cari',
                  onPressed: () => _refreshLibrary(query: _searchController.text),
                  icon: const Icon(Icons.arrow_forward),
                ),
              ),
            ),
            if (_loadingLibrary) ...[
              const SizedBox(height: 12),
              const LinearProgressIndicator(),
            ],
            if (_libraryError != null) ...[
              const SizedBox(height: 12),
              _StatusBox(text: _libraryError!, success: false),
            ],
            const SizedBox(height: 20),
            const Text(
              'Katalog buku',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            if (_books.isEmpty && !_loadingLibrary)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Belum ada buku yang dapat ditampilkan.'),
                ),
              ),
            ..._books.map((book) {
              final id = (book['id'] as num?)?.toInt() ?? 0;
              final stock = (book['stock'] as num?)?.toInt() ?? 0;
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        book['title']?.toString() ?? 'Judul buku',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Color(0xFF1E3A5F),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text('Penulis: ' + (book['author']?.toString() ?? '-')),
                      const SizedBox(height: 6),
                      Text(
                        book['description']?.toString() ?? '',
                        style: const TextStyle(color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        (book['categoryName']?.toString() ?? 'Tanpa kategori') +
                            ' · Stok: ' + stock.toString(),
                      ),
                      const SizedBox(height: 10),
                      if (!isAdmin)
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: stock > 0 ? () => _borrowBook(id) : null,
                            child: Text(stock > 0 ? 'Pinjam buku' : 'Stok habis'),
                          ),
                        )
                      else
                        Wrap(
                          spacing: 8,
                          children: [
                            OutlinedButton(
                              onPressed: () => _editBook(book),
                              child: const Text('Ubah judul'),
                            ),
                            OutlinedButton(
                              onPressed: () => _deleteBook(id),
                              child: const Text('Hapus'),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),
            Text(
              isAdmin ? 'Semua peminjaman' : 'Peminjaman saya',
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            if (_loans.isEmpty && !_loadingLibrary)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Belum ada data peminjaman.'),
                ),
              ),
            ..._loans.map((loan) {
              final id = (loan['id'] as num?)?.toInt() ?? 0;
              final status = loan['status']?.toString() ?? '-';
              final children = <Widget>[
                Text(
                  loan['bookTitle']?.toString() ?? 'Buku',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (isAdmin)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Peminjam: ' +
                          (loan['userName']?.toString() ??
                              loan['userEmail']?.toString() ??
                              '-'),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    'Jatuh tempo: ' + (loan['dueDate']?.toString() ?? '-'),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('Status: ' + status),
                ),
                if (status == 'borrowed')
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => _returnLoan(id),
                      child: const Text('Tandai dikembalikan'),
                    ),
                  ),
              ];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: children,
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_accessTokenInMemory != null && _currentUser != null) {
      return _buildLibrary();
    }
    const primary = Color(0xFF1E3A5F);
    const accent = Color(0xFF14B8A6);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'E',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    'E-LIBRARY · KELOMPOK 5',
                    style: TextStyle(
                      color: primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Selamat datang kembali',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Masuk untuk melanjutkan aktivitas perpustakaan digitalmu.',
                    style: TextStyle(
                      color: Color(0xFF64748B),
                      height: 1.55,
                    ),
                  ),
                  const SizedBox(height: 30),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Email',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.username],
                          validator: _validateEmail,
                          decoration: const InputDecoration(
                            hintText: 'nama@contoh.com',
                            prefixIcon: Icon(Icons.mail_outline),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'Kata sandi',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _hidePassword,
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.password],
                          validator: _validatePassword,
                          onFieldSubmitted: (_) {
                            if (!_loading) _login();
                          },
                          decoration: InputDecoration(
                            hintText: 'Masukkan kata sandi',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              tooltip: _hidePassword
                                  ? 'Tampilkan kata sandi'
                                  : 'Sembunyikan kata sandi',
                              onPressed: () => setState(
                                () => _hidePassword = !_hidePassword,
                              ),
                              icon: Icon(
                                _hidePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                            ),
                          ),
                        ),
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 16),
                          _StatusBox(text: _errorMessage!, success: false),
                        ],
                        if (_successMessage != null) ...[
                          const SizedBox(height: 16),
                          _StatusBox(text: _successMessage!, success: true),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          height: 50,
                          child: FilledButton(
                            onPressed: _loading ? null : _login,
                            style: FilledButton.styleFrom(
                              backgroundColor: primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: _loading
                                ? const SizedBox(
                                    height: 21,
                                    width: 21,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    'Masuk',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Prototipe login · membutuhkan backend API yang aktif.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 12,
                      height: 1.5,
                    ),
                  ),
                  if (_accessTokenInMemory != null)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        'Status autentikasi saat ini hanya disimpan di memori.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: accent,
                          fontSize: 12,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusBox extends StatelessWidget {
  const _StatusBox({required this.text, required this.success});

  final String text;
  final bool success;

  @override
  Widget build(BuildContext context) {
    final foreground = success
        ? const Color(0xFF115E59)
        : const Color(0xFF991B1B);
    final background = success
        ? const Color(0xFFF0FDFA)
        : const Color(0xFFFEF2F2);
    final border = success
        ? const Color(0xFF99F6E4)
        : const Color(0xFFFECACA);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(color: foreground, height: 1.45, fontSize: 13),
      ),
    );
  }
}