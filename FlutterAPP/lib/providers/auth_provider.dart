import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/student_model.dart';
import 'supabase_provider.dart';

class AuthNotifier extends StateNotifier<AsyncValue<StudentModel?>> {
  final Ref ref;

  AuthNotifier(this.ref) : super(const AsyncValue.data(null));

  /// Called at app start to restore session from Supabase native session
  Future<void> restoreSession() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    state = const AsyncValue.loading();
    try {
      final email = session.user.email;
      if (email == null) {
        state = const AsyncValue.data(null);
        return;
      }
      final user = await ref.read(supabaseServiceProvider).fetchProfile(email);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login(String identifier, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await ref
          .read(supabaseServiceProvider)
          .login(identifier, password);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> register({
    required String name,
    required String dob,
    required String studentClass,
    String? stream,
    required String email,
    String? phone,
    required String password,
    List<String>? competitiveExams,
    String gender = 'OTHER',
  }) async {
    state = const AsyncValue.loading();
    try {
      final user = await ref
          .read(supabaseServiceProvider)
          .register(
            name: name,
            dob: dob,
            studentClass: studentClass,
            stream: stream,
            email: email,
            phone: phone,
            password: password,
            competitiveExams: competitiveExams,
            gender: gender,
          );
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> resetPassword(String email) async {
    await ref.read(supabaseServiceProvider).sendPasswordReset(email);
  }

  Future<void> updateProfile({
    required String id,
    required String name,
    String? phone,
    required String gender,
    String? stream,
    required List<String> competitiveExams,
    String? board,
    required String dob,
    required String studentClass,
  }) async {
    final oldUser = state.value;
    if (oldUser == null) return;

    state = const AsyncValue.loading();
    try {
      await ref
          .read(supabaseServiceProvider)
          .updateProfile(
            id: id,
            name: name,
            phone: phone,
            gender: gender,
            stream: stream,
            competitiveExams: competitiveExams,
            board: board,
            dob: dob,
            studentClass: studentClass,
          );

      // Refetch profile using the email we had
      final user = await ref
          .read(supabaseServiceProvider)
          .fetchProfile(oldUser.email);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> logout() async {
    await ref.read(supabaseServiceProvider).signOut();
    state = const AsyncValue.data(null);
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<StudentModel?>>((ref) {
      return AuthNotifier(ref);
    });
