import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

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
        scaffoldBackgroundColor: const Color(0xFFF3F7F8),
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          primary: primary,
          secondary: accent,
          surface: const Color(0xFFFFFFFF),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF14283D),
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: Color(0xFF14283D),
            fontSize: 20,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.4,
          ),
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 12),
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: const BorderSide(color: Color(0xFFE2EAED)),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          hintStyle: const TextStyle(color: Color(0xFF9AAAB5), fontSize: 14),
          prefixIconColor: const Color(0xFF718797),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFDCE6E9)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFDCE6E9)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: accent, width: 1.7),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: primary,
            foregroundColor: Colors.white,
            elevation: 0,
            minimumSize: const Size(0, 48),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
            textStyle: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: primary,
            side: const BorderSide(color: Color(0xFFDCE6E9)),
            minimumSize: const Size(0, 42),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF173D59),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _searchController = TextEditingController();

  bool _loading = false;
  bool _hidePassword = true;
  bool _isRegistering = false;
  bool _loadingLibrary = false;
  String? _errorMessage;
  String? _libraryError;
  String? _successMessage;
  String? _accessTokenInMemory;
  Map<String, dynamic>? _currentUser;
  List<Map<String, dynamic>> _books = [];
  List<Map<String, dynamic>> _loans = [];
  List<Map<String, dynamic>> _reservations = [];
  List<Map<String, dynamic>> _ebooks = [];
  Map<String, dynamic> _fines = <String, dynamic>{};
  Map<String, dynamic> _leadershipStats = <String, dynamic>{};

  @override
  void dispose() {
    _nameController.dispose();
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

  String? _validateName(String? value) {
    if (!_isRegistering) return null;
    final name = (value ?? '').trim();
    if (name.length < 2) return 'Nama minimal 2 karakter.';
    if (name.length > 80) return 'Nama maksimal 80 karakter.';
    return null;
  }

  String? _validatePassword(String? value) {
    final password = value ?? '';
    if (password.isEmpty) return 'Kata sandi wajib diisi.';
    if (_isRegistering && password.length < 8) {
      return 'Kata sandi minimal 8 karakter.';
    }
    if (password.length > 72) return 'Kata sandi maksimal 72 karakter.';
    return null;
  }

  void _toggleAuthMode() {
    setState(() {
      _isRegistering = !_isRegistering;
      _errorMessage = null;
      _successMessage = null;
      _nameController.clear();
      _passwordController.clear();
      _formKey.currentState?.reset();
    });
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
      if (_isRegistering) {
        final registerResponse = await http
            .post(
              Uri.parse(base + '/auth/register'),
              headers: const {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: jsonEncode({
                'name': _nameController.text.trim(),
                'email': _emailController.text.trim(),
                'password': _passwordController.text,
              }),
            )
            .timeout(const Duration(seconds: 15));
        final registerData = _decodeResponse(registerResponse);
        if (registerResponse.statusCode < 200 || registerResponse.statusCode >= 300) {
          final error = registerData['error'];
          final detail = error is Map<String, dynamic>
              ? error['message']?.toString()
              : registerData['message']?.toString();
          throw Exception(detail?.isNotEmpty == true
              ? detail!
              : 'Pendaftaran gagal. Periksa data yang dimasukkan.');
        }
        if (!mounted) return;
        setState(() {
          _isRegistering = false;
          _passwordController.clear();
          _nameController.clear();
          _successMessage = 'Pendaftaran berhasil. Silakan masuk dengan akun yang baru dibuat.';
          _errorMessage = null;
        });
        return;
      }

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
      Map<String, dynamic>? loansResponse;
      Map<String, dynamic>? leadershipResponse;
      Map<String, dynamic>? reservationsResponse;
      Map<String, dynamic>? finesResponse;
      final ebooksResponse = await _apiRequest('GET', '/ebooks');
      if (role == 'leadership') {
        leadershipResponse = await _apiRequest('GET', '/leadership/stats');
      } else {
        loansResponse = await _apiRequest(
          'GET',
          role == 'librarian' ? '/admin/loans' : '/loans/my',
        );
        if (role == 'member') {
          reservationsResponse = await _apiRequest('GET', '/reservations/my');
          finesResponse = await _apiRequest('GET', '/fines/my');
        }
      }
      final rawBooks = booksResponse['data'];
      final rawLoans = loansResponse?['data'];
      final rawLeadership = leadershipResponse?['data'];
      final rawReservations = reservationsResponse?['data'];
      final rawEbooks = ebooksResponse['data'];

      if (!mounted) return;
      setState(() {
        _currentUser = current;
        _books = rawBooks is List
            ? rawBooks.whereType<Map<String, dynamic>>().toList()
            : <Map<String, dynamic>>[];
        _loans = rawLoans is List
            ? rawLoans.whereType<Map<String, dynamic>>().toList()
            : <Map<String, dynamic>>[];
        _leadershipStats = rawLeadership is Map
            ? Map<String, dynamic>.from(rawLeadership)
            : <String, dynamic>{};
        _reservations = rawReservations is List
            ? rawReservations.whereType<Map<String, dynamic>>().toList()
            : <Map<String, dynamic>>[];
        _ebooks = rawEbooks is List
            ? rawEbooks.whereType<Map<String, dynamic>>().toList()
            : <Map<String, dynamic>>[];
        final rawFines = finesResponse?['data'];
        _fines = rawFines is Map
            ? Map<String, dynamic>.from(rawFines)
            : <String, dynamic>{};
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
      final book = _books.firstWhere((item) => item['id'] == bookId);
      if (((book['stock'] as num?)?.toInt() ?? 0) > 0) {
        await _apiRequest('POST', '/loans', body: {'bookId': bookId});
        _notify('Buku berhasil dipinjam.');
      } else {
        await _apiRequest('POST', '/reservations', body: {'bookId': bookId});
        _notify('Reservasi berhasil masuk antrean.');
      }
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _renewLoan(int loanId) async {
    try {
      await _apiRequest('POST', '/loans/' + loanId.toString() + '/renew');
      _notify('Masa peminjaman berhasil diperpanjang.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _claimReservation(int reservationId) async {
    try {
      await _apiRequest('POST', '/reservations/' + reservationId.toString() + '/claim');
      _notify('Reservasi berhasil menjadi peminjaman.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _cancelReservation(int reservationId) async {
    try {
      await _apiRequest('DELETE', '/reservations/' + reservationId.toString());
      _notify('Reservasi dibatalkan.');
      await _refreshLibrary();
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _openEbook(Map<String, dynamic> ebook) async {
    try {
      final result = await _apiRequest('GET', '/ebooks/' + ebook['id'].toString() + '/download');
      final url = Uri.parse(result['data']['downloadUrl'].toString());
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        _notify('Tautan e-book tidak dapat dibuka.');
      }
    } on Exception catch (error) {
      _notify(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _showAddEbookDialog() async {
    final title = TextEditingController();
    final author = TextEditingController();
    final url = TextEditingController();
    final description = TextEditingController();
    final saved = await showDialog<bool>(context: context, builder: (dialogContext) => AlertDialog(
      title: const Text('Tambah e-book'),
      content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: title, decoration: const InputDecoration(labelText: 'Judul')),
        TextField(controller: author, decoration: const InputDecoration(labelText: 'Penulis')),
        TextField(controller: url, decoration: const InputDecoration(labelText: 'URL HTTPS file')),
        TextField(controller: description, decoration: const InputDecoration(labelText: 'Deskripsi')),
      ])),
      actions: [TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Batal')),
        FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Simpan'))],
    ));
    if (saved == true) {
      try {
        await _apiRequest('POST', '/admin/ebooks', body: {'title': title.text.trim(), 'author': author.text.trim(), 'fileUrl': url.text.trim(), 'description': description.text.trim()});
        _notify('E-book berhasil ditambahkan.');
        await _refreshLibrary();
      } on Exception catch (error) { _notify(error.toString().replaceFirst('Exception: ', '')); }
    }
    title.dispose(); author.dispose(); url.dispose(); description.dispose();
  }

  Future<void> _returnLoan(int loanId) async {
    try {
      final isLibrarian = _currentUser?['role'] == 'librarian';
      if (isLibrarian) {
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
      _leadershipStats = <String, dynamic>{};
      _reservations = [];
      _ebooks = [];
      _fines = <String, dynamic>{};
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

  Widget _buildStatCard(String label, dynamic value) {
    final icon = label.toLowerCase().contains('judul')
        ? Icons.menu_book_rounded
        : label.toLowerCase().contains('stok')
            ? Icons.inventory_2_outlined
            : label.toLowerCase().contains('aktif')
                ? Icons.autorenew_rounded
                : label.toLowerCase().contains('transaksi')
                    ? Icons.swap_horiz_rounded
                    : Icons.people_alt_outlined;
    return SizedBox(
      width: 158,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFE9F7F3),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, color: const Color(0xFF0E8C80), size: 19),
              ),
              const SizedBox(height: 14),
              Text(label, style: const TextStyle(color: Color(0xFF718394), fontSize: 11, fontWeight: FontWeight.w700)),
              const SizedBox(height: 5),
              Text(
                (value ?? 0).toString(),
                style: const TextStyle(fontSize: 27, height: 1, fontWeight: FontWeight.w900, color: Color(0xFF14283D), letterSpacing: -0.8),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRankList(
    String title,
    dynamic rawRows,
    String Function(Map<String, dynamic>) labelBuilder,
  ) {
    final rows = rawRows is List
        ? rawRows.whereType<Map<String, dynamic>>().toList()
        : <Map<String, dynamic>>[];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF14283D))),
            const SizedBox(height: 12),
            if (rows.isEmpty)
              const Text('Belum ada data.', style: TextStyle(color: Color(0xFF718394), fontSize: 13)),
            ...rows.asMap().entries.map((entry) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Container(
                    width: 27,
                    height: 27,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: const Color(0xFFEAF7F3), borderRadius: BorderRadius.circular(9)),
                    child: Text((entry.key + 1).toString(), style: const TextStyle(color: Color(0xFF087F75), fontSize: 11, fontWeight: FontWeight.w900)),
                  ),
                  const SizedBox(width: 11),
                  Expanded(child: Text(labelBuilder(entry.value), style: const TextStyle(color: Color(0xFF526879), fontSize: 13, height: 1.4))),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildLeadershipStats() {
    final rawSummary = _leadershipStats['summary'];
    final summary = rawSummary is Map
        ? Map<String, dynamic>.from(rawSummary)
        : <String, dynamic>{};
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Dashboard Pimpinan',
          style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            _buildStatCard('Judul buku', summary['totalTitles']),
            _buildStatCard('Stok tersedia', summary['availableCopies']),
            _buildStatCard('Peminjaman aktif', summary['activeLoans']),
            _buildStatCard('Total transaksi', summary['totalLoans']),
            _buildStatCard('Anggota', summary['totalMembers']),
          ],
        ),
        _buildRankList(
          'Buku paling sering dipinjam',
          _leadershipStats['mostBorrowed'],
          (row) => (row['title'] ?? 'Buku').toString() +
              ' — ' + (row['loanCount'] ?? 0).toString() + ' kali',
        ),
        _buildRankList(
          'Anggota paling aktif',
          _leadershipStats['mostActiveMembers'],
          (row) => (row['name'] ?? row['email'] ?? 'Anggota').toString() +
              ' — ' + (row['loanCount'] ?? 0).toString() + ' pinjaman',
        ),
        _buildRankList(
          'Buku dengan stok menipis',
          _leadershipStats['lowStockBooks'],
          (row) => (row['title'] ?? 'Buku').toString() +
              ' — stok ' + (row['stock'] ?? 0).toString(),
        ),
        const SizedBox(height: 18),
      ],
    );
  }

  Widget _buildLibrary() {
    final role = _currentUser?['role']?.toString() ?? 'member';
    final isLibrarian = role == 'librarian';
    final isMember = role == 'member';
    final isLeadership = role == 'leadership';
    final username = _currentUser?['name']?.toString() ?? 'Pengguna';
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF173D59), Color(0xFF0E9F91)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(11),
              ),
              child: const Text('E', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 19)),
            ),
            const SizedBox(width: 10),
            const Text('E-Library'),
          ],
        ),
        actions: [
          if (isLibrarian) ...[
            IconButton(tooltip: 'Tambah buku', onPressed: _showAddBookDialog, icon: const Icon(Icons.add)),
            IconButton(tooltip: 'Tambah e-book', onPressed: _showAddEbookDialog, icon: const Icon(Icons.menu_book)),
          ],
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
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF102B43), Color(0xFF17615F)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: const [
                  BoxShadow(color: Color(0x1D102B43), blurRadius: 22, offset: Offset(0, 10)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: .13),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withValues(alpha: .18)),
                    ),
                    child: Text(
                      isLibrarian ? 'RUANG PUSTAKAWAN' : isLeadership ? 'DASHBOARD PIMPINAN' : 'RUANG ANGGOTA',
                      style: const TextStyle(color: Color(0xFFB8F0E4), fontSize: 10, letterSpacing: 1.2, fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(height: 15),
                  Text(
                    'Halo, ' + username,
                    style: const TextStyle(fontSize: 25, height: 1.1, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -.5),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isLibrarian
                        ? 'Kelola katalog dan pantau sirkulasi perpustakaan.'
                        : isLeadership
                            ? 'Pantau koleksi, aktivitas, dan performa perpustakaan.'
                            : 'Temukan bacaan baru dan kelola perjalanan membacamu.',
                    style: const TextStyle(color: Color(0xFFD4E8E7), height: 1.5, fontSize: 13),
                  ),
                ],
              ),
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
            if (isLeadership) ...[
              const SizedBox(height: 20),
              _buildLeadershipStats(),
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
                child: Padding(
                  padding: const EdgeInsets.all(15),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 72,
                            height: 98,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF153B55), Color(0xFF0E827A)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(11),
                              boxShadow: const [
                                BoxShadow(color: Color(0x1D153B55), blurRadius: 12, offset: Offset(0, 5)),
                              ],
                            ),
                            child: Stack(
                              children: [
                                Positioned(right: -14, bottom: -18, child: Icon(Icons.menu_book_rounded, size: 76, color: Colors.white.withValues(alpha: .10))),
                                const Center(child: Icon(Icons.auto_stories_rounded, color: Color(0xFFD5F5EC), size: 30)),
                                const Positioned(left: 9, bottom: 9, child: Text('E-LIBRARY', style: TextStyle(color: Colors.white, fontSize: 7, letterSpacing: 1, fontWeight: FontWeight.w900))),
                              ],
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  book['title']?.toString() ?? 'Judul buku',
                                  style: const TextStyle(fontSize: 16, height: 1.25, color: Color(0xFF14283D), fontWeight: FontWeight.w900, letterSpacing: -.25),
                                ),
                                const SizedBox(height: 5),
                                Text('Oleh ' + (book['author']?.toString() ?? '-'), style: const TextStyle(color: Color(0xFF718394), fontSize: 12)),
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                                  decoration: BoxDecoration(color: const Color(0xFFEAF7F3), borderRadius: BorderRadius.circular(30)),
                                  child: Text(
                                    (book['categoryName']?.toString() ?? 'Umum') + ' · Stok ' + stock.toString(),
                                    style: const TextStyle(color: Color(0xFF087F75), fontSize: 10, fontWeight: FontWeight.w800),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if ((book['description']?.toString() ?? '').isNotEmpty) ...[
                        const SizedBox(height: 14),
                        Text(
                          book['description']?.toString() ?? '',
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Color(0xFF718394), height: 1.5, fontSize: 12),
                        ),
                      ],
                      if (isMember || isLibrarian) ...[
                        const SizedBox(height: 14),
                        if (isMember)
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: () => _borrowBook(id),
                              icon: Icon(stock > 0 ? Icons.bookmark_add_outlined : Icons.notifications_active_outlined, size: 18),
                              label: Text(stock > 0 ? 'Pinjam buku' : 'Reservasi antrean'),
                            ),
                          )
                        else
                          Wrap(
                            spacing: 8,
                            children: [
                              OutlinedButton.icon(
                                onPressed: () => _editBook(book),
                                icon: const Icon(Icons.edit_outlined, size: 17),
                                label: const Text('Ubah'),
                              ),
                              OutlinedButton.icon(
                                onPressed: () => _deleteBook(id),
                                icon: const Icon(Icons.delete_outline, size: 17),
                                label: const Text('Hapus'),
                              ),
                            ],
                          ),
                      ],
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 20),
            const Text('Koleksi e-book', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            if (_ebooks.isEmpty) const Text('Belum ada koleksi e-book.'),
            ..._ebooks.map((ebook) => Card(child: ListTile(
              leading: const Icon(Icons.picture_as_pdf),
              title: Text(ebook['title']?.toString() ?? 'E-book'),
              subtitle: Text(ebook['author']?.toString() ?? ''),
              trailing: IconButton(icon: const Icon(Icons.download), onPressed: () => _openEbook(ebook)),
            ))),
            if (isMember) ...[
              const SizedBox(height: 20),
              const Text('Reservasi saya', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
              Text('Estimasi total denda: Rp${(_fines['totalFine'] ?? 0)}'),
              if (_reservations.isEmpty) const Text('Belum ada reservasi.'),
              ..._reservations.map((reservation) => Card(child: ListTile(
                title: Text(reservation['bookTitle']?.toString() ?? 'Buku'),
                subtitle: Text('Status: ' + (reservation['status']?.toString() ?? '-') + (reservation['queueNumber'] == null ? '' : ' · Antrean ' + reservation['queueNumber'].toString())),
                trailing: reservation['status'] == 'ready'
                    ? TextButton(onPressed: () => _claimReservation((reservation['id'] as num).toInt()), child: const Text('Ambil'))
                    : (reservation['status'] == 'waiting' ? TextButton(onPressed: () => _cancelReservation((reservation['id'] as num).toInt()), child: const Text('Batal')) : null),
              ))),
            ],
            if (!isLeadership) ...[
            const SizedBox(height: 16),
            Text(
              isLibrarian ? 'Semua peminjaman' : 'Peminjaman saya',
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
                if (isLibrarian)
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
                Padding(padding: const EdgeInsets.only(top: 4), child: Text('Status: ' + status)),
                if (((loan['fineAmount'] as num?)?.toInt() ?? 0) > 0)
                  Padding(padding: const EdgeInsets.only(top: 4), child: Text('Estimasi denda: Rp' + loan['fineAmount'].toString())),
                if (isMember && status == 'borrowed' && ((loan['renewalCount'] as num?)?.toInt() ?? 0) < 1)
                  Align(alignment: Alignment.centerRight, child: TextButton(onPressed: () => _renewLoan(id), child: const Text('Perpanjang'))),
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
      backgroundColor: const Color(0xFFF3F7F8),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(color: const Color(0xFFE2EAED)),
                  boxShadow: const [
                    BoxShadow(color: Color(0x12142D40), blurRadius: 36, offset: Offset(0, 16)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                  Container(
                    width: 62,
                    height: 62,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF173D59), Color(0xFF0E9F91)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: const [
                        BoxShadow(color: Color(0x26173D59), blurRadius: 20, offset: Offset(0, 9)),
                      ],
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
                  Text(
                    _isRegistering ? 'Buat akun E-Library' : 'Selamat datang kembali',
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 29,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.8,
                      height: 1.12,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _isRegistering
                        ? 'Daftar untuk mulai meminjam buku di perpustakaan digital.'
                        : 'Masuk untuk melanjutkan aktivitas perpustakaan digitalmu.',
                    style: const TextStyle(
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
                        if (_isRegistering) ...[
                          const Text(
                            'Nama lengkap',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
                            textInputAction: TextInputAction.next,
                            validator: _validateName,
                            decoration: const InputDecoration(
                              hintText: 'Nama lengkap',
                              prefixIcon: Icon(Icons.person_outline),
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
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
                              elevation: 0,
                              minimumSize: const Size(0, 52),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(13),
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
                                : Text(
                                    _isRegistering ? 'Daftar' : 'Masuk',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: _loading ? null : _toggleAuthMode,
                          child: Text(_isRegistering
                              ? 'Sudah punya akun? Masuk'
                              : 'Belum punya akun? Daftar'),
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