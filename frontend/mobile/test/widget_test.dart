import 'package:flutter_test/flutter_test.dart';
import 'package:elibrary_mobile/main.dart';

void main() {
  testWidgets('login screen renders the E-Library form', (tester) async {
    await tester.pumpWidget(const ELibraryApp());

    expect(find.text('Selamat datang kembali'), findsOneWidget);
    expect(find.text('E-LIBRARY · KELOMPOK 5'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Kata sandi'), findsOneWidget);
    expect(find.text('Masuk'), findsOneWidget);
    expect(find.text('Belum punya akun? Daftar'), findsOneWidget);
  });

  testWidgets('password visibility can be toggled', (tester) async {
    await tester.pumpWidget(const ELibraryApp());

    expect(find.byTooltip('Tampilkan kata sandi'), findsOneWidget);
    await tester.tap(find.byTooltip('Tampilkan kata sandi'));
    await tester.pumpAndSettle();

    expect(find.byTooltip('Sembunyikan kata sandi'), findsOneWidget);
  });

  testWidgets('register mode reveals required name field', (tester) async {
    await tester.pumpWidget(const ELibraryApp());

    await tester.tap(find.text('Belum punya akun? Daftar'));
    await tester.pumpAndSettle();

    expect(find.text('Buat akun E-Library'), findsOneWidget);
    expect(find.text('Nama lengkap'), findsOneWidget);
    expect(find.text('Daftar'), findsOneWidget);
    expect(find.text('Sudah punya akun? Masuk'), findsOneWidget);
  });
}