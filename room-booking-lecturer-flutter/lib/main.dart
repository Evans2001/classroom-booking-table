import 'package:flutter/material.dart';

void main() {
  runApp(const LecturerBookingApp());
}

const brandPrimary = Color(0xFF5C2C30);
const brandAccent = Color(0xFFEAB308);
const appBg = Color(0xFFF8FAFC);

class LecturerBookingApp extends StatelessWidget {
  const LecturerBookingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Room Booking Lecturer',
      debugShowCheckedModeBanner: false,
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
      ),
      home: const LoginScreen(),
    );
  }
}

enum RoomType { lectureHall, lab, meetingRoom }

enum RoomStatus { available, limited, unavailable }

enum BookingStatus { pending, approved, rejected, cancelled }

enum IssueSeverity { low, medium, high }

enum IssueStatus { open, inProgress, resolved }

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

final bookings = <Booking>[
  Booking(
    id: 'bk-1',
    roomId: 'room-1',
    roomName: 'Main Lecture Hall',
    building: 'Engineering Block',
    roomCode: 'LH-101',
    moduleName: 'Software Engineering',
    startAt: DateTime(2026, 6, 16, 9, 0),
    endAt: DateTime(2026, 6, 16, 11, 0),
    purpose: 'Department seminar',
    attendees: 80,
    status: BookingStatus.pending,
    submittedAt: DateTime(2026, 6, 5, 13, 0),
  ),
  Booking(
    id: 'bk-2',
    roomId: 'room-3',
    roomName: 'Board Meeting Room',
    building: 'Admin Building',
    roomCode: 'MR-305',
    moduleName: 'Database Systems',
    startAt: DateTime(2026, 6, 18, 13, 30),
    endAt: DateTime(2026, 6, 18, 14, 30),
    purpose: 'Project discussion',
    attendees: 12,
    status: BookingStatus.approved,
    submittedAt: DateTime(2026, 6, 4, 17, 30),
    reviewerNote: 'Approved',
  ),
  Booking(
    id: 'bk-3',
    roomId: 'room-2',
    roomName: 'Computer Lab A',
    building: 'Science Complex',
    roomCode: 'LAB-204',
    moduleName: 'Web Application Development',
    startAt: DateTime(2026, 6, 20, 8, 30),
    endAt: DateTime(2026, 6, 20, 9, 30),
    purpose: 'Lab revision session',
    attendees: 30,
    status: BookingStatus.rejected,
    submittedAt: DateTime(2026, 6, 3, 13, 45),
    reviewerNote: 'Room unavailable due maintenance slot.',
  ),
  Booking(
    id: 'bk-4',
    roomId: 'room-1',
    roomName: 'Main Lecture Hall',
    building: 'Engineering Block',
    roomCode: 'LH-101',
    moduleName: 'Computer Networks',
    startAt: DateTime(2026, 6, 24, 9, 30),
    endAt: DateTime(2026, 6, 24, 11, 30),
    purpose: 'Guest lecture',
    attendees: 70,
    status: BookingStatus.approved,
    submittedAt: DateTime(2026, 6, 2, 16, 30),
    reviewerNote: 'Approved and reserved.',
  ),
];

final issues = <Issue>[
  Issue(
    id: 'is-1',
    roomId: 'room-2',
    roomName: 'Computer Lab A',
    title: 'Projector not turning on',
    description: 'Power light blinks but no display.',
    severity: IssueSeverity.high,
    status: IssueStatus.inProgress,
    createdAt: DateTime(2026, 2, 26, 14, 0),
    updates: [
      IssueUpdate(
        status: IssueStatus.open,
        note: 'Issue reported by lecturer.',
        at: DateTime(2026, 2, 26, 14, 0),
      ),
      IssueUpdate(
        status: IssueStatus.inProgress,
        note: 'Maintenance team assigned.',
        at: DateTime(2026, 2, 27, 16, 30),
      ),
    ],
  ),
  Issue(
    id: 'is-2',
    roomId: 'room-1',
    roomName: 'Main Lecture Hall',
    title: 'Microphone echo issue',
    description: 'Audio feedback starts when volume is above medium.',
    severity: IssueSeverity.medium,
    status: IssueStatus.open,
    createdAt: DateTime(2026, 2, 28, 11, 30),
    updates: [
      IssueUpdate(
        status: IssueStatus.open,
        note: 'Issue reported by faculty.',
        at: DateTime(2026, 2, 28, 11, 30),
      ),
    ],
  ),
  Issue(
    id: 'is-3',
    roomId: 'room-3',
    roomName: 'Board Meeting Room',
    title: 'Ceiling light flicker',
    description: 'One light panel was flickering during meetings.',
    severity: IssueSeverity.low,
    status: IssueStatus.resolved,
    createdAt: DateTime(2026, 1, 30, 11, 15),
    updates: [
      IssueUpdate(
        status: IssueStatus.open,
        note: 'Issue reported by lecturer.',
        at: DateTime(2026, 1, 30, 11, 15),
      ),
      IssueUpdate(
        status: IssueStatus.resolved,
        note: 'Electrical maintenance completed.',
        at: DateTime(2026, 2, 2, 14, 50),
      ),
    ],
  ),
];

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void signIn() {
    final email = emailController.text.trim();
    final password = passwordController.text;
    if (email == 'lecturer@eng.ruh.ac.lk' && password == 'Lecturer@123') {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LecturerHome()),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Use the demo lecturer credentials.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
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
              padding: const EdgeInsets.fromLTRB(24, 22, 24, 28),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(34)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Welcome Back',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 18),
                  TextField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.mail_outline),
                      hintText: 'Email address',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.lock_outline),
                      hintText: 'Password',
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: FilledButton.icon(
                      onPressed: signIn,
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: const Text('Sign In'),
                    ),
                  ),
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    onPressed: () {
                      emailController.text = 'lecturer@eng.ruh.ac.lk';
                      passwordController.text = 'Lecturer@123';
                    },
                    icon: const Icon(Icons.info_outline),
                    label: const Text('Auto-fill demo credentials'),
                  ),
                ],
              ),
            ),
          ],
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

  final pages = const [
    DashboardScreen(),
    RoomsScreen(),
    BookingsScreen(),
    CalendarScreen(),
    IssuesScreen(),
    ProfileScreen(),
  ];

  final titles = const [
    'Lecturer Dashboard',
    'Rooms',
    'My Bookings',
    'Calendar',
    'My Issues',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(titles[index]),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: pages[index],
      floatingActionButton: index == 2
          ? FloatingActionButton.extended(
              onPressed: () => openBookingForm(context),
              icon: const Icon(Icons.add),
              label: const Text('Book'),
            )
          : index == 4
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
            icon: Icon(Icons.event_note_outlined),
            label: 'Bookings',
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
  }) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BookingFormScreen(defaultRoom: room, booking: booking),
      ),
    );
    setState(() {});
  }

  void deleteBooking(BuildContext context, Booking booking) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete booking?'),
        content: Text(
          'This will remove the ${booking.roomCode} request for ${booking.moduleName}.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              setState(
                () => bookings.removeWhere((item) => item.id == booking.id),
              );
              Navigator.of(dialogContext).pop();
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(const SnackBar(content: Text('Booking deleted.')));
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> openIssueForm(BuildContext context, [Room? room]) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => IssueFormScreen(defaultRoom: room)),
    );
    setState(() {});
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final activeBookings = bookings
        .where(
          (booking) =>
              booking.status == BookingStatus.pending ||
              booking.status == BookingStatus.approved,
        )
        .take(3)
        .toList();
    final home = context.findAncestorStateOfType<_LecturerHomeState>();

    return AppScrollView(
      children: [
        HeroPanel(
          title: 'Hello, Demo Lecturer',
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
        if (activeBookings.isEmpty)
          const EmptyPanel(
            icon: Icons.event_available_outlined,
            title: 'No upcoming bookings',
            subtitle: 'Approved and pending requests will appear here.',
          )
        else
          ...activeBookings.map((booking) => BookingTile(booking: booking)),
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

class BookingsScreen extends StatelessWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScrollView(
      children: [
        const SectionTitle('Requests'),
        ...bookings.map(
          (booking) => BookingTile(booking: booking, detailed: true),
        ),
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
  late DateTime visibleMonth = DateTime(
    DateTime.now().year,
    DateTime.now().month,
  );
  late DateTime selectedDate = bookings.isNotEmpty
      ? DateTime(
          bookings.first.startAt.year,
          bookings.first.startAt.month,
          bookings.first.startAt.day,
        )
      : DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);

  @override
  Widget build(BuildContext context) {
    final selectedBookings =
        bookings
            .where((booking) => isSameDay(booking.startAt, selectedDate))
            .toList()
          ..sort((a, b) => a.startAt.compareTo(b.startAt));

    return AppScrollView(
      children: [
        const HeroPanel(
          title: 'Teaching Calendar',
          subtitle: 'Approved and pending booking requests by date.',
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
        SectionTitle('Bookings on ${dateLabel(selectedDate)}'),
        if (selectedBookings.isEmpty)
          const EmptyPanel(
            icon: Icons.event_busy_outlined,
            title: 'No bookings',
            subtitle: 'Choose another highlighted date or create a request.',
          )
        else
          ...selectedBookings.map((booking) => BookingTile(booking: booking)),
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
        ...issues.map((issue) => IssueTile(issue: issue)),
      ],
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
          child: const Column(
            children: [
              CircleAvatar(
                radius: 42,
                backgroundColor: Colors.white24,
                child: Text(
                  'DL',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              SizedBox(height: 14),
              Text(
                'Demo Lecturer',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
              SizedBox(height: 6),
              Text('Faculty Lecturer', style: TextStyle(color: Colors.white70)),
            ],
          ),
        ),
        const InfoRow(
          icon: Icons.mail_outline,
          label: 'Email',
          value: 'lecturer@eng.ruh.ac.lk',
        ),
        const InfoRow(
          icon: Icons.business_outlined,
          label: 'Department',
          value: 'Computer Engineering',
        ),
        const InfoRow(
          icon: Icons.phone_outlined,
          label: 'Phone',
          value: '+94 77 000 0000',
        ),
        const InfoRow(
          icon: Icons.verified_user_outlined,
          label: 'Role',
          value: 'Lecturer',
        ),
      ],
    );
  }
}

class RoomDetailsScreen extends StatelessWidget {
  const RoomDetailsScreen({required this.room, super.key});

  final Room room;

  @override
  Widget build(BuildContext context) {
    final home = context.findAncestorStateOfType<_LecturerHomeState>();
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
                  onPressed: () => home?.openIssueForm(context, room),
                  icon: const Icon(Icons.report_outlined),
                  label: const Text('Report Issue'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: room.status == RoomStatus.unavailable
                      ? null
                      : () => home?.openBookingForm(context, room: room),
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
  const BookingFormScreen({this.defaultRoom, this.booking, super.key});

  final Room? defaultRoom;
  final Booking? booking;

  @override
  State<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends State<BookingFormScreen> {
  late Room selectedRoom =
      widget.defaultRoom ??
      rooms.firstWhere(
        (room) => room.id == widget.booking?.roomId,
        orElse: () => rooms.first,
      );
  final moduleController = TextEditingController();
  final purposeController = TextEditingController();
  final attendeesController = TextEditingController();
  late DateTime selectedDate =
      widget.booking?.startAt ?? DateTime.now().add(const Duration(days: 1));
  late TimeOfDay startTime = widget.booking == null
      ? const TimeOfDay(hour: 9, minute: 0)
      : TimeOfDay.fromDateTime(widget.booking!.startAt);
  late TimeOfDay endTime = widget.booking == null
      ? const TimeOfDay(hour: 10, minute: 0)
      : TimeOfDay.fromDateTime(widget.booking!.endAt);

  bool get isEditing => widget.booking != null;

  @override
  void initState() {
    super.initState();
    moduleController.text = widget.booking?.moduleName ?? '';
    purposeController.text = widget.booking?.purpose ?? '';
    attendeesController.text = '${widget.booking?.attendees ?? 30}';
  }

  @override
  void dispose() {
    moduleController.dispose();
    purposeController.dispose();
    attendeesController.dispose();
    super.dispose();
  }

  void submit() {
    final module = moduleController.text.trim();
    final purpose = purposeController.text.trim();
    final attendees = int.tryParse(attendeesController.text.trim()) ?? 0;
    if (module.isEmpty || purpose.isEmpty || attendees <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete the booking details.')),
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

    final savedBooking = Booking(
      id: widget.booking?.id ?? 'bk-${DateTime.now().millisecondsSinceEpoch}',
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      building: selectedRoom.building,
      roomCode: selectedRoom.code,
      moduleName: module,
      startAt: start,
      endAt: end,
      purpose: purpose,
      attendees: attendees,
      status: widget.booking?.status ?? BookingStatus.pending,
      submittedAt: widget.booking?.submittedAt ?? DateTime.now(),
      reviewerNote: widget.booking?.reviewerNote,
    );

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
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(isEditing ? 'Edit Booking' : 'Request Space')),
      body: AppScrollView(
        children: [
          DropdownButtonFormField<Room>(
            initialValue: selectedRoom,
            items: rooms
                .where((room) => room.status != RoomStatus.unavailable)
                .map(
                  (room) => DropdownMenuItem(
                    value: room,
                    child: Text('${room.code} - ${room.name}'),
                  ),
                )
                .toList(),
            onChanged: (value) =>
                setState(() => selectedRoom = value ?? selectedRoom),
            decoration: const InputDecoration(labelText: 'Room'),
          ),
          TextField(
            controller: moduleController,
            decoration: const InputDecoration(labelText: 'Module name'),
          ),
          TextField(
            controller: purposeController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Purpose'),
          ),
          TextField(
            controller: attendeesController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Attendees'),
          ),
          Wrap(
            spacing: 10,
            children: [
              ActionChip(
                avatar: const Icon(Icons.calendar_month),
                label: Text(dateLabel(selectedDate)),
                onPressed: () async {
                  final value = await showDatePicker(
                    context: context,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    initialDate: selectedDate,
                  );
                  if (value != null) setState(() => selectedDate = value);
                },
              ),
              ActionChip(
                avatar: const Icon(Icons.schedule),
                label: Text(startTime.format(context)),
                onPressed: () async {
                  final value = await showTimePicker(
                    context: context,
                    initialTime: startTime,
                  );
                  if (value != null) setState(() => startTime = value);
                },
              ),
              ActionChip(
                avatar: const Icon(Icons.schedule_send_outlined),
                label: Text(endTime.format(context)),
                onPressed: () async {
                  final value = await showTimePicker(
                    context: context,
                    initialTime: endTime,
                  );
                  if (value != null) setState(() => endTime = value);
                },
              ),
            ],
          ),
          SizedBox(
            height: 54,
            child: FilledButton.icon(
              onPressed: submit,
              icon: const Icon(Icons.send_outlined),
              label: Text(isEditing ? 'Save Changes' : 'Submit Request'),
            ),
          ),
        ],
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
  late Room selectedRoom = widget.defaultRoom ?? rooms.first;
  IssueSeverity severity = IssueSeverity.medium;
  final titleController = TextEditingController();
  final descriptionController = TextEditingController();

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    super.dispose();
  }

  void submit() {
    final title = titleController.text.trim();
    final description = descriptionController.text.trim();
    if (title.isEmpty || description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add an issue title and description.')),
      );
      return;
    }
    issues.insert(
      0,
      Issue(
        id: 'is-${DateTime.now().millisecondsSinceEpoch}',
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        title: title,
        description: description,
        severity: severity,
        status: IssueStatus.open,
        createdAt: DateTime.now(),
        updates: [
          IssueUpdate(
            status: IssueStatus.open,
            note: 'Issue submitted from lecturer mobile app.',
            at: DateTime.now(),
          ),
        ],
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report Issue')),
      body: AppScrollView(
        children: [
          DropdownButtonFormField<Room>(
            initialValue: selectedRoom,
            items: rooms
                .map(
                  (room) => DropdownMenuItem(
                    value: room,
                    child: Text('${room.code} - ${room.name}'),
                  ),
                )
                .toList(),
            onChanged: (value) =>
                setState(() => selectedRoom = value ?? selectedRoom),
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
            onChanged: (value) => setState(() => severity = value ?? severity),
            decoration: const InputDecoration(labelText: 'Severity'),
          ),
          TextField(
            controller: titleController,
            decoration: const InputDecoration(labelText: 'Issue title'),
          ),
          TextField(
            controller: descriptionController,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Description'),
          ),
          SizedBox(
            height: 54,
            child: FilledButton.icon(
              onPressed: submit,
              icon: const Icon(Icons.send_outlined),
              label: const Text('Submit Issue'),
            ),
          ),
        ],
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
    return CardPanel(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => RoomDetailsScreen(room: room)),
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
  final DateTime selectedDate;
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
  final DateTime selectedDate;
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
    final isSelected = isSameDay(selectedDate, date);
    final isToday = isSameDay(DateTime.now(), date);

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
          if (detailed) ...[
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
                    icon: const Icon(Icons.delete_outline, size: 18),
                    label: const Text('Delete'),
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
};

Color issueStatusColor(IssueStatus status) => switch (status) {
  IssueStatus.open => const Color(0xFFDC2626),
  IssueStatus.inProgress => const Color(0xFFD97706),
  IssueStatus.resolved => const Color(0xFF059669),
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
