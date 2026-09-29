import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:room_booking_lecturer/main.dart';

void main() {
  testWidgets('long lists build only visible rows and remain refreshable', (
    tester,
  ) async {
    var built = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AppScrollView(
            itemCount: 500,
            itemBuilder: (context, index) {
              built++;
              return SizedBox(height: 80, child: Text('Room $index'));
            },
            children: const [Text('Rooms')],
          ),
        ),
      ),
    );
    expect(built, lessThan(30));
    expect(find.text('Room 499'), findsNothing);
    await tester.scrollUntilVisible(find.text('Room 20'), 300);
    expect(find.text('Room 20'), findsOneWidget);
  });

  testWidgets(
    'calendar displays shared semester lectures and checks free rooms',
    (tester) async {
      tester.view.physicalSize = const Size(1000, 2600);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final tomorrow = DateUtils.dateOnly(
        campusNow().add(const Duration(days: 1)),
      );
      final days = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];
      var checked = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CalendarScreen(
              calendarLoader: (_) async => {
                'entries': [
                  {
                    'id': 'tt',
                    'dayOfWeek': days[tomorrow.weekday - 1],
                    'startTime': '08:00',
                    'endTime': '09:00',
                    'moduleCode': 'CS101',
                    'roomName': 'Shared hall',
                    'lecturerName': 'Dr Shared',
                    'batch': '2026',
                    'semester': 'S1',
                  },
                ],
                'bookings': [],
              },
              availabilityLoader: (start, end) async {
                checked = true;
                expect(isSameDay(start, tomorrow), isTrue);
                expect(end.isAfter(start), isTrue);
                return [rooms.first];
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      if (tomorrow.month != campusNow().month) {
        await tester.tap(find.byTooltip('Next month'));
        await tester.pumpAndSettle();
      }
      await tester.tap(
        find.descendant(
          of: find.byType(CalendarMonthGrid),
          matching: find.text('${tomorrow.day}'),
        ),
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Semester lecture'));
      expect(find.text('Shared hall - Dr Shared'), findsOneWidget);
      await tester.ensureVisible(find.text('Check available rooms'));
      await tester.tap(find.text('Check available rooms'));
      await tester.pumpAndSettle();
      expect(checked, isTrue);
      expect(find.text(rooms.first.name), findsOneWidget);
      expect(find.text('Book'), findsOneWidget);
    },
  );

  testWidgets('shows lecturer login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const LecturerBookingApp());

    expect(find.text('Classroom Booking System'), findsOneWidget);
    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('Auto-fill demo credentials'), findsOneWidget);

    await tester.tap(find.text('Auto-fill demo credentials'));
    await tester.pump();

    expect(find.text('lecturer@eng.ruh.ac.lk'), findsOneWidget);
    expect(find.byIcon(Icons.lock_outline), findsOneWidget);
  });

  testWidgets('calendar reveals selected-date booking details and creation', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1000, 1800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final previousBookings = List<Booking>.from(bookings);
    addTearDown(() {
      bookings
        ..clear()
        ..addAll(previousBookings);
    });
    final today = DateUtils.dateOnly(campusNow());
    bookings
      ..clear()
      ..add(
        Booking(
          id: 'calendar-test',
          roomId: 'room-test',
          roomName: 'Calendar test room',
          roomNumber: 'TEST',
          moduleName: 'CS101',
          startAt: today.add(const Duration(hours: 10)),
          endAt: today.add(const Duration(hours: 11)),
          purpose: 'Assignment',
          attendees: 20,
          status: BookingStatus.approved,
          submittedAt: today,
        ),
      );
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: CalendarScreen())),
    );
    expect(find.text('Select a date'), findsOneWidget);
    expect(find.text('Book a room'), findsNothing);
    expect(find.byType(BookingTile), findsNothing);
    await tester.tap(
      find.descendant(
        of: find.byType(CalendarMonthGrid),
        matching: find.text('${today.day}'),
      ),
    );
    await tester.pump();
    expect(find.text('Book a room'), findsOneWidget);
    expect(find.text('Calendar test room'), findsOneWidget);
    expect(find.text('Assignment'), findsOneWidget);
    expect(find.text('Approved'), findsOneWidget);
    final otherDay = today.day == 1 ? 2 : 1;
    await tester.tap(
      find.descendant(
        of: find.byType(CalendarMonthGrid),
        matching: find.text('$otherDay'),
      ),
    );
    await tester.pump();
    expect(find.text('Calendar test room'), findsNothing);
    expect(find.text('No bookings'), findsOneWidget);
  });

  testWidgets(
    'booking form preserves selected date and offers the three purposes',
    (tester) async {
      tester.view.physicalSize = const Size(1000, 1800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final date = DateUtils.dateOnly(campusNow().add(const Duration(days: 2)));
      await tester.pumpWidget(
        MaterialApp(home: BookingFormScreen(initialDate: date)),
      );
      expect(find.text(dateLabel(date)), findsOneWidget);
      final dropdown = find.byType(DropdownButtonFormField<String>);
      expect(dropdown, findsOneWidget);
      await tester.tap(dropdown);
      await tester.pumpAndSettle();
      for (final purpose in ['Assignment', 'Lecture', 'Extra Curricular']) {
        expect(find.text(purpose).hitTestable(), findsOneWidget);
      }
      await tester.tap(find.text('Extra Curricular').hitTestable());
      await tester.pumpAndSettle();
      expect(
        tester.widget<DropdownButtonFormField<String>>(dropdown).initialValue,
        'Extra Curricular',
      );
    },
  );
}
