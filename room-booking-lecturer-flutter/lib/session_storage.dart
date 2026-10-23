import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Stores only the session and public profile fields, never the password.
class LecturerSession {
  const LecturerSession({
    required this.token,
    required this.identifier,
    required this.id,
    required this.name,
    required this.department,
  });

  factory LecturerSession.fromJson(Map<String, dynamic> json) {
    final token = json['sessionToken'] as String? ?? '';
    if (token.trim().isEmpty) {
      throw const FormatException('The saved login is incomplete.');
    }
    return LecturerSession(
      token: token,
      identifier: json['gmail'] as String? ?? '',
      id: json['idNumber'] as String? ?? '',
      name: json['name'] as String? ?? 'Lecturer',
      department: json['department'] as String? ?? '',
    );
  }

  final String token;
  final String identifier;
  final String id;
  final String name;
  final String department;

  Map<String, dynamic> toJson() => {
    'sessionToken': token,
    'gmail': identifier,
    'idNumber': id,
    'name': name,
    'department': department,
  };
}

abstract class SessionStorage {
  Future<LecturerSession?> read();
  Future<void> save(LecturerSession session);
  Future<void> clear();
}

class SecureSessionStorage implements SessionStorage {
  const SecureSessionStorage({
    required this.server,
    this.storage = const FlutterSecureStorage(),
  });

  final String server;
  final FlutterSecureStorage storage;

  // Keep credentials scoped to the server that issued them.
  String get key => 'lecturer_session_v1_${Uri.encodeComponent(server)}';

  @override
  Future<LecturerSession?> read() async {
    final value = await storage.read(key: key);
    if (value == null) return null;
    return LecturerSession.fromJson(jsonDecode(value) as Map<String, dynamic>);
  }

  @override
  Future<void> save(LecturerSession session) =>
      storage.write(key: key, value: jsonEncode(session.toJson()));

  @override
  Future<void> clear() => storage.delete(key: key);
}
