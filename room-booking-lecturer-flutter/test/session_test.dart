import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:room_booking_lecturer/main.dart';
import 'package:room_booking_lecturer/session_storage.dart';

class FailingStorage implements SessionStorage {
  bool failRead = true;
  bool failSave = false;
  bool failClear = false;
  LecturerSession? session;

  @override
  Future<LecturerSession?> read() async {
    if (failRead) throw StateError('Storage temporarily unavailable');
    return session;
  }

  @override
  Future<void> save(LecturerSession value) async {
    if (failSave) throw StateError('Storage temporarily unavailable');
    session = value;
  }

  @override
  Future<void> clear() async {
    if (failClear) throw StateError('Storage temporarily unavailable');
    session = null;
  }
}

const account = <String, dynamic>{
  'sessionToken': 'saved-session',
  'gmail': 'lecturer@example.edu',
  'idNumber': '042',
  'name': 'Dr Example',
  'department': 'Engineering',
  'password': 'must-not-be-saved',
};

Future<void> noData() async {}

void resetMemory() {
  currentLecturerSessionToken = '';
  currentLecturerIdentifier = '';
  currentLecturerId = '';
  currentLecturerName = 'Lecturer';
  currentLecturerDepartment = '';
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late SessionStorage originalStorage;

  setUp(() {
    originalStorage = sessionStorage;
    FlutterSecureStorage.setMockInitialValues({});
    sessionStorage = const SecureSessionStorage(
      server: 'https://booking.example.edu',
    );
    resetMemory();
  });

  tearDown(() {
    sessionStorage = originalStorage;
    resetMemory();
  });

  test('saves the token and profile without storing the password', () async {
    await saveLecturerSession(account);
    final values = await const FlutterSecureStorage().readAll();
    expect(values.values.single, contains('saved-session'));
    expect(values.values.single, isNot(contains('password')));
    expect(values.values.single, isNot(contains('must-not-be-saved')));
    expect(
      await const SecureSessionStorage(
        server: 'https://other.example.edu',
      ).read(),
      isNull,
    );
  });

  test('failed persistence does not report a successful login', () async {
    sessionStorage = FailingStorage()..failSave = true;
    await expectLater(saveLecturerSession(account), throwsStateError);
    expect(currentLecturerSessionToken, isEmpty);
  });

  testWidgets(
    'restores the account after restart without requiring the network',
    (tester) async {
      await saveLecturerSession(account);
      resetMemory();
      await tester.pumpWidget(
        const MaterialApp(
          home: SessionGate(home: Scaffold(body: Text('Signed in'))),
        ),
      );
      expect(find.byType(LoginScreen), findsNothing);
      await tester.pumpAndSettle();
      expect(find.text('Signed in'), findsOneWidget);
      expect(currentLecturerSessionToken, 'saved-session');
      expect(currentLecturerIdentifier, 'lecturer@example.edu');
      expect(currentLecturerId, '042');
      expect(currentLecturerName, 'Dr Example');
    },
  );

  testWidgets('storage read errors preserve the login and allow retry', (
    tester,
  ) async {
    final store = FailingStorage()..session = LecturerSession.fromJson(account);
    sessionStorage = store;
    await tester.pumpWidget(
      const MaterialApp(
        home: SessionGate(home: Scaffold(body: Text('Signed in'))),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Retry'), findsOneWidget);
    expect(find.byType(LoginScreen), findsNothing);
    expect(store.session, isNotNull);
    store.failRead = false;
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();
    expect(find.text('Signed in'), findsOneWidget);
  });

  for (final status in [null, 401, 500]) {
    testWidgets('refresh failure ($status) and resume do not sign out', (
      tester,
    ) async {
      await saveLecturerSession(account);
      var attempts = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: LecturerHome(
            dataLoader: () async {
              attempts++;
              throw ApiException('Cannot refresh', statusCode: status);
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pumpAndSettle();
      expect(attempts, 2);
      expect(find.byType(LecturerHome), findsOneWidget);
      expect(find.byType(LoginScreen), findsNothing);
      expect(currentLecturerSessionToken, 'saved-session');
      expect((await sessionStorage.read())?.token, 'saved-session');
    });
  }

  testWidgets(
    'cancel retains login; confirmed logout clears it across restart',
    (tester) async {
      await saveLecturerSession(account);
      await tester.pumpWidget(
        const MaterialApp(home: LecturerHome(dataLoader: noData)),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Sign out'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect((await sessionStorage.read())?.token, 'saved-session');

      await tester.tap(find.byTooltip('Sign out'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(FilledButton, 'Sign out'));
      await tester.pumpAndSettle();
      expect(await sessionStorage.read(), isNull);
      expect(currentLecturerSessionToken, isEmpty);
      expect(find.byType(LoginScreen), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pumpWidget(const LecturerBookingApp());
      await tester.pumpAndSettle();
      expect(find.byType(LoginScreen), findsOneWidget);
    },
  );

  testWidgets('failed local logout stays signed in and can be retried', (
    tester,
  ) async {
    final store = FailingStorage()
      ..failRead = false
      ..failClear = true;
    sessionStorage = store;
    await saveLecturerSession(account);
    await tester.pumpWidget(
      const MaterialApp(home: LecturerHome(dataLoader: noData)),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Sign out'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Sign out'));
    await tester.pumpAndSettle();
    expect(find.byType(LecturerHome), findsOneWidget);
    expect(store.session, isNotNull);
    expect(currentLecturerSessionToken, 'saved-session');
    expect(find.text('Could not sign out. Please try again.'), findsOneWidget);
  });
}
