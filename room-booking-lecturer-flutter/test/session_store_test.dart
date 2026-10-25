import 'dart:convert';
import 'dart:io';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:room_booking_lecturer/session_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final now = DateTime.utc(2026, 10, 24);
  const server = 'https://booking.example.test';
  final account = <String, dynamic>{
    'sessionToken': 'a' * 64,
    'gmail': 'lecturer@gmail.com',
    'idNumber': 'MME001',
    'name': 'Test Lecturer',
    'department': 'Mechanical and Manufacturing Engineering',
  };
  LecturerSessionStore store([DateTime? at]) =>
      LecturerSessionStore(SecureSessionPersistence(), now: () => at ?? now);

  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  test(
    'restores a remembered session after recreating the app store without saving passwords',
    () async {
      await store().save(
        {
          ...account,
          'password': 'never-save-this',
          'passwordHash': 'also-not-saved',
        },
        server,
        remember: true,
      );
      final raw = (await SecureSessionPersistence().read())!;
      expect(raw, isNot(contains('never-save-this')));
      expect(raw, isNot(contains('passwordHash')));
      final restored = await store().restore(server, (token) async {
        expect(token, account['sessionToken']);
        return true;
      });
      expect(restored, account);
    },
  );

  test(
    'unchecked stay signed in removes a previously remembered account',
    () async {
      await store().save(account, server, remember: true);
      await store().save(account, server, remember: false);
      expect(await store().restore(server, (_) async => true), isNull);
    },
  );

  test('expired and server-revoked sessions are cleared', () async {
    await store().save(account, server, remember: true);
    var validated = false;
    expect(
      await store(now.add(const Duration(days: 31))).restore(server, (_) async {
        validated = true;
        return true;
      }),
      isNull,
    );
    expect(validated, isFalse);
    expect(await SecureSessionPersistence().read(), isNull);
    await store().save(account, server, remember: true);
    expect(await store().restore(server, (_) async => false), isNull);
    expect(await SecureSessionPersistence().read(), isNull);
  });

  test(
    'temporary connection failures preserve the saved session for retry',
    () async {
      await store().save(account, server, remember: true);
      await expectLater(
        store().restore(
          server,
          (_) async => throw const SocketException('Offline'),
        ),
        throwsA(isA<SocketException>()),
      );
      expect(await SecureSessionPersistence().read(), isNotNull);
      expect(await store().restore(server, (_) async => true), account);
    },
  );

  test('sign out clears the session across app restarts', () async {
    await store().save(account, server, remember: true);
    await store().clear();
    expect(await store().restore(server, (_) async => true), isNull);
  });

  test(
    'corrupted records and sessions belonging to another server cannot restore',
    () async {
      await SecureSessionPersistence().write('broken JSON');
      expect(await store().restore(server, (_) async => true), isNull);
      await store().save(account, server, remember: true);
      expect(
        await store().restore(
          'https://another.example.test',
          (_) async => true,
        ),
        isNull,
      );
      await SecureSessionPersistence().write(
        jsonEncode({'server': server, 'expiresAt': 'invalid'}),
      );
      expect(await store().restore(server, (_) async => true), isNull);
    },
  );
}
