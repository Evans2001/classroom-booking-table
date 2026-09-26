import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase is configured by google-services.json in Android builds.
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LecturerBookingApp());
  pushNotificationsInitialization = initializePushNotifications();
}

const brandPrimary = Color(0xFF5C2C30);
const brandAccent = Color(0xFFEAB308);
const appBg = Color(0xFFF8FAFC);
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();
bool pushNotificationsReady = false;
bool pushTokenRefreshListenerAttached = false;
Future<void>? pushNotificationsInitialization;
String? registeredPushToken;

const campusUtcOffsetMinutes = int.fromEnvironment(
  'CAMPUS_UTC_OFFSET_MINUTES',
  defaultValue: 330,
);

DateTime campusNow() {
  final shifted = DateTime.now().toUtc().add(
    const Duration(minutes: campusUtcOffsetMinutes),
  );
  return DateTime(
    shifted.year,
    shifted.month,
    shifted.day,
    shifted.hour,
    shifted.minute,
    shifted.second,
    shifted.millisecond,
    shifted.microsecond,
  );
}

DateTime campusInstantFromIso(String value) {
  final shifted = DateTime.parse(
    value,
  ).toUtc().add(const Duration(minutes: campusUtcOffsetMinutes));
  return DateTime(
    shifted.year,
    shifted.month,
    shifted.day,
    shifted.hour,
    shifted.minute,
    shifted.second,
    shifted.millisecond,
    shifted.microsecond,
  );
}

DateTime campusLocalFromApi(Object? localValue, Object? instantValue) {
  if (localValue is String) {
    final parsed = DateTime.tryParse(localValue);
    if (parsed != null) return parsed;
  }
  if (instantValue is! String) {
    throw const FormatException('Booking date/time is missing.');
  }
  return campusInstantFromIso(instantValue);
}

String campusLocalToApi(DateTime value) =>
    '${value.year.toString().padLeft(4, '0')}-'
    '${value.month.toString().padLeft(2, '0')}-'
    '${value.day.toString().padLeft(2, '0')}T'
    '${value.hour.toString().padLeft(2, '0')}:'
    '${value.minute.toString().padLeft(2, '0')}';

Future<void> initializePushNotifications() async {
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    await FirebaseMessaging.instance.requestPermission();
    FirebaseMessaging.onMessage.listen((message) {
      final notification = message.notification;
      final title = notification?.title ?? 'Room booking update';
      final body =
          notification?.body ?? 'Open the app to view the latest update.';
      scaffoldMessengerKey.currentState?.showSnackBar(
        SnackBar(content: Text('$title\n$body')),
      );
    });
    pushNotificationsReady = true;
  } catch (error) {
    debugPrint('Push notifications are not configured yet: $error');
  }
}

class LecturerBookingApp extends StatelessWidget {
  const LecturerBookingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Room Booking Lecturer',
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: scaffoldMessengerKey,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: brandPrimary,
          primary: brandPrimary,
          secondary: brandAccent,
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: appBg,
        fontFamily: 'Roboto',
        appBarTheme: const AppBarTheme(
          backgroundColor: brandPrimary,
          foregroundColor: Colors.white,
          centerTitle: false,
          elevation: 0,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: brandPrimary, width: 1.6),
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ),
      home: const LoginScreen(),
    );
  }
}

enum RoomType { lectureHall, lab, meetingRoom }

enum RoomStatus { available, limited, unavailable }

enum BookingStatus { pending, approved, rejected, cancelled }

enum IssueSeverity { low, medium, high }

enum IssueStatus { open, inProgress, resolved, closed }

class Room {
  const Room({
    required this.id,
    required this.code,
    required this.name,
    required this.building,
    required this.floor,
    required this.capacity,
    required this.type,
    required this.status,
    required this.facilities,
    required this.description,
  });

  final String id;
  final String code;
  final String name;
  final String building;
  final int floor;
  final int capacity;
  final RoomType type;
  final RoomStatus status;
  final List<String> facilities;
  final String description;
}

class Booking {
  Booking({
    required this.id,
    required this.roomId,
    required this.roomName,
    required this.building,
    required this.roomCode,
    required this.moduleName,
    required this.startAt,
    required this.endAt,
    required this.purpose,
    required this.attendees,
    required this.status,
    required this.submittedAt,
    this.reviewerNote,
  });

  final String id;
  final String roomId;
  final String roomName;
  final String building;
  final String roomCode;
  final String moduleName;
  final DateTime startAt;
  final DateTime endAt;
  final String purpose;
  final int attendees;
  BookingStatus status;
  final DateTime submittedAt;
  final String? reviewerNote;
}

class Issue {
  Issue({
    required this.id,
    required this.roomId,
    required this.roomName,
    required this.title,
    required this.description,
    required this.severity,
    required this.status,
    required this.createdAt,
    required this.updates,
  });

  final String id;
  final String roomId;
  final String roomName;
  final String title;
  final String description;
  final IssueSeverity severity;
  IssueStatus status;
  final DateTime createdAt;
  final List<IssueUpdate> updates;
}

class IssueUpdate {
  const IssueUpdate({
    required this.status,
    required this.note,
    required this.at,
  });

  final IssueStatus status;
  final String note;
  final DateTime at;
}

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');
const _apiTimeout = Duration(seconds: 15);
final _apiClient = HttpClient()..connectionTimeout = _apiTimeout;

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

String get apiBaseUrl {
  final configured = _configuredApiBaseUrl.trim();
  if (configured.isNotEmpty) {
    if (kReleaseMode && !configured.toLowerCase().startsWith('https://')) {
      throw const ApiException('Release builds require an HTTPS API_BASE_URL.');
    }
    return configured.endsWith('/')
        ? configured.substring(0, configured.length - 1)
        : configured;
  }

  if (kReleaseMode) {
    throw const ApiException(
      'API_BASE_URL must be configured for release builds.',
    );
  }

  if (Platform.isAndroid) {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

Future<dynamic> apiRequest(
  String path, {
  String method = 'GET',
  Map<String, dynamic>? body,
  String? sessionTokenOverride,
}) async {
  try {
    final request = await _apiClient
        .openUrl(method, Uri.parse('$apiBaseUrl$path'))
        .timeout(_apiTimeout);
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    final authorizationToken =
        sessionTokenOverride ?? currentLecturerSessionToken;
    if (authorizationToken.isNotEmpty) {
      request.headers.set(
        HttpHeaders.authorizationHeader,
        'Bearer $authorizationToken',
      );
    }
    if (body != null) {
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      request.write(jsonEncode(body));
    }

    final response = await request.close().timeout(_apiTimeout);
    final responseText = await response
        .transform(utf8.decoder)
        .join()
        .timeout(_apiTimeout);

    dynamic decoded;
    if (responseText.trim().isNotEmpty) {
      try {
        decoded = jsonDecode(responseText);
      } on FormatException {
        throw const ApiException('The server returned an invalid response.');
      }
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final serverMessage = decoded is Map<String, dynamic>
          ? decoded['error']
          : null;
      throw ApiException(
        serverMessage is String && serverMessage.trim().isNotEmpty
            ? serverMessage
            : 'The request could not be completed. Please try again.',
      );
    }
    return decoded;
  } on ApiException {
    rethrow;
  } on TimeoutException {
    throw const ApiException(
      'The server took too long to respond. Please try again.',
    );
  } on SocketException {
    throw const ApiException(
      'Cannot reach the booking server. Check your connection and try again.',
    );
  } on FormatException {
    throw const ApiException('The booking server address is invalid.');
  } on HttpException {
    throw const ApiException(
      'The booking server could not complete the request.',
    );
  }
}

String userFacingError(Object error) {
  if (error case ApiException(message: final message)) {
    return message;
  }
  return 'Something went wrong. Please try again.';
}

RoomType roomTypeFromApi(String value) => switch (value) {
  'LECTURE_HALL' => RoomType.lectureHall,
  'LAB' => RoomType.lab,
  _ => RoomType.meetingRoom,
};

RoomStatus roomStatusFromApi(String value) => switch (value) {
  'AVAILABLE' => RoomStatus.available,
  'LIMITED' => RoomStatus.limited,
  _ => RoomStatus.unavailable,
};

BookingStatus bookingStatusFromApi(String value) => switch (value) {
  'APPROVED' => BookingStatus.approved,
  'REJECTED' => BookingStatus.rejected,
  'CANCELLED' => BookingStatus.cancelled,
  _ => BookingStatus.pending,
};

IssueSeverity issueSeverityFromApi(String value) => switch (value) {
  'LOW' => IssueSeverity.low,
  'HIGH' => IssueSeverity.high,
  _ => IssueSeverity.medium,
};

IssueStatus issueStatusFromApi(String value) => switch (value) {
  'IN_PROGRESS' => IssueStatus.inProgress,
  'RESOLVED' => IssueStatus.resolved,
  'CLOSED' => IssueStatus.closed,
  _ => IssueStatus.open,
};

String issueSeverityToApi(IssueSeverity value) => switch (value) {
  IssueSeverity.low => 'LOW',
  IssueSeverity.medium => 'MEDIUM',
  IssueSeverity.high => 'HIGH',
};

Map<String, dynamic> bookingInputToApi({
  required Room room,
  required String moduleName,
  required DateTime startAt,
  required DateTime endAt,
  required String purpose,
  required int attendees,
}) => {
  'roomId': room.id,
  'moduleName': moduleName,
  'startLocal': campusLocalToApi(startAt),
  'endLocal': campusLocalToApi(endAt),
  'purpose': purpose,
  'attendees': attendees,
};

Room roomFromApi(Map<String, dynamic> json) => Room(
  id: json['id'] as String,
  code: json['code'] as String,
  name: json['name'] as String,
  building: json['building'] as String,
  floor: json['floor'] as int,
  capacity: json['capacity'] as int,
  type: roomTypeFromApi(json['type'] as String),
  status: roomStatusFromApi(json['status'] as String),
  facilities: (json['facilities'] as List<dynamic>).cast<String>(),
  description: json['description'] as String,
);

Booking bookingFromApi(Map<String, dynamic> json) => Booking(
  id: json['id'] as String,
  roomId: json['roomId'] as String,
  roomName: json['roomName'] as String,
  building: json['building'] as String,
  roomCode: json['roomCode'] as String,
  moduleName: json['moduleName'] as String,
  startAt: campusLocalFromApi(json['startLocal'], json['startAt']),
  endAt: campusLocalFromApi(json['endLocal'], json['endAt']),
  purpose: json['purpose'] as String,
  attendees: json['attendees'] as int,
  status: bookingStatusFromApi(json['status'] as String),
  submittedAt: campusInstantFromIso(json['submittedAt'] as String),
  reviewerNote: json['reviewerNote'] as String?,
);

IssueUpdate issueUpdateFromApi(Map<String, dynamic> json) => IssueUpdate(
  status: issueStatusFromApi(json['status'] as String),
  note: json['note'] as String,
  at: campusInstantFromIso(json['at'] as String),
);

Issue issueFromApi(Map<String, dynamic> json) => Issue(
  id: json['id'] as String,
  roomId: json['roomId'] as String,
  roomName: json['roomName'] as String,
  title: json['title'] as String,
  description: json['description'] as String,
  severity: issueSeverityFromApi(json['severity'] as String),
  status: issueStatusFromApi(json['status'] as String),
  createdAt: campusInstantFromIso(json['createdAt'] as String),
  updates: (json['updates'] as List<dynamic>)
      .map((item) => issueUpdateFromApi(item as Map<String, dynamic>))
      .toList(),
);

Future<void> loadSharedData() async {
  final sessionToken = currentLecturerSessionToken;
  final responses = await Future.wait<dynamic>([
    apiRequest('/api/lecturer/rooms'),
    apiRequest('/api/lecturer/bookings'),
    apiRequest('/api/lecturer/issues'),
  ]);
  if (responses.any((response) => response is! List<dynamic>)) {
    throw const ApiException('The server returned an invalid data format.');
  }

  final roomsJson = responses[0] as List<dynamic>;
  final bookingsJson = responses[1] as List<dynamic>;
  final issuesJson = responses[2] as List<dynamic>;
  if (sessionToken != currentLecturerSessionToken) {
    return;
  }

  final nextRooms = roomsJson
      .map((item) => roomFromApi(item as Map<String, dynamic>))
      .toList(growable: false);
  final nextBookings = bookingsJson
      .map((item) => bookingFromApi(item as Map<String, dynamic>))
      .toList(growable: false);
  final nextIssues = issuesJson
      .map((item) => issueFromApi(item as Map<String, dynamic>))
      .toList(growable: false);
  if (sessionToken != currentLecturerSessionToken) return;

  rooms
    ..clear()
    ..addAll(nextRooms);
  bookings
    ..clear()
    ..addAll(nextBookings);
  issues
    ..clear()
    ..addAll(nextIssues);
}

Future<void> submitLecturerAccountRequest({
  required String name,
  required String department,
  required String position,
  required String gmail,
  required String idNumber,
}) async {
  await apiRequest(
    '/api/lecturer/account-requests',
    method: 'POST',
    body: {
      'name': name,
      'department': department,
      'position': position,
      'gmail': gmail,
      'idNumber': idNumber,
    },
  );
}

Future<Map<String, dynamic>> loginLecturerAccount({
  required String identifier,
  required String password,
}) async {
  final response = await apiRequest(
    '/api/lecturer/auth/login',
    method: 'POST',
    body: {'identifier': identifier, 'password': password},
  );
  return response as Map<String, dynamic>;
}

Future<Map<String, dynamic>> changeLecturerAccountPassword({
  required String currentPassword,
  required String nextPassword,
}) async {
  final response = await apiRequest(
    '/api/lecturer/auth/change-password',
    method: 'POST',
    body: {'currentPassword': currentPassword, 'nextPassword': nextPassword},
  );
  return response as Map<String, dynamic>;
}

Future<void> registerCurrentLecturerPushToken() async {
  await pushNotificationsInitialization;
  if (!pushNotificationsReady) {
    return;
  }
  try {
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) {
      return;
    }
    await apiRequest(
      '/api/lecturer/push-token',
      method: 'POST',
      body: {'token': token, 'platform': Platform.operatingSystem},
    );
    registeredPushToken = token;
    if (!pushTokenRefreshListenerAttached) {
      pushTokenRefreshListenerAttached = true;
      FirebaseMessaging.instance.onTokenRefresh.listen((nextToken) async {
        final activeSession = currentLecturerSessionToken;
        if (activeSession.isEmpty) return;
        try {
          await apiRequest(
            '/api/lecturer/push-token',
            method: 'POST',
            body: {'token': nextToken, 'platform': Platform.operatingSystem},
            sessionTokenOverride: activeSession,
          );
          if (currentLecturerSessionToken == activeSession) {
            registeredPushToken = nextToken;
          }
        } catch (error) {
          debugPrint('Push token refresh registration failed: $error');
        }
      });
    }
  } catch (error) {
    debugPrint('Push token registration failed: $error');
  }
}

Future<void> finishRemoteLogout(
  String sessionToken,
  String? knownPushToken,
) async {
  var pushToken = knownPushToken;
  if (pushToken == null && pushNotificationsReady) {
    try {
      pushToken = await FirebaseMessaging.instance.getToken();
    } catch (_) {
      // Session revocation should still continue.
    }
  }
  if (sessionToken.isNotEmpty && pushToken != null) {
    try {
      await apiRequest(
        '/api/lecturer/push-token',
        method: 'DELETE',
        body: {'token': pushToken},
        sessionTokenOverride: sessionToken,
      );
    } catch (error) {
      debugPrint('Push token unregister failed: $error');
    }
  }
  if (sessionToken.isNotEmpty) {
    try {
      await apiRequest(
        '/api/lecturer/auth/logout',
        method: 'POST',
        sessionTokenOverride: sessionToken,
      );
    } catch (error) {
      debugPrint('Remote session revocation failed: $error');
    }
  }
  if (pushNotificationsReady) {
    try {
      await FirebaseMessaging.instance.deleteToken();
    } catch (error) {
      debugPrint('Local push token deletion failed: $error');
    }
  }
}

String currentLecturerIdentifier = '';
String currentLecturerName = 'Lecturer';
String currentLecturerDepartment = '';
String currentLecturerSessionToken = '';

final rooms = <Room>[
  const Room(
    id: 'room-1',
    code: 'LH-101',
    name: 'Main Lecture Hall',
    building: 'Engineering Block',
    floor: 1,
    capacity: 160,
    type: RoomType.lectureHall,
    status: RoomStatus.available,
    facilities: ['Projector', 'Sound System', 'WiFi'],
    description: 'Large hall for major lectures and events.',
  ),
  const Room(
    id: 'room-2',
    code: 'LAB-204',
    name: 'Computer Lab A',
    building: 'Science Complex',
    floor: 2,
    capacity: 45,
    type: RoomType.lab,
    status: RoomStatus.limited,
    facilities: ['Desktop PCs', 'Projector', 'AC'],
    description: 'Computer lab with fixed workstation setup.',
  ),
  const Room(
    id: 'room-3',
    code: 'MR-305',
    name: 'Board Meeting Room',
    building: 'Admin Building',
    floor: 3,
    capacity: 20,
    type: RoomType.meetingRoom,
    status: RoomStatus.available,
    facilities: ['TV Display', 'Video Conferencing', 'AC'],
    description: 'Quiet room optimized for meetings and interviews.',
  ),
  const Room(
    id: 'room-4',
    code: 'LH-202',
    name: 'South Lecture Hall',
    building: 'Engineering Block',
    floor: 2,
    capacity: 120,
    type: RoomType.lectureHall,
    status: RoomStatus.unavailable,
    facilities: ['Projector'],
    description: 'Under maintenance this week.',
  ),
];

final bookings = <Booking>[];

final issues = <Issue>[];

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final formKey = GlobalKey<FormState>();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool signingIn = false;
  bool obscurePassword = true;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> signIn() async {
    if (signingIn || !(formKey.currentState?.validate() ?? false)) {
      return;
    }
    FocusManager.instance.primaryFocus?.unfocus();
    final email = emailController.text.trim();
    final password = passwordController.text;
    setState(() => signingIn = true);
    try {
      final account = await loginLecturerAccount(
        identifier: email,
        password: password,
      );
      currentLecturerIdentifier = account['gmail'] as String? ?? email;
      currentLecturerName = account['name'] as String? ?? 'Lecturer';
      currentLecturerDepartment =
          account['department'] as String? ?? 'Faculty Department';
      currentLecturerSessionToken = account['sessionToken'] as String? ?? '';
      unawaited(registerCurrentLecturerPushToken());
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LecturerHome()),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
    } finally {
      if (mounted) {
        setState(() => signingIn = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final headerHeight = constraints.maxHeight < 700
                ? 230.0
                : constraints.maxHeight * 0.44;
            return SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Column(
                  children: [
                    SizedBox(
                      height: headerHeight,
                      child: Container(
                        width: double.infinity,
                        color: brandPrimary,
                        padding: const EdgeInsets.all(28),
                        child: Center(
                          child: SingleChildScrollView(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  height: 88,
                                  width: 88,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(26),
                                  ),
                                  child: const Icon(
                                    Icons.school_rounded,
                                    color: Colors.white,
                                    size: 50,
                                  ),
                                ),
                                const SizedBox(height: 18),
                                const Text(
                                  'Classroom Booking System',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Faculty of Engineering University of Ruhuna',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.82),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(24, 22, 24, 28),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(34),
                        ),
                      ),
                      child: Form(
                        key: formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Welcome Back',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 18),
                            TextFormField(
                              controller: emailController,
                              keyboardType: TextInputType.emailAddress,
                              inputFormatters: [
                                LengthLimitingTextInputFormatter(254),
                              ],
                              autofillHints: const [
                                AutofillHints.username,
                                AutofillHints.email,
                              ],
                              textInputAction: TextInputAction.next,
                              enabled: !signingIn,
                              validator: (value) =>
                                  value == null || value.trim().isEmpty
                                  ? 'Enter your email or username'
                                  : null,
                              decoration: const InputDecoration(
                                prefixIcon: Icon(Icons.mail_outline),
                                labelText: 'Email or username',
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: passwordController,
                              obscureText: obscurePassword,
                              inputFormatters: [
                                LengthLimitingTextInputFormatter(128),
                              ],
                              autofillHints: const [AutofillHints.password],
                              textInputAction: TextInputAction.done,
                              enabled: !signingIn,
                              onFieldSubmitted: (_) => signIn(),
                              validator: (value) =>
                                  value == null || value.isEmpty
                                  ? 'Enter your password'
                                  : null,
                              decoration: InputDecoration(
                                prefixIcon: const Icon(Icons.lock_outline),
                                labelText: 'Password',
                                suffixIcon: IconButton(
                                  tooltip: obscurePassword
                                      ? 'Show password'
                                      : 'Hide password',
                                  onPressed: () => setState(
                                    () => obscurePassword = !obscurePassword,
                                  ),
                                  icon: Icon(
                                    obscurePassword
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              height: 54,
                              child: FilledButton.icon(
                                onPressed: signingIn ? null : signIn,
                                icon: signingIn
                                    ? const SizedBox.square(
                                        dimension: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(Icons.arrow_forward_rounded),
                                label: Text(
                                  signingIn ? 'Signing in...' : 'Sign In',
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            if (!kReleaseMode)
                              OutlinedButton.icon(
                                onPressed: signingIn
                                    ? null
                                    : () {
                                        emailController.text =
                                            'lecturer@eng.ruh.ac.lk';
                                        passwordController.text =
                                            'Lecturer@123';
                                      },
                                icon: const Icon(Icons.info_outline),
                                label: const Text('Auto-fill demo credentials'),
                              ),
                            const SizedBox(height: 8),
                            TextButton.icon(
                              onPressed: signingIn
                                  ? null
                                  : () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) =>
                                              const AccountRequestScreen(),
                                        ),
                                      );
                                    },
                              icon: const Icon(Icons.person_add_alt_1_outlined),
                              label: const Text('Create lecturer account'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class AccountRequestScreen extends StatefulWidget {
  const AccountRequestScreen({super.key});

  @override
  State<AccountRequestScreen> createState() => _AccountRequestScreenState();
}

class _AccountRequestScreenState extends State<AccountRequestScreen> {
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final departmentController = TextEditingController();
  final positionController = TextEditingController();
  final gmailController = TextEditingController();
  final idNumberController = TextEditingController();
  bool submitting = false;

  @override
  void dispose() {
    nameController.dispose();
    departmentController.dispose();
    positionController.dispose();
    gmailController.dispose();
    idNumberController.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (submitting) return;
    if (!(formKey.currentState?.validate() ?? false)) return;
    setState(() => submitting = true);
    try {
      await submitLecturerAccountRequest(
        name: nameController.text.trim(),
        department: departmentController.text.trim(),
        position: positionController.text.trim(),
        gmail: gmailController.text.trim(),
        idNumber: idNumberController.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account request sent to admin.')),
      );
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  String? requiredField(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: Form(
          key: formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const HeroPanel(
                title: 'Lecturer account request',
                subtitle:
                    'Fill your details and send them to admin for approval.',
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: nameController,
                validator: requiredField,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.name],
                inputFormatters: [LengthLimitingTextInputFormatter(120)],
                enabled: !submitting,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.person_outline),
                  labelText: 'Full name',
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: departmentController,
                validator: requiredField,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                inputFormatters: [LengthLimitingTextInputFormatter(120)],
                enabled: !submitting,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.apartment_outlined),
                  labelText: 'Department',
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: positionController,
                validator: requiredField,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                inputFormatters: [LengthLimitingTextInputFormatter(80)],
                enabled: !submitting,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.work_outline),
                  labelText: 'Position',
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: gmailController,
                validator: (value) {
                  final required = requiredField(value);
                  if (required != null) return required;
                  return RegExp(
                        r"^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$",
                        caseSensitive: false,
                      ).hasMatch(value!.trim())
                      ? null
                      : 'Enter a valid Gmail address';
                },
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                inputFormatters: [LengthLimitingTextInputFormatter(254)],
                enabled: !submitting,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.mail_outline),
                  labelText: 'Gmail',
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: idNumberController,
                validator: requiredField,
                textInputAction: TextInputAction.done,
                inputFormatters: [LengthLimitingTextInputFormatter(80)],
                enabled: !submitting,
                onFieldSubmitted: (_) => submit(),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.badge_outlined),
                  labelText: 'ID number',
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                height: 54,
                child: FilledButton.icon(
                  onPressed: submitting ? null : submit,
                  icon: const Icon(Icons.send_outlined),
                  label: Text(submitting ? 'Sending...' : 'Send to admin'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LecturerHome extends StatefulWidget {
  const LecturerHome({super.key});

  @override
  State<LecturerHome> createState() => _LecturerHomeState();
}

class _LecturerHomeState extends State<LecturerHome> {
  int index = 0;
  bool refreshing = false;
  bool loggingOut = false;
  Future<void>? refreshOperation;

  final pages = const [
    DashboardScreen(),
    RoomsScreen(),
    CalendarScreen(),
    IssuesScreen(),
    ProfileScreen(),
  ];

  final titles = const [
    'Lecturer Dashboard',
    'Rooms',
    'Calendar',
    'My Issues',
    'Profile',
  ];

  @override
  void initState() {
    super.initState();
    refreshData();
  }

  Future<void> refreshData() async {
    final activeRefresh = refreshOperation;
    if (activeRefresh != null) {
      return activeRefresh;
    }

    final operation = performRefresh();
    refreshOperation = operation;
    await operation;
    if (identical(refreshOperation, operation)) {
      refreshOperation = null;
    }
  }

  Future<void> performRefresh() async {
    if (mounted) {
      setState(() => refreshing = true);
    }
    try {
      await loadSharedData();
      if (mounted) {
        setState(() {});
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${userFacingError(error)} Showing the last loaded data.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => refreshing = false);
      }
    }
  }

  Future<void> confirmLogout() async {
    if (loggingOut) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text(
          'You will need to sign in again to manage bookings.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) {
      return;
    }

    final sessionToken = currentLecturerSessionToken;
    final pushToken = registeredPushToken;
    setState(() => loggingOut = true);
    currentLecturerIdentifier = '';
    currentLecturerName = 'Lecturer';
    currentLecturerDepartment = '';
    currentLecturerSessionToken = '';
    registeredPushToken = null;
    rooms.clear();
    bookings.clear();
    issues.clear();
    TextInput.finishAutofillContext();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
    unawaited(finishRemoteLogout(sessionToken, pushToken));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(titles[index]),
        actions: [
          if (refreshing)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 14),
              child: Center(
                child: SizedBox.square(
                  dimension: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                ),
              ),
            )
          else
            IconButton(
              tooltip: 'Refresh data',
              onPressed: refreshData,
              icon: const Icon(Icons.refresh_rounded),
            ),
          IconButton(
            tooltip: 'Sign out',
            onPressed: loggingOut ? null : confirmLogout,
            icon: loggingOut
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(onRefresh: refreshData, child: pages[index]),
      floatingActionButton: index == 3
          ? FloatingActionButton.extended(
              onPressed: () => openIssueForm(context),
              icon: const Icon(Icons.add_alert_outlined),
              label: const Text('Issue'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.meeting_room_outlined),
            label: 'Rooms',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            label: 'Calendar',
          ),
          NavigationDestination(
            icon: Icon(Icons.report_outlined),
            label: 'Issues',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Future<void> openBookingForm(
    BuildContext context, {
    Room? room,
    Booking? booking,
    DateTime? initialDate,
  }) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BookingFormScreen(
          defaultRoom: room,
          booking: booking,
          initialDate: initialDate,
        ),
      ),
    );
    await refreshData();
  }

  void deleteBooking(BuildContext context, Booking booking) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancel booking?'),
        content: Text(
          'This will cancel the ${booking.roomCode} request for ${booking.moduleName} and retain it in your history.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              try {
                await apiRequest(
                  '/api/lecturer/bookings/${booking.id}',
                  method: 'DELETE',
                );
                await refreshData();
                if (!dialogContext.mounted || !context.mounted) {
                  return;
                }
                Navigator.of(dialogContext).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Booking cancelled.')),
                );
              } catch (error) {
                if (!dialogContext.mounted || !context.mounted) {
                  return;
                }
                Navigator.of(dialogContext).pop();
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
              }
            },
            child: const Text('Cancel booking'),
          ),
        ],
      ),
    );
  }

  Future<void> openIssueForm(BuildContext context, [Room? room]) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => IssueFormScreen(defaultRoom: room)),
    );
    await refreshData();
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final now = campusNow();
    final activeBookings =
        bookings
            .where(
              (booking) =>
                  isActiveBooking(booking) && booking.endAt.isAfter(now),
            )
            .toList()
          ..sort((a, b) => a.startAt.compareTo(b.startAt));
    final upcomingBookings = activeBookings.take(3);
    final home = context.findAncestorStateOfType<_LecturerHomeState>();

    return AppScrollView(
      children: [
        HeroPanel(
          title: 'Hello, $currentLecturerName',
          subtitle: 'Manage classroom bookings and report room issues.',
          actions: [
            Expanded(
              child: FilledButton.icon(
                onPressed: () => home?.openBookingForm(context),
                icon: const Icon(Icons.add),
                label: const Text('Book Room'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => home?.openIssueForm(context),
                icon: const Icon(Icons.report_outlined),
                label: const Text('Report'),
                style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
              ),
            ),
          ],
        ),
        const SectionTitle('Overview'),
        Row(
          children: [
            Expanded(
              child: StatCard(
                icon: Icons.meeting_room_outlined,
                value: '${rooms.length}',
                label: 'Rooms',
                color: Colors.teal,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatCard(
                icon: Icons.calendar_month_outlined,
                value: '${bookings.length}',
                label: 'Bookings',
                color: brandPrimary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatCard(
                icon: Icons.report_outlined,
                value: '${issues.length}',
                label: 'Issues',
                color: const Color(0xFFE11D48),
              ),
            ),
          ],
        ),
        const SectionTitle('Upcoming Bookings'),
        if (upcomingBookings.isEmpty)
          const EmptyPanel(
            icon: Icons.event_available_outlined,
            title: 'No upcoming bookings',
            subtitle: 'Approved and pending requests will appear here.',
          )
        else
          ...upcomingBookings.map((booking) => BookingTile(booking: booking)),
      ],
    );
  }
}

class RoomsScreen extends StatefulWidget {
  const RoomsScreen({super.key});

  @override
  State<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends State<RoomsScreen> {
  String query = '';

  @override
  Widget build(BuildContext context) {
    final filtered = rooms.where((room) {
      final haystack = '${room.name} ${room.code} ${room.building}'
          .toLowerCase();
      return haystack.contains(query.toLowerCase());
    }).toList();

    return AppScrollView(
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: brandPrimary,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Find a Space',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Search rooms across all buildings.',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
              ),
              const SizedBox(height: 14),
              TextField(
                onChanged: (value) => setState(() => query = value),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Search by name, code, or building',
                ),
              ),
            ],
          ),
        ),
        SectionTitle('${filtered.length} rooms found'),
        if (filtered.isEmpty)
          const EmptyPanel(
            icon: Icons.search_off,
            title: 'No rooms found',
            subtitle: 'Try a different search term.',
          )
        else
          ...filtered.map((room) => RoomTile(room: room)),
      ],
    );
  }
}

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  late DateTime visibleMonth;
  DateTime? selectedDate;

  @override
  void initState() {
    super.initState();
    final now = campusNow();
    visibleMonth = DateTime(now.year, now.month);
  }

  @override
  Widget build(BuildContext context) {
    final selectedBookings =
        bookings
            .where(
              (booking) =>
                  selectedDate != null &&
                  isSameDay(booking.startAt, selectedDate!),
            )
            .toList()
          ..sort((a, b) => a.startAt.compareTo(b.startAt));

    return AppScrollView(
      children: [
        const HeroPanel(
          title: 'Teaching Calendar',
          subtitle: 'Select a date to view, create, or manage your bookings.',
        ),
        CardPanel(
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    tooltip: 'Previous month',
                    onPressed: () => setState(() {
                      visibleMonth = DateTime(
                        visibleMonth.year,
                        visibleMonth.month - 1,
                      );
                    }),
                    icon: const Icon(Icons.chevron_left),
                  ),
                  Expanded(
                    child: Text(
                      '${monthLong(visibleMonth)} ${visibleMonth.year}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Next month',
                    onPressed: () => setState(() {
                      visibleMonth = DateTime(
                        visibleMonth.year,
                        visibleMonth.month + 1,
                      );
                    }),
                    icon: const Icon(Icons.chevron_right),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Row(
                children: [
                  CalendarWeekday('M'),
                  CalendarWeekday('T'),
                  CalendarWeekday('W'),
                  CalendarWeekday('T'),
                  CalendarWeekday('F'),
                  CalendarWeekday('S'),
                  CalendarWeekday('S'),
                ],
              ),
              const SizedBox(height: 8),
              CalendarMonthGrid(
                month: visibleMonth,
                selectedDate: selectedDate,
                onDateSelected: (date) => setState(() => selectedDate = date),
              ),
            ],
          ),
        ),
        if (selectedDate == null)
          const EmptyPanel(
            icon: Icons.touch_app_outlined,
            title: 'Select a date',
            subtitle:
                'Your bookings and the Book a room button will appear here.',
          )
        else ...[
          SectionTitle('Bookings on ${dateLabel(selectedDate!)}'),
          if (!selectedDate!.isBefore(DateUtils.dateOnly(campusNow())))
            FilledButton.icon(
              onPressed: () => context
                  .findAncestorStateOfType<_LecturerHomeState>()
                  ?.openBookingForm(context, initialDate: selectedDate),
              icon: const Icon(Icons.add),
              label: const Text('Book a room'),
            ),
          if (selectedBookings.isEmpty)
            const EmptyPanel(
              icon: Icons.event_busy_outlined,
              title: 'No bookings',
              subtitle: 'There are no booking requests for this date.',
            )
          else
            ...selectedBookings.map(
              (booking) => BookingTile(booking: booking, detailed: true),
            ),
        ],
      ],
    );
  }
}

class IssuesScreen extends StatelessWidget {
  const IssuesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScrollView(
      children: [
        const SectionTitle('Reported Issues'),
        if (issues.isEmpty)
          const EmptyPanel(
            icon: Icons.task_alt_outlined,
            title: 'No reported issues',
            subtitle: 'Issues you report will appear here with their status.',
          )
        else
          ...issues.map((issue) => IssueTile(issue: issue)),
      ],
    );
  }
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final currentPasswordController = TextEditingController();
  final nextPasswordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  bool submitting = false;

  @override
  void dispose() {
    currentPasswordController.dispose();
    nextPasswordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> changePassword() async {
    if (submitting) return;
    if (currentPasswordController.text.isEmpty ||
        nextPasswordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Enter current password and an 8 character new password.',
          ),
        ),
      );
      return;
    }
    if (nextPasswordController.text != confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('The new passwords do not match.')),
      );
      return;
    }
    setState(() => submitting = true);
    try {
      await changeLecturerAccountPassword(
        currentPassword: currentPasswordController.text,
        nextPassword: nextPasswordController.text,
      );
      if (!mounted) return;
      currentPasswordController.clear();
      nextPasswordController.clear();
      confirmPasswordController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password changed successfully.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScrollView(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: brandPrimary,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            children: [
              CircleAvatar(
                radius: 42,
                backgroundColor: Colors.white24,
                child: Text(
                  lecturerInitials(currentLecturerName),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                currentLecturerName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                currentLecturerDepartment,
                style: const TextStyle(color: Colors.white70),
              ),
            ],
          ),
        ),
        InfoRow(
          icon: Icons.mail_outline,
          label: 'Gmail / Username',
          value: currentLecturerIdentifier,
        ),
        InfoRow(
          icon: Icons.business_outlined,
          label: 'Department',
          value: currentLecturerDepartment,
        ),
        const InfoRow(
          icon: Icons.verified_user_outlined,
          label: 'Role',
          value: 'Lecturer',
        ),
        CardPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Change Password',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: currentPasswordController,
                obscureText: true,
                enabled: !submitting,
                autofillHints: const [AutofillHints.password],
                inputFormatters: [LengthLimitingTextInputFormatter(128)],
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.lock_outline),
                  labelText: 'Current password',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nextPasswordController,
                obscureText: true,
                enabled: !submitting,
                autofillHints: const [AutofillHints.newPassword],
                inputFormatters: [LengthLimitingTextInputFormatter(128)],
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.key_outlined),
                  labelText: 'New password',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: confirmPasswordController,
                obscureText: true,
                enabled: !submitting,
                autofillHints: const [AutofillHints.newPassword],
                inputFormatters: [LengthLimitingTextInputFormatter(128)],
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.key_outlined),
                  labelText: 'Confirm new password',
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton.icon(
                  onPressed: submitting ? null : changePassword,
                  icon: const Icon(Icons.save_outlined),
                  label: Text(submitting ? 'Changing...' : 'Change password'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class RoomDetailsScreen extends StatelessWidget {
  const RoomDetailsScreen({
    required this.room,
    this.onBook,
    this.onReportIssue,
    super.key,
  });

  final Room room;
  final VoidCallback? onBook;
  final VoidCallback? onReportIssue;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Room Details')),
      body: AppScrollView(
        children: [
          HeroPanel(
            title: room.name,
            subtitle: '${room.code} - ${room.building}',
          ),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              DetailChip(
                icon: Icons.groups_outlined,
                label: '${room.capacity} seats',
              ),
              DetailChip(
                icon: Icons.layers_outlined,
                label: 'Floor ${room.floor}',
              ),
              DetailChip(
                icon: Icons.category_outlined,
                label: roomTypeLabel(room.type),
              ),
            ],
          ),
          StatusPill(
            label: roomStatusLabel(room.status),
            color: roomStatusColor(room.status),
          ),
          CardPanel(
            child: Text(
              room.description,
              style: const TextStyle(height: 1.4, color: Color(0xFF475569)),
            ),
          ),
          const SectionTitle('Facilities'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: room.facilities
                .map(
                  (facility) => Chip(
                    label: Text(facility),
                    avatar: const Icon(Icons.check, size: 16),
                  ),
                )
                .toList(),
          ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onReportIssue,
                  icon: const Icon(Icons.report_outlined),
                  label: const Text('Report Issue'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: room.status == RoomStatus.unavailable
                      ? null
                      : onBook,
                  icon: const Icon(Icons.add),
                  label: const Text('Book Room'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class BookingFormScreen extends StatefulWidget {
  const BookingFormScreen({
    this.defaultRoom,
    this.booking,
    this.initialDate,
    super.key,
  });

  final Room? defaultRoom;
  final Booking? booking;
  final DateTime? initialDate;

  @override
  State<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends State<BookingFormScreen> {
  late final List<Room> availableRooms;
  Room? selectedRoom;
  final moduleController = TextEditingController();
  static const purposeOptions = ['Assignment', 'Lecture', 'Extra Curricular'];
  String? selectedPurpose;
  final attendeesController = TextEditingController();
  late DateTime selectedDate;
  late TimeOfDay startTime;
  late TimeOfDay endTime;
  bool submitting = false;

  bool get isEditing => widget.booking != null;

  @override
  void initState() {
    super.initState();
    availableRooms = List.unmodifiable(
      rooms.where(
        (room) =>
            room.status != RoomStatus.unavailable ||
            (isEditing && room.id == widget.booking?.roomId),
      ),
    );
    final preferredRoomId = widget.defaultRoom?.id ?? widget.booking?.roomId;
    selectedRoom = roomWithId(availableRooms, preferredRoomId);
    if (!isEditing && selectedRoom == null && availableRooms.isNotEmpty) {
      selectedRoom = availableRooms.first;
    }

    final earliestStart = nextWholeHour(
      campusNow().add(const Duration(hours: 1)),
    );
    final requestedDate = widget.initialDate;
    final initialStart =
        widget.booking?.startAt ??
        (requestedDate == null || isSameDay(requestedDate, earliestStart)
            ? earliestStart
            : DateTime(
                requestedDate.year,
                requestedDate.month,
                requestedDate.day,
                9,
              ));
    final initialEnd =
        widget.booking?.endAt ?? initialStart.add(const Duration(hours: 1));
    selectedDate = DateUtils.dateOnly(initialStart);
    startTime = TimeOfDay.fromDateTime(initialStart);
    endTime = TimeOfDay.fromDateTime(initialEnd);
    moduleController.text = widget.booking?.moduleName ?? '';
    final existingPurpose = widget.booking?.purpose;
    selectedPurpose = purposeOptions.contains(existingPurpose)
        ? existingPurpose
        : null;
    attendeesController.text = '${widget.booking?.attendees ?? 1}';
  }

  @override
  void dispose() {
    moduleController.dispose();
    attendeesController.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (submitting) {
      return;
    }
    final room = selectedRoom;
    final module = moduleController.text.trim();
    final purpose = selectedPurpose ?? '';
    final attendees = int.tryParse(attendeesController.text.trim()) ?? 0;
    if (room == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No rooms are currently available.')),
      );
      return;
    }
    if (module.isEmpty || purpose.isEmpty || attendees <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete the booking details.')),
      );
      return;
    }
    if (attendees > room.capacity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${room.name} can accommodate up to ${room.capacity} attendees.',
          ),
        ),
      );
      return;
    }
    final start = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      startTime.hour,
      startTime.minute,
    );
    final end = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      endTime.hour,
      endTime.minute,
    );
    if (!end.isAfter(start)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End time must be after start time.')),
      );
      return;
    }
    if (start.isBefore(campusNow().add(const Duration(hours: 1)))) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Bookings must be requested at least 1 hour before the start time.',
          ),
        ),
      );
      return;
    }
    if (end.difference(start) > const Duration(hours: 12)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('A booking cannot be longer than 12 hours.'),
        ),
      );
      return;
    }

    FocusManager.instance.primaryFocus?.unfocus();
    setState(() => submitting = true);
    try {
      final response = await apiRequest(
        isEditing
            ? '/api/lecturer/bookings/${widget.booking!.id}'
            : '/api/lecturer/bookings',
        method: isEditing ? 'PUT' : 'POST',
        body: bookingInputToApi(
          room: room,
          moduleName: module,
          startAt: start,
          endAt: end,
          purpose: purpose,
          attendees: attendees,
        ),
      );
      final savedBooking = bookingFromApi(response as Map<String, dynamic>);

      if (isEditing) {
        final index = bookings.indexWhere(
          (item) => item.id == widget.booking!.id,
        );
        if (index != -1) {
          bookings[index] = savedBooking;
        }
      } else {
        bookings.insert(0, savedBooking);
      }
      if (mounted) {
        if (!isEditing) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                savedBooking.status == BookingStatus.approved
                    ? 'Room available. Your booking was approved automatically.'
                    : 'This time overlaps an existing schedule and was sent for admin approval.',
              ),
            ),
          );
        }
        Navigator.of(context).pop();
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
    } finally {
      if (mounted) {
        setState(() => submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final room = selectedRoom;
    return PopScope(
      canPop: !submitting,
      child: Scaffold(
        appBar: AppBar(
          title: Text(isEditing ? 'Edit Booking' : 'Request Space'),
        ),
        body: room == null
            ? AppScrollView(
                children: [
                  EmptyPanel(
                    icon: Icons.meeting_room_outlined,
                    title: isEditing
                        ? 'Original room unavailable'
                        : 'No bookable rooms',
                    subtitle: isEditing
                        ? 'This booking room no longer exists. Go back and refresh before editing.'
                        : 'There are no available rooms right now. Refresh and try again later.',
                  ),
                ],
              )
            : AppScrollView(
                children: [
                  const SectionTitle('Room and purpose'),
                  DropdownButtonFormField<Room>(
                    initialValue: room,
                    isExpanded: true,
                    items: availableRooms
                        .map(
                          (room) => DropdownMenuItem(
                            value: room,
                            child: Text(
                              '${room.code} - ${room.name}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: submitting
                        ? null
                        : (value) =>
                              setState(() => selectedRoom = value ?? room),
                    decoration: const InputDecoration(labelText: 'Room'),
                  ),
                  TextField(
                    controller: moduleController,
                    enabled: !submitting,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.next,
                    maxLength: 100,
                    decoration: const InputDecoration(labelText: 'Module name'),
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: selectedPurpose,
                    isExpanded: true,
                    hint: const Text('Select purpose'),
                    items: purposeOptions
                        .map(
                          (purpose) => DropdownMenuItem(
                            value: purpose,
                            child: Text(purpose),
                          ),
                        )
                        .toList(),
                    onChanged: submitting
                        ? null
                        : (value) => setState(() => selectedPurpose = value),
                    decoration: const InputDecoration(labelText: 'Purpose'),
                  ),
                  TextField(
                    controller: attendeesController,
                    enabled: !submitting,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    maxLength: 6,
                    decoration: InputDecoration(
                      labelText: 'Expected attendees',
                      helperText: 'Room capacity: ${room.capacity} seats',
                    ),
                  ),
                  const SectionTitle('Date and time'),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.calendar_month),
                        label: Text(dateLabel(selectedDate)),
                        onPressed: submitting
                            ? null
                            : () async {
                                final today = DateUtils.dateOnly(campusNow());
                                final standardLastDate = today.add(
                                  const Duration(days: 365),
                                );
                                final lastDate =
                                    selectedDate.isAfter(standardLastDate)
                                    ? selectedDate
                                    : standardLastDate;
                                final initialDate = selectedDate.isBefore(today)
                                    ? today
                                    : selectedDate;
                                final value = await showDatePicker(
                                  context: context,
                                  firstDate: today,
                                  lastDate: lastDate,
                                  initialDate: initialDate,
                                  helpText: 'Select booking date',
                                );
                                if (value != null && mounted) {
                                  setState(() => selectedDate = value);
                                }
                              },
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.schedule),
                        label: Text(startTime.format(context)),
                        onPressed: submitting
                            ? null
                            : () async {
                                final value = await showTimePicker(
                                  context: context,
                                  initialTime: startTime,
                                  helpText: 'Select start time',
                                );
                                if (value != null && mounted) {
                                  setState(() => startTime = value);
                                }
                              },
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.schedule_send_outlined),
                        label: Text(endTime.format(context)),
                        onPressed: submitting
                            ? null
                            : () async {
                                final value = await showTimePicker(
                                  context: context,
                                  initialTime: endTime,
                                  helpText: 'Select end time',
                                );
                                if (value != null && mounted) {
                                  setState(() => endTime = value);
                                }
                              },
                      ),
                    ],
                  ),
                  SizedBox(
                    height: 54,
                    child: FilledButton.icon(
                      onPressed: submitting ? null : submit,
                      icon: submitting
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send_outlined),
                      label: Text(
                        submitting
                            ? 'Saving...'
                            : isEditing
                            ? 'Save Changes'
                            : 'Submit Request',
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class IssueFormScreen extends StatefulWidget {
  const IssueFormScreen({this.defaultRoom, super.key});

  final Room? defaultRoom;

  @override
  State<IssueFormScreen> createState() => _IssueFormScreenState();
}

class _IssueFormScreenState extends State<IssueFormScreen> {
  late final List<Room> formRooms;
  Room? selectedRoom;
  IssueSeverity severity = IssueSeverity.medium;
  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  bool submitting = false;

  @override
  void initState() {
    super.initState();
    formRooms = List.unmodifiable(rooms);
    selectedRoom = roomWithId(formRooms, widget.defaultRoom?.id);
    if (selectedRoom == null && formRooms.isNotEmpty) {
      selectedRoom = formRooms.first;
    }
  }

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (submitting) {
      return;
    }
    final room = selectedRoom;
    final title = titleController.text.trim();
    final description = descriptionController.text.trim();
    if (room == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No rooms are available to report.')),
      );
      return;
    }
    if (title.isEmpty || description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add an issue title and description.')),
      );
      return;
    }
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() => submitting = true);
    try {
      final response = await apiRequest(
        '/api/lecturer/issues',
        method: 'POST',
        body: {
          'roomId': room.id,
          'title': title,
          'description': description,
          'severity': issueSeverityToApi(severity),
        },
      );
      issues.insert(0, issueFromApi(response as Map<String, dynamic>));
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
    } finally {
      if (mounted) {
        setState(() => submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final room = selectedRoom;
    return PopScope(
      canPop: !submitting,
      child: Scaffold(
        appBar: AppBar(title: const Text('Report Issue')),
        body: room == null
            ? const AppScrollView(
                children: [
                  EmptyPanel(
                    icon: Icons.meeting_room_outlined,
                    title: 'No rooms found',
                    subtitle:
                        'Refresh the room list before submitting an issue report.',
                  ),
                ],
              )
            : AppScrollView(
                children: [
                  const SectionTitle('Issue details'),
                  DropdownButtonFormField<Room>(
                    initialValue: room,
                    isExpanded: true,
                    items: formRooms
                        .map(
                          (room) => DropdownMenuItem(
                            value: room,
                            child: Text(
                              '${room.code} - ${room.name}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: submitting
                        ? null
                        : (value) =>
                              setState(() => selectedRoom = value ?? room),
                    decoration: const InputDecoration(labelText: 'Room'),
                  ),
                  DropdownButtonFormField<IssueSeverity>(
                    initialValue: severity,
                    items: IssueSeverity.values
                        .map(
                          (value) => DropdownMenuItem(
                            value: value,
                            child: Text(issueSeverityLabel(value)),
                          ),
                        )
                        .toList(),
                    onChanged: submitting
                        ? null
                        : (value) =>
                              setState(() => severity = value ?? severity),
                    decoration: const InputDecoration(labelText: 'Severity'),
                  ),
                  TextField(
                    controller: titleController,
                    enabled: !submitting,
                    textCapitalization: TextCapitalization.sentences,
                    textInputAction: TextInputAction.next,
                    maxLength: 120,
                    decoration: const InputDecoration(labelText: 'Issue title'),
                  ),
                  TextField(
                    controller: descriptionController,
                    enabled: !submitting,
                    textCapitalization: TextCapitalization.sentences,
                    maxLines: 4,
                    maxLength: 2000,
                    decoration: const InputDecoration(labelText: 'Description'),
                  ),
                  SizedBox(
                    height: 54,
                    child: FilledButton.icon(
                      onPressed: submitting ? null : submit,
                      icon: submitting
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send_outlined),
                      label: Text(
                        submitting ? 'Submitting...' : 'Submit Issue',
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class IssueDetailsScreen extends StatelessWidget {
  const IssueDetailsScreen({required this.issue, super.key});

  final Issue issue;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Issue Details')),
      body: AppScrollView(
        children: [
          HeroPanel(title: issue.title, subtitle: issue.roomName),
          StatusPill(
            label: issueStatusLabel(issue.status),
            color: issueStatusColor(issue.status),
          ),
          CardPanel(
            child: Text(
              issue.description,
              style: const TextStyle(height: 1.4, color: Color(0xFF475569)),
            ),
          ),
          const SectionTitle('Updates'),
          ...issue.updates.map(
            (update) => CardPanel(
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  Icons.history,
                  color: issueStatusColor(update.status),
                ),
                title: Text(update.note),
                subtitle: Text(
                  '${issueStatusLabel(update.status)} - ${dateTimeLabel(update.at)}',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class RoomTile extends StatelessWidget {
  const RoomTile({required this.room, super.key});

  final Room room;

  @override
  Widget build(BuildContext context) {
    final home = context.findAncestorStateOfType<_LecturerHomeState>();
    return CardPanel(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => RoomDetailsScreen(
              room: room,
              onBook: home == null
                  ? null
                  : () => home.openBookingForm(context, room: room),
              onReportIssue: home == null
                  ? null
                  : () => home.openIssueForm(context, room),
            ),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: brandPrimary.withValues(alpha: 0.1),
                foregroundColor: brandPrimary,
                child: Icon(
                  room.type == RoomType.lab
                      ? Icons.computer
                      : Icons.meeting_room_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      room.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      '${room.code} - ${room.building}',
                      style: const TextStyle(color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              DetailChip(
                icon: Icons.groups_outlined,
                label: '${room.capacity} seats',
              ),
              DetailChip(
                icon: Icons.layers_outlined,
                label: 'Floor ${room.floor}',
              ),
              StatusPill(
                label: roomStatusLabel(room.status),
                color: roomStatusColor(room.status),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class CalendarWeekday extends StatelessWidget {
  const CalendarWeekday(this.label, {super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Text(
        label,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Color(0xFF64748B),
          fontSize: 12,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class CalendarMonthGrid extends StatelessWidget {
  const CalendarMonthGrid({
    required this.month,
    required this.selectedDate,
    required this.onDateSelected,
    super.key,
  });

  final DateTime month;
  final DateTime? selectedDate;
  final ValueChanged<DateTime> onDateSelected;

  @override
  Widget build(BuildContext context) {
    final firstDay = DateTime(month.year, month.month);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final leadingBlanks = firstDay.weekday - 1;
    final totalCells = leadingBlanks + daysInMonth;
    final rowCount = (totalCells / 7).ceil();

    return Column(
      children: [
        for (var row = 0; row < rowCount; row++)
          Row(
            children: [
              for (var column = 0; column < 7; column++)
                Expanded(
                  child: _CalendarDayCell(
                    dayNumber: row * 7 + column - leadingBlanks + 1,
                    daysInMonth: daysInMonth,
                    month: month,
                    selectedDate: selectedDate,
                    onDateSelected: onDateSelected,
                  ),
                ),
            ],
          ),
      ],
    );
  }
}

class _CalendarDayCell extends StatelessWidget {
  const _CalendarDayCell({
    required this.dayNumber,
    required this.daysInMonth,
    required this.month,
    required this.selectedDate,
    required this.onDateSelected,
  });

  final int dayNumber;
  final int daysInMonth;
  final DateTime month;
  final DateTime? selectedDate;
  final ValueChanged<DateTime> onDateSelected;

  @override
  Widget build(BuildContext context) {
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return const SizedBox(height: 48);
    }

    final date = DateTime(month.year, month.month, dayNumber);
    final hasBooking = bookings.any(
      (booking) => isSameDay(booking.startAt, date),
    );
    final isSelected = selectedDate != null && isSameDay(selectedDate!, date);
    final isToday = isSameDay(campusNow(), date);

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => onDateSelected(date),
      child: Container(
        height: 48,
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: isSelected ? brandPrimary : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: isToday && !isSelected
              ? Border.all(color: brandPrimary.withValues(alpha: 0.45))
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$dayNumber',
              style: TextStyle(
                color: isSelected ? Colors.white : const Color(0xFF0F172A),
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 3),
            Container(
              height: 5,
              width: 5,
              decoration: BoxDecoration(
                color: hasBooking
                    ? (isSelected ? brandAccent : brandPrimary)
                    : Colors.transparent,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BookingTile extends StatelessWidget {
  const BookingTile({required this.booking, this.detailed = false, super.key});

  final Booking booking;
  final bool detailed;

  @override
  Widget build(BuildContext context) {
    final canManage =
        isActiveBooking(booking) && booking.startAt.isAfter(campusNow());
    final home = context.findAncestorStateOfType<_LecturerHomeState>();

    return CardPanel(
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: brandPrimary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      monthShort(booking.startAt).toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      '${booking.startAt.day}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.roomName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${booking.moduleName} - ${timeLabel(booking.startAt)} to ${timeLabel(booking.endAt)}',
                      style: const TextStyle(color: Color(0xFF64748B)),
                    ),
                    if (detailed) ...[
                      const SizedBox(height: 8),
                      Text(booking.purpose),
                      Text(
                        '${booking.attendees} attendees',
                        style: const TextStyle(color: Color(0xFF64748B)),
                      ),
                    ],
                  ],
                ),
              ),
              StatusPill(
                label: bookingStatusLabel(booking.status),
                color: bookingStatusColor(booking.status),
              ),
            ],
          ),
          if (detailed && canManage) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        home?.openBookingForm(context, booking: booking),
                    icon: const Icon(Icons.edit_outlined, size: 18),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => home?.deleteBooking(context, booking),
                    icon: const Icon(Icons.cancel_outlined, size: 18),
                    label: const Text('Cancel'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class IssueTile extends StatelessWidget {
  const IssueTile({required this.issue, super.key});

  final Issue issue;

  @override
  Widget build(BuildContext context) {
    return CardPanel(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => IssueDetailsScreen(issue: issue)),
        );
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: issueSeverityColor(
              issue.severity,
            ).withValues(alpha: 0.12),
            foregroundColor: issueSeverityColor(issue.severity),
            child: const Icon(Icons.report_outlined),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  issue.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  issue.roomName,
                  style: const TextStyle(color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    StatusPill(
                      label: issueSeverityLabel(issue.severity),
                      color: issueSeverityColor(issue.severity),
                    ),
                    StatusPill(
                      label: issueStatusLabel(issue.status),
                      color: issueStatusColor(issue.status),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}

class AppScrollView extends StatelessWidget {
  const AppScrollView({required this.children, super.key});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        for (final child in children) ...[child, const SizedBox(height: 14)],
      ],
    );
  }
}

class HeroPanel extends StatelessWidget {
  const HeroPanel({
    required this.title,
    required this.subtitle,
    this.actions = const [],
    super.key,
  });

  final String title;
  final String subtitle;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: brandPrimary,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: brandPrimary.withValues(alpha: 0.16),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(subtitle, style: const TextStyle(color: Colors.white70)),
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 18),
            Row(children: actions),
          ],
        ],
      ),
    );
  }
}

class CardPanel extends StatelessWidget {
  const CardPanel({required this.child, this.onTap, super.key});

  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: child,
    );
    if (onTap == null) return card;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: card,
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    super.key,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return CardPanel(
      child: Column(
        children: [
          CircleAvatar(
            backgroundColor: color.withValues(alpha: 0.12),
            foregroundColor: color,
            child: Icon(icon),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: Color(0xFF64748B),
        fontSize: 12,
        fontWeight: FontWeight.w900,
        letterSpacing: 0.6,
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({required this.label, required this.color, super.key});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class DetailChip extends StatelessWidget {
  const DetailChip({required this.icon, required this.label, super.key});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
      backgroundColor: const Color(0xFFF1F5F9),
      side: BorderSide.none,
    );
  }
}

class EmptyPanel extends StatelessWidget {
  const EmptyPanel({
    required this.icon,
    required this.title,
    required this.subtitle,
    super.key,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return CardPanel(
      child: Column(
        children: [
          Icon(icon, size: 38, color: const Color(0xFFCBD5E1)),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}

class InfoRow extends StatelessWidget {
  const InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    super.key,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return CardPanel(
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(icon, color: brandPrimary),
        title: Text(label, style: const TextStyle(color: Color(0xFF64748B))),
        subtitle: Text(
          value,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }
}

Room? roomWithId(Iterable<Room> source, String? id) {
  if (id == null) {
    return null;
  }
  for (final room in source) {
    if (room.id == id) {
      return room;
    }
  }
  return null;
}

DateTime nextWholeHour(DateTime now) {
  return DateTime(
    now.year,
    now.month,
    now.day,
    now.hour,
  ).add(const Duration(hours: 1));
}

String roomTypeLabel(RoomType type) => switch (type) {
  RoomType.lectureHall => 'Lecture Hall',
  RoomType.lab => 'Lab',
  RoomType.meetingRoom => 'Meeting Room',
};

String roomStatusLabel(RoomStatus status) => switch (status) {
  RoomStatus.available => 'Available',
  RoomStatus.limited => 'Limited',
  RoomStatus.unavailable => 'Unavailable',
};

Color roomStatusColor(RoomStatus status) => switch (status) {
  RoomStatus.available => const Color(0xFF059669),
  RoomStatus.limited => const Color(0xFFD97706),
  RoomStatus.unavailable => const Color(0xFFDC2626),
};

String bookingStatusLabel(BookingStatus status) => switch (status) {
  BookingStatus.pending => 'Pending',
  BookingStatus.approved => 'Approved',
  BookingStatus.rejected => 'Rejected',
  BookingStatus.cancelled => 'Cancelled',
};

bool isActiveBooking(Booking booking) =>
    booking.status == BookingStatus.pending ||
    booking.status == BookingStatus.approved;

Color bookingStatusColor(BookingStatus status) => switch (status) {
  BookingStatus.pending => const Color(0xFFD97706),
  BookingStatus.approved => const Color(0xFF059669),
  BookingStatus.rejected => const Color(0xFFDC2626),
  BookingStatus.cancelled => const Color(0xFF64748B),
};

String issueSeverityLabel(IssueSeverity severity) => switch (severity) {
  IssueSeverity.low => 'Low',
  IssueSeverity.medium => 'Medium',
  IssueSeverity.high => 'High',
};

Color issueSeverityColor(IssueSeverity severity) => switch (severity) {
  IssueSeverity.low => const Color(0xFF2563EB),
  IssueSeverity.medium => const Color(0xFFD97706),
  IssueSeverity.high => const Color(0xFFDC2626),
};

String issueStatusLabel(IssueStatus status) => switch (status) {
  IssueStatus.open => 'Open',
  IssueStatus.inProgress => 'In Progress',
  IssueStatus.resolved => 'Resolved',
  IssueStatus.closed => 'Closed',
};

String lecturerInitials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) return 'L';
  final first = parts.first[0];
  final second = parts.length > 1 ? parts.last[0] : '';
  return '$first$second'.toUpperCase();
}

Color issueStatusColor(IssueStatus status) => switch (status) {
  IssueStatus.open => const Color(0xFFDC2626),
  IssueStatus.inProgress => const Color(0xFFD97706),
  IssueStatus.resolved => const Color(0xFF059669),
  IssueStatus.closed => const Color(0xFF64748B),
};

String dateLabel(DateTime date) =>
    '${monthShort(date)} ${date.day}, ${date.year}';

String dateTimeLabel(DateTime date) => '${dateLabel(date)} ${timeLabel(date)}';

String timeLabel(DateTime date) {
  final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
  final minute = date.minute.toString().padLeft(2, '0');
  final period = date.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $period';
}

String monthShort(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[date.month - 1];
}

String monthLong(DateTime date) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[date.month - 1];
}

bool isSameDay(DateTime a, DateTime b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}
