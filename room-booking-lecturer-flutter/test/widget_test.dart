import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:room_booking_lecturer/main.dart';

void main() {
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
          building: 'Engineering',
          roomCode: 'TEST',
          moduleName: 'CS101',
          startAt: today.add(const Duration(hours: 10)),
          endAt: today.add(const Duration(hours: 11)),
          purpose: 'Assignment',
          attendees: 20,
          status: BookingStatus.cancelled,
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
    expect(find.text('Cancelled'), findsOneWidget);
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
