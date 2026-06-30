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
}
