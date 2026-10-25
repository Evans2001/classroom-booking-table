import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class SessionPersistence {
  Future<String?> read();
  Future<void> write(String value);
  Future<void> clear();
}

class SecureSessionPersistence implements SessionPersistence {
  static const _storage = FlutterSecureStorage();
  static const _key = 'lecturer_session_v1';

  @override
  Future<String?> read() => _storage.read(key: _key);
  @override
  Future<void> write(String value) => _storage.write(key: _key, value: value);
  @override
  Future<void> clear() => _storage.delete(key: _key);
}

class LecturerSessionStore {
  LecturerSessionStore(this.persistence, {DateTime Function()? now})
    : now = now ?? DateTime.now;

  final SessionPersistence persistence;
  final DateTime Function() now;
  static const _fields = [
    'sessionToken',
    'gmail',
    'idNumber',
    'name',
    'department',
  ];

  Future<void> save(
    Map<String, dynamic> account,
    String server, {
    required bool remember,
  }) async {
    if (!remember) return clear();
    if (!_validAccount(account)) {
      throw const FormatException('Invalid lecturer session');
    }
    await persistence.write(
      jsonEncode({
        'server': server,
        'expiresAt': now()
            .toUtc()
            .add(const Duration(days: 30))
            .toIso8601String(),
        'account': {for (final field in _fields) field: account[field]},
      }),
    );
  }

  Future<Map<String, dynamic>?> restore(
    String server,
    Future<bool> Function(String token) validate,
  ) async {
    final raw = await persistence.read();
    if (raw == null) return null;
    Map<String, dynamic>? account;
    try {
      final saved = jsonDecode(raw);
      if (saved is Map<String, dynamic> &&
          saved['server'] == server &&
          DateTime.parse(saved['expiresAt'] as String).isAfter(now()) &&
          saved['account'] is Map<String, dynamic> &&
          _validAccount(saved['account'])) {
        final fields = saved['account'] as Map<String, dynamic>;
        account = {for (final field in _fields) field: fields[field]};
      }
    } on FormatException {
      // A malformed record is discarded rather than used as a session.
    } on TypeError {
      // Older or incomplete records must not bypass sign-in.
    }
    if (account == null) {
      await clear();
      return null;
    }
    // Connection failures propagate without erasing a still-valid saved session.
    if (!await validate(account['sessionToken'] as String)) {
      await clear();
      return null;
    }
    return account;
  }

  bool _validAccount(Map<String, dynamic> account) =>
      _fields.every(
        (field) =>
            account[field] is String && (account[field] as String).isNotEmpty,
      ) &&
      RegExp(r'^[a-f0-9]{64}$').hasMatch(account['sessionToken'] as String);

  Future<void> clear() => persistence.clear();
}
